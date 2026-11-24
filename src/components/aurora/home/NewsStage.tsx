/**
 * NewsStage — Cockpit Aurora front page: the focused story fills the stage
 * (free-licence photo, headline, source), a market panel sits top-right and a
 * focus rail of stories runs along the bottom. Focusing a card changes the
 * stage (console-style), Enter opens the story.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ImpactPanelAsset, PrimaryNewsItem } from "@/data/newsData";
import { Chip, Rail } from "../cockpit/Rail";
import { PhotoCredit, SourceLink } from "./NewsAtoms";
import { EVENT_LABEL, formatMinutesAgo } from "./newsUtils";

const LEVEL: Record<string, { tone?: "bad" | "warn"; label: string }> = {
  critical: { tone: "bad", label: "Crítico" },
  high: { tone: "warn", label: "Alta" },
  moderate: { label: "Moderado" },
  low: { label: "Baixo" },
};
const HUE = ["108,184,255", "255,181,71", "180,140,255", "62,224,143", "56,225,214", "255,122,182"];

export function NewsStage({
  stories,
  market,
  onOpen,
  isSaved,
  onToggleSave,
}: {
  stories: PrimaryNewsItem[];
  market: ImpactPanelAsset[];
  onOpen: (id: string) => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
}) {
  const [currentId, setCurrentId] = useState(stories[0]!.id);
  const cur = stories.find((s) => s.id === currentId) ?? stories[0]!;
  const lvl = LEVEL[cur.attentionLevel]!;
  const ring = Math.round((cur.impactScore / 100) * 170);

  return (
    <section
      aria-label="Notícia em destaque"
      className="relative isolate overflow-hidden rounded-[var(--cx-r4)] border border-[var(--cx-hair)]"
      style={{ background: "var(--cx-bg)" }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={cur.id}
          aria-hidden
          className="cx-stage-layer cx-photo absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {cur.image ? (
            <img
              src={cur.image.src}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-full object-cover lg:w-[68%]"
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(900px 500px at 78% 18%, rgba(var(--ambient-rgb), .14), transparent 60%),
                linear-gradient(90deg, rgba(5,7,12,.97) 0%, rgba(5,7,12,.8) 45%, rgba(5,7,12,.3) 100%),
                linear-gradient(0deg, rgba(5,7,12,1) 0%, rgba(5,7,12,.25) 55%, rgba(5,7,12,.55) 100%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative flex flex-col gap-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-[660px]">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={lvl.tone}>{lvl.label}</Chip>
              <Chip>{EVENT_LABEL[cur.eventType]}</Chip>
              <Chip>
                {cur.ticker}
                {cur.priceChange !== 0
                  ? ` ${cur.priceChange > 0 ? "+" : "−"}${Math.abs(cur.priceChange).toFixed(1).replace(".", ",")}%`
                  : ""}
              </Chip>
            </div>
            <h1
              className="mt-4 text-[28px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[var(--cx-ink-1)] sm:text-[40px] xl:text-[46px]"
              style={{ fontFamily: '"Inter Display", Inter, sans-serif' }}
            >
              {cur.headline}
            </h1>
            <p className="mt-4 max-w-[580px] text-[15px] leading-relaxed text-[var(--cx-ink-2)]">
              {cur.summary}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-[13px] text-[var(--cx-ink-2)]">
              <span
                className="relative grid h-14 w-14 place-items-center"
                aria-label={`Impacto em carteira ${cur.impactScore} de 100`}
                role="img"
              >
                <svg viewBox="0 0 64 64" className="absolute inset-0" aria-hidden>
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    stroke="rgba(255,255,255,.1)"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    stroke={lvl.tone === "bad" ? "var(--cx-bad)" : "var(--ambient)"}
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={`${ring} 170`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <b className="text-[16px] font-extrabold tabular-nums text-white">
                  {cur.impactScore}
                </b>
              </span>
              <span>Impacto em carteira</span>
              <span aria-hidden>·</span>
              <span>há {formatMinutesAgo(cur.minutesAgo)}</span>
              <span aria-hidden>·</span>
              <SourceLink source={cur.source} url={cur.url} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onOpen(cur.id)}
                className="h-11 rounded-full bg-white px-6 text-[13px] font-bold text-[#05070c] transition-[filter] duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{ boxShadow: "0 0 30px rgba(var(--ambient-rgb), .45)" }}
              >
                Ver impacto na carteira
              </button>
              <button
                type="button"
                aria-pressed={isSaved(cur.id)}
                onClick={() => onToggleSave(cur.id)}
                className="cx-glass-thin h-11 rounded-full px-5 text-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {isSaved(cur.id) ? "Guardada" : "Guardar"}
              </button>
            </div>
          </div>
          {market.length ? (
            <aside
              aria-label="Fecho de mercado"
              className="cx-glass-thin hidden w-[280px] rounded-[var(--cx-r3)] p-4 lg:block"
            >
              <p className="cx-eyebrow mb-2">Fecho · 18 nov · Reuters</p>
              <ul>
                {market.map((a) => (
                  <li
                    key={a.ticker}
                    className="flex items-center justify-between border-t border-[var(--cx-hair)] py-2 text-[13px] first:border-0"
                  >
                    <span className="text-[var(--cx-ink-1)]">{a.name}</span>
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: a.change < 0 ? "var(--cx-bad)" : "var(--cx-good)" }}
                    >
                      {a.change < 0 ? "▼" : "▲"} {Math.abs(a.change).toFixed(1).replace(".", ",")}%
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>

        {cur.image ? <PhotoCredit image={cur.image} className="self-end" /> : null}

        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-[15px] font-bold text-[var(--cx-ink-1)]">Em foco</h2>
            <span className="cx-eyebrow">
              {stories.length} notícias com impacto · ← → mudar · Enter abrir
            </span>
          </div>
          <Rail
            label="Notícias em foco"
            width={230}
            onFocusItem={setCurrentId}
            onOpen={onOpen}
            items={stories.map((s, i) => ({
              id: s.id,
              eyebrow: (
                <Chip tone={LEVEL[s.attentionLevel]!.tone}>{LEVEL[s.attentionLevel]!.label}</Chip>
              ),
              title: s.headline,
              detail: s.summary.split(". ")[0],
              meta: s.source,
              art: s.image ? (
                <div className="cx-photo relative h-full w-full">
                  <img
                    src={s.image.src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: `radial-gradient(260px 200px at 80% 10%, rgba(${HUE[i % HUE.length]},.45), transparent), linear-gradient(160deg, rgba(${HUE[i % HUE.length]},.18), #07090f)`,
                  }}
                >
                  <span
                    className="absolute right-4 top-2 text-[56px] font-extrabold tracking-[-0.04em]"
                    style={{
                      color: `rgb(${HUE[i % HUE.length]})`,
                      fontFamily: '"Inter Display", Inter, sans-serif',
                    }}
                  >
                    {s.stat}
                  </span>
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
