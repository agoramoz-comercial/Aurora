import { motion } from "framer-motion";
import { CalendarClock, Database, GitFork, ShieldCheck, Users } from "lucide-react";
import { CADENCE, DATA_DOMAINS, GOVERNANCE_ROLES, INDEPENDENCE } from "@/lib/finance/iipaData";
import { CHART } from "../../chartTheme";
import { Panel } from "../../primitives";
import { ProbabilityRing, RevealBar, riseItem, staggerContainer } from "../motionKit";
import type { IipaModel } from "../useIipaModel";
import { LEVEL_META, LevelChip } from "./shared";

export function GovernanceSection({ model }: { model: IipaModel }) {
  const { alerts, dq, mandate } = model;
  const counts = (["black", "red", "amber", "green"] as const).map((l) => ({
    level: l,
    n: alerts.filter((a) => a.level === l).length,
  }));

  return (
    <div className="flex flex-col gap-3">
      <Panel
        title="Centro de alertas"
        subtitle="Regras de controlo e escalada automática"
        right={
          <div className="flex flex-wrap gap-1.5">
            {counts.map((c) => (
              <span
                key={c.level}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{ color: LEVEL_META[c.level].color, background: LEVEL_META[c.level].bg }}
              >
                {c.n} {LEVEL_META[c.level].label.toLowerCase()}
              </span>
            ))}
          </div>
        }
      >
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-1.5"
        >
          {alerts.map((a) => (
            <motion.li
              key={a.id}
              variants={riseItem}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[13px] px-3 py-2.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto]"
              style={{
                background: a.level === "black" ? "rgba(0,0,0,0.45)" : "var(--aurora-surface-1)",
                border: `1px solid ${a.level === "green" ? "var(--aurora-hairline)" : LEVEL_META[a.level].border}`,
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-white">{a.title}</p>
                <p className="text-[10px] text-white/45">{a.owner}</p>
              </div>
              <p className="hidden text-[12px] tabular-nums text-white md:block">
                {a.value} <span className="text-[10px] text-white/40">{a.limit}</span>
              </p>
              <p className="hidden text-[11px] text-white/70 md:block">{a.action}</p>
              <LevelChip level={a.level} />
            </motion.li>
          ))}
        </motion.ul>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="Qualidade dos dados"
          subtitle="Nenhuma projeção é publicada abaixo do mínimo"
          right={<Database size={14} className="text-white/40" />}
        >
          <div className="flex items-center gap-4">
            <ProbabilityRing
              value={dq.score / 100}
              size={92}
              color={dq.publishable ? CHART.positive : CHART.negative}
              label="qualidade"
            />
            <div className="min-w-0 flex-1">
              <p
                className="flex items-center gap-1.5 text-[14px] font-semibold"
                style={{ color: dq.publishable ? CHART.positive : CHART.negative }}
              >
                <ShieldCheck size={15} />
                {dq.publishable ? "Projeções publicáveis" : "Publicação bloqueada"}
              </p>
              <p className="text-[11px] text-white/50">
                Mínimo exigido {mandate.minDataQuality}/100 · ponto mais fraco:{" "}
                {dq.weakest.label.toLowerCase()}
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {DATA_DOMAINS.map((d, i) => {
              const color =
                d.score >= 90
                  ? CHART.positive
                  : d.score >= mandate.minDataQuality
                    ? CHART.warn
                    : CHART.negative;
              return (
                <li key={d.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/75">{d.label}</span>
                    <span className="tabular-nums text-white/50">
                      <b className="text-white">{d.score}</b> · {d.updated} · {d.owner}
                    </span>
                  </div>
                  <RevealBar
                    value={d.score / 100}
                    marker={mandate.minDataQuality / 100}
                    color={color}
                    height={5}
                    delay={0.1 + i * 0.06}
                  />
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title="Cadência de decisão"
          subtitle="Próximas revisões obrigatórias"
          right={<CalendarClock size={14} className="text-white/40" />}
        >
          <motion.ol
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="relative flex flex-col gap-3 pl-5"
          >
            <span
              aria-hidden
              className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-[var(--aurora-accent)] to-white/10"
            />
            {CADENCE.map((c) => (
              <motion.li key={c.rhythm} variants={riseItem} className="relative">
                <span
                  className="absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--aurora-accent)]"
                  style={{ background: "rgba(8,12,22,0.9)" }}
                />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-semibold text-white">{c.rhythm}</span>
                  <span className="text-[11px] tabular-nums text-[var(--aurora-accent)]">
                    {c.next}
                  </span>
                </div>
                <p className="text-[11px] text-white/50">{c.focus}</p>
              </motion.li>
            ))}
          </motion.ol>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Quem decide o quê" right={<Users size={14} className="text-white/40" />}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-2 sm:grid-cols-2"
          >
            {GOVERNANCE_ROLES.map((r) => (
              <motion.div
                key={r.role}
                variants={riseItem}
                className="rounded-[12px] px-3 py-2.5"
                style={{
                  background: "var(--aurora-surface-1)",
                  border: "1px solid var(--aurora-hairline)",
                }}
              >
                <p className="text-[12px] font-semibold text-white">{r.role}</p>
                <p className="text-[11px] text-white/50">{r.duty}</p>
              </motion.div>
            ))}
          </motion.div>
        </Panel>

        <Panel
          title="Princípio de independência"
          right={<GitFork size={14} className="text-white/40" />}
        >
          <div className="flex flex-col gap-2">
            {INDEPENDENCE.map((p) => (
              <div
                key={p.a}
                className="flex items-center justify-between gap-2 rounded-[12px] px-3 py-2.5 text-[12px]"
                style={{
                  background: "rgba(74,158,255,0.07)",
                  border: "1px solid rgba(74,158,255,0.2)",
                }}
              >
                <span className="text-white">{p.a}</span>
                <span className="font-bold text-[var(--aurora-accent)]">≠</span>
                <span className="text-right text-white/70">{p.b}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
