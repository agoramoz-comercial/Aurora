import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, Plus } from "lucide-react";
import { useState } from "react";
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
import { Sidebar } from "./Sidebar";
import { BottomDock } from "./BottomDock";
import { GlassCard, cardVariants } from "./GlassCard";
import { AreaChartViz, BarChartViz } from "./Charts";
import { Avatar, EmptyState, Pill, ProgressBar, WorkspaceHeader } from "./primitives";
import { AnalyticsWorkspace } from "./analytics/AnalyticsWorkspace";
import { HomeWorkspace } from "./home/HomeWorkspace";
import { BusinessPlanWorkspace } from "./businessPlan/BusinessPlanWorkspace";
import { BenchmarkWorkspace } from "./benchmark/BenchmarkWorkspace";
import { TeslaModelWorkspace } from "./teslaModel/TeslaModelWorkspace";
import { MarketplaceWorkspace } from "./marketplace/MarketplaceWorkspace";
import { ProofMarketWorkspace } from "./proofmarket/ProofMarketWorkspace";
import { PersonalFinanceWorkspace } from "./personalFinance/PersonalFinanceWorkspace";
import { MarketplaceStoreProvider } from "@/data/marketplaceStore";
import { PortfolioStoreProvider } from "@/data/portfolioStore";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};

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
          background: "linear-gradient(180deg, rgba(8,6,5,0.34) 0%, rgba(8,6,5,0.52) 100%)",
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
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
                  <OverviewContent />
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

function InlineAdd({
  label,
  placeholder,
  onAdd,
}: {
  label: string;
  placeholder: string;
  onAdd: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState("");
  if (!open)
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="glass-soft grid h-7 w-7 place-items-center text-white/80 hover:bg-white/25"
      >
        <Plus size={14} />
      </button>
    );
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onAdd(v.trim());
        setV("");
        setOpen(false);
      }}
    >
      <label className="sr-only" htmlFor={`add-${label}`}>
        {label}
      </label>
      <input
        id={`add-${label}`}
        autoFocus
        value={v}
        maxLength={40}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className="w-32 rounded-full bg-black/35 px-2.5 py-1 text-[11px] text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/60"
      />
      <button
        type="submit"
        className="rounded-full bg-[var(--aurora-accent-strong)] px-2.5 py-1 text-[11px] font-semibold text-white"
      >
        Adicionar
      </button>
    </form>
  );
}

function OverviewContent() {
  const [goalList, setGoalList] = useState(goals);
  const [team, setTeam] = useState(teamMembers);
  return (
    <>
      <WorkspaceHeader
        title="Ollympius Dashboard"
        subtitle="Live performance overview · updated just now"
        right={
          <>
            <Pill className="hidden sm:inline-flex">Overview</Pill>
            <Pill className="hidden sm:inline-flex" tone="mute">
              Reports
            </Pill>
            <Avatar initials="LV" />
            <Pill className="hidden md:inline-flex">+ Invite team</Pill>
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
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Revenue trend</Pill>
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
          <Pill className="shrink-0 !px-3 !py-1 !text-[12px] !font-semibold">Weekly volume</Pill>
          <p className="mt-1 shrink-0 text-[11px] text-white/55">Conversions per week</p>
          <div className="relative mt-2 min-h-[160px] flex-1 lg:min-h-0">
            <BarChartViz />
          </div>
        </GlassCard>

        <GlassCard className="lg:h-full lg:min-h-0 !p-4">
          <Pill className="shrink-0 !px-3 !py-1 !text-[12px] !font-semibold">Recent activity</Pill>
          <ul className="mt-2 flex flex-1 flex-col gap-1.5 lg:min-h-0 lg:overflow-hidden">
            {recentActivity.map((row) => (
              <li key={row.id} className="flex items-center gap-2.5 rounded-xl px-1 py-0.5">
                <Avatar initials={row.initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-white/95">{row.name}</p>
                  <p className="truncate text-micro text-white/55">{row.note}</p>
                </div>
                <Pill className="!px-2 !py-0.5 !text-micro tabular-nums">{row.value}</Pill>
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
              <Pill tone="mute" className="!text-micro">
                {k.secondary.label}
              </Pill>
            </div>
          </GlassCard>
        ))}

        <GlassCard className="lg:h-full lg:min-h-0 !p-4">
          <div className="flex shrink-0 items-center justify-between">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Goals</Pill>
            <InlineAdd
              label="Add goal"
              placeholder="Novo objetivo"
              onAdd={(label) =>
                setGoalList((g) => [
                  ...g,
                  { id: `g${Date.now()}`, label, progress: 0, value: "0%" },
                ])
              }
            />
          </div>
          <ul className="mt-3 flex min-h-0 flex-1 flex-col justify-around gap-2">
            {goalList.map((g) => (
              <li key={g.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/80">{g.label}</span>
                  <span className="font-semibold tabular-nums text-white">{g.value}</span>
                </div>
                <ProgressBar value={g.progress} label={`${g.label}: ${g.value}`} />
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="lg:h-full lg:min-h-0 !p-4">
          <div className="flex shrink-0 items-center justify-between">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Team</Pill>
            <InlineAdd
              label="Add member"
              placeholder="Nome do membro"
              onAdd={(name) =>
                setTeam((t) => [
                  ...t,
                  {
                    id: `t${Date.now()}`,
                    initials: name
                      .split(" ")
                      .map((w) => w[0] ?? "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase(),
                    name,
                    note: "Convite pendente",
                    value: "Novo",
                  },
                ])
              }
            />
          </div>
          <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
            {team.map((m) => {
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
                    <p className="truncate text-micro text-white/55">{m.note}</p>
                  </div>
                  <Pill className="!px-2 !py-0.5 !text-micro">{m.value}</Pill>
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
              <Pill tone="mute" className="!text-micro">
                {m.secondary.label}
              </Pill>
            </div>
          </GlassCard>
        ))}

        <motion.button
          variants={cardVariants}
          whileHover={{ y: -2 }}
          className="glass grid min-h-[120px] place-items-center lg:h-full lg:min-h-0 text-white/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Add card"
        >
          <span
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{ border: "1px dashed rgba(255,255,255,0.4)" }}
          >
            <Plus size={18} />
          </span>
        </motion.button>
      </motion.div>
    </>
  );
}
