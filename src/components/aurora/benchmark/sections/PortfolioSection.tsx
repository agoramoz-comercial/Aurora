import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CircleSlash, Sparkles } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ASSET_CLASSES } from "@/lib/finance/iipaData";
import type { MethodId } from "@/lib/finance/iipaEngine";
import { CHART, axisProps, tooltipProps } from "../../chartTheme";
import { Panel } from "../../primitives";
import {
  ProbabilityRing,
  RevealBar,
  riseItem,
  staggerContainer,
  useChartMotion,
} from "../motionKit";
import type { IipaModel } from "../useIipaModel";
import { MetricRow, pct, pp } from "./shared";

const METHOD_COLORS: Record<MethodId, string> = {
  goals: CHART.accent,
  maxSharpe: CHART.positive,
  minVar: CHART.teal,
  riskParity: CHART.violet,
  policy: "#e5e7eb",
  current: CHART.warn,
  equal: "rgba(255,255,255,0.45)",
  sixtyForty: "rgba(255,255,255,0.45)",
};

export function PortfolioSection({ model }: { model: IipaModel }) {
  const chart = useChartMotion();
  const { opt } = model;
  const rec = opt.recommended;
  const current = opt.methods.find((m) => m.id === "current")!;

  const cloud = opt.cloud.map((p) => ({
    vol: +(p.vol * 100).toFixed(2),
    ret: +(p.ret * 100).toFixed(2),
  }));
  const frontier = opt.frontier.map((p) => ({
    vol: +(p.vol * 100).toFixed(2),
    frontier: +(p.ret * 100).toFixed(2),
  }));
  const points = opt.methods.map((m) => ({
    id: m.id,
    name: m.label,
    vol: +(m.vol * 100).toFixed(2),
    ret: +(m.ret * 100).toFixed(2),
  }));

  const rebalance = ASSET_CLASSES.map((c) => ({
    id: c.id,
    label: c.label,
    color: c.color,
    now: current.weights[c.id],
    next: rec.weights[c.id],
    delta: rec.weights[c.id] - current.weights[c.id],
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <div className="flex flex-col gap-3">
      <div
        className="glass flex flex-wrap items-center gap-4 p-4"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(74,158,255,0.3), 0 0 30px rgba(74,158,255,0.08)",
        }}
      >
        <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[rgba(74,158,255,0.18)] text-[var(--aurora-accent)]">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--aurora-accent)]">
            Recomendação
          </p>
          <p className="text-[15px] font-semibold text-white">
            Carteira {rec.label.toLowerCase()}: probabilidade de cumprir a meta de{" "}
            <span className="tabular-nums">{pct(current.probTarget, 0)}</span> para{" "}
            <span className="tabular-nums text-[var(--aurora-accent)]">
              {pct(rec.probTarget, 0)}
            </span>
          </p>
          <p className="text-[11px] text-white/50">
            Retorno esperado {pct(rec.ret)} · ano mau {pct(rec.badYear)} ·{" "}
            {rec.compliant ? "cumpre todos os limites do mandato" : "exige exceção ao mandato"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Fronteira de carteiras possíveis"
          subtitle="Cada ponto é uma carteira que respeita o mandato · a linha é o melhor retorno para cada nível de risco"
        >
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis
                  type="number"
                  dataKey="vol"
                  name="Oscilação"
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  {...axisProps}
                />
                <YAxis
                  type="number"
                  dataKey="ret"
                  name="Retorno"
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                  domain={["dataMin - 0.3", "dataMax + 0.3"]}
                  {...axisProps}
                />
                <Tooltip
                  {...tooltipProps}
                  cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }}
                  formatter={(v: number, n: string) => [
                    `${v}%`,
                    n === "vol" ? "Oscilação" : "Retorno",
                  ]}
                  labelFormatter={() => ""}
                />
                <Scatter
                  data={cloud}
                  fill={CHART.accent}
                  fillOpacity={0.16}
                  shape="circle"
                  isAnimationActive={false}
                />
                <Line
                  data={frontier}
                  dataKey="frontier"
                  type="monotone"
                  stroke={CHART.accent}
                  strokeWidth={2.2}
                  dot={false}
                  {...chart(1)}
                />
                <Scatter data={points} {...chart(3)}>
                  {points.map((p) => (
                    <Cell
                      key={p.id}
                      fill={METHOD_COLORS[p.id]}
                      stroke={p.id === "goals" ? "#fff" : "rgba(0,0,0,0.4)"}
                      strokeWidth={p.id === "goals" ? 2 : 1}
                    />
                  ))}
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {opt.methods.map((m) => (
              <span key={m.id} className="flex items-center gap-1 text-[10px] text-white/55">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: METHOD_COLORS[m.id] }}
                />{" "}
                {m.label}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Rebalanceamento sugerido" subtitle="Da carteira atual para a recomendada">
          <ul className="flex flex-col gap-2.5">
            {rebalance.map((r, i) => (
              <li key={r.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-white/75">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                    {r.label}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-white/45">{pct(r.now, 0)}</span>
                    <ArrowRight size={11} className="text-white/35" />
                    <span className="font-semibold text-white">{pct(r.next, 0)}</span>
                    <span
                      className="w-14 text-right font-semibold"
                      style={{
                        color:
                          Math.abs(r.delta) < 0.01
                            ? "rgba(255,255,255,0.4)"
                            : r.delta > 0
                              ? CHART.positive
                              : CHART.negative,
                      }}
                    >
                      {pp(r.delta, 0)}
                    </span>
                  </span>
                </div>
                <RevealBar
                  value={r.next / 0.4}
                  marker={r.now / 0.4}
                  color={r.color}
                  height={5}
                  delay={0.15 + i * 0.05}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-white/40">A marca branca indica o peso atual.</p>
        </Panel>
      </div>

      <Panel
        title="Métodos de construção comparados"
        subtitle={`Probabilidade de cumprir a meta em ${model.mandate.horizonYears} anos`}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {opt.methods.map((m, i) => (
            <motion.div
              key={m.id}
              variants={riseItem}
              className="relative flex flex-col gap-2 rounded-[14px] p-3"
              style={{
                background: m.id === "goals" ? "rgba(74,158,255,0.1)" : "var(--aurora-surface-1)",
                boxShadow:
                  m.id === "goals"
                    ? "inset 0 0 0 1px rgba(74,158,255,0.55)"
                    : "inset 0 0 0 1px var(--aurora-hairline)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: METHOD_COLORS[m.id] }}
                    />
                    {m.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-white/45">{m.purpose}</p>
                </div>
                <ProbabilityRing value={m.probTarget} size={48} stroke={4} delay={0.1 + i * 0.05} />
              </div>
              <div className="divide-y divide-white/[0.06]">
                <MetricRow label="Retorno esperado" value={pct(m.ret)} />
                <MetricRow label="Oscilação" value={pct(m.vol)} />
                <MetricRow label="Ano mau" value={pct(m.badYear)} tone={CHART.negative} />
              </div>
              <span
                className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: m.compliant ? CHART.positive : CHART.warn }}
              >
                {m.compliant ? <BadgeCheck size={12} /> : <CircleSlash size={12} />}
                {m.compliant ? "Cumpre o mandato" : "Fora dos limites do mandato"}
              </span>
              {m.id === "goals" ? (
                <span className="absolute -top-2 right-3 rounded-full bg-[var(--aurora-accent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                  Recomendada
                </span>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      </Panel>
    </div>
  );
}
