import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { useState } from "react";
import roomBg from "@/assets/room-bg.jpg";
import { Sidebar } from "./Sidebar";
import { BottomDock } from "./BottomDock";
import { EmptyState, WorkspaceHeader } from "./primitives";
import { AnalyticsWorkspace } from "./analytics/AnalyticsWorkspace";
import { HomeWorkspace } from "./home/HomeWorkspace";
import { BusinessPlanWorkspace } from "./businessPlan/BusinessPlanWorkspace";
import { BenchmarkWorkspace } from "./benchmark/BenchmarkWorkspace";
import { TeslaModelWorkspace } from "./teslaModel/TeslaModelWorkspace";
import { MarketplaceWorkspace } from "./marketplace/MarketplaceWorkspace";
import { ProofMarketWorkspace } from "./proofmarket/ProofMarketWorkspace";
import { PersonalFinanceWorkspace } from "./personalFinance/PersonalFinanceWorkspace";
import { OllympiusDashboard } from "./ollympius/OllympiusDashboard";
import { MarketplaceStoreProvider } from "@/data/marketplaceStore";
import { PortfolioStoreProvider } from "@/data/portfolioStore";
import { cn } from "@/lib/utils";

const sectionTitles: Record<string, string> = {
  home: "Notícias",
  proofmarket: "Aurora Chat",
  financas: "Finanças Pessoais",
  grid: "Ollympius Dashboard",
  bars: "Analytics",
  benchmarkPage: "Benchmark & Projeções",
  businessPlan: "Plano de Negócios",
  teslaModel: "Modelo Financeiro & DCF Hub (TSLA · MSFT · GOOGL · AAPL · NVDA · AMZN)",
  marketplace: "Marketplace",
  settings: "Settings",
  new: "New workspace",
};

export function DashboardShell({ defaultActive = "home" }: { defaultActive?: string }) {
  const [active, setActive] = useState(defaultActive);
  const [chatOpen, setChatOpen] = useState<{ step: "feed" | "chat"; n: number }>({
    step: "feed",
    n: 0,
  });
  const openTarget = (target: string) => {
    const [id, step] = target.split(":");
    if (id === "proofmarket")
      setChatOpen((c) => ({ step: step === "chat" ? "chat" : "feed", n: c.n + 1 }));
    setActive(id!);
  };

  return (
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
          <Sidebar active={active} onSelect={setActive} orientation="horizontal" />
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-5">
          <div className="hidden items-center lg:flex">
            <Sidebar active={active} onSelect={setActive} />
          </div>

          <motion.section
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "flex min-w-0 flex-1 flex-col lg:min-h-0",
              active !== "proofmarket" && "glass p-4 md:p-5",
            )}
            style={active === "proofmarket" ? undefined : { borderRadius: 28 }}
          >
            <AnimatePresence mode="wait">
              {active === "grid" ? (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col lg:min-h-0"
                >
                  <OllympiusDashboard />
                </motion.div>
              ) : (
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-1 flex-col lg:min-h-0"
                >
                  {active === "home" ? (
                    <HomeWorkspace />
                  ) : active === "proofmarket" ? (
                    <ProofMarketWorkspace key={chatOpen.n} initialStep={chatOpen.step} />
                  ) : active === "financas" ? (
                    <PersonalFinanceWorkspace />
                  ) : active === "bars" ? (
                    <AnalyticsWorkspace />
                  ) : active === "benchmarkPage" ? (
                    <PortfolioStoreProvider>
                      <BenchmarkWorkspace />
                    </PortfolioStoreProvider>
                  ) : active === "businessPlan" ? (
                    <PortfolioStoreProvider>
                      <BusinessPlanWorkspace />
                    </PortfolioStoreProvider>
                  ) : active === "teslaModel" ? (
                    <TeslaModelWorkspace />
                  ) : active === "marketplace" ? (
                    <MarketplaceStoreProvider>
                      <MarketplaceWorkspace />
                    </MarketplaceStoreProvider>
                  ) : (
                    <EmptyEnvironment title={sectionTitles[active] ?? "Workspace"} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        <div className="hidden shrink-0 justify-center sm:flex">
          <BottomDock onOpen={openTarget} active={active} />
        </div>
      </main>
    </div>
  );
}

function EmptyEnvironment({ title }: { title: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader title={title} subtitle="Ambiente vazio · pronto a compor" />
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <EmptyState
          icon={LayoutTemplate}
          title={title}
          hint="Este espaço ainda não tem módulos. Escolha outra aba na barra lateral."
          className="w-full max-w-md"
        />
      </div>
    </div>
  );
}
