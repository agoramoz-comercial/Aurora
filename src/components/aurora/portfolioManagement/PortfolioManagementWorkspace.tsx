/**
 * Portfolio Management — whole-portfolio view (Aladdin), risk & contribution (MSCI Barra),
 * pre/post-trade compliance and order blotter (Charles River), tolerance-band rebalancing
 * (Orion/Tamarac), Brinson-Fachler attribution (FactSet/Bloomberg PORT/Morningstar), stress
 * scenarios and income (Addepar). Spec: docs/prompts/PORTFOLIO-MANAGEMENT.md. Simulation only.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Coins,
  Flame,
  Gauge,
  Layers,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Button,
  Drawer,
  Avatar,
  EmptyState,
  MetricCard,
  ProgressBar,
  Panel,
  SegmentedTabs,
  WorkspaceHeader,
} from "../primitives";
import { CHART, SERIES_COLORS, axisProps, legendProps, tooltipProps } from "../chartTheme";
import { BentoTile, NumberTicker, SpotlightCard } from "../spatial";
import { cn } from "@/lib/utils";
import { PmStoreProvider, usePm } from "@/data/portfolioManagement/store";
import { BENCHMARK, BENCH_PATHS, FUNDS, lastPrice } from "@/data/portfolioManagement/market";
import { BENCHMARK_WEIGHTS, SECURITIES } from "@/data/portfolioManagement/seed";
import {
  CLASS_LABEL,
  SCENARIOS,
  brinson,
  driftRows,
  drawdowns,
  incomeSchedule,
  pct1,
  portfolioSeries,
  postTradeBreaches,
  preTradeChecks,
  rebalancePlan,
  returns,
  riskReport,
  signedPct,
  stressTest,
  twr,
  usd,
  weightsByClass,
  type AssetClass,
  type Factor,
} from "@/lib/portfolio/pm";

type View =
  | "geral"
  | "posicoes"
  | "ordens"
  | "rebalancear"
  | "risco"
  | "stress"
  | "atribuicao"
  | "rendimentos";
const VIEWS: { id: View; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: "geral", label: "Visão geral", shortLabel: "Geral", icon: Briefcase },
  { id: "posicoes", label: "Posições", shortLabel: "Posições", icon: Layers },
  { id: "ordens", label: "Ordens", shortLabel: "Ordens", icon: ShieldCheck },
  { id: "rebalancear", label: "Rebalancear", shortLabel: "Rebalancear", icon: Scale },
  { id: "risco", label: "Risco", shortLabel: "Risco", icon: Gauge },
  { id: "stress", label: "Stress", shortLabel: "Stress", icon: Flame },
  { id: "atribuicao", label: "Atribuição", shortLabel: "Atribuição", icon: BarChart3 },
  { id: "rendimentos", label: "Rendimentos", shortLabel: "Rendimentos", icon: Coins },
];
const CLASS_COLOR: Record<AssetClass, string> = {
  acoesEUA: CHART.accent,
  acoesIntl: CHART.violet,
  obrigacoes: CHART.positive,
  imobiliario: CHART.amber,
  ouro: "#fde68a",
  liquidez: "rgba(255,255,255,0.55)",
};
const PERIODS = [
  { id: "1M", days: 21 },
  { id: "3M", days: 63 },
  { id: "6M", days: 126 },
  { id: "1A", days: 252 },
] as const;
type Period = (typeof PERIODS)[number]["id"];

/** `onOverview` set: this is the Reports view of the Ollympius Dashboard (no own overview). */
export function PortfolioManagementWorkspace({ onOverview }: { onOverview?: () => void } = {}) {
  return (
    <PmStoreProvider>
      <Workspace onOverview={onOverview} />
    </PmStoreProvider>
  );
}

type Ticket = { symbol: string; side: "compra" | "venda" } | null;

function Workspace({ onOverview }: { onOverview?: () => void }) {
  const pm = usePm();
  const [view, setView] = useState<View>(onOverview ? "posicoes" : "geral");
  const [ticket, setTicket] = useState<Ticket>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "warn" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);
  const breaches = postTradeBreaches(pm.pos, pm.state.rules);
  const w = weightsByClass(pm.pos, pm.state.cash);
  const drifting = driftRows(w, pm.state.targets, pm.state.band).filter((r) => r.outOfBand).length;
  const say = (text: string, tone: "ok" | "warn" = "ok") => setToast({ text, tone });
  const reports = view !== "geral";
  const pill = (active: boolean) =>
    cn(
      "glass-pill h-9 px-3.5 text-caption font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
      active ? "bg-white/30 text-white" : "text-white/65 hover:text-white",
    );

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col gap-4"
      data-glass={onOverview ? "dense" : undefined}
    >
      <WorkspaceHeader
        title="Portfolio Management"
        subtitle="Visão da carteira em tempo real · simulação, sem execução real nem aconselhamento"
        right={
          <>
            <div role="group" aria-label="Modo" className="flex gap-1.5">
              <button
                type="button"
                aria-pressed={!reports}
                onClick={() => (onOverview ? onOverview() : setView("geral"))}
                className={pill(!reports)}
              >
                Visão geral
              </button>
              <button
                type="button"
                aria-pressed={reports}
                onClick={() => setView(reports ? view : "posicoes")}
                className={pill(reports)}
              >
                Relatórios
              </button>
            </div>
            <span className="hidden sm:inline-flex">
              <Avatar initials="EU" />
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              className="hidden lg:inline-flex"
              onClick={() => {
                pm.dispatch({ type: "reset" });
                say("Carteira de demonstração reposta.");
              }}
            >
              Repor
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setTicket({ symbol: "MSFT", side: "compra" })}
            >
              Nova ordem
            </Button>
          </>
        }
      />
      {reports ? (
        <SegmentedTabs
          tabs={VIEWS.filter((v) => v.id !== "geral").map((v) => ({
            ...v,
            count:
              v.id === "rebalancear" && drifting
                ? drifting
                : v.id === "ordens" && breaches.length
                  ? breaches.length
                  : undefined,
          }))}
          active={view}
          onSelect={setView}
        />
      ) : null}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
      >
        <AnimatePresence>
          {toast ? (
            <motion.p
              key={toast.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="glass pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-caption font-medium text-white shadow-2xl"
            >
              {toast.tone === "warn" ? (
                <AlertTriangle size={15} className="text-[#fcd34d]" aria-hidden />
              ) : (
                <CheckCircle2 size={15} className="text-[#86efac]" aria-hidden />
              )}
              {toast.text}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      <motion.div
        key={view}
        tabIndex={0}
        role="region"
        aria-label="Conteúdo do Portfolio Management"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-4 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:overflow-y-auto lg:pr-1"
      >
        {view === "geral" ? <Overview go={setView} onTrade={setTicket} /> : null}
        {view === "posicoes" ? <Holdings onTrade={setTicket} /> : null}
        {view === "ordens" ? <Orders onTrade={setTicket} /> : null}
        {view === "rebalancear" ? <Rebalance say={say} /> : null}
        {view === "risco" ? <Risk /> : null}
        {view === "stress" ? <Stress /> : null}
        {view === "atribuicao" ? <Attribution /> : null}
        {view === "rendimentos" ? <Income /> : null}
      </motion.div>
      <TradeTicket
        ticket={ticket}
        onClose={() => setTicket(null)}
        onDone={(m, tone) => say(m, tone)}
      />
    </div>
  );
}

/* ── Shared ──────────────────────────────────────────────────────────── */

function Kpi({
  label,
  value,
  hint,
  tone,
  bare,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "good" | "bad" | "warn" | "accent";
  bare?: boolean;
  delta?: React.ReactNode;
}) {
  if (bare)
    return (
      <MetricCard
        bare
        label={label}
        value={value}
        hint={hint}
        tone={tone === "accent" ? undefined : tone}
        delta={delta}
        className="h-full"
      />
    );
  return (
    <SpotlightCard className="flex min-w-0 flex-col p-4">
      <MetricCard
        bare
        label={label}
        value={value}
        hint={hint}
        tone={tone === "accent" ? undefined : tone}
        delta={delta}
        className="h-full"
      />
    </SpotlightCard>
  );
}
const tone = (x: number) => (x > 0 ? "good" : x < 0 ? "bad" : undefined);

function Spark({ path, positive }: { path: number[]; positive: boolean }) {
  const pts = path.filter((_, i) => i % 6 === 0 || i === path.length - 1);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const d = pts
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / (pts.length - 1)) * 80).toFixed(1)},${(22 - ((v - min) / (max - min || 1)) * 20).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 80 24" className="h-6 w-20" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={positive ? CHART.positive : CHART.negative}
        strokeWidth={1.6}
      />
    </svg>
  );
}

/* ── Visão geral (estrutura Ollympius) ───────────────────────────────── */

function ChartPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="glass-pill px-2.5 py-1 text-caption font-semibold tabular-nums text-white shadow-lg">
      {children}
    </span>
  );
}

function TileTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <h3 className="glass-pill px-3 py-1 text-caption font-semibold text-white">{children}</h3>
      {right}
    </div>
  );
}

function initials(sym: string) {
  return sym.replace(/[^A-Z]/g, "").slice(0, 2) || sym.slice(0, 2).toUpperCase();
}

function Overview({ go, onTrade }: { go: (v: View) => void; onTrade: (t: Ticket) => void }) {
  const pm = usePm();
  const [period, setPeriod] = useState<Period>("1A");
  const series = useMemo(() => portfolioSeries(pm.pos, pm.state.cash), [pm.pos, pm.state.cash]);
  const days = PERIODS.find((p) => p.id === period)!.days;
  const sl = series.slice(-days - 1);
  const bl = BENCHMARK.slice(-days - 1);
  const ret = twr(returns(sl));
  const bret = twr(returns(bl));
  const chart = sl.map((v, i) => ({
    d: i,
    Carteira: Math.round(v),
    Referência: Math.round((bl[i]! / bl[0]!) * sl[0]!),
  }));
  const peak = chart.reduce((m, c, i) => (c.Carteira > chart[m]!.Carteira ? i : m), 0);
  const dayChange = pm.pos.reduce((s, p) => s + p.holding.qty * (p.price - p.prevClose), 0);
  const pnl = pm.pos.reduce((s, p) => s + p.pnl, 0);
  const w = weightsByClass(pm.pos, pm.state.cash);
  const risk = riskReport(pm.pos, pm.state.cash, BENCHMARK);
  const breaches = postTradeBreaches(pm.pos, pm.state.rules);
  // Weekly returns (5 trading days) — last 8 weeks.
  const weeks = useMemo(() => {
    const out: { w: string; r: number }[] = [];
    for (let k = 8; k >= 1; k--) {
      const a = series[series.length - 1 - k * 5]!;
      const b = series[series.length - 1 - (k - 1) * 5]!;
      out.push({ w: `S-${k - 1}`, r: +((b / a - 1) * 100).toFixed(2) });
    }
    return out;
  }, [series]);
  const best = weeks.reduce((m, x, i) => (x.r > weeks[m]!.r ? i : m), 0);
  // Recent activity: latest orders, then income received last month.
  const lastMonth = (new Date().getUTCMonth() + 11) % 12;
  const activity = [
    ...pm.state.orders.slice(0, 4).map((o) => ({
      id: o.id,
      ini: initials(o.symbol),
      title: `${o.side === "compra" ? "Compra" : "Venda"} ${o.qty} ${o.symbol}`,
      note:
        o.status === "executada"
          ? o.source === "rebalanceamento"
            ? "Rebalanceamento"
            : "Ordem executada"
          : "Bloqueada pela compliance",
      value: `${o.side === "compra" ? "−" : "+"}${usd(o.qty * o.price)}`,
    })),
    ...pm.pos
      .filter((p) => p.sec.yield > 0 && p.sec.payMonths.includes(lastMonth))
      .sort((a, b) => b.value * b.sec.yield - a.value * a.sec.yield)
      .map((p) => ({
        id: `div-${p.sec.symbol}`,
        ini: initials(p.sec.symbol),
        title: p.sec.name,
        note: p.sec.fund ? "Distribuição recebida" : "Dividendo recebido",
        value: `+${usd((p.value * p.sec.yield) / p.sec.payMonths.length)}`,
      })),
  ].slice(0, 4);
  const targetRows = driftRows(w, pm.state.targets, pm.state.band)
    .filter((r) => r.assetClass !== "liquidez")
    .slice(0, 4);
  const top = pm.pos.slice(0, 5);
  const breachSet = new Set(breaches.map((b) => b.symbol));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-h-full lg:flex-1 lg:grid-cols-4 lg:grid-rows-[1.35fr_1fr_1fr]">
      {/* Row 1 — hero trend (span 2) · weekly returns · recent activity */}
      <BentoTile span={2} label="Valor da carteira" className="min-h-[300px] lg:min-h-0">
        <TileTitle
          right={
            <div className="flex gap-1.5" role="group" aria-label="Período">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={period === p.id}
                  onClick={() => setPeriod(p.id)}
                  className={cn(
                    "glass-pill h-8 min-w-11 px-2.5 text-micro font-semibold tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    period === p.id ? "bg-white/30 text-white" : "text-white/60 hover:text-white",
                  )}
                >
                  {p.id}
                </button>
              ))}
            </div>
          }
        >
          Valor da carteira
        </TileTitle>
        <div className="relative mt-2 min-h-[190px] flex-1">
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 flex -translate-x-1/2 items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-[var(--aurora-accent)] shadow-[0_0_12px_var(--aurora-accent-glow)]"
              aria-hidden
            />
            <ChartPill>
              <span className="sr-only">Valor total </span>
              <NumberTicker value={pm.total} format={(n) => usd(n)} />
            </ChartPill>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 34, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pm-port" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" hide />
              <YAxis hide domain={["dataMin - 2000", "dataMax + 2000"]} />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.4)", strokeDasharray: "3 3" }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <ChartPill>{usd(Number(payload[0]!.value))}</ChartPill>
                  ) : null
                }
              />
              <ReferenceLine x={peak} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="Referência"
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="4 4"
                strokeWidth={1.4}
                dot={false}
                isAnimationActive={false}
              />
              <Area
                animationDuration={300}
                animationEasing="ease-out"
                type="monotone"
                dataKey="Carteira"
                stroke="rgba(255,255,255,0.88)"
                strokeWidth={2}
                fill="url(#pm-port)"
                activeDot={{ r: 6, fill: "var(--aurora-accent)", stroke: "white", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex shrink-0 flex-wrap gap-1.5">
          {[
            ["Hoje", usd(dayChange)],
            [period, `${signedPct(ret)} · ref. ${signedPct(bret)}`],
            ["P&L", usd(pnl)],
            ["Liquidez", usd(pm.state.cash)],
          ].map(([k, v]) => (
            <span key={k} className="glass-pill flex items-center gap-2 px-2.5 py-1 text-micro">
              <span className="text-white/60">{k}</span>
              <span className="font-semibold tabular-nums text-white">{v}</span>
            </span>
          ))}
        </div>
      </BentoTile>

      <BentoTile label="Retorno semanal" className="min-h-[300px] lg:min-h-0">
        <TileTitle>Retorno semanal</TileTitle>
        <p className="mt-1.5 text-micro text-white/60">Últimas 8 semanas · % por semana</p>
        <div className="relative mt-2 min-h-[200px] flex-1">
          <div
            className="pointer-events-none absolute top-0 z-10"
            style={{
              left: `${((best + 0.5) / weeks.length) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <ChartPill>{signedPct(weeks[best]!.r / 100)}</ChartPill>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks} margin={{ top: 34, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="w" hide />
              <YAxis hide />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <ChartPill>{signedPct(Number(payload[0]!.value) / 100, 2)}</ChartPill>
                  ) : null
                }
              />
              <Bar
                animationDuration={300}
                animationEasing="ease-out"
                dataKey="r"
                radius={[6, 6, 2, 2]}
              >
                {weeks.map((x, i) => (
                  <Cell
                    key={x.w}
                    fill={
                      i === best ? CHART.barActive : x.r < 0 ? "rgba(248,113,113,0.45)" : CHART.bar
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </BentoTile>

      <BentoTile label="Atividade recente" className="min-h-[300px] lg:min-h-0">
        <TileTitle>Atividade recente</TileTitle>
        <ul className="mt-3 flex flex-1 flex-col gap-1.5">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center gap-2.5 rounded-xl px-1 py-1">
              <Avatar initials={a.ini} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-medium text-white">{a.title}</p>
                <p className="truncate text-micro text-white/60">{a.note}</p>
              </div>
              <span className="glass-pill shrink-0 px-2 py-0.5 text-micro tabular-nums text-white/90">
                {a.value}
              </span>
            </li>
          ))}
          {!activity.length ? (
            <li className="text-caption text-white/65">Sem atividade ainda.</li>
          ) : null}
        </ul>
        <Button size="sm" variant="ghost" className="self-start" onClick={() => go("ordens")}>
          Ver livro de ordens
        </Button>
      </BentoTile>

      {/* Row 2 — two KPIs · allocation targets (Goals) · top holdings (Team) */}
      <BentoTile label="Retorno 1A">
        <Kpi
          bare
          label="Retorno 1A"
          value={signedPct(twr(returns(series)))}
          delta={`ref. ${signedPct(twr(returns(BENCHMARK)))}`}
          tone={tone(twr(returns(series)))}
        />
      </BentoTile>
      <BentoTile label="Volatilidade">
        <Kpi
          bare
          label="Volatilidade"
          value={pct1(risk.vol)}
          delta={`beta ${risk.beta.toFixed(2).replace(".", ",")}`}
          hint={`Sharpe ${risk.sharpe.toFixed(2).replace(".", ",")}`}
        />
      </BentoTile>
      <BentoTile label="Alvos de alocação">
        <TileTitle
          right={
            <button
              type="button"
              onClick={() => go("rebalancear")}
              aria-label="Editar alvos de alocação"
              className="glass-pill grid h-8 w-8 place-items-center text-white/85 transition-colors duration-150 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Plus size={14} aria-hidden />
            </button>
          }
        >
          Alvos de alocação
        </TileTitle>
        <ul className="mt-3 flex flex-1 flex-col justify-around gap-2.5">
          {targetRows.map((r) => (
            <li key={r.assetClass} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-micro">
                <span className="text-white/80">{CLASS_LABEL[r.assetClass]}</span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    r.outOfBand ? "text-[#fcd34d]" : "text-white",
                  )}
                >
                  {pct1(r.current)} / {pct1(r.target, 0)}
                </span>
              </div>
              <ProgressBar
                value={r.target ? Math.min(100, (r.current / r.target) * 100) : 0}
                label={`${CLASS_LABEL[r.assetClass]}: ${pct1(r.current)} de ${pct1(r.target, 0)}`}
              />
            </li>
          ))}
        </ul>
      </BentoTile>
      <BentoTile label="Principais posições" rows={2}>
        <TileTitle
          right={
            <button
              type="button"
              onClick={() => onTrade({ symbol: "MSFT", side: "compra" })}
              aria-label="Nova ordem"
              className="glass-pill grid h-8 w-8 place-items-center text-white/85 transition-colors duration-150 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Plus size={14} aria-hidden />
            </button>
          }
        >
          Principais posições
        </TileTitle>
        <ul className="mt-2 flex flex-1 flex-col gap-1">
          {top.map((p) => {
            const hot = breachSet.has(p.sec.symbol);
            return (
              <li key={p.sec.symbol}>
                <button
                  type="button"
                  onClick={() => onTrade({ symbol: p.sec.symbol, side: hot ? "venda" : "compra" })}
                  aria-label={`${p.sec.symbol}, ${pct1(p.weight)} da carteira${hot ? ", acima do limite" : ""}. Abrir ordem`}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-2xl px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    hot && "bg-white/16 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.45)]",
                  )}
                >
                  <Avatar initials={initials(p.sec.symbol)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-caption font-medium text-white">
                      {p.sec.name}
                    </span>
                    <span className="block truncate text-micro text-white/60">
                      {p.sec.symbol} · {signedPct(p.pnlPct)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "glass-pill shrink-0 px-2 py-0.5 text-micro tabular-nums",
                      hot ? "text-[#fca5a5]" : "text-white/90",
                    )}
                  >
                    {pct1(p.weight)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {breaches.length ? (
          <p className="mt-2 flex items-start gap-1.5 text-micro text-[#fca5a5]">
            <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
            {breaches.map((b) => `${b.symbol} acima de ${pct1(b.limit, 0)}`).join(" · ")}
          </p>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="mt-1 self-start"
          onClick={() => go("posicoes")}
        >
          Todas as posições
        </Button>
      </BentoTile>

      {/* Row 3 — two KPIs · add tile */}
      <BentoTile label="Drawdown máximo">
        <Kpi bare label="Drawdown máx." value={pct1(risk.maxDrawdown)} delta="1 ano" tone="bad" />
      </BentoTile>
      <BentoTile label="VaR 95%">
        <Kpi
          bare
          label="VaR 95% · 1 dia"
          value={usd(risk.var95)}
          delta={pct1(risk.var95Pct, 2)}
          tone="warn"
        />
      </BentoTile>
      <button
        type="button"
        onClick={() => onTrade({ symbol: "MSFT", side: "compra" })}
        className="glass grid min-h-[150px] place-items-center p-4 lg:min-h-0 transition-colors duration-150 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Nova ordem"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-white/45 text-white/80">
          <Plus size={18} aria-hidden />
        </span>
      </button>
    </div>
  );
}

/* ── Posições ────────────────────────────────────────────────────────── */

function Holdings({ onTrade }: { onTrade: (t: Ticket) => void }) {
  const pm = usePm();
  const [sort, setSort] = useState<"valor" | "pnl" | "dia">("valor");
  const rows = [...pm.pos].sort((a, b) =>
    sort === "pnl" ? b.pnlPct - a.pnlPct : sort === "dia" ? b.dayPct - a.dayPct : b.value - a.value,
  );
  const limitOf = (fund?: boolean) =>
    fund ? pm.state.rules.maxWeightFund : pm.state.rules.maxWeight;
  return (
    <Panel
      title="Posições"
      subtitle={`${rows.length} posições + liquidez ${usd(pm.state.cash)}`}
      right={
        <SegmentedTabs
          size="sm"
          active={sort}
          onSelect={setSort}
          tabs={[
            { id: "valor", label: "Valor" },
            { id: "pnl", label: "P&L" },
            { id: "dia", label: "Hoje" },
          ]}
        />
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-body">
          <thead>
            <tr className="text-left text-micro uppercase tracking-[0.08em] text-white/60">
              {[
                "Ativo",
                "Classe",
                "Qtd.",
                "Custo médio",
                "Preço",
                "Valor",
                "Peso",
                "P&L",
                "1A",
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn("pb-2 font-semibold", i >= 2 && i <= 7 && "text-right")}
                >
                  {h || <span className="sr-only">Ações</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const over = p.weight > limitOf(p.sec.fund);
              return (
                <tr key={p.sec.symbol} className="border-t border-white/8">
                  <td className="py-2.5 pr-3">
                    <span className="block font-semibold text-white">{p.sec.symbol}</span>
                    <span className="block max-w-[180px] truncate text-micro text-white/60">
                      {p.sec.name}
                    </span>
                  </td>
                  <td className="py-2.5 text-caption text-white/75">
                    {CLASS_LABEL[p.sec.assetClass]}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white/85">{p.holding.qty}</td>
                  <td className="py-2.5 text-right tabular-nums text-white/70">
                    {usd(p.holding.avgCost, true)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white">
                    {usd(p.price, true)}
                    <span
                      className={cn(
                        "block text-micro",
                        p.dayPct >= 0 ? "text-[#86efac]" : "text-[#fca5a5]",
                      )}
                    >
                      {signedPct(p.dayPct, 2)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-white">
                    {usd(p.value)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    <span
                      className={cn(
                        over ? "rounded-full bg-[#7f1d1d] px-2 py-0.5 text-white" : "text-white/85",
                      )}
                      title={
                        over ? `Acima do limite de ${pct1(limitOf(p.sec.fund), 0)}` : undefined
                      }
                    >
                      {pct1(p.weight)}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "py-2.5 text-right tabular-nums",
                      p.pnl >= 0 ? "text-[#86efac]" : "text-[#fca5a5]",
                    )}
                  >
                    {usd(p.pnl)}
                    <span className="block text-micro">{signedPct(p.pnlPct)}</span>
                  </td>
                  <td className="py-2.5 pl-3">
                    <Spark path={p.path} positive={p.path.at(-1)! >= p.path[0]!} />
                  </td>
                  <td className="py-2.5 pl-2">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onTrade({ symbol: p.sec.symbol, side: "compra" })}
                        aria-label={`Comprar ${p.sec.symbol}`}
                      >
                        Comprar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onTrade({ symbol: p.sec.symbol, side: "venda" })}
                        aria-label={`Vender ${p.sec.symbol}`}
                      >
                        Vender
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ── Ordem (boletim) ─────────────────────────────────────────────────── */

function TradeTicket({
  ticket,
  onClose,
  onDone,
}: {
  ticket: Ticket;
  onClose: () => void;
  onDone: (m: string, tone: "ok" | "warn") => void;
}) {
  const pm = usePm();
  const [symbol, setSymbol] = useState("MSFT");
  const [side, setSide] = useState<"compra" | "venda">("compra");
  const [qty, setQty] = useState("10");
  useEffect(() => {
    if (!ticket) return;
    setSymbol(ticket.symbol);
    setSide(ticket.side);
    const held = pm.pos.find((p) => p.sec.symbol === ticket.symbol);
    setQty(
      ticket.side === "venda" && held
        ? String(Math.max(1, Math.round(held.holding.qty * 0.1)))
        : "10",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);
  const price = lastPrice(symbol);
  const n = Number(qty);
  const checks = preTradeChecks(
    { symbol, side, qty: n, price },
    pm.pos,
    pm.state.cash,
    pm.state.rules,
    FUNDS,
  );
  const ok = checks.every((c) => c.ok);
  const sec = pm.secs[symbol];
  const held = pm.pos.find((p) => p.sec.symbol === symbol);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    pm.dispatch({ type: "order", symbol, side, qty: n });
    onDone(
      `${side === "compra" ? "Compra" : "Venda"} executada: ${n} ${symbol} a ${usd(price, true)} (${usd(n * price)}).`,
      "ok",
    );
    onClose();
  };
  return (
    <Drawer
      open={!!ticket}
      onClose={onClose}
      width={460}
      eyebrow="Boletim de ordem · simulação"
      title={`${side === "compra" ? "Comprar" : "Vender"} ${symbol}`}
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-white/70">
            Total estimado{" "}
            <b className="tabular-nums text-white">{usd((Number.isFinite(n) ? n : 0) * price)}</b>
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant={side === "venda" ? "danger" : "primary"}
              type="submit"
              form="pm-ticket"
              disabled={!ok}
            >
              {side === "compra" ? "Executar compra" : "Executar venda"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="pm-ticket" onSubmit={submit} className="flex flex-col gap-4 p-5">
        <SegmentedTabs
          active={side}
          onSelect={setSide}
          tabs={[
            { id: "compra", label: "Compra" },
            { id: "venda", label: "Venda" },
          ]}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pm-symbol" className="text-caption font-semibold text-white/80">
            Ativo
          </label>
          <select
            id="pm-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-10 rounded-[12px] border border-white/14 bg-black/30 px-3 text-body text-white outline-none focus:ring-2 focus:ring-white/30"
          >
            {SECURITIES.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} · {s.name}
                {pm.state.rules.restricted.includes(s.symbol) ? " (restrito)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pm-qty" className="text-caption font-semibold text-white/80">
              Quantidade
            </label>
            <input
              id="pm-qty"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              aria-describedby="pm-checks"
              className="h-10 rounded-[12px] border border-white/14 bg-black/30 px-3 text-body tabular-nums text-white outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-caption font-semibold text-white/80">Preço (último)</span>
            <span className="flex h-10 items-center rounded-[12px] border border-white/8 bg-white/5 px-3 text-body tabular-nums text-white">
              {usd(price, true)}
            </span>
          </div>
        </div>
        <p className="text-caption text-white/70">
          {sec ? `${CLASS_LABEL[sec.assetClass]}${sec.fund ? " · fundo" : " · empresa"}` : ""} ·
          detém {held?.holding.qty ?? 0} · liquidez {usd(pm.state.cash)}
        </p>
        <div
          id="pm-checks"
          role="status"
          className="flex flex-col gap-1.5 rounded-[14px] border border-white/10 bg-white/5 p-3"
        >
          <p className="text-micro font-semibold uppercase tracking-[0.1em] text-white/65">
            Compliance pré-negociação
          </p>
          <ul className="flex flex-col gap-1">
            {checks.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-center gap-2 text-caption",
                  c.ok ? "text-white/85" : "text-[#fca5a5]",
                )}
              >
                {c.ok ? (
                  <CheckCircle2 size={14} className="shrink-0 text-[#86efac]" aria-hidden />
                ) : (
                  <XCircle size={14} className="shrink-0" aria-hidden />
                )}
                <span>{c.label}</span>
                <span className="sr-only">{c.ok ? "cumprido" : "falha"}</span>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </Drawer>
  );
}

/* ── Ordens ──────────────────────────────────────────────────────────── */

function Orders({ onTrade }: { onTrade: (t: Ticket) => void }) {
  const pm = usePm();
  const breaches = postTradeBreaches(pm.pos, pm.state.rules);
  const executed = pm.state.orders.filter((o) => o.status === "executada");
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Ordens executadas"
          value={executed.length}
          hint={usd(executed.reduce((s, o) => s + o.qty * o.price, 0)) + " negociados"}
        />
        <Kpi
          label="Bloqueadas"
          value={pm.state.orders.length - executed.length}
          hint="Pela compliance pré-negociação"
          tone={pm.state.orders.length - executed.length ? "warn" : undefined}
        />
        <Kpi
          label="Limite por empresa"
          value={pct1(pm.state.rules.maxWeight, 0)}
          hint={`Fundos: ${pct1(pm.state.rules.maxWeightFund, 0)}`}
        />
        <Kpi
          label="Lista restrita"
          value={pm.state.rules.restricted.join(", ") || "—"}
          hint={`Liquidez mínima ${usd(pm.state.rules.minCash)}`}
        />
      </div>
      <Panel title="Compliance pós-negociação" subtitle="Posições que já excedem os limites">
        {breaches.length ? (
          <ul className="flex flex-col gap-2">
            {breaches.map((b) => (
              <li
                key={b.symbol}
                className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[#f87171]/40 bg-[#7f1d1d]/30 px-3 py-2.5"
              >
                <AlertTriangle size={16} className="text-[#fca5a5]" aria-hidden />
                <span className="flex-1 text-body text-white">
                  {b.symbol}: {pct1(b.weight)} vs limite {pct1(b.limit, 0)} · excede{" "}
                  {pct1(b.excess)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onTrade({ symbol: b.symbol, side: "venda" })}
                >
                  Reduzir posição
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="Sem violações"
            hint="Todas as posições estão dentro dos limites."
          />
        )}
      </Panel>
      <Panel
        title="Livro de ordens"
        subtitle="Mais recentes primeiro"
        right={
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => onTrade({ symbol: "MSFT", side: "compra" })}
          >
            Nova ordem
          </Button>
        }
      >
        {pm.state.orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-body">
              <thead>
                <tr className="text-left text-micro uppercase tracking-[0.08em] text-white/60">
                  {["ID", "Hora", "Ativo", "Lado", "Qtd.", "Preço", "Estado"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={cn("pb-2 font-semibold", (i === 4 || i === 5) && "text-right")}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pm.state.orders.map((o) => (
                  <tr key={o.id} className="border-t border-white/8">
                    <td className="py-2 font-mono text-caption text-white/70">{o.id}</td>
                    <td className="py-2 text-caption tabular-nums text-white/70">
                      {new Date(o.at).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 font-semibold text-white">{o.symbol}</td>
                    <td
                      className={cn(
                        "py-2 capitalize",
                        o.side === "compra" ? "text-[#86efac]" : "text-[#fca5a5]",
                      )}
                    >
                      {o.side}
                      {o.source === "rebalanceamento" ? (
                        <span className="ml-1 text-micro text-white/55">(rebal.)</span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right tabular-nums text-white">{o.qty}</td>
                    <td className="py-2 text-right tabular-nums text-white/85">
                      {usd(o.price, true)}
                    </td>
                    <td className="py-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-micro font-semibold",
                          o.status === "executada"
                            ? "bg-[#14532d] text-[#dcfce7]"
                            : "bg-[#7f1d1d] text-white",
                        )}
                        title={o.reason}
                      >
                        {o.status}
                      </span>
                      {o.reason ? (
                        <span className="mt-0.5 block max-w-[240px] text-micro text-[#fca5a5]">
                          {o.reason}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="Ainda sem ordens"
            hint="As ordens manuais e de rebalanceamento aparecem aqui com o resultado da compliance."
          />
        )}
      </Panel>
    </>
  );
}

/* ── Rebalancear ─────────────────────────────────────────────────────── */

function Rebalance({ say }: { say: (m: string, t?: "ok" | "warn") => void }) {
  const pm = usePm();
  const w = weightsByClass(pm.pos, pm.state.cash);
  const rows = driftRows(w, pm.state.targets, pm.state.band);
  const sumT = Object.values(pm.state.targets).reduce((s, x) => s + x, 0);
  const plan = useMemo(
    () => rebalancePlan(pm.pos, pm.state.cash, pm.state.targets),
    [pm.pos, pm.state.cash, pm.state.targets],
  );
  const sells = plan.filter((p) => p.side === "venda").reduce((s, p) => s + p.amount, 0);
  const buys = plan.filter((p) => p.side === "compra").reduce((s, p) => s + p.amount, 0);
  const valid = Math.abs(sumT - 1) < 0.0005;
  const chart = rows.map((r) => ({
    name: CLASS_LABEL[r.assetClass],
    Desvio: +(r.drift * 100).toFixed(2),
    k: r.assetClass,
    out: r.outOfBand,
  }));
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="Alvos por classe"
          subtitle={
            valid ? "Os alvos somam 100%" : `Os alvos somam ${pct1(sumT)} — ajuste para 100%`
          }
        >
          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <li
                key={r.assetClass}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
              >
                <label
                  htmlFor={`tg-${r.assetClass}`}
                  className="flex items-center gap-2 text-body text-white/90"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: CLASS_COLOR[r.assetClass] }}
                    aria-hidden
                  />
                  {CLASS_LABEL[r.assetClass]}
                </label>
                <span className="text-caption tabular-nums text-white/80">
                  atual {pct1(r.current)} · alvo <b className="text-white">{pct1(r.target)}</b>
                </span>
                <input
                  id={`tg-${r.assetClass}`}
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={Math.round(r.target * 100)}
                  onChange={(e) =>
                    pm.dispatch({
                      type: "setTarget",
                      assetClass: r.assetClass,
                      weight: Number(e.target.value) / 100,
                    })
                  }
                  className="col-span-2 w-full accent-[#4a9eff]"
                />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-1.5 border-t border-white/10 pt-3">
            <label
              htmlFor="pm-band"
              className="flex justify-between text-caption font-semibold text-white/80"
            >
              Banda de tolerância{" "}
              <span className="tabular-nums text-white">±{pct1(pm.state.band, 0)}</span>
            </label>
            <input
              id="pm-band"
              type="range"
              min={1}
              max={10}
              step={1}
              value={Math.round(pm.state.band * 100)}
              onChange={(e) => pm.dispatch({ type: "setBand", band: Number(e.target.value) / 100 })}
              className="w-full accent-[#4a9eff]"
            />
          </div>
        </Panel>
        <Panel title="Desvio vs alvo" subtitle="Pontos percentuais · a vermelho fora da banda">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} stroke={CHART.grid} />
                <XAxis type="number" {...axisProps} tickFormatter={(v: number) => `${v}pp`} />
                <YAxis type="category" dataKey="name" {...axisProps} width={128} />
                <Tooltip {...tooltipProps} formatter={(v) => `${String(v).replace(".", ",")} pp`} />
                <ReferenceLine x={pm.state.band * 100} stroke={CHART.warn} strokeDasharray="3 3" />
                <ReferenceLine x={-pm.state.band * 100} stroke={CHART.warn} strokeDasharray="3 3" />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.35)" />
                <Bar animationDuration={300} animationEasing="ease-out" dataKey="Desvio" radius={4}>
                  {chart.map((c) => (
                    <Cell key={c.k} fill={c.out ? CHART.negative : CLASS_COLOR[c.k]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel
        title="Plano de rebalanceamento"
        subtitle={
          plan.length
            ? `${plan.length} ordens · vende ${usd(sells)}, compra ${usd(buys)} · vendas primeiro`
            : "Carteira já está nos alvos"
        }
        right={
          <Button
            variant="primary"
            size="sm"
            icon={Scale}
            disabled={!plan.length || !valid}
            onClick={() => {
              pm.dispatch({
                type: "orders",
                list: plan.map((p) => ({ symbol: p.symbol, side: p.side, qty: p.qty })),
                source: "rebalanceamento",
              });
              say(
                `Plano enviado: ${plan.length} ordens. Veja o resultado da compliance em Ordens.`,
                "ok",
              );
            }}
          >
            Executar plano
          </Button>
        }
      >
        {plan.length ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {plan.map((p) => (
              <li
                key={p.symbol + p.side}
                className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-micro font-semibold capitalize",
                    p.side === "compra" ? "bg-[#14532d] text-[#dcfce7]" : "bg-[#7f1d1d] text-white",
                  )}
                >
                  {p.side}
                </span>
                <span className="min-w-0 flex-1 text-body text-white">
                  {p.qty} × {p.symbol}
                </span>
                <span className="text-caption tabular-nums text-white/80">{usd(p.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CheckCircle2} title="Nos alvos" hint="Nenhuma ordem necessária." />
        )}
        {!valid ? (
          <p role="alert" className="mt-3 text-caption text-[#fcd34d]">
            Os alvos têm de somar 100% para executar o plano.
          </p>
        ) : null}
      </Panel>
    </>
  );
}

/* ── Risco ───────────────────────────────────────────────────────────── */

function Risk() {
  const pm = usePm();
  const risk = useMemo(() => riskReport(pm.pos, pm.state.cash, BENCHMARK), [pm.pos, pm.state.cash]);
  const series = portfolioSeries(pm.pos, pm.state.cash);
  const dd = drawdowns(series).map((v, i) => ({ d: i, Drawdown: +(v * 100).toFixed(2) }));
  const contrib = risk.contributions.map((c) => ({
    name: c.symbol,
    Risco: +(c.contribution * 100).toFixed(1),
    Peso: +(c.weight * 100).toFixed(1),
  }));
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Volatilidade" value={pct1(risk.vol)} hint="Anualizada, 1 ano diário" />
        <Kpi
          label="Beta"
          value={risk.beta.toFixed(2).replace(".", ",")}
          hint="vs referência 60/40"
        />
        <Kpi
          label="Sharpe"
          value={risk.sharpe.toFixed(2).replace(".", ",")}
          hint="Taxa sem risco 4%"
          tone={risk.sharpe >= 1 ? "good" : risk.sharpe >= 0.5 ? "accent" : "warn"}
        />
        <Kpi
          label="Drawdown máx."
          value={pct1(risk.maxDrawdown)}
          hint="Maior queda desde um pico"
          tone="bad"
        />
        <Kpi
          label="VaR 95% · 1 dia"
          value={usd(risk.var95)}
          hint={`Histórico · ${pct1(risk.var95Pct, 2)}`}
          tone="warn"
        />
        <Kpi
          label="Concentração"
          value={`${risk.effectiveN.toFixed(1).replace(".", ",")} posições`}
          hint={`Efetivas (1/HHI) · top 5 = ${pct1(risk.top5, 0)}`}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Contribuição para o risco"
          subtitle="Quanto de toda a volatilidade vem de cada posição, vs o seu peso"
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contrib} barGap={2}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} width={36} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip {...tooltipProps} formatter={(v) => `${String(v).replace(".", ",")}%`} />
                <Legend {...legendProps} />
                <Bar
                  animationDuration={300}
                  animationEasing="ease-out"
                  dataKey="Peso"
                  fill={CHART.muted}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  animationDuration={300}
                  animationEasing="ease-out"
                  dataKey="Risco"
                  fill={CHART.negative}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-micro text-white/60">
            Quando a barra de risco é maior que a de peso, a posição acrescenta mais volatilidade do
            que capital.
          </p>
        </Panel>
        <Panel title="Drawdown" subtitle="Distância ao máximo anterior, 1 ano">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dd}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis
                  dataKey="d"
                  {...axisProps}
                  tickFormatter={(d: number) => `${d - 252}d`}
                  interval={50}
                />
                <YAxis {...axisProps} width={40} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v) => `${String(v).replace(".", ",")}%`}
                  labelFormatter={(d) => `Dia ${Number(d) - 252}`}
                />
                <Area
                  animationDuration={300}
                  animationEasing="ease-out"
                  type="monotone"
                  dataKey="Drawdown"
                  stroke={CHART.negative}
                  fill="rgba(248,113,113,0.25)"
                  strokeWidth={1.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}

/* ── Stress ──────────────────────────────────────────────────────────── */

const FACTOR_LABEL: Record<Factor, string> = {
  acoes: "Ações",
  juros: "Juros (pp)",
  usd: "Dólar",
  tecnologia: "Tecnologia",
  commodities: "Matérias-primas",
};

function Stress() {
  const pm = usePm();
  const [id, setId] = useState(SCENARIOS[0]!.id);
  const [custom, setCustom] = useState<Record<Factor, number>>({
    acoes: -10,
    juros: 1,
    usd: 0,
    tecnologia: 0,
    commodities: 0,
  });
  const sc = SCENARIOS.find((s) => s.id === id);
  const shocks =
    id === "custom"
      ? {
          acoes: custom.acoes / 100,
          juros: custom.juros / 100,
          usd: custom.usd / 100,
          tecnologia: custom.tecnologia / 100,
          commodities: custom.commodities / 100,
        }
      : sc!.shocks;
  const res = stressTest(pm.pos, pm.state.cash, shocks);
  const all = SCENARIOS.map((s) => ({
    name: s.name,
    Impacto: +(stressTest(pm.pos, pm.state.cash, s.shocks).impactPct * 100).toFixed(1),
  }));
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Panel
          title="Cenário"
          subtitle={id === "custom" ? "Defina os choques por fator" : sc!.note}
        >
          <div role="radiogroup" aria-label="Cenários" className="flex flex-wrap gap-2">
            {[
              ...SCENARIOS.map((s) => ({ id: s.id, name: s.name })),
              { id: "custom", name: "Personalizado" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={id === s.id}
                onClick={() => setId(s.id)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-caption font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  id === s.id
                    ? "border-transparent bg-white/30 text-white"
                    : "border-white/14 bg-white/6 text-white/80 hover:bg-white/12",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
          {id === "custom" ? (
            <ul className="mt-4 flex flex-col gap-3">
              {(Object.keys(FACTOR_LABEL) as Factor[]).map((f) => (
                <li key={f} className="flex flex-col gap-1">
                  <label
                    htmlFor={`sh-${f}`}
                    className="flex justify-between text-caption font-semibold text-white/80"
                  >
                    {FACTOR_LABEL[f]}{" "}
                    <span className="tabular-nums text-white">
                      {custom[f] > 0 ? "+" : ""}
                      {custom[f]}
                      {f === "juros" ? " pp" : "%"}
                    </span>
                  </label>
                  <input
                    id={`sh-${f}`}
                    type="range"
                    min={f === "juros" ? -3 : -50}
                    max={f === "juros" ? 3 : 50}
                    step={f === "juros" ? 0.5 : 5}
                    value={custom[f]}
                    onChange={(e) => setCustom({ ...custom, [f]: Number(e.target.value) })}
                    className="w-full accent-[#4a9eff]"
                  />
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 rounded-[16px] border border-white/10 bg-white/5 p-4">
            <p className="text-micro font-semibold uppercase tracking-[0.1em] text-white/65">
              Impacto estimado
            </p>
            <p
              className={cn(
                "text-hero font-semibold tabular-nums",
                res.impact < 0 ? "text-[#fca5a5]" : "text-[#86efac]",
              )}
            >
              {usd(res.impact)}
            </p>
            <p className="text-caption text-white/75">
              {signedPct(res.impactPct)} da carteira · valor após choque{" "}
              {usd(pm.total + res.impact)}
            </p>
          </div>
        </Panel>
        <Panel title="Impacto por posição" subtitle="Valor × Σ(choque × sensibilidade)">
          <ul className="flex flex-col gap-1.5">
            {res.rows.map((r) => {
              const maxAbs = Math.max(...res.rows.map((x) => Math.abs(x.impact)), 1);
              return (
                <li
                  key={r.symbol}
                  className="grid grid-cols-[56px_minmax(0,1fr)_88px_64px] items-center gap-2 text-caption"
                >
                  <span className="font-semibold text-white">{r.symbol}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(Math.abs(r.impact) / maxAbs) * 100}%`,
                        background: r.impact < 0 ? CHART.negative : CHART.positive,
                      }}
                    />
                  </span>
                  <span
                    className={cn(
                      "text-right tabular-nums",
                      r.impact < 0
                        ? "text-[#fca5a5]"
                        : r.impact > 0
                          ? "text-[#86efac]"
                          : "text-white/60",
                    )}
                  >
                    {usd(r.impact)}
                  </span>
                  <span className="text-right tabular-nums text-white/65">{signedPct(r.pct)}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <Panel title="Comparação de cenários" subtitle="Impacto em % da carteira">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={all}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} width={40} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip {...tooltipProps} formatter={(v) => `${String(v).replace(".", ",")}%`} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.35)" />
              <Bar animationDuration={300} animationEasing="ease-out" dataKey="Impacto" radius={4}>
                {all.map((a) => (
                  <Cell key={a.name} fill={a.Impacto < 0 ? CHART.negative : CHART.positive} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}

/* ── Atribuição ──────────────────────────────────────────────────────── */

function Attribution() {
  const pm = usePm();
  const data = useMemo(() => {
    const w = weightsByClass(pm.pos, pm.state.cash);
    const port: Partial<Record<AssetClass, { w: number; r: number }>> = {};
    for (const c of Object.keys(CLASS_LABEL) as AssetClass[]) {
      const inC = pm.pos.filter((p) => p.sec.assetClass === c);
      const start = inC.reduce((s, p) => s + p.holding.qty * p.path[0]!, 0);
      const end = inC.reduce((s, p) => s + p.value, 0);
      if (c === "liquidez") port[c] = { w: w.liquidez, r: 0.04 };
      else if (inC.length) port[c] = { w: w[c], r: start ? end / start - 1 : 0 };
    }
    const bench: Partial<Record<AssetClass, { w: number; r: number }>> = {};
    for (const c of Object.keys(BENCHMARK_WEIGHTS) as AssetClass[]) {
      const path = BENCH_PATHS[c];
      if (BENCHMARK_WEIGHTS[c] > 0 || port[c])
        bench[c] = {
          w: BENCHMARK_WEIGHTS[c],
          r: c === "liquidez" ? 0.04 : path ? path.at(-1)! / path[0]! - 1 : (port[c]?.r ?? 0),
        };
    }
    return brinson(port, bench);
  }, [pm.pos, pm.state.cash]);
  const totals = data.rows.reduce(
    (s, r) => ({ a: s.a + r.allocation, s: s.s + r.selection, i: s.i + r.interaction }),
    { a: 0, s: 0, i: 0 },
  );
  const chart = data.rows.map((r) => ({
    name: CLASS_LABEL[r.assetClass],
    Alocação: +(r.allocation * 100).toFixed(2),
    Seleção: +(r.selection * 100).toFixed(2),
    Interação: +(r.interaction * 100).toFixed(2),
  }));
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Carteira 1A"
          value={signedPct(data.Rp)}
          hint="Retorno ponderado por classe"
          tone={tone(data.Rp)}
        />
        <Kpi label="Referência 1A" value={signedPct(data.Rb)} hint="60/40 de referência" />
        <Kpi
          label="Excesso"
          value={signedPct(data.excess, 2)}
          hint={`Alocação ${signedPct(totals.a, 2)} · seleção ${signedPct(totals.s, 2)}`}
          tone={tone(data.excess)}
        />
        <Kpi
          label="Interação"
          value={signedPct(totals.i, 2)}
          hint="Sobrepeso onde a seleção também ganhou"
        />
      </div>
      <Panel
        title="Atribuição Brinson-Fachler por classe"
        subtitle="Pontos percentuais do excesso de retorno · pesos atuais como aproximação"
      >
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} width={44} tickFormatter={(v: number) => `${v}pp`} />
              <Tooltip {...tooltipProps} formatter={(v) => `${String(v).replace(".", ",")} pp`} />
              <Legend {...legendProps} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.35)" />
              <Bar
                animationDuration={300}
                animationEasing="ease-out"
                dataKey="Alocação"
                stackId="a"
                fill={SERIES_COLORS[0]}
              />
              <Bar
                animationDuration={300}
                animationEasing="ease-out"
                dataKey="Seleção"
                stackId="a"
                fill={SERIES_COLORS[1]}
              />
              <Bar
                animationDuration={300}
                animationEasing="ease-out"
                dataKey="Interação"
                stackId="a"
                fill={SERIES_COLORS[2]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-caption">
            <thead>
              <tr className="text-left text-micro uppercase tracking-[0.08em] text-white/60">
                {[
                  "Classe",
                  "Peso cart.",
                  "Peso ref.",
                  "Ret. cart.",
                  "Ret. ref.",
                  "Alocação",
                  "Seleção",
                  "Total",
                ].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn("pb-2 font-semibold", i > 0 && "text-right")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.assetClass} className="border-t border-white/8 tabular-nums">
                  <td className="py-1.5 text-white">{CLASS_LABEL[r.assetClass]}</td>
                  <td className="py-1.5 text-right text-white/85">{pct1(r.wp)}</td>
                  <td className="py-1.5 text-right text-white/85">{pct1(r.wb)}</td>
                  <td className="py-1.5 text-right text-white/85">{signedPct(r.rp)}</td>
                  <td className="py-1.5 text-right text-white/85">{signedPct(r.rb)}</td>
                  <td className="py-1.5 text-right text-white">{signedPct(r.allocation, 2)}</td>
                  <td className="py-1.5 text-right text-white">{signedPct(r.selection, 2)}</td>
                  <td
                    className={cn(
                      "py-1.5 text-right font-semibold",
                      r.total >= 0 ? "text-[#86efac]" : "text-[#fca5a5]",
                    )}
                  >
                    {signedPct(r.total, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ── Rendimentos ─────────────────────────────────────────────────────── */

function Income() {
  const pm = usePm();
  const now = new Date().getUTCMonth();
  const sched = incomeSchedule(pm.pos, now);
  const total = sched.reduce((s, m) => s + m.total, 0);
  const monthName = (m: number) =>
    new Date(Date.UTC(2026, m, 1)).toLocaleDateString("pt-PT", { month: "short", timeZone: "UTC" });
  const chart = sched.map((m) => ({ mes: monthName(m.month), Rendimento: Math.round(m.total) }));
  const payers = [...pm.pos]
    .filter((p) => p.sec.yield > 0)
    .sort((a, b) => b.value * b.sec.yield - a.value * a.sec.yield);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Rendimento 12 meses"
          value={<NumberTicker value={total} format={(n) => usd(n)} />}
          hint="Dividendos e cupões previstos"
          tone="good"
        />
        <Kpi
          label="Yield da carteira"
          value={pct1(total / pm.total, 2)}
          hint="Sobre o valor total"
        />
        <Kpi label="Média mensal" value={usd(total / 12)} hint="Distribuída de forma irregular" />
        <Kpi
          label="Próximo mês"
          value={usd(sched[1]?.total ?? 0)}
          hint={monthName(sched[1]?.month ?? now)}
          tone="accent"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Calendário de rendimentos" subtitle="Próximos 12 meses">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="mes" {...axisProps} />
                <YAxis {...axisProps} width={48} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip {...tooltipProps} formatter={(v) => usd(Number(v))} />
                <Bar
                  animationDuration={300}
                  animationEasing="ease-out"
                  dataKey="Rendimento"
                  fill={CHART.positive}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Quem paga" subtitle="Rendimento anual por posição">
          <ul className="flex flex-col divide-y divide-white/8">
            {payers.map((p) => (
              <li
                key={p.sec.symbol}
                className="flex items-center justify-between gap-3 py-2 text-body"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{p.sec.symbol}</span>
                  <span className="flex items-center gap-1 text-micro text-white/60">
                    <CalendarClock size={11} aria-hidden />{" "}
                    {p.sec.payMonths.length === 12
                      ? "mensal"
                      : `${p.sec.payMonths.length}× por ano`}{" "}
                    · yield {pct1(p.sec.yield, 1)}
                  </span>
                </span>
                <span className="tabular-nums text-white">{usd(p.value * p.sec.yield)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
