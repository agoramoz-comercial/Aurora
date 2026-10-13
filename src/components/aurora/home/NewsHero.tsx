import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BarChart2, Clock, Eye } from "lucide-react";
import type { PrimaryNewsItem } from "@/data/newsData";
import { CHART } from "../chartTheme";
import { AttentionBadge, EvidenceDots, ImpactRing, SaveButton, StoryArt } from "./NewsAtoms";
import {
  EVENT_LABEL,
  HERO_IMAGES,
  HORIZON_LABEL,
  attentionColor,
  confidenceBadge,
  formatMinutesAgo,
  signed,
} from "./newsUtils";

const ROTATE_SECONDS = 9;

function LeadStory({
  item,
  onOpen,
  saved,
  onToggleSave,
}: {
  item: PrimaryNewsItem;
  onOpen: () => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const col = attentionColor(item.attentionLevel);
  const conf = confidenceBadge(item.confidenceBand);
  const img = HERO_IMAGES[item.id];

  return (
    <article
      className="group relative flex h-full min-h-[300px] cursor-pointer flex-col overflow-hidden rounded-[20px]"
      style={{
        border: `1px solid ${col.border}`,
        boxShadow: `0 0 48px ${col.glow}, 0 16px 48px rgba(0,0,0,0.45)`,
      }}
      onClick={onOpen}
    >
      {img ? (
        <img
          src={img}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <StoryArt ticker={item.ticker} level={item.attentionLevel} />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(8,12,22,0.98) 0%, rgba(8,12,22,0.7) 48%, rgba(8,12,22,0.15) 100%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <AttentionBadge level={item.attentionLevel} pulse />
          <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/75 backdrop-blur-md">
            {EVENT_LABEL[item.eventType]}
          </span>
        </div>
        <ImpactRing score={item.impactScore} level={item.attentionLevel} />
      </div>

      <div className="relative mt-auto flex flex-col gap-3 p-5 pt-0">
        <div className="flex items-center gap-2 text-[11px] text-white/55">
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-[12px] font-bold text-white backdrop-blur-md">
            {item.ticker}
          </span>
          <span>{item.sector}</span>
          <span className="text-white/30">·</span>
          <span>{item.geography}</span>
          <span className="ml-auto flex items-center gap-1 text-white/45">
            <Clock size={10} /> há {formatMinutesAgo(item.minutesAgo)}
          </span>
        </div>

        <h2 className="max-w-[640px] text-[20px] font-bold leading-[1.2] tracking-[-0.01em] text-white sm:text-[22px]">
          {item.headline}
        </h2>
        <p className="line-clamp-2 max-w-[620px] text-pretty text-[12px] leading-relaxed text-white/65">
          {item.summary}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-xl bg-black/45 px-3 py-1.5 text-[12px] font-bold tabular-nums backdrop-blur-md"
            style={{
              color: item.priceChange >= 0 ? CHART.positive : CHART.negative,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {signed(item.priceChange)}
          </span>
          <span
            className="flex items-center gap-1.5 rounded-xl bg-black/45 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur-md"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <BarChart2 size={11} /> Vol{" "}
            <b className="font-semibold tabular-nums text-white">+{item.volumeChange}%</b>
          </span>
          <span
            className="rounded-xl bg-black/45 px-3 py-1.5 text-[11px] font-medium backdrop-blur-md"
            style={{ color: conf.color, border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {conf.label}
          </span>
          <span className="flex items-center gap-2 text-[10px] text-white/45">
            <EvidenceDots count={item.evidenceCount} /> {HORIZON_LABEL[item.horizon]}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <SaveButton
              saved={saved}
              onToggle={onToggleSave}
              className="bg-black/40 backdrop-blur-md"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl px-4 text-[11px] font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.97]"
              style={{
                background: "var(--aurora-accent)",
                boxShadow: "0 0 20px rgba(74,158,255,0.45)",
              }}
            >
              <Eye size={12} /> Ver impacto
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SideStory({ item, onOpen }: { item: PrimaryNewsItem; onOpen: () => void }) {
  const col = attentionColor(item.attentionLevel);
  const img = HERO_IMAGES[item.id];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex min-h-[140px] flex-1 flex-col justify-end overflow-hidden rounded-[18px] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {img ? (
        <img
          src={img}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-[1.05]"
        />
      ) : (
        <StoryArt ticker={item.ticker} level={item.attentionLevel} />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(8,12,22,0.96) 10%, rgba(8,12,22,0.35) 100%)",
        }}
      />
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${col.dot}, transparent)` }}
      />
      <div className="relative flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.dot }} />
          <span className="font-bold text-white">{item.ticker}</span>
          <span className="text-white/45">{EVENT_LABEL[item.eventType]}</span>
          <span
            className="ml-auto font-bold tabular-nums"
            style={{ color: item.priceChange >= 0 ? CHART.positive : CHART.negative }}
          >
            {signed(item.priceChange)}
          </span>
        </div>
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
          {item.headline}
        </p>
        <span className="flex items-center gap-1 text-[10px] text-white/45">
          há {formatMinutesAgo(item.minutesAgo)} · {HORIZON_LABEL[item.horizon]}
          <ArrowUpRight
            size={11}
            className="ml-auto text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
          />
        </span>
      </div>
    </button>
  );
}

/**
 * Front page: rotating lead story + two stacked secondary leads.
 * Rotation is driven by the CSS progress bar's `animationend`, so pausing the
 * bar (hover or open drawer) pauses the carousel with no timers to clear.
 */
export function NewsHero({
  leads,
  leadIndex,
  onAdvance,
  onSelectLead,
  paused,
  onPauseChange,
  onOpen,
  isSaved,
  onToggleSave,
}: {
  leads: PrimaryNewsItem[];
  leadIndex: number;
  onAdvance: () => void;
  onSelectLead: (i: number) => void;
  paused: boolean;
  onPauseChange: (p: boolean) => void;
  onOpen: (id: string) => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
}) {
  const lead = leads[leadIndex % leads.length];
  if (!lead) return null;
  const sides = leads.filter((l) => l.id !== lead.id).slice(0, 2);

  return (
    <section
      className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]"
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
      aria-label="Destaques"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={lead.id}
            className="flex-1"
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <LeadStory
              item={lead}
              onOpen={() => onOpen(lead.id)}
              saved={isSaved(lead.id)}
              onToggleSave={() => onToggleSave(lead.id)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Timed progress segments */}
        <div className="flex gap-1.5" role="tablist" aria-label="Destaques em rotação">
          {leads.map((l, i) => {
            const isActive = i === leadIndex % leads.length;
            const done = i < leadIndex % leads.length;
            return (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${l.ticker}: ${l.headline}`}
                onClick={() => onSelectLead(i)}
                className="group relative h-4 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/15 group-hover:bg-white/25">
                  <span
                    key={isActive ? `run-${l.id}-${leadIndex}` : l.id}
                    className="block h-full origin-left rounded-full bg-[var(--aurora-accent)]"
                    style={
                      isActive
                        ? {
                            animation: `aurora-progress ${ROTATE_SECONDS}s linear forwards`,
                            animationPlayState: paused ? "paused" : "running",
                            boxShadow: "0 0 8px rgba(74,158,255,0.7)",
                          }
                        : { transform: done ? "scaleX(1)" : "scaleX(0)", opacity: done ? 0.5 : 1 }
                    }
                    onAnimationEnd={isActive ? onAdvance : undefined}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row lg:flex-col">
        {sides.map((s) => (
          <SideStory key={s.id} item={s} onOpen={() => onOpen(s.id)} />
        ))}
      </div>
    </section>
  );
}
