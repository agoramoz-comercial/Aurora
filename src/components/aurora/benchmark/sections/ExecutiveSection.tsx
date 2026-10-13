import { motion } from "framer-motion";
import {
  AlertTriangle,
  Compass,
  Flag,
  Gavel,
  Landmark,
  Scale,
  Target,
  TrendingUp,
  Wallet,
  Activity,
  ShieldAlert,
  Telescope,
} from "lucide-react";
import { CADENCE } from "@/lib/finance/iipaData";
import { CHART } from "../../chartTheme";
import { Panel } from "../../primitives";
import {
  AnimatedNumber,
  FanChart,
  LegendDot,
  ProbabilityRing,
  riseItem,
  staggerContainer,
} from "../motionKit";
import type { IipaModel } from "../useIipaModel";
import { LevelChip, MetricRow, Rise, money, pct, pp, signedPct } from "./shared";

function Answer({
  icon: Icon,
  question,
  children,
  tone,
}: {
  icon: React.ElementType;
  question: string;
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <Rise>
      <div
        className="flex items-start gap-3 rounded-[13px] px-3 py-2.5"
        style={{
          background: "var(--aurora-surface-1)",
          border: "1px solid var(--aurora-hairline)",
        }}
      >
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px]"
          style={{ background: `${tone ?? CHART.accent}1f`, color: tone ?? CHART.accent }}
        >
          <Icon size={14} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
            {question}
          </p>
          <div className="mt-0.5 text-[13px] font-semibold leading-snug text-white">{children}</div>
        </div>
      </div>
    </Rise>
  );
}

export function ExecutiveSection({ model }: { model: IipaModel }) {
  const { mandate, mc, current, target, worstStress, attr, alerts } = model;
  const H = mandate.horizonYears;
  const gap = current.ret - target;
  const openAlerts = alerts.filter((a) => a.level !== "green");
  const quarterly = CADENCE.find((c) => c.rhythm === "Trimestral");

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Panel
          title={`Para onde pode ir o capital em ${H} anos`}
          subtitle={`${mc.paths.toLocaleString("pt-PT")} futuros possíveis simulados para a carteira atual`}
          right={
            <div className="hidden flex-wrap items-center gap-3 sm:flex">
              <LegendDot color="#fff" label="Resultado central" />
              <LegendDot color={CHART.accent} label="Intervalo provável" />
              <LegendDot color={CHART.warn} label="Meta" dashed />
            </div>
          }
        >
          <FanChart
            key={`${H}-${mandate.capitalUsd}-${target}`}
            data={mc.fan}
            baseline={mandate.capitalUsd}
            height={290}
            format={(v) => money(v, 0)}
            timeLabel={(t) => (t === 0 ? "Hoje" : `Ano ${Math.round(t)}`)}
          />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Cenário central", value: mc.terminal.p50, tone: "#fff" },
              { label: "Pessimista (1 em 20)", value: mc.terminal.p5, tone: CHART.negative },
              { label: "Otimista (1 em 20)", value: mc.terminal.p95, tone: CHART.positive },
              {
                label: "Meta do mandato",
                value: mandate.capitalUsd * Math.pow(1 + target, H),
                tone: CHART.warn,
              },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-[12px] px-3 py-2"
                style={{ background: "var(--aurora-surface-1)" }}
              >
                <p className="text-[10px] text-white/45">{k.label}</p>
                <AnimatedNumber
                  value={k.value}
                  format={(n) => money(n)}
                  className="text-[15px] font-bold"
                  style={{ color: k.tone }}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Resposta do sistema" subtitle="O que o Comité precisa de saber hoje">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-1.5"
          >
            <Answer icon={Target} question="Retorno necessário">
              {pct(target)} ao ano{" "}
              <span className="font-normal text-white/50">
                · inflação + {pct(mandate.realTarget, 0)}
              </span>
            </Answer>
            <Answer
              icon={TrendingUp}
              question="Retorno esperado da carteira"
              tone={gap >= 0 ? CHART.positive : CHART.warn}
            >
              {pct(current.ret)} ao ano{" "}
              <span
                className="font-normal"
                style={{ color: gap >= 0 ? CHART.positive : CHART.warn }}
              >
                ({pp(gap)} vs meta)
              </span>
            </Answer>
            <Answer
              icon={Compass}
              question="Probabilidade de cumprir a meta"
              tone={mc.probTarget >= 0.5 ? CHART.positive : CHART.warn}
            >
              <span className="flex items-center gap-3">
                <ProbabilityRing value={mc.probTarget} size={44} stroke={4} />
                <span className="font-normal text-white/60">
                  Meta realista com 65% de confiança: inflação +{" "}
                  {pct(Math.max(0, model.attainableReal65))}
                </span>
              </span>
            </Answer>
            <Answer icon={Scale} question={`Resultado provável em ${H} anos`}>
              {money(mc.terminal.p25)} a {money(mc.terminal.p75)}
            </Answer>
            <Answer icon={ShieldAlert} question="Risco assumido" tone={CHART.negative}>
              Num ano mau, perda de {pct(-model.badYear)}{" "}
              <span className="font-normal text-white/50">
                · tolerância {pct(mandate.maxLoss12m, 0)}
              </span>
            </Answer>
            <Answer
              icon={AlertTriangle}
              question="Onde a tese falha"
              tone={worstStress.breach ? CHART.negative : CHART.positive}
            >
              {worstStress.label} ({worstStress.period}): {signedPct(worstStress.loss)}
            </Answer>
            <Answer icon={Gavel} question="Quem decide e quando">
              Comité de Investimentos{" "}
              <span className="font-normal text-white/50">· próxima revisão {quarterly?.next}</span>
            </Answer>
          </motion.div>
        </Panel>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Rise>
          <Panel
            title="Capital"
            right={<Wallet size={14} className="text-white/40" />}
            className="h-full"
          >
            <MetricRow label="Património" value={money(mandate.capitalUsd)} />
            <MetricRow
              label="Liquidez imediata"
              value={pct(model.liquidity, 0)}
              hint={`mín. ${pct(mandate.minLiquidity, 0)}`}
            />
            <MetricRow
              label="Exposição cambial"
              value={pct(model.fx)}
              hint={`máx. ${pct(mandate.maxFxUnhedged, 0)}`}
              tone={model.fx > mandate.maxFxUnhedged ? CHART.negative : undefined}
            />
          </Panel>
        </Rise>
        <Rise>
          <Panel
            title="Desempenho · 3 anos"
            right={<Activity size={14} className="text-white/40" />}
            className="h-full"
          >
            <MetricRow label="Retorno anual" value={pct(attr.metrics.portfolioReturn)} />
            <MetricRow
              label="Vs benchmark estratégico"
              value={pp(attr.metrics.activeReturn)}
              tone={attr.metrics.activeReturn >= 0 ? CHART.positive : CHART.negative}
            />
            <MetricRow
              label="Valor da seleção de ativos"
              value={pp(attr.effects.selection, 2)}
              tone={attr.effects.selection >= 0 ? CHART.positive : CHART.negative}
            />
          </Panel>
        </Rise>
        <Rise>
          <Panel
            title="Risco"
            right={<Landmark size={14} className="text-white/40" />}
            className="h-full"
          >
            <MetricRow label="Oscilação anual típica" value={pct(current.vol)} />
            <MetricRow
              label="Queda máxima típica"
              value={pct(-mc.medianMaxDrawdown)}
              tone={CHART.negative}
            />
            <MetricRow
              label="Recuperação típica"
              value={`${Math.round(mc.medianRecoveryMonths)} meses`}
            />
          </Panel>
        </Rise>
        <Rise>
          <Panel
            title="Projeções"
            right={<Telescope size={14} className="text-white/40" />}
            className="h-full"
          >
            <MetricRow label="Retorno esperado" value={pct(current.ret)} />
            <MetricRow label="Probabilidade de perder capital" value={pct(mc.probLoss)} />
            <MetricRow
              label="Carteira recomendada"
              value={pct(model.opt.recommended.probTarget, 0)}
              hint="prob. meta"
              tone={CHART.positive}
            />
          </Panel>
        </Rise>
      </motion.div>

      <Panel
        title="Alertas que exigem atenção"
        subtitle={
          openAlerts.length
            ? `${openAlerts.length} de ${alerts.length} controlos fora da zona verde`
            : "Todos os controlos dentro da tolerância"
        }
        right={<Flag size={14} className="text-white/40" />}
      >
        {openAlerts.length ? (
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-2 md:grid-cols-2 xl:grid-cols-3"
          >
            {openAlerts.slice(0, 6).map((a) => (
              <motion.li
                key={a.id}
                variants={riseItem}
                className="flex h-full flex-col gap-1.5 rounded-[13px] p-3"
                style={{
                  background: "var(--aurora-surface-1)",
                  border: "1px solid var(--aurora-hairline)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] font-semibold text-white">{a.title}</span>
                  <LevelChip level={a.level} compact />
                </div>
                <p className="text-[11px] tabular-nums text-white/60">
                  {a.value} <span className="text-white/35">· {a.limit}</span>
                </p>
                <p className="text-[11px] text-white/80">→ {a.action}</p>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <p className="text-[12px] text-white/50">Nenhuma ação necessária.</p>
        )}
      </Panel>
    </div>
  );
}
