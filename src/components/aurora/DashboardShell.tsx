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
const ProofMarketWorkspace = lazy(() =>
  import("./proofmarket/ProofMarketWorkspace").then((m) => ({ default: m.ProofMarketWorkspace })),
);
const PersonalFinanceWorkspace = lazy(() =>
  import("./personalFinance/PersonalFinanceWorkspace").then((m) => ({
    default: m.PersonalFinanceWorkspace,
  })),
);
const PortfolioWorkspace = lazy(() =>
  import("./portfolio/PortfolioWorkspace").then((m) => ({ default: m.PortfolioWorkspace })),
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
      <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute" }}>
        {/* P&L Contribution bar finish, shared by every bar chart (see styles.css) */}
        <defs>
          <linearGradient id="aurora-bar-fade-v" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="aurora-bar-fade-h" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="aurora-bar-fade-hn" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.95" />
          </linearGradient>
          <mask id="aurora-bar-mask-hn" maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill="url(#aurora-bar-fade-hn)" />
          </mask>
          <mask id="aurora-bar-mask-v" maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill="url(#aurora-bar-fade-v)" />
          </mask>
          <mask id="aurora-bar-mask-h" maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill="url(#aurora-bar-fade-h)" />
          </mask>
        </defs>
      </svg>
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
      workspace = (
        <PortfolioStoreProvider>
          <PortfolioWorkspace />
        </PortfolioStoreProvider>
      );
      break;
    case "proofmarket":
      workspace = <ProofMarketWorkspace />;
      break;
    case "financas":
      workspace = <PersonalFinanceWorkspace />;
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
        data-glass={active === "grid" ? "ollympius" : undefined}
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
            background:
              active === "grid"
                ? "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.18) 100%)"
                : "linear-gradient(180deg, rgba(8,6,5,0.34) 0%, rgba(8,6,5,0.52) 100%)",
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
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "flex min-w-0 flex-1 flex-col lg:min-h-0",
                active !== "proofmarket" && "glass p-4 md:p-5",
              )}
              style={active !== "proofmarket" ? { borderRadius: 28 } : undefined}
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
