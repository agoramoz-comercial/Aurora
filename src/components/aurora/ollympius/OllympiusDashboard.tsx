/**
 * Ollympius Dashboard — the overview published at ollympius.vercel.app, restored
 * verbatim from this repository's history (commit d967f01). "Reports" opens the
 * Portfolio Management reports inside the same slot.
 */
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
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
import { GlassCard, cardVariants } from "../GlassCard";
import { AreaChartViz, BarChartViz } from "../Charts";
import { Avatar, Pill, ProgressBar, WorkspaceHeader } from "../primitives";
import { PortfolioManagementWorkspace } from "../portfolioManagement/PortfolioManagementWorkspace";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};

const pillBtn =
  "rounded-full transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

export function OllympiusDashboard() {
  const [mode, setMode] = useState<"overview" | "reports">("overview");
  if (mode === "reports")
    return <PortfolioManagementWorkspace onOverview={() => setMode("overview")} />;
  return <OverviewContent onReports={() => setMode("reports")} />;
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
        className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-[#0b0f17]"
      >
        Adicionar
      </button>
    </form>
  );
}

function OverviewContent({ onReports }: { onReports: () => void }) {
  const [goalList, setGoalList] = useState(goals);
  const [team, setTeam] = useState(teamMembers);
  return (
    <>
      <WorkspaceHeader
        title="Ollympius Dashboard"
        subtitle="Live performance overview · updated just now"
        right={
          <>
            <button type="button" aria-pressed="true" className={cn(pillBtn, "inline-flex")}>
              <Pill>Overview</Pill>
            </button>
            <button
              type="button"
              aria-pressed="false"
              onClick={onReports}
              className={cn(pillBtn, "inline-flex")}
            >
              <Pill tone="mute">Reports</Pill>
            </button>
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
                    "flex items-center gap-2.5 rounded-2xl px-1.5 py-1 transition-colors duration-150",
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
          className="glass grid min-h-[120px] place-items-center lg:h-full lg:min-h-0 text-white/60 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
