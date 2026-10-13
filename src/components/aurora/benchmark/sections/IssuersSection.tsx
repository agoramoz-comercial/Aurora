/**
 * IssuersSection — single-company view of the Benchmark workspace.
 * Runs the systemic three-statement model in the background and shows only
 * the answers: fair value, upside, scenarios and trajectory.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Minus, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MIN_WACC_G_SPREAD,
  runSystemicFinancialModel,
  type ModelDrivers,
} from "@/lib/finance/excelModelEngine";
import { STOCK_BENCHMARK_DATABASE, getStockBenchmark } from "@/lib/finance/stockBenchmarkData";
import { cn } from "@/lib/utils";
import { CHART, axisProps, legendProps, tooltipProps } from "../../chartTheme";
import { Panel, StatTile, TickerChips } from "../../primitives";
import {
  AnimatedNumber,
  ProbabilityRing,
  riseItem,
  staggerContainer,
  useChartMotion,
} from "../motionKit";
import { money, pct, signedPct } from "./shared";

/** Reference market prices used to read the upside. */
const REFERENCE_PRICE: Record<string, number> = {
  TSLA: 248.5,
  AAPL: 227.8,
  MSFT: 421.3,
  NVDA: 138.2,
  AMZN: 213.6,
  GOOGL: 172.4,
  META: 596.1,
  AMD: 142.7,
};

type CaseId = "bear" | "base" | "bull";

const CASES: Record<
  CaseId,
  {
    label: string;
    note: string;
    color: string;
    volume: number;
    margin: number;
    wacc: number;
    price: number;
    multiple: number;
  }
> = {
  bear: {
    label: "Pessimista",
    note: "Procura fraca, margens comprimidas e capital mais caro",
    color: CHART.negative,
    volume: -0.4,
    margin: -0.03,
    wacc: 0.012,
    price: -0.012,
    multiple: -0.15,
  },
  base: {
    label: "Central",
    note: "Premissas centrais do modelo",
    color: CHART.accent,
    volume: 0,
    margin: 0,
    wacc: 0,
    price: 0,
    multiple: 0,
  },
  bull: {
    label: "Otimista",
    note: "Escala operacional, mix premium e capital mais barato",
    color: CHART.positive,
    volume: 0.4,
    margin: 0.025,
    wacc: -0.009,
    price: 0.01,
    multiple: 0.1,
  },
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
/** Additive growth shock scaled by the base rate (2pp floor) — keeps Bear below Base. */
const shockGrowth = (rate: number, shock: number) => rate + shock * Math.max(Math.abs(rate), 0.02);

function applyCase(d: ModelDrivers, id: CaseId): ModelDrivers {
  const s = CASES[id];
  return {
    ...d,
    volumeGrowthRate: shockGrowth(d.volumeGrowthRate, s.volume),
    secondaryGrowthRate: shockGrowth(d.secondaryGrowthRate, s.volume),
    priceGrowthRate: d.priceGrowthRate + s.price,
    grossMarginPct: clamp(d.grossMarginPct + s.margin, 0.05, 0.85),
    secondaryGrossMarginPct: clamp(d.secondaryGrossMarginPct + s.margin, 0.05, 0.9),
    wacc: clamp(d.wacc + s.wacc, 0.03, 0.25),
    exitEvEbitdaMultiple: Math.max(1, d.exitEvEbitdaMultiple * (1 + s.multiple)),
  };
}

const fairValue = (v: { impliedSharePriceGordon: number; impliedSharePriceMultiple: number }) =>
  (v.impliedSharePriceGordon + v.impliedSharePriceMultiple) / 2;

function CaseSwitch({ active, onSelect }: { active: CaseId; onSelect: (c: CaseId) => void }) {
  return (
    <div className="glass-soft flex shrink-0 gap-0.5 p-0.5" style={{ borderRadius: 10 }}>
      {(Object.keys(CASES) as CaseId[]).map((id) => {
        const s = CASES[id];
        const isActive = id === active;
        const Icon = id === "bull" ? TrendingUp : id === "bear" ? TrendingDown : Minus;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-pressed={isActive}
            title={s.note}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-[color,background-color,box-shadow]",
              isActive ? "text-white" : "text-white/50 hover:text-white",
            )}
            style={{
              borderRadius: 8,
              background: isActive ? `${s.color}28` : undefined,
              boxShadow: isActive
                ? `inset 0 0 0 1px ${s.color}80, 0 0 14px ${s.color}33`
                : undefined,
            }}
          >
            <Icon size={11} style={{ color: isActive ? s.color : undefined }} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function IssuersSection() {
  const chart = useChartMotion();
  const [symbol, setSymbol] = useState("TSLA");
  const [caseId, setCaseId] = useState<CaseId>("base");
  const reference = REFERENCE_PRICE[symbol] ?? 100;
  const meta = getStockBenchmark(symbol);

  const runs = useMemo(
    () =>
      (Object.keys(CASES) as CaseId[]).map((id) => {
        const d = applyCase(meta.drivers, id);
        return { id, drivers: d, ...runSystemicFinancialModel(d) };
      }),
    [meta],
  );
  const run = runs.find((r) => r.id === caseId)!;
  const { reports, valuation, drivers } = run;
  const first = reports[0]!;
  const last = reports[reports.length - 1]!;
  const value = fairValue(valuation);
  const upside = reference > 0 ? value / reference - 1 : 0;
  const cagr =
    Math.pow(last.totalRevenue / Math.max(1, first.totalRevenue), 1 / (reports.length - 1)) - 1;

  const checks = [
    reports.every((r) => Math.abs(r.balanceDifference) < 1),
    drivers.perpetualGrowthRate <= drivers.wacc - MIN_WACC_G_SPREAD,
    valuation.tvShareOfEv <= 0.85,
    reports.every((r) => r.ufcf > 0),
    Math.abs(
      valuation.impliedSharePriceGordon / Math.max(0.01, valuation.impliedSharePriceMultiple) - 1,
    ) <= 0.5,
  ];
  const passed = checks.filter(Boolean).length;

  /* Probability-like read: share of the three cases above today's price. */
  const casesAbove = runs.filter((r) => fairValue(r.valuation) > reference).length;

  const field = [
    { name: "Fluxos de caixa", price: valuation.impliedSharePriceGordon, color: CHART.accent },
    { name: "Comparáveis", price: valuation.impliedSharePriceMultiple, color: CHART.teal },
    ...runs.map((r) => ({
      name: CASES[r.id].label,
      price: fairValue(r.valuation),
      color: CASES[r.id].color,
    })),
  ].map((d) => ({ ...d, price: +d.price.toFixed(2) }));

  const trajectory = reports.map((r) => ({
    year: String(r.year),
    Receita: Math.round(r.totalRevenue / 1e6),
    EBITDA: Math.round(r.ebitda / 1e6),
    "Lucro líquido": Math.round(r.netIncome / 1e6),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TickerChips
          symbols={Object.keys(STOCK_BENCHMARK_DATABASE)}
          active={symbol}
          onSelect={setSymbol}
        />
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-white/45 lg:inline">
            {meta.name} · {meta.sector}
          </span>
          <CaseSwitch active={caseId} onSelect={setCaseId} />
        </div>
      </div>

      <motion.div
        key={`${symbol}-${caseId}`}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"
      >
        <motion.div variants={riseItem}>
          <StatTile
            accent
            label="Valor justo por ação"
            value={<AnimatedNumber value={value} format={(n) => `$${n.toFixed(2)}`} />}
            delta={signedPct(upside)}
            deltaTone={upside >= 0 ? "up" : "down"}
            footnote={`Mercado $${reference.toFixed(2)}`}
          />
        </motion.div>
        <motion.div variants={riseItem}>
          <StatTile
            label={`Receita ${last.year}`}
            value={<AnimatedNumber value={last.totalRevenue} format={(n) => money(n, 1)} />}
            delta={`${pct(cagr)} a.a.`}
            deltaTone={cagr >= 0 ? "up" : "down"}
            footnote={`Hoje ${money(first.totalRevenue, 1)}`}
          />
        </motion.div>
        <motion.div variants={riseItem}>
          <StatTile
            label="Margem operacional final"
            value={
              <AnimatedNumber value={last.ebitdaMargin * 100} format={(n) => `${n.toFixed(1)}%`} />
            }
            footnote={`Lucro ${money(last.netIncome, 1)} em ${last.year}`}
          />
        </motion.div>
        <motion.div variants={riseItem}>
          <StatTile
            label="Qualidade da avaliação"
            value={`${passed}/5`}
            deltaTone={passed >= 4 ? "up" : "down"}
            delta={passed >= 4 ? "Robusta" : "Rever"}
            footnote="Verificações automáticas do modelo"
          />
        </motion.div>
      </motion.div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Valor por ação em cada leitura"
          subtitle={`A linha amarela é o preço de mercado ($${reference.toFixed(2)})`}
        >
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={`${symbol}-${caseId}`}
                data={field}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" {...axisProps} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={96} {...axisProps} />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Valor por ação"]}
                />
                <ReferenceLine
                  x={reference}
                  stroke={CHART.warn}
                  strokeDasharray="4 3"
                  strokeWidth={1.6}
                />
                <Bar dataKey="price" radius={[0, 6, 6, 0]} maxBarSize={18} {...chart(0)}>
                  {field.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Leitura por cenário" subtitle={CASES[caseId].note}>
          <div className="flex items-center gap-4 pb-3">
            <ProbabilityRing
              value={casesAbove / 3}
              size={78}
              label="cenários"
              color={
                casesAbove >= 2 ? CHART.positive : casesAbove === 1 ? CHART.warn : CHART.negative
              }
            />
            <p className="text-[12px] leading-relaxed text-white/65">
              Em <b className="text-white">{casesAbove} de 3</b> cenários o valor justo fica acima
              do preço atual.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {runs.map((r) => {
              const v = fairValue(r.valuation);
              const up = reference > 0 ? v / reference - 1 : 0;
              const active = r.id === caseId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setCaseId(r.id)}
                  className="flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition-[background-color,box-shadow]"
                  style={{
                    background: active ? `${CASES[r.id].color}1f` : "var(--aurora-surface-1)",
                    boxShadow: active
                      ? `inset 0 0 0 1px ${CASES[r.id].color}80`
                      : "inset 0 0 0 1px var(--aurora-hairline)",
                  }}
                >
                  <span
                    className="w-16 shrink-0 text-[11px] font-bold"
                    style={{ color: CASES[r.id].color }}
                  >
                    {CASES[r.id].label}
                  </span>
                  <span className="flex-1 text-[14px] font-semibold tabular-nums text-white">
                    ${v.toFixed(2)}
                  </span>
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: up >= 0 ? CHART.positive : CHART.negative }}
                  >
                    {signedPct(up)}
                  </span>
                </button>
              );
            })}
          </div>
          <p
            className="mt-3 flex items-center gap-1.5 text-[10px]"
            style={{ color: passed >= 4 ? CHART.positive : CHART.warn }}
          >
            {passed >= 4 ? <BadgeCheck size={12} /> : <ShieldAlert size={12} />}
            {passed >= 4
              ? "Avaliação consistente e verificada"
              : "Avaliação sensível — ler com cautela"}
          </p>
        </Panel>
      </div>

      <Panel
        title="Trajetória da empresa"
        subtitle="Receita, EBITDA e lucro projetados · USD milhões"
      >
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={`${symbol}-${caseId}`}
              data={trajectory}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="issRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="issEbitda" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.positive} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.positive} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <Area
                type="monotone"
                dataKey="Receita"
                stroke={CHART.accent}
                strokeWidth={2}
                fill="url(#issRev)"
                {...chart(0)}
              />
              <Area
                type="monotone"
                dataKey="EBITDA"
                stroke={CHART.positive}
                strokeWidth={2}
                fill="url(#issEbitda)"
                {...chart(1)}
              />
              <Line
                type="monotone"
                dataKey="Lucro líquido"
                stroke={CHART.violet}
                strokeWidth={2}
                dot={false}
                {...chart(2)}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
