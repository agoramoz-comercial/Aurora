/**
 * BenchmarkWorkspace — Investment Intelligence & Projection Architecture (IIPA).
 *
 * Mandate → multi-layer benchmarks → probabilistic projections → portfolio
 * construction → risk & stress → attribution → governance. The client sees
 * the answers (probabilities, ranges, limits, actions), never the maths.
 *
 * Visual language: Ollympius Dashboard (glass surfaces, pill headers, single
 * blue accent, tabular numerals). Motion: ./motionKit.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Crosshair,
  Gauge,
  LayoutDashboard,
  LineChart,
  ScrollText,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
} from "lucide-react";
import { AccentBadge, SegmentedTabs, StatTile, WorkspaceHeader } from "../primitives";
import { AnimatedNumber, motionTokens, riseItem, staggerContainer } from "./motionKit";
import { MandateDrawer } from "./MandateDrawer";
import { useIipaModel, useMandate } from "./useIipaModel";
import { ExecutiveSection } from "./sections/ExecutiveSection";
import { MandateSection } from "./sections/MandateSection";
import { ProjectionsSection } from "./sections/ProjectionsSection";
import { PortfolioSection } from "./sections/PortfolioSection";
import { RiskSection } from "./sections/RiskSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { IssuersSection } from "./sections/IssuersSection";
import { GovernanceSection } from "./sections/GovernanceSection";
import { LEVEL_META, LevelChip, money, pct } from "./sections/shared";

const TABS = [
  { id: "executive", label: "Visão executiva", shortLabel: "Executiva", icon: LayoutDashboard },
  { id: "mandate", label: "Mandato & Benchmarks", shortLabel: "Mandato", icon: ScrollText },
  { id: "projections", label: "Projeções & Cenários", shortLabel: "Projeções", icon: LineChart },
  { id: "portfolio", label: "Carteira ótima", shortLabel: "Carteira", icon: Crosshair },
  { id: "risk", label: "Risco & Stress", shortLabel: "Risco", icon: ShieldAlert },
  { id: "performance", label: "Desempenho & Atribuição", shortLabel: "Desempenho", icon: Gauge },
  { id: "issuers", label: "Emitentes", shortLabel: "Emitentes", icon: Building2 },
  { id: "governance", label: "Alertas & Governação", shortLabel: "Alertas", icon: Siren },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BenchmarkWorkspace() {
  const [tab, setTab] = useState<TabId>("executive");
  const [mandateOpen, setMandateOpen] = useState(false);
  const { mandate, setMandate } = useMandate();
  const model = useIipaModel(mandate);
  const { mc, current, target, worstStress, alerts, worstLevel } = model;
  const H = model.mandate.horizonYears;
  const open = alerts.filter((a) => a.level !== "green").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="Benchmark & Projeções"
        subtitle="Mandato · benchmarks · projeções probabilísticas · carteira · risco · atribuição · governação"
        badge={<AccentBadge>IIPA</AccentBadge>}
        right={
          <>
            <button
              type="button"
              onClick={() => setMandateOpen(true)}
              className="glass-pill hidden items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/25 md:inline-flex"
            >
              <SlidersHorizontal size={12} />
              {money(model.mandate.capitalUsd, 0)} · Inflação + {pct(model.mandate.realTarget, 0)} ·{" "}
              {H} anos
            </button>
            <button type="button" onClick={() => setTab("governance")} aria-label="Ver alertas">
              <LevelChip level={worstLevel} />
            </button>
          </>
        }
      />

      {/* Executive answer strip */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mt-3 grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
        style={{
          opacity: model.pending ? 0.6 : 1,
          transition: `opacity ${motionTokens.duration.fast}s`,
        }}
      >
        <motion.div variants={riseItem}>
          <StatTile
            accent
            label="Retorno esperado"
            value={<AnimatedNumber value={current.ret * 100} format={(n) => `${n.toFixed(1)}%`} />}
            delta={`meta ${pct(target)}`}
            deltaTone={current.ret >= target ? "up" : "down"}
            footnote="ao ano, carteira atual"
          />
        </motion.div>
        <motion.div variants={riseItem}>
          <StatTile
            label="Probabilidade da meta"
            value={
              <AnimatedNumber value={mc.probTarget * 100} format={(n) => `${Math.round(n)}%`} />
            }
            footnote={`recomendada: ${pct(model.opt.recommended.probTarget, 0)}`}
          />
        </motion.div>
        <motion.div variants={riseItem}>
          <StatTile
            label={`Capital em ${H} anos`}
            value={
              <span className="tabular-nums">
                <AnimatedNumber value={mc.terminal.p25} format={(n) => money(n, 0)} />
                <span className="text-white/40"> – </span>
                <AnimatedNumber value={mc.terminal.p75} format={(n) => money(n, 0)} />
              </span>
            }
            footnote={`central ${money(mc.terminal.p50)}`}
          />
        </motion.div>
        <motion.div variants={riseItem}>
          <StatTile
            label="Pior cenário extremo"
            value={
              <AnimatedNumber value={worstStress.loss * 100} format={(n) => `${n.toFixed(1)}%`} />
            }
            deltaTone="down"
            delta={worstStress.breach ? "> limite" : undefined}
            footnote={`${worstStress.label} · tolerância ${pct(model.mandate.maxLoss12m, 0)}`}
          />
        </motion.div>
        <motion.div variants={riseItem} className="col-span-2 sm:col-span-1">
          <button
            type="button"
            onClick={() => setTab("governance")}
            className="block h-full w-full text-left"
          >
            <StatTile
              label="Estado de controlo"
              value={
                <span style={{ color: LEVEL_META[worstLevel].color }}>
                  {open ? `${open} alerta${open > 1 ? "s" : ""}` : "Tudo verde"}
                </span>
              }
              footnote={LEVEL_META[worstLevel].label}
            />
          </button>
        </motion.div>
      </motion.div>

      <div className="mt-3 shrink-0">
        <SegmentedTabs tabs={[...TABS]} active={tab} onSelect={setTab} />
      </div>

      <div className="thin-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: motionTokens.distance.sm }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -motionTokens.distance.sm / 2,
              transition: { duration: motionTokens.duration.fast },
            }}
            transition={{
              duration: motionTokens.duration.normal,
              ease: motionTokens.easing.smooth,
            }}
            className="pb-2"
          >
            {tab === "executive" && <ExecutiveSection model={model} />}
            {tab === "mandate" && (
              <MandateSection model={model} onEditMandate={() => setMandateOpen(true)} />
            )}
            {tab === "projections" && <ProjectionsSection model={model} />}
            {tab === "portfolio" && <PortfolioSection model={model} />}
            {tab === "risk" && <RiskSection model={model} />}
            {tab === "performance" && <PerformanceSection model={model} />}
            {tab === "issuers" && <IssuersSection />}
            {tab === "governance" && <GovernanceSection model={model} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <MandateDrawer
        open={mandateOpen}
        mandate={mandate}
        onClose={() => setMandateOpen(false)}
        onApply={setMandate}
      />
    </div>
  );
}
