import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  ASSET_CLASSES,
  CURRENT_WEIGHTS,
  SCENARIOS,
  SOURCE_LABELS,
  type ScenarioId,
} from "@/lib/finance/iipaData";
import { CHART, axisProps, legendProps, tooltipProps } from "../../chartTheme";
import { FilterChip, Panel, SegmentedTabs } from "../../primitives";
import {
  AnimatedNumber,
  FanChart,
  LegendDot,
  ProbabilityRing,
  riseItem,
  staggerContainer,
  useChartMotion,
} from "../motionKit";
import { useHorizonProjection, type IipaModel } from "../useIipaModel";
import { MetricRow, money, pct } from "./shared";

type HorizonId = "tactical" | "medium" | "strategic";

export function ProjectionsSection({ model }: { model: IipaModel }) {
  const [horizon, setHorizon] = useState<HorizonId>("strategic");
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const chart = useChartMotion();
  const H = model.mandate.horizonYears;
  const years = horizon === "tactical" ? 1 : horizon === "medium" ? 5 : H;
  const { mc, stats } = useHorizonProjection(model, years, scenario);
  const sc = SCENARIOS.find((s) => s.id === scenario)!;

  const sources = ASSET_CLASSES.map((c) => ({
    name: c.short,
    [SOURCE_LABELS.income]: +(c.sources.income * 100).toFixed(2),
    [SOURCE_LABELS.growth]: +(c.sources.growth * 100).toFixed(2),
    [SOURCE_LABELS.valuation]: +(c.sources.valuation * 100).toFixed(2),
    [SOURCE_LABELS.drag]: +(c.sources.drag * 100).toFixed(2),
  }));
  const sourceColors = [CHART.accent, CHART.positive, CHART.violet, CHART.negative];

  const riskReturn = ASSET_CLASSES.map((c) => ({
    name: c.label,
    risco: +(c.volatility * 100).toFixed(1),
    retorno: +(c.expectedReturn * 100).toFixed(1),
    peso: Math.max(4, CURRENT_WEIGHTS[c.id] * 100),
    color: c.color,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedTabs
          size="sm"
          active={horizon}
          onSelect={setHorizon}
          tabs={[
            { id: "tactical", label: "Tático · 12 meses", shortLabel: "12m" },
            { id: "medium", label: "Intermédio · 5 anos", shortLabel: "5A" },
            { id: "strategic", label: `Estratégico · ${H} anos`, shortLabel: `${H}A` },
          ]}
        />
        <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
          {SCENARIOS.map((s) => (
            <FilterChip key={s.id} active={scenario === s.id} onClick={() => setScenario(s.id)}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title={`Trajetórias prováveis · cenário ${sc.label.toLowerCase()}`}
          subtitle={sc.narrative}
          right={
            <div className="hidden items-center gap-3 sm:flex">
              <LegendDot color="#fff" label="Central" />
              <LegendDot color={sc.color} label="Intervalo provável" />
              <LegendDot color={CHART.warn} label="Meta" dashed />
            </div>
          }
        >
          <FanChart
            key={`${horizon}-${scenario}-${model.mandate.capitalUsd}`}
            data={mc.fan}
            baseline={model.mandate.capitalUsd}
            accent={sc.color}
            height={280}
            format={(v) => money(v, 0)}
            timeLabel={(t) =>
              t === 0 ? "Hoje" : years <= 2 ? `Mês ${Math.round(t * 12)}` : `Ano ${Math.round(t)}`
            }
          />
        </Panel>

        <Panel
          title="Resultado neste horizonte"
          subtitle={`${mc.paths.toLocaleString("pt-PT")} simulações`}
        >
          <div className="flex items-center gap-4 pb-2">
            <ProbabilityRing
              key={`${horizon}-${scenario}`}
              value={mc.probTarget}
              size={86}
              label="meta"
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Valor central</p>
              <AnimatedNumber
                value={mc.terminal.p50}
                format={(n) => money(n)}
                className="text-[24px] font-bold text-white"
              />
              <p className="text-[11px] text-white/50">
                Provável entre {money(mc.terminal.p25)} e {money(mc.terminal.p75)}
              </p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            <MetricRow label="Retorno anual esperado" value={pct(stats.ret)} />
            <MetricRow label="Oscilação anual típica" value={pct(stats.vol)} />
            <MetricRow
              label="Probabilidade de perder capital"
              value={pct(mc.probLoss)}
              tone={mc.probLoss > 0.1 ? CHART.warn : undefined}
            />
            <MetricRow
              label="Queda máxima típica"
              value={pct(-mc.medianMaxDrawdown)}
              tone={CHART.negative}
            />
            <MetricRow
              label="Queda num período mau (1 em 10)"
              value={pct(-mc.badMaxDrawdown)}
              tone={CHART.negative}
            />
            <MetricRow
              label="Recuperação típica após queda"
              value={`${Math.round(mc.medianRecoveryMonths)} meses`}
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="Matriz de cenários"
        subtitle={`Horizonte de ${H} anos · a carteira atual em cada mundo possível`}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5"
        >
          {model.scenarios.map((s, i) => (
            <motion.button
              type="button"
              key={s.id}
              variants={riseItem}
              onClick={() => setScenario(s.id)}
              aria-pressed={scenario === s.id}
              className="flex flex-col items-center gap-2 rounded-[14px] p-3 text-center transition-[background-color,box-shadow] duration-200"
              style={{
                background: scenario === s.id ? `${s.color}1c` : "var(--aurora-surface-1)",
                boxShadow:
                  scenario === s.id
                    ? `inset 0 0 0 1px ${s.color}99`
                    : "inset 0 0 0 1px var(--aurora-hairline)",
              }}
            >
              <span className="text-[12px] font-bold" style={{ color: s.color }}>
                {s.label}
              </span>
              <ProbabilityRing
                value={s.probTarget}
                size={64}
                color={s.color}
                label="meta"
                delay={0.1 + i * 0.07}
              />
              <div className="w-full text-left">
                <MetricRow label="Retorno anual" value={pct(s.ret)} />
                <MetricRow label="Ano mau" value={pct(s.badYear)} tone={CHART.negative} />
                <MetricRow label="Queda típica" value={pct(-s.maxDrawdown, 0)} />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="De onde vem o retorno" subtitle="Contributos esperados por classe · % ao ano">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sources}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
                stackOffset="sign"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" {...axisProps} unit="%" />
                <YAxis type="category" dataKey="name" width={80} {...axisProps} />
                <Tooltip {...tooltipProps} formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Legend {...legendProps} />
                {Object.values(SOURCE_LABELS).map((k, i) => (
                  <Bar
                    key={k}
                    dataKey={k}
                    stackId="s"
                    fill={sourceColors[i]}
                    radius={i === 3 ? [4, 4, 4, 4] : 0}
                    maxBarSize={16}
                    {...chart(i)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Risco e retorno por classe"
          subtitle="Tamanho da bolha = peso na carteira atual"
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis type="number" dataKey="risco" name="Oscilação" unit="%" {...axisProps} />
                <YAxis type="number" dataKey="retorno" name="Retorno" unit="%" {...axisProps} />
                <ZAxis type="number" dataKey="peso" range={[60, 520]} />
                <Tooltip
                  {...tooltipProps}
                  cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }}
                  formatter={(v: number, n: string) => (n === "peso" ? null : [`${v}%`, n])}
                  labelFormatter={() => ""}
                />
                <Scatter data={riskReturn} {...chart(1)}>
                  {riskReturn.map((d) => (
                    <Cell
                      key={d.name}
                      fill={d.color}
                      fillOpacity={0.85}
                      stroke="#fff"
                      strokeOpacity={0.3}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {riskReturn.map((d) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-white/55">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
