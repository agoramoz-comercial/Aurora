import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { expectedShortfall1y, levelFor } from "@/lib/finance/iipaEngine";
import { CHART, axisProps, tooltipProps } from "../../chartTheme";
import { Panel } from "../../primitives";
import { RevealBar, riseItem, staggerContainer, useChartMotion } from "../motionKit";
import type { IipaModel } from "../useIipaModel";
import { LEVEL_META, LevelChip, money, pct } from "./shared";

export function RiskSection({ model }: { model: IipaModel }) {
  const chart = useChartMotion();
  const { mandate, current, policy, mc, stress, u, wp, alerts } = model;
  const es = expectedShortfall1y(current.ret, current.vol);

  const gauges = [
    {
      label: "Oscilação anual",
      value: pct(current.vol),
      limit: `estratégica ${pct(policy.vol)}`,
      usage: current.vol / (policy.vol * 1.25),
    },
    {
      label: "Perda num ano mau",
      value: pct(-model.badYear),
      limit: `tolerância ${pct(mandate.maxLoss12m, 0)}`,
      usage: -model.badYear / mandate.maxLoss12m,
    },
    {
      label: "Perda média nos piores anos",
      value: pct(-es),
      limit: `tolerância ${pct(mandate.maxLoss12m, 0)}`,
      usage: -es / mandate.maxLoss12m,
    },
    {
      label: "Queda máxima típica",
      value: pct(mc.medianMaxDrawdown),
      limit: `tolerância ${pct(mandate.maxLoss12m * 1.5, 0)}`,
      usage: mc.medianMaxDrawdown / (mandate.maxLoss12m * 1.5),
    },
    ...["te", "issuer", "liquidity", "fx"].map((id) => {
      const a = alerts.find((x) => x.id === id)!;
      return { label: a.title, value: a.value.split(" · ")[0]!, limit: a.limit, usage: a.usage };
    }),
  ];

  const stressData = stress.map((s) => ({
    name: s.label,
    perda: +(s.loss * 100).toFixed(1),
    usd: s.lossUsd,
    breach: s.breach,
  }));

  const histogram = useMemo(() => {
    const bins: { bin: string; mid: number; count: number }[] = [];
    for (let lo = -0.4; lo < 0.4; lo += 0.04) {
      bins.push({ bin: `${Math.round(lo * 100)}%`, mid: lo + 0.02, count: 0 });
    }
    for (const r of mc.firstYear) {
      const idx = Math.min(bins.length - 1, Math.max(0, Math.floor((r + 0.4) / 0.04)));
      bins[idx]!.count++;
    }
    const total = mc.firstYear.length || 1;
    return bins.map((b) => ({ ...b, share: +((b.count / total) * 100).toFixed(1) }));
  }, [mc.firstYear]);

  const riskDrivers = u.classes
    .map((c, i) => ({
      label: c.short,
      color: c.color,
      capital: wp[i]!,
      risk: current.riskShare[i]!,
    }))
    .filter((d) => d.capital > 0)
    .sort((a, b) => b.risk - a.risk);

  return (
    <div className="flex flex-col gap-3">
      <Panel
        title="Orçamento de risco"
        subtitle="Posição de cada medida face ao limite do mandato · a marca é o limite"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-x-6 gap-y-3 md:grid-cols-2"
        >
          {gauges.map((g, i) => {
            const level = levelFor(g.usage);
            return (
              <motion.div key={g.label} variants={riseItem} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-white/70">{g.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold tabular-nums text-white">{g.value}</span>
                    <span className="text-white/40">{g.limit}</span>
                    <LevelChip level={level} compact />
                  </span>
                </div>
                <RevealBar
                  value={Math.min(1, g.usage / 1.5)}
                  marker={1 / 1.5}
                  color={LEVEL_META[level].color}
                  delay={0.1 + i * 0.05}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel
          title="Stress tests"
          subtitle={`Perda imediata da carteira em choques históricos e hipotéticos · linha = tolerância de ${pct(mandate.maxLoss12m, 0)}`}
        >
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stressData}
                layout="vertical"
                margin={{ top: 4, right: 56, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                <XAxis
                  type="number"
                  {...axisProps}
                  unit="%"
                  domain={[Math.min(-30, ...stressData.map((d) => d.perda - 2)), 0]}
                />
                <YAxis type="category" dataKey="name" width={130} {...axisProps} />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v: number, _n: string, p: { payload?: { usd: number } }) => [
                    `${v}% · ${money(p.payload?.usd ?? 0)}`,
                    "Perda",
                  ]}
                />
                <ReferenceLine
                  x={-mandate.maxLoss12m * 100}
                  stroke={CHART.warn}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
                <Bar dataKey="perda" radius={[6, 0, 0, 6]} maxBarSize={18} {...chart(0)}>
                  {stressData.map((d) => (
                    <Cell key={d.name} fill={d.breach ? CHART.negative : CHART.accent} />
                  ))}
                  <LabelList
                    dataKey="usd"
                    position="right"
                    formatter={(v: number) => money(v)}
                    style={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Como podem correr os próximos 12 meses"
          subtitle="Distribuição dos resultados simulados · vermelho = pior que a tolerância"
        >
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogram} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="bin" {...axisProps} interval={2} />
                <YAxis {...axisProps} unit="%" />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v: number) => [`${v}% dos cenários`, "Frequência"]}
                />
                <Bar dataKey="share" radius={[4, 4, 0, 0]} {...chart(1)}>
                  {histogram.map((b) => (
                    <Cell
                      key={b.bin}
                      fill={
                        b.mid < -mandate.maxLoss12m
                          ? CHART.negative
                          : b.mid < 0
                            ? CHART.warn
                            : CHART.positive
                      }
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-white/55">
            Probabilidade de perder mais do que a tolerância em 12 meses:{" "}
            <b className="tabular-nums text-white">{pct(mc.prob12mBreach)}</b>
          </p>
        </Panel>
      </div>

      <Panel
        title="Quem gera o risco"
        subtitle="Peso no capital vs peso no risco total da carteira"
      >
        <div className="flex flex-col gap-2">
          {riskDrivers.map((d, i) => (
            <div
              key={d.label}
              className="grid grid-cols-[96px_minmax(0,1fr)_150px] items-center gap-3 text-[11px]"
            >
              <span className="flex items-center gap-1.5 truncate text-white/75">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                {d.label}
              </span>
              <div className="flex flex-col gap-1">
                <RevealBar
                  value={d.capital / 0.6}
                  color="rgba(255,255,255,0.55)"
                  height={4}
                  delay={0.1 + i * 0.05}
                />
                <RevealBar
                  value={Math.max(0, d.risk) / 0.6}
                  color={d.color}
                  height={6}
                  delay={0.2 + i * 0.05}
                />
              </div>
              <span className="whitespace-nowrap text-right tabular-nums text-white/60">
                {pct(d.capital, 0)} capital · <b className="text-white">{pct(d.risk, 0)}</b> risco
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
