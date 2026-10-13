import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FORECAST_REGISTRY } from "@/lib/finance/iipaData";
import { CHART, axisProps, legendProps, tooltipProps } from "../../chartTheme";
import { Panel, StatTile } from "../../primitives";
import {
  AnimatedNumber,
  RevealBar,
  riseItem,
  staggerContainer,
  useChartMotion,
} from "../motionKit";
import type { IipaModel } from "../useIipaModel";
import { pct, pp } from "./shared";

export function PerformanceSection({ model }: { model: IipaModel }) {
  const chart = useChartMotion();
  const { attr, forecast } = model;
  const m = attr.metrics;

  const series = attr.series.map((s) => ({
    label: s.label,
    Carteira: +(s.portfolio * 100).toFixed(2),
    "Benchmark estratégico": +(s.policy * 100).toFixed(2),
    "Objetivo do mandato": +(s.objective * 100).toFixed(2),
  }));

  /* Waterfall: invisible base + visible step. */
  const steps = [
    { name: "Alocação", v: attr.effects.allocation },
    { name: "Seleção", v: attr.effects.selection },
    { name: "Interação", v: attr.effects.interaction },
    { name: "Câmbio", v: attr.effects.currency },
    { name: "Custos", v: attr.effects.costs },
  ];
  let run = 0;
  const waterfall = steps.map((s) => {
    const start = run;
    run += s.v;
    return {
      name: s.name,
      base: +(Math.min(start, run) * 100).toFixed(3),
      value: +(Math.abs(s.v) * 100).toFixed(3),
      signed: s.v,
    };
  });
  waterfall.push({
    name: "Total",
    base: Math.min(0, run * 100),
    value: +(Math.abs(run) * 100).toFixed(3),
    signed: run,
  });

  const maxMae = Math.max(...forecast.ranking.map((r) => r.mae));
  const registry = FORECAST_REGISTRY.map((r) => ({
    q: r.quarter,
    faixa: [+(r.low * 100).toFixed(1), +(r.high * 100).toFixed(1)] as [number, number],
    Previsto: +(r.central * 100).toFixed(1),
    Realizado: +(r.realized * 100).toFixed(1),
  }));

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6"
      >
        {[
          {
            label: "Retorno anual · 3A",
            v: m.portfolioReturn,
            f: (n: number) => pct(n),
            accent: true,
          },
          {
            label: "Vs estratégico",
            v: m.activeReturn,
            f: (n: number) => pp(n, 2),
            tone: m.activeReturn >= 0 ? ("up" as const) : ("down" as const),
          },
          {
            label: "Valor da seleção de ativos",
            v: attr.effects.selection,
            f: (n: number) => pp(n, 2),
          },
          { label: "Distância ao benchmark", v: m.trackingError, f: (n: number) => pct(n, 2) },
          {
            label: "Eficiência da gestão ativa",
            v: m.informationRatio,
            f: (n: number) => n.toFixed(2),
          },
          { label: "Retorno por risco", v: m.sharpe, f: (n: number) => n.toFixed(2) },
        ].map((k) => (
          <motion.div key={k.label} variants={riseItem}>
            <StatTile
              accent={k.accent}
              label={k.label}
              value={<AnimatedNumber value={k.v} format={k.f} />}
              deltaTone={k.tone}
            />
          </motion.div>
        ))}
      </motion.div>

      <Panel
        title="Carteira vs benchmark estratégico vs objetivo"
        subtitle="Retorno acumulado dos últimos 36 meses · %"
      >
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval={5} />
              <YAxis {...axisProps} unit="%" />
              <Tooltip {...tooltipProps} formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend {...legendProps} />
              <Line
                type="monotone"
                dataKey="Carteira"
                stroke={CHART.accent}
                strokeWidth={2.6}
                dot={false}
                {...chart(0)}
              />
              <Line
                type="monotone"
                dataKey="Benchmark estratégico"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={1.8}
                dot={false}
                {...chart(2)}
              />
              <Line
                type="monotone"
                dataKey="Objetivo do mandato"
                stroke={CHART.warn}
                strokeWidth={1.6}
                strokeDasharray="5 5"
                dot={false}
                {...chart(4)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel
          title="De onde veio a diferença"
          subtitle="Contributo anual de cada decisão para o resultado vs benchmark · pp"
        >
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfall} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} unit="pp" />
                <Tooltip
                  {...tooltipProps}
                  formatter={(_v: number, n: string, p: { payload?: { signed: number } }) =>
                    n === "base" ? null : [pp(p.payload?.signed ?? 0, 2), "Contributo"]
                  }
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
                <Bar
                  dataKey="value"
                  stackId="w"
                  radius={[5, 5, 5, 5]}
                  maxBarSize={42}
                  {...chart(1)}
                >
                  {waterfall.map((w) => (
                    <Cell
                      key={w.name}
                      fill={
                        w.name === "Total"
                          ? CHART.accent
                          : w.signed >= 0
                            ? CHART.positive
                            : CHART.negative
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Precisão das projeções"
          subtitle="O modelo tem de bater alternativas simples · menor erro é melhor"
        >
          <ul className="flex flex-col gap-2">
            {forecast.ranking.map((r, i) => (
              <li key={r.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`flex items-center gap-1.5 ${r.isModel ? "font-semibold text-white" : "text-white/65"}`}
                  >
                    <span className="w-4 text-right tabular-nums text-white/40">{i + 1}.</span>
                    {r.label}
                    {r.isModel && i === 0 ? (
                      <Trophy size={12} className="text-[var(--aurora-warn)]" />
                    ) : null}
                  </span>
                  <span className="tabular-nums text-white/55">
                    erro {pct(r.mae, 1)} · acerto {pct(r.hitRate, 0)}
                    {r.coverage !== null ? ` · dentro do intervalo ${pct(r.coverage, 0)}` : ""}
                  </span>
                </div>
                <RevealBar
                  value={1 - r.mae / (maxMae * 1.15)}
                  color={r.isModel ? CHART.accent : "rgba(255,255,255,0.4)"}
                  height={5}
                  delay={0.1 + i * 0.06}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3 h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={registry} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="q" {...axisProps} />
                <YAxis {...axisProps} unit="%" />
                <Tooltip {...tooltipProps} />
                <Area
                  dataKey="faixa"
                  name="Intervalo previsto"
                  stroke="none"
                  fill={CHART.accent}
                  fillOpacity={0.15}
                  {...chart(0)}
                />
                <Line
                  dataKey="Previsto"
                  stroke={CHART.accent}
                  strokeWidth={2}
                  dot={false}
                  {...chart(1)}
                />
                <Scatter dataKey="Realizado" fill="#fff" {...chart(2)} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
