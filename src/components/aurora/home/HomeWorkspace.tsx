/**
 * HomeWorkspace — Notícias 2.0 ("newsroom").
 *
 * Reading order: live tape → front page (rotating lead + two leads) → search &
 * filters → timeline river. The right rail holds portfolio impact, trending
 * themes and the macro/regime layer. Every story opens the same drawer.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, LayoutGrid, Rows3, X } from "lucide-react";
import {
  impactPanelAssets,
  primaryNews,
  secondaryNews,
  type AttentionLevel,
  type Horizon,
} from "@/data/newsData";
import {
  AccentBadge,
  FilterChip,
  LiveBadge,
  Pill,
  SearchField,
  SegmentedTabs,
  WorkspaceHeader,
} from "../primitives";
import { TickerTape } from "./TickerTape";
import { NewsHero } from "./NewsHero";
import { ImpactRadar, NewsFeed, SecondaryList, TrendingTopics } from "./NewsFeed";
import { NewsDrawer } from "./NewsDrawer";
import { HORIZON_LABEL, searchText, trendingTopics } from "./newsUtils";

const SAVED_KEY = "ollympius.news.saved";

function readSaved(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const ATTENTION_FILTERS: { id: AttentionLevel; label: string }[] = [
  { id: "critical", label: "Crítico" },
  { id: "high", label: "Alta" },
  { id: "moderate", label: "Moderado" },
];
const HORIZON_FILTERS: Horizon[] = ["intraday", "1-5d", "1-4w", "structural"];

/* Front page = the three highest-impact stories. */
const LEADS = [...primaryNews].sort((a, b) => b.impactScore - a.impactScore).slice(0, 3);
const TOPICS = trendingTopics([...primaryNews, ...secondaryNews], 12);

export function HomeWorkspace() {
  const [query, setQuery] = useState("");
  const [attention, setAttention] = useState<AttentionLevel | null>(null);
  const [horizon, setHorizon] = useState<Horizon | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [onlySaved, setOnlySaved] = useState(false);
  const [layout, setLayout] = useState<"feed" | "grid">("feed");
  const [openId, setOpenId] = useState<string | null>(null);
  const [leadIndex, setLeadIndex] = useState(0);
  const [hoverPause, setHoverPause] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());

  useEffect(() => setSaved(readSaved()), []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable — keep in memory only */
      }
      return next;
    });
  }, []);
  const isSaved = useCallback((id: string) => saved.has(id), [saved]);

  const q = query.trim().toLowerCase();
  const matchesText = useCallback(
    (item: Parameters<typeof searchText>[0]) =>
      (!q || searchText(item).includes(q)) && (!topic || item.tags.includes(topic)),
    [q, topic],
  );

  /* Base set for chip counts: text + topic + saved, before chip filters. */
  const textMatched = useMemo(
    () => primaryNews.filter((n) => matchesText(n) && (!onlySaved || saved.has(n.id))),
    [matchesText, onlySaved, saved],
  );

  const feed = useMemo(
    () =>
      textMatched
        .filter(
          (n) =>
            (!attention || n.attentionLevel === attention) && (!horizon || n.horizon === horizon),
        )
        .sort((a, b) => a.minutesAgo - b.minutesAgo),
    [textMatched, attention, horizon],
  );

  const secondary = useMemo(() => secondaryNews.filter(matchesText), [matchesText]);

  const resetFilters = () => {
    setQuery("");
    setAttention(null);
    setHorizon(null);
    setTopic(null);
    setOnlySaved(false);
  };

  const openItem = openId ? (primaryNews.find((n) => n.id === openId) ?? null) : null;
  const closeDrawer = useCallback(() => setOpenId(null), []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="Notícias"
        subtitle="Newsroom portfolio-aware · primárias com impacto direto · regime & macro"
        badge={<AccentBadge>Newsroom</AccentBadge>}
        right={
          <>
            <LiveBadge />
            <Pill className="hidden md:inline-flex" tone="mute">
              {primaryNews.length + secondaryNews.length} sinais
            </Pill>
          </>
        }
      />

      <div className="mt-3">
        <TickerTape />
      </div>

      <div className="thin-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
        <div className="grid gap-4 pb-2 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          {/* ── Main column ─────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-col gap-4">
            <NewsHero
              leads={LEADS}
              leadIndex={leadIndex}
              onAdvance={() => setLeadIndex((i) => (i + 1) % LEADS.length)}
              onSelectLead={setLeadIndex}
              paused={hoverPause || openId !== null}
              onPauseChange={setHoverPause}
              onOpen={setOpenId}
              isSaved={isSaved}
              onToggleSave={toggleSave}
            />

            {/* Toolbar */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <SearchField
                  value={query}
                  onChange={setQuery}
                  placeholder="Pesquisar ticker, empresa ou tema…"
                  className="min-w-[200px] flex-1"
                />
                <FilterChip
                  active={onlySaved}
                  onClick={() => setOnlySaved((s) => !s)}
                  icon={Bookmark}
                  count={saved.size}
                  size="md"
                >
                  Guardadas
                </FilterChip>
                <SegmentedTabs
                  size="sm"
                  active={layout}
                  onSelect={setLayout}
                  tabs={[
                    { id: "feed", label: "Feed", icon: Rows3 },
                    { id: "grid", label: "Grelha", icon: LayoutGrid },
                  ]}
                />
              </div>

              <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
                <FilterChip
                  active={!attention}
                  onClick={() => setAttention(null)}
                  count={textMatched.length}
                >
                  Todas
                </FilterChip>
                {ATTENTION_FILTERS.map((f) => (
                  <FilterChip
                    key={f.id}
                    active={attention === f.id}
                    onClick={() => setAttention(attention === f.id ? null : f.id)}
                    count={textMatched.filter((n) => n.attentionLevel === f.id).length}
                  >
                    {f.label}
                  </FilterChip>
                ))}
                <span className="mx-1 h-4 w-px shrink-0 bg-white/15" />
                {HORIZON_FILTERS.map((h) => (
                  <FilterChip
                    key={h}
                    active={horizon === h}
                    onClick={() => setHorizon(horizon === h ? null : h)}
                  >
                    {HORIZON_LABEL[h]}
                  </FilterChip>
                ))}
                {topic ? (
                  <button
                    type="button"
                    onClick={() => setTopic(null)}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[rgba(74,158,255,0.2)] px-2.5 py-1 text-[10px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(74,158,255,0.5)]"
                  >
                    #{topic} <X size={11} />
                  </button>
                ) : null}
              </div>
            </div>

            <NewsFeed
              items={feed}
              layout={layout}
              isSaved={isSaved}
              onToggleSave={toggleSave}
              onOpen={setOpenId}
              onReset={resetFilters}
            />
          </div>

          {/* ── Right rail ──────────────────────────────────────────── */}
          <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
            <ImpactRadar assets={impactPanelAssets} onOpen={setOpenId} />
            <TrendingTopics topics={TOPICS} active={topic} onSelect={setTopic} />
            <SecondaryList items={secondary} />
          </aside>
        </div>
      </div>

      <NewsDrawer
        item={openItem}
        onClose={closeDrawer}
        saved={openItem ? saved.has(openItem.id) : false}
        onToggleSave={() => openItem && toggleSave(openItem.id)}
      />
    </div>
  );
}
