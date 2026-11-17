/**
 * ProofMarket — evidence-based financial social network inside Ollympius.
 * MVP scope from the PROOFMARKET spec: UF-03 build, UF-04 read, UF-05 contest,
 * UF-08 report, UF-09 review. No orders, custody, copy trading or advice.
 */
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Flag, Gauge, Scale, SlidersHorizontal } from "lucide-react";
import { SectionLabel } from "../primitives";
import { DEFAULT_PREFS, ProofMarketStoreProvider, useProofMarket } from "@/data/proofmarket/store";
import { ME_ID } from "@/data/proofmarket/seed";
import type { FeedPrefs, Thesis } from "@/data/proofmarket/types";
import {
  daysBetween,
  formatDate,
  iso,
  latest,
  rankFeed,
  reputationFor,
} from "@/lib/proofmarket/rules";
export type OpenTab = "resumo" | "evidencias" | "contraditorio" | "historico";
import { FeedPane, MessagesPane, ProfilePane, visionGlass } from "./social/VisionPanels";
import { Drawer } from "../primitives";
import { cn } from "@/lib/utils";
import { ThesisDrawer } from "./ThesisDrawer";
import { ThesisBuilder } from "./ThesisBuilder";
import { CounterBuilder, ReportDrawer, ReviewDrawer } from "./FlowDrawers";
import { GhostButton, LevelTag, Tag } from "./atoms";

type FeedTab = "paraMim" | "seguindo" | "revisao";
type Overlay =
  | { kind: "thesis"; id: string; tab: OpenTab }
  | { kind: "counter"; id: string }
  | { kind: "report"; id: string }
  | { kind: "review"; id: string }
  | { kind: "builder" }
  | { kind: "controls" }
  | { kind: "reputation"; authorId: string }
  | null;
type Pane = "perfil" | "feed" | "mensagens";

export function ProofMarketWorkspace() {
  return (
    <ProofMarketStoreProvider>
      <Workspace />
    </ProofMarketStoreProvider>
  );
}

function Workspace() {
  const pm = useProofMarket();
  const [tab, setTab] = useState<FeedTab>("paraMim");
  const [query] = useState("");
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [pane, setPane] = useState<Pane>("feed");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState("");
  const today = iso(Date.now());

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const q = query.trim().toLowerCase();
  const matches = (t: Thesis) =>
    !q ||
    [latest(t).claim, t.entity.name, t.entity.code ?? "", ...t.tags, pm.getAuthor(t.authorId).name]
      .join(" ")
      .toLowerCase()
      .includes(q);
  const visible = pm.theses.filter((t) => !pm.hidden.includes(t.id)).filter(matches);

  const savedStances = useMemo(() => {
    const m = new Map<string, string>();
    pm.theses
      .filter((t) => pm.saved.includes(t.id) || pm.followed.includes(t.id))
      .forEach((t) => m.set(t.entity.id, t.stance));
    return m;
  }, [pm.theses, pm.saved, pm.followed]);

  const paraMim = rankFeed(visible, {
    prefs: pm.prefs,
    followedAuthorIds: new Set(pm.followedAuthors),
    savedStances,
    today,
  });
  const seguindo = visible
    .filter(
      (t) =>
        pm.followed.includes(t.id) ||
        pm.followedAuthors.includes(t.authorId) ||
        t.authorId === ME_ID,
    )
    .sort((a, b) => latest(b).date.localeCompare(latest(a).date));
  const revisao = visible
    .filter(
      (t) =>
        (t.status === "ativa" && daysBetween(t.reviewDue, today) >= -30) ||
        (t.reviews.length > 0 && daysBetween(t.reviews[t.reviews.length - 1]!.date, today) <= 90),
    )
    .sort((a, b) => a.reviewDue.localeCompare(b.reviewDue));

  const open = (id: string, t: OpenTab = "resumo") => setOverlay({ kind: "thesis", id, tab: t });
  const list =
    tab === "paraMim"
      ? paraMim.map((r) => ({ thesis: r.thesis, reasons: r.reasons }))
      : (tab === "seguindo" ? seguindo : revisao).map((t) => ({
          thesis: t,
          reasons:
            tab === "seguindo"
              ? ["Segue esta tese, o autor, ou é sua."]
              : ["Revisão devida, em atraso ou feita nos últimos 90 dias."],
        }));

  const feedItems = authorFilter ? list.filter((i) => i.thesis.authorId === authorFilter) : list;
  const share = async (t: Thesis) => {
    const text = `${t.id} · ${latest(t).claim}`;
    try {
      await navigator.clipboard.writeText(text);
      setToast(`Referência copiada: ${t.id}`);
    } catch {
      setToast(`Não foi possível copiar. Referência da tese: ${t.id}`);
    }
  };
  const paneCls = (id: Pane) =>
    cn(
      "flex h-[78vh] min-h-0 min-w-0 flex-col lg:h-auto [&>section]:flex-1",
      pane !== id && "hidden lg:flex",
    );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 top-1 z-30 flex justify-center px-4"
      >
        {toast ? (
          <p
            className="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium text-white"
            style={visionGlass}
          >
            <CheckCircle2 size={14} aria-hidden className="text-[#86efac]" /> {toast}
          </p>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label="Painéis"
        className="mx-auto mb-3 grid w-full max-w-[420px] grid-cols-3 gap-1 p-1 lg:hidden"
        style={{ ...visionGlass, borderRadius: 999 }}
      >
        {(
          [
            ["perfil", "Perfil"],
            ["feed", "Feed"],
            ["mensagens", "Mensagens"],
          ] as const
        ).map(([id, l]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={pane === id}
            onClick={() => setPane(id)}
            className={cn(
              "rounded-full py-1.5 text-[12px] font-semibold text-white/80",
              pane === id && "bg-white/30 text-white",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-[1240px] min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.14fr)_minmax(0,0.92fr)] lg:gap-5">
        <div className={cn(paneCls("perfil"), "lg:py-7")}>
          <ProfilePane
            onOpen={(id) => open(id)}
            onCreate={() => setOverlay({ kind: "builder" })}
            onReputation={() => setOverlay({ kind: "reputation", authorId: ME_ID })}
            onReview={(id) => setOverlay({ kind: "review", id })}
            onShare={() =>
              setToast("Perfil de demonstração: a partilha pública fica disponível com servidor.")
            }
          />
        </div>
        <div className={paneCls("feed")}>
          <FeedPane
            items={feedItems}
            mode={tab}
            onMode={setTab}
            counts={{ paraMim: paraMim.length, seguindo: seguindo.length, revisao: revisao.length }}
            onOpen={(id, t) => open(id, t ?? "resumo")}
            onCounter={(id) => setOverlay({ kind: "counter", id })}
            onReport={(id) => setOverlay({ kind: "report", id })}
            onCreate={() => setOverlay({ kind: "builder" })}
            onControls={() => setOverlay({ kind: "controls" })}
            onAuthor={setAuthorFilter}
            authorFilter={authorFilter}
            onShare={share}
          />
        </div>
        <div className={cn(paneCls("mensagens"), "lg:py-7")}>
          <MessagesPane onAuthor={(a) => setOverlay({ kind: "reputation", authorId: a.id })} />
        </div>
      </div>

      <Drawer
        open={overlay?.kind === "controls"}
        onClose={() => setOverlay(null)}
        width={440}
        title="Controlo do feed"
      >
        <div className="flex flex-col gap-3 p-5">
          <FeedControls prefs={pm.prefs} onChange={pm.setPrefs} />
          <ReportsPanel />
          <p className="text-[11px] text-white/50">
            O feed nunca é ordenado por tempo de leitura. Likes e seguidores não contam para a
            reputação.
          </p>
        </div>
      </Drawer>
      <Drawer
        open={overlay?.kind === "reputation"}
        onClose={() => setOverlay(null)}
        width={440}
        title="Reputação por domínio"
      >
        <div className="flex flex-col gap-3 p-5">
          {overlay?.kind === "reputation" ? <ReputationPanel initial={overlay.authorId} /> : null}
        </div>
      </Drawer>
      <ThesisDrawer
        thesisId={overlay?.kind === "thesis" ? overlay.id : null}
        initialTab={overlay?.kind === "thesis" ? overlay.tab : "resumo"}
        onClose={() => setOverlay(null)}
        onCounter={(id) => setOverlay({ kind: "counter", id })}
        onReport={(id) => setOverlay({ kind: "report", id })}
        onReview={(id) => setOverlay({ kind: "review", id })}
      />
      <ThesisBuilder
        open={overlay?.kind === "builder"}
        onClose={() => setOverlay(null)}
        onPublished={(id) => {
          setToast(
            `Tese publicada: ${id} · versão 1.0. Não pode ser apagada; pode ser corrigida, arquivada ou revista.`,
          );
          setTab("seguindo");
          setOverlay({ kind: "thesis", id, tab: "resumo" });
        }}
      />
      <CounterBuilder
        thesisId={overlay?.kind === "counter" ? overlay.id : null}
        onClose={() => setOverlay(null)}
        onDone={(id) => {
          setToast("Contra-tese publicada. O autor foi notificado.");
          setOverlay({ kind: "thesis", id, tab: "contraditorio" });
        }}
      />
      <ReportDrawer
        thesisId={overlay?.kind === "report" ? overlay.id : null}
        onClose={() => setOverlay(null)}
      />
      <ReviewDrawer
        thesisId={overlay?.kind === "review" ? overlay.id : null}
        onClose={() => setOverlay(null)}
        onDone={(id) => {
          setToast("Revisão publicada. Os seguidores recebem o resumo das alterações.");
          setOverlay({ kind: "thesis", id, tab: "historico" });
        }}
      />
    </div>
  );
}

function RailCard({
  title,
  icon,
  children,
  note,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section className="glass flex flex-col gap-3 p-4">
      <SectionLabel icon={icon} note={note}>
        {title}
      </SectionLabel>
      {children}
    </section>
  );
}

function ReputationPanel({ initial = "ines" }: { initial?: string }) {
  const pm = useProofMarket();
  const [authorId, setAuthorId] = useState(initial);
  const author = pm.getAuthor(authorId);
  const dims = reputationFor(author, pm.theses);
  return (
    <RailCard title="Reputação por domínio" icon={Gauge}>
      <label className="flex flex-col gap-1 text-[11px] text-white/55">
        Autor
        <select
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          className="rounded-[10px] border border-white/12 bg-black/25 px-2.5 py-1.5 text-[12px] text-white"
        >
          {pm.authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id === ME_ID ? "Você" : a.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <LevelTag author={author} />
        {author.forecasts[0] ? <Tag>{author.forecasts[0].domain}</Tag> : null}
      </div>
      <ul className="flex flex-col gap-2">
        {dims.map((d) => (
          <li key={d.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
              <span className="text-white/70">{d.label}</span>
              <span className="font-semibold tabular-nums text-white">
                {d.enough ? d.value : "Dados insuficientes"}
              </span>
            </div>
            {d.enough && d.ratio !== undefined ? (
              <div className="h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div
                  className="h-full rounded-full bg-[var(--aurora-accent)]"
                  style={{ width: `${Math.round(d.ratio * 100)}%` }}
                />
              </div>
            ) : null}
            <p className="text-[10.5px] text-white/40">{d.sample}</p>
          </li>
        ))}
      </ul>
      <p className="text-[10.5px] text-white/40">
        Likes e seguidores não contam. Não existe ranking geral de autores.
      </p>
    </RailCard>
  );
}

function FeedControls({ prefs, onChange }: { prefs: FeedPrefs; onChange: (p: FeedPrefs) => void }) {
  const items: { key: keyof FeedPrefs; label: string; hint: string }[] = [
    { key: "chronological", label: "Ordem cronológica", hint: "Desliga o ranking em Para mim." },
    {
      key: "limitSpeculative",
      label: "Esconder especulativo",
      hint: "Remove teses de risco especulativo.",
    },
    {
      key: "moreContrary",
      label: "Aumentar contraditório",
      hint: "Sobe teses com posição diferente das que guardou.",
    },
    {
      key: "hideConflicted",
      label: "Esconder teses com conflito",
      hint: "Só autores sem posição, patrocínio ou relação.",
    },
  ];
  return (
    <RailCard title="Controlo do feed" icon={SlidersHorizontal}>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.key}>
            <label className="flex cursor-pointer items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-[12px] font-semibold text-white/85">{it.label}</span>
                <span className="text-[10.5px] text-white/45">{it.hint}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={prefs[it.key]}
                onChange={(e) => onChange({ ...prefs, [it.key]: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a9eff]"
              />
            </label>
          </li>
        ))}
      </ul>
      <div>
        <GhostButton onClick={() => onChange(DEFAULT_PREFS)}>Repor padrão</GhostButton>
      </div>
    </RailCard>
  );
}

function ReportsPanel() {
  const pm = useProofMarket();
  if (!pm.reports.length) return null;
  return (
    <RailCard title="As suas denúncias" icon={Flag}>
      <ul className="flex flex-col gap-1.5">
        {pm.reports.slice(0, 4).map((r) => (
          <li key={r.caseId} className="flex flex-col gap-0.5 text-[11.5px]">
            <span className="font-semibold tabular-nums text-white/85">{r.caseId}</span>
            <span className="text-white/50">
              {r.reason.replace(/_/g, " ")} · {formatDate(r.date)} · recebido
            </span>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-1 text-[10.5px] text-white/40">
        <Scale size={11} aria-hidden /> Cada decisão pode ser recorrida para um revisor diferente.
      </p>
    </RailCard>
  );
}
