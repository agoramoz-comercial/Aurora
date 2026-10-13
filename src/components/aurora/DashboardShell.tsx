import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { AlertTriangle, Plus } from "lucide-react";
import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import roomBg from "@/assets/room-bg.jpg";
import {
  goals,
  heroStats,
  kpiCards,
  microCards,
  recentActivity,
  teamMembers,
  teamSelectedId,
  timeframes,
} from "@/data/aurora";
import { BrokerStoreProvider, useBrokerStore } from "@/data/brokerStore";
import { MarketplaceStoreProvider } from "@/data/marketplaceStore";
import { PortfolioStoreProvider } from "@/data/portfolioStore";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { BottomDock } from "./BottomDock";
import { CommandPalette } from "./CommandPalette";
import { GlassCard, cardVariants } from "./GlassCard";
import { AreaChartViz, BarChartViz } from "./Charts";
import {
  ActionButton,
  Avatar,
  EmptyState,
  Pill,
  ProgressBar,
  WorkspaceHeader,
  formatUsd,
} from "./primitives";
import { BrokerMark } from "./brokers/BrokerMark";
import type { SectionId } from "./navigation";

// Workspaces load on first visit: the shell paints immediately and heavy
// modules (models, TradingView charts) only download when opened.
const HomeWorkspace = lazy(() =>
  import("./home/HomeWorkspace").then((m) => ({ default: m.HomeWorkspace })),
);
const AnalyticsWorkspace = lazy(() =>
  import("./analytics/AnalyticsWorkspace").then((m) => ({ default: m.AnalyticsWorkspace })),
);
const BrokersWorkspace = lazy(() =>
  import("./brokers/BrokersWorkspace").then((m) => ({ default: m.BrokersWorkspace })),
);
const BenchmarkWorkspace = lazy(() =>
  import("./benchmark/BenchmarkWorkspace").then((m) => ({ default: m.BenchmarkWorkspace })),
);
const BusinessPlanWorkspace = lazy(() =>
  import("./businessPlan/BusinessPlanWorkspace").then((m) => ({
    default: m.BusinessPlanWorkspace,
  })),
);
const TeslaModelWorkspace = lazy(() =>
  import("./teslaModel/TeslaModelWorkspace").then((m) => ({ default: m.TeslaModelWorkspace })),
);
const MarketplaceWorkspace = lazy(() =>
  import("./marketplace/MarketplaceWorkspace").then((m) => ({
    default: m.MarketplaceWorkspace,
  })),
);
const SettingsWorkspace = lazy(() =>
  import("./settings/SettingsWorkspace").then((m) => ({ default: m.SettingsWorkspace })),
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};

const PREFS_KEY = "aurora-prefs-v1";

function loadReduceMotion(): boolean {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}").reduceMotion === true;
  } catch {
    return false;
  }
}

export function DashboardShell({ defaultActive = "home" }: { defaultActive?: SectionId }) {
  return (
    <BrokerStoreProvider>
      <Shell defaultActive={defaultActive} />
    </BrokerStoreProvider>
  );
}

function Shell({ defaultActive }: { defaultActive: SectionId }) {
  const [active, setActive] = useState<SectionId>(defaultActive);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [wizardSignal, setWizardSignal] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(loadReduceMotion);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ reduceMotion }));
    } catch {
      // Preference stays in memory for this session.
    }
  }, [reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const addBroker = useCallback(() => {
    setActive("brokers");
    setWizardSignal((n) => n + 1);
  }, []);

  let workspace: ReactNode;
  switch (active) {
    case "grid":
      workspace = <OverviewContent onNavigate={setActive} />;
      break;
    case "home":
      workspace = <HomeWorkspace />;
      break;
    case "bars":
      workspace = <AnalyticsWorkspace />;
      break;
    case "brokers":
      workspace = <BrokersWorkspace wizardSignal={wizardSignal} />;
      break;
    case "benchmarkPage":
      workspace = (
        <PortfolioStoreProvider>
          <BenchmarkWorkspace />
        </PortfolioStoreProvider>
      );
      break;
    case "businessPlan":
      workspace = (
        <PortfolioStoreProvider>
          <BusinessPlanWorkspace />
        </PortfolioStoreProvider>
      );
      break;
    case "teslaModel":
      workspace = <TeslaModelWorkspace />;
      break;
    case "marketplace":
      workspace = (
        <MarketplaceStoreProvider>
          <MarketplaceWorkspace />
        </MarketplaceStoreProvider>
      );
      break;
    case "settings":
      workspace = (
        <SettingsWorkspace reduceMotion={reduceMotion} onReduceMotion={setReduceMotion} />
      );
      break;
  }

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <div
        className="relative min-h-screen w-full text-white lg:h-screen lg:overflow-hidden"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <img
          src={roomBg}
          alt=""
          aria-hidden
          width={1920}
          height={1216}
          className="pointer-events-none fixed inset-0 -z-20 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.18) 100%)",
          }}
        />

        <main className="relative mx-auto flex min-h-screen w-full max-w-[1560px] flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-5 lg:h-full lg:min-h-0 lg:px-8 lg:py-6">
          <div className="flex justify-center lg:hidden">
            <Sidebar
              active={active}
              onSelect={setActive}
              onCommand={openPalette}
              orientation="horizontal"
            />
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-5">
            <div className="hidden items-center lg:flex">
              <Sidebar active={active} onSelect={setActive} onCommand={openPalette} />
            </div>

            <motion.section
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="glass flex min-w-0 flex-1 flex-col p-4 md:p-5 lg:min-h-0"
              style={{ borderRadius: 28 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col lg:min-h-0"
                >
                  <WorkspaceBoundary onHome={() => setActive("grid")}>
                    <Suspense fallback={<WorkspaceSkeleton />}>{workspace}</Suspense>
                  </WorkspaceBoundary>
                </motion.div>
              </AnimatePresence>
            </motion.section>
          </div>

          <div className="hidden shrink-0 justify-center sm:flex">
            <BottomDock onNavigate={setActive} onCommand={openPalette} />
          </div>
        </main>

        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onNavigate={setActive}
          onAddBroker={addBroker}
        />
      </div>
    </MotionConfig>
  );
}

/**
 * Contains a failing workspace (render error or a chunk that failed to load)
 * so the shell, navigation and other sections keep working. Remounted per
 * section via the parent's `key`, which clears the error on navigation.
 */
class WorkspaceBoundary extends Component<
  { children: ReactNode; onHome: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Workspace failed", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Esta secção não carregou"
          hint="As restantes secções continuam disponíveis. Tente novamente ou volte à visão geral."
          className="w-full max-w-md"
          action={
            <div className="mt-2 flex gap-2">
              <ActionButton tone="ghost" onClick={() => this.setState({ error: null })}>
                Tentar novamente
              </ActionButton>
              <ActionButton onClick={this.props.onHome}>Visão geral</ActionButton>
            </div>
          }
        />
      </div>
    );
  }
}

/** Placeholder with the shape of a workspace while its chunk downloads. */
function WorkspaceSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-busy="true" aria-label="A carregar">
      <div className="h-9 w-56 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass h-[78px] animate-pulse motion-reduce:animate-none"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="glass min-h-[240px] flex-1 animate-pulse motion-reduce:animate-none" />
    </div>
  );
}

/** Overview tile summarising connected broker accounts; opens Corretoras. */
function BrokersTile({ onOpen }: { onOpen: () => void }) {
  const { connections, totals } = useBrokerStore();
  const marks = [...new Set(connections.map((c) => c.brokerId))].slice(0, 4);
  return (
    <motion.button
      type="button"
      variants={cardVariants}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      aria-label={`Corretoras: ${totals.accounts} contas, ${formatUsd(totals.value)}`}
      className="glass relative flex min-h-[120px] min-w-0 flex-col justify-between p-4 text-left text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:h-full lg:min-h-0 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-[20px] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"
    >
      <div className="flex items-center justify-between gap-2">
        <Pill className="!px-2.5 !py-1 !text-[11px] text-white/70">Corretoras</Pill>
        {marks.length ? (
          <span className="flex -space-x-1.5">
            {marks.map((id) => (
              <BrokerMark key={id} brokerId={id} size={20} className="ring-2 ring-black/30" />
            ))}
          </span>
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-lg border border-dashed border-white/35">
            <Plus size={12} />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-xl font-semibold tabular-nums text-white">
          {totals.accounts ? formatUsd(totals.value) : "Ligar conta"}
        </span>
        <Pill tone="mute" className="!text-[10px]">
          {totals.accounts} conta{totals.accounts === 1 ? "" : "s"}
        </Pill>
      </div>
    </motion.button>
  );
}

function OverviewContent({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  return (
    <>
      <WorkspaceHeader
        title="Ollympius Dashboard"
        subtitle="Visão geral de desempenho · atualizado agora"
        right={
          <>
            <Pill className="hidden sm:inline-flex">Visão geral</Pill>
            <Pill className="hidden sm:inline-flex" tone="mute">
              Relatórios
            </Pill>
            <Avatar initials="LV" />
            <Pill className="hidden md:inline-flex">+ Convidar equipa</Pill>
          </>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-4 lg:grid-rows-[1.35fr_1fr_1fr]"
      >
        <GlassCard className="sm:col-span-2 lg:col-span-2 lg:h-full lg:min-h-0 !p-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Tendência de receita</Pill>
            <div className="flex gap-1.5">
              {timeframes.map((t, i) => (
                <Pill
                  key={t}
                  tone={i === 2 ? "active" : "mute"}
                  className="!px-2.5 !py-0.5 !text-[11px]"
                >
                  {t}
                </Pill>
              ))}
            </div>
          </div>
          <div className="relative mt-2 min-h-[180px] flex-1 lg:min-h-0">
            <AreaChartViz />
          </div>
          <div className="mt-2 flex shrink-0 flex-wrap gap-1.5">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="glass-pill flex items-center gap-2 px-2.5 py-1 text-[11px]"
              >
                <span className="text-white/60">{s.label}</span>
                <span className="font-semibold tabular-nums text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:h-full lg:min-h-0 !p-4">
          <Pill className="shrink-0 !px-3 !py-1 !text-[12px] !font-semibold">Volume semanal</Pill>
          <p className="mt-1 shrink-0 text-[11px] text-white/55">Conversões por semana</p>
          <div className="relative mt-2 min-h-[160px] flex-1 lg:min-h-0">
            <BarChartViz />
          </div>
        </GlassCard>

        <GlassCard className="lg:h-full lg:min-h-0 !p-4">
          <Pill className="shrink-0 !px-3 !py-1 !text-[12px] !font-semibold">
            Atividade recente
          </Pill>
          <ul className="mt-2 flex flex-1 flex-col gap-1.5 lg:min-h-0 lg:overflow-hidden">
            {recentActivity.map((row) => (
              <li key={row.id} className="flex items-center gap-2.5 rounded-xl px-1 py-0.5">
                <Avatar initials={row.initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-white/95">{row.name}</p>
                  <p className="truncate text-[10px] text-white/55">{row.note}</p>
                </div>
                <Pill className="!px-2 !py-0.5 !text-[10px] tabular-nums">{row.value}</Pill>
              </li>
            ))}
          </ul>
        </GlassCard>

        {kpiCards.map((k) => (
          <GlassCard key={k.id} className="lg:h-full lg:min-h-0 justify-between !p-4">
            <Pill className="self-start !px-2.5 !py-1 !text-[11px] text-white/70">
              {k.primary.label}
            </Pill>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold tabular-nums text-white">
                {k.primary.value}
              </span>
              <Pill tone="mute" className="!text-[10px]">
                {k.secondary.label}
              </Pill>
            </div>
          </GlassCard>
        ))}

        <GlassCard className="lg:h-full lg:min-h-0 !p-4">
          <div className="flex shrink-0 items-center justify-between">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Metas</Pill>
            <button
              aria-label="Adicionar meta"
              className="glass-soft grid h-7 w-7 place-items-center text-white/80 hover:bg-white/25"
            >
              <Plus size={14} />
            </button>
          </div>
          <ul className="mt-3 flex min-h-0 flex-1 flex-col justify-around gap-2">
            {goals.map((g) => (
              <li key={g.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/80">{g.label}</span>
                  <span className="font-semibold tabular-nums text-white">{g.value}</span>
                </div>
                <ProgressBar value={g.progress} />
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="lg:h-full lg:min-h-0 !p-4">
          <div className="flex shrink-0 items-center justify-between">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Equipa</Pill>
            <button
              aria-label="Adicionar membro"
              className="glass-soft grid h-7 w-7 place-items-center text-white/80 hover:bg-white/25"
            >
              <Plus size={14} />
            </button>
          </div>
          <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
            {teamMembers.map((m) => {
              const selected = m.id === teamSelectedId;
              return (
                <li
                  key={m.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl px-1.5 py-1 transition",
                    selected && "bg-white/20",
                  )}
                  style={
                    selected
                      ? {
                          boxShadow:
                            "inset 0 0 0 1px rgba(74,158,255,0.35), 0 0 18px rgba(74,158,255,0.18)",
                        }
                      : undefined
                  }
                >
                  <Avatar initials={m.initials} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-white/95">{m.name}</p>
                    <p className="truncate text-[10px] text-white/55">{m.note}</p>
                  </div>
                  <Pill className="!px-2 !py-0.5 !text-[10px]">{m.value}</Pill>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        {microCards.map((m) => (
          <GlassCard key={m.id} className="lg:h-full lg:min-h-0 justify-between !p-4">
            <Pill className="self-start !px-2.5 !py-1 !text-[11px] text-white/70">
              {m.primary.label}
            </Pill>
            <div className="flex items-end justify-between gap-2">
              <span className="text-xl font-semibold tabular-nums text-white">
                {m.primary.value}
              </span>
              <Pill tone="mute" className="!text-[10px]">
                {m.secondary.label}
              </Pill>
            </div>
          </GlassCard>
        ))}

        <BrokersTile onOpen={() => onNavigate("brokers")} />
      </motion.div>
    </>
  );
}
