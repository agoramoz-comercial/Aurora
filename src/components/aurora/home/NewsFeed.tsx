import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Flame, Newspaper, Radar } from "lucide-react";
import type { ImpactPanelAsset, PrimaryNewsItem, SecondaryNewsItem } from "@/data/newsData";
import { cn } from "@/lib/utils";
import { CHART } from "../chartTheme";
import { EmptyState } from "../primitives";
import { EvidenceDots, ImpactMeter, SaveButton } from "./NewsAtoms";
import {
  EVENT_ICON,
  EVENT_LABEL,
  HORIZON_LABEL,
  attentionColor,
  confidenceBadge,
  formatMinutesAgo,
  signed,
} from "./newsUtils";

/* ── Story card (feed + grid) ─────────────────────────────────────────── */
function StoryCard({
  item,
  index,
  layout,
  saved,
  onToggleSave,
  onOpen,
}: {
  item: PrimaryNewsItem;
  index: number;
  layout: "feed" | "grid";
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  const col = attentionColor(item.attentionLevel);
  const conf = confidenceBadge(item.confidenceBand);
  const EventIcon = EVENT_ICON[item.eventType];

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.32, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="glass-soft group relative flex min-w-0 cursor-pointer flex-col gap-2.5 p-4 transition-[background-color,box-shadow] duration-200 hover:bg-white/[0.05]"
      style={{ borderRadius: 16 }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${col.border}`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-white/12 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {item.ticker}
        </span>
        <span
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: col.text }}
        >
          <EventIcon size={10} /> {EVENT_LABEL[item.eventType]}
        </span>
        <span className="truncate text-[10px] text-white/40">{item.sector}</span>
        <span
          className="ml-auto text-[12px] font-bold tabular-nums"
          style={{ color: item.priceChange >= 0 ? CHART.positive : CHART.negative }}
        >
          {signed(item.priceChange)}
        </span>
      </div>

      <h3 className="text-[14px] font-semibold leading-snug text-white/95">{item.headline}</h3>
      {layout === "feed" ? (
        <p className="line-clamp-2 text-pretty text-[12px] leading-relaxed text-white/55">
          {item.summary}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
        <ImpactMeter score={item.impactScore} level={item.attentionLevel} />
        <span className="text-[10px]" style={{ color: conf.color }}>
          {conf.label}
        </span>
        <span className="text-[10px] text-white/40">{HORIZON_LABEL[item.horizon]}</span>
        {layout === "grid" ? (
          <span className="text-[10px] text-white/40">há {formatMinutesAgo(item.minutesAgo)}</span>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          <EvidenceDots count={item.evidenceCount} />
          <SaveButton saved={saved} onToggle={onToggleSave} />
        </span>
      </div>
    </motion.article>
  );
}

export function NewsFeed({
  items,
  layout,
  isSaved,
  onToggleSave,
  onOpen,
  onReset,
}: {
  items: PrimaryNewsItem[];
  layout: "feed" | "grid";
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onOpen: (id: string) => void;
  onReset: () => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="Nenhuma notícia corresponde"
        hint="Ajuste a pesquisa ou os filtros para voltar a ver o fluxo."
        action={
          <button
            type="button"
            onClick={onReset}
            className="mt-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/16"
          >
            Limpar filtros
          </button>
        }
      />
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid gap-2.5 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {items.map((it, i) => (
            <StoryCard
              key={it.id}
              item={it}
              index={i}
              layout="grid"
              saved={isSaved(it.id)}
              onToggleSave={() => onToggleSave(it.id)}
              onOpen={() => onOpen(it.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  /* Timeline river: time rail on the left, stories on the right. */
  return (
    <ol className="relative flex flex-col gap-2.5">
      <span
        aria-hidden
        className="absolute bottom-3 left-[57.5px] top-3 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
      />
      <AnimatePresence mode="popLayout">
        {items.map((it, i) => {
          const col = attentionColor(it.attentionLevel);
          return (
            <motion.li
              key={it.id}
              layout="position"
              className="grid grid-cols-[46px_16px_minmax(0,1fr)] items-start gap-x-1"
            >
              <span className="whitespace-nowrap pt-4 text-right text-[10px] font-semibold tabular-nums text-white/45">
                {formatMinutesAgo(it.minutesAgo)}
              </span>
              <span className="relative flex justify-center pt-[18px]">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-4 ring-[rgba(8,12,22,0.6)]"
                  style={{ background: col.dot, boxShadow: `0 0 10px ${col.dot}` }}
                />
              </span>
              <StoryCard
                item={it}
                index={i}
                layout="feed"
                saved={isSaved(it.id)}
                onToggleSave={() => onToggleSave(it.id)}
                onOpen={() => onOpen(it.id)}
              />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}

/* ── Right rail ───────────────────────────────────────────────────────── */

export function ImpactRadar({
  assets,
  onOpen,
}: {
  assets: ImpactPanelAsset[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className="glass flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
          <Radar size={13} className="text-[var(--aurora-accent)]" /> Radar de impacto
        </span>
        <span className="text-[10px] text-white/35">carteira</span>
      </header>
      <ul className="flex flex-col gap-1">
        {assets.map((a, i) => {
          const col = attentionColor(a.attentionLevel);
          const up = a.change >= 0;
          return (
            <li key={a.ticker}>
              <button
                type="button"
                onClick={() => onOpen(a.relatedNewsId)}
                className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: col.dot, boxShadow: `0 0 6px ${col.dot}` }}
                />
                <span className="w-11 shrink-0 text-[11px] font-bold text-white">{a.ticker}</span>
                <span
                  className="flex w-14 shrink-0 items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: up ? CHART.positive : CHART.negative }}
                >
                  {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {signed(a.change)}
                </span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    className="block h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${a.impactScore}%` }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: `linear-gradient(90deg, ${col.dot}, var(--aurora-accent))`,
                    }}
                  />
                </span>
                <span className="w-6 text-right text-[10px] tabular-nums text-white/45">
                  {a.impactScore}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TrendingTopics({
  topics,
  active,
  onSelect,
}: {
  topics: { tag: string; count: number }[];
  active: string | null;
  onSelect: (tag: string | null) => void;
}) {
  return (
    <section className="glass flex flex-col gap-3 p-4">
      <header className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
        <Flame size={13} className="text-[var(--aurora-warn)]" /> Temas em alta
      </header>
      <div className="flex flex-wrap gap-1.5">
        {topics.map(({ tag, count }) => {
          const isActive = active === tag;
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(isActive ? null : tag)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-[background-color,color,box-shadow] duration-150",
                isActive
                  ? "bg-[rgba(74,158,255,0.22)] text-white shadow-[inset_0_0_0_1px_rgba(74,158,255,0.5)]"
                  : "bg-white/6 text-white/60 hover:bg-white/12 hover:text-white",
              )}
            >
              #{tag}
              <span className="tabular-nums text-white/35">{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SecondaryRow({ item }: { item: SecondaryNewsItem }) {
  const [open, setOpen] = useState(false);
  const col = attentionColor(item.attentionLevel);
  const EventIcon = EVENT_ICON[item.eventType];
  return (
    <li
      className="overflow-hidden rounded-[12px]"
      style={{ background: "var(--aurora-surface-1)" }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
      >
        <span
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ color: col.text }}
        >
          <EventIcon size={10} /> {item.regimeFlag}
          <span className="ml-auto font-medium normal-case tracking-normal text-white/35">
            {formatMinutesAgo(item.minutesAgo)}
          </span>
        </span>
        <span className="flex items-start gap-2">
          <span className="line-clamp-2 flex-1 text-[12px] font-medium leading-snug text-white/85">
            {item.headline}
          </span>
          <ChevronDown
            size={13}
            className={cn(
              "mt-0.5 shrink-0 text-white/35 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-3 pb-3 text-[11px] leading-relaxed">
              <p className="text-pretty text-white/55">{item.summary}</p>
              <p
                className="rounded-[10px] px-2.5 py-2 text-white/65"
                style={{
                  background: "rgba(74,158,255,0.08)",
                  border: "1px solid rgba(74,158,255,0.18)",
                }}
              >
                <b className="font-semibold text-[var(--aurora-accent)]">Transmissão · </b>
                {item.transmissionVector}
              </p>
              <span className="text-[10px] text-white/35">
                {EVENT_LABEL[item.eventType]} · {HORIZON_LABEL[item.horizon]}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

export function SecondaryList({ items }: { items: SecondaryNewsItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 4);
  return (
    <section className="glass flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-violet)]" /> Regime & macro
        </span>
        <span className="text-[10px] tabular-nums text-white/35">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-white/35">Sem sinais para esta pesquisa</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visible.map((it) => (
            <SecondaryRow key={it.id} item={it} />
          ))}
        </ul>
      )}
      {items.length > 4 ? (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="rounded-[10px] py-2 text-[11px] font-semibold text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80"
        >
          {showAll ? "Mostrar menos" : `Ver todas (${items.length})`}
        </button>
      ) : null}
    </section>
  );
}
