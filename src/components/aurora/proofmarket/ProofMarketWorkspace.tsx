/**
 * ProofMarket — evidence-based financial social network inside Ollympius.
 * MVP scope from the PROOFMARKET spec: UF-03 build, UF-04 read, UF-05 contest,
 * UF-08 report, UF-09 review. No orders, custody, copy trading or advice.
 */
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Flag,
  Gauge,
  Inbox,
  Plus,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import {
  AccentBadge,
  EmptyState,
  Pill,
  SearchField,
  SectionLabel,
  SegmentedTabs,
  StatTile,
  WorkspaceHeader,
} from "../primitives";
import { DEFAULT_PREFS, ProofMarketStoreProvider, useProofMarket } from "@/data/proofmarket/store";
import { ME_ID } from "@/data/proofmarket/seed";
import type { FeedPrefs, Thesis } from "@/data/proofmarket/types";
import {
  daysBetween,
  evidenceQuality,
  formatDate,
  iso,
  latest,
  rankFeed,
  reputationFor,
} from "@/lib/proofmarket/rules";
import { ThesisCard, type OpenTab } from "./ThesisCard";
import { ThesisDrawer } from "./ThesisDrawer";
import { ThesisBuilder } from "./ThesisBuilder";
import { CounterBuilder, ReportDrawer, ReviewDrawer } from "./FlowDrawers";
import { GhostButton, LevelTag, PrimaryButton, Tag } from "./atoms";

type FeedTab = "paraMim" | "seguindo" | "revisao";
type Overlay =
  | { kind: "thesis"; id: string; tab: OpenTab }
  | { kind: "counter"; id: string }
  | { kind: "report"; id: string }
  | { kind: "review"; id: string }
  | { kind: "builder" }
  | null;

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
  const [query, setQuery] = useState("");
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

  const myDue = pm.theses.filter(
    (t) => t.authorId === ME_ID && t.status === "ativa" && daysBetween(t.reviewDue, today) >= -7,
  );
  const active = pm.theses.filter((t) => t.status === "ativa");
  const withCounter = active.filter((t) => pm.allCounters.some((c) => c.thesisId === t.id)).length;
  const allSources = pm.theses.flatMap((t) => latest(t).sources);
  const strong = pm.theses.reduce((n, t) => n + evidenceQuality(latest(t)).strong, 0);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="ProofMarket"
        subtitle="Rede de investigação financeira · cada tese traz fontes, conflitos, cenários e data de revisão"
        badge={<AccentBadge>Teses auditáveis</AccentBadge>}
        right={
          <>
            <Pill className="hidden md:inline-flex" tone="mute">
              Dados de demonstração
            </Pill>
            <PrimaryButton icon={Plus} onClick={() => setOverlay({ kind: "builder" })}>
              Criar tese
            </PrimaryButton>
          </>
        }
      />

      <div aria-live="polite" className="min-h-0">
        {toast ? (
          <p
            className="mt-3 flex items-center gap-2 rounded-[12px] px-3 py-2 text-[12px] text-[#86efac]"
            style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)" }}
          >
            <CheckCircle2 size={14} aria-hidden /> {toast}
          </p>
        ) : null}
      </div>

      <div className="thin-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatTile
            label="Teses ativas"
            value={active.length}
            footnote={`${pm.theses.length} no total, com histórico`}
          />
          <StatTile
            label="Com contraditório"
            value={`${active.length ? Math.round((withCounter / active.length) * 100) : 0}%`}
            footnote="Teses ativas com ≥ 1 contra-tese"
          />
          <StatTile
            label="Fontes fortes"
            value={`${allSources.length ? Math.round((strong / allSources.length) * 100) : 0}%`}
            footnote="Primárias ou oficiais, datadas"
          />
          <StatTile
            label="As suas revisões"
            value={myDue.length}
            accent={myDue.length > 0}
            footnote={myDue.length ? "Revisão devida agora" : "Nada pendente"}
          />
        </div>

        <div className="mt-4 grid gap-4 pb-2 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedTabs
                active={tab}
                onSelect={setTab}
                tabs={[
                  { id: "paraMim", label: "Para mim", icon: Sparkles, count: paraMim.length },
                  { id: "seguindo", label: "Seguindo", icon: Users, count: seguindo.length },
                  { id: "revisao", label: "Revisão", icon: Clock3, count: revisao.length },
                ]}
              />
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Pesquisar entidade, tema ou autor…"
                className="min-w-[200px] flex-1"
              />
            </div>
            <p className="text-[11px] text-white/45">
              {tab === "paraMim"
                ? pm.prefs.chronological
                  ? "Ordem cronológica, sem ranking."
                  : "Ordenado por qualidade das fontes, atualidade e diversidade de perspetivas. Nunca por tempo de leitura."
                : tab === "seguindo"
                  ? "Ordem cronológica estrita das teses e autores que segue."
                  : "Teses com revisão devida, em atraso ou revistas recentemente."}
              {pm.hidden.length ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="font-semibold text-[var(--aurora-accent)] hover:underline"
                    onClick={() => pm.hidden.forEach((id) => pm.toggleHidden(id))}
                  >
                    Mostrar {pm.hidden.length} oculta{pm.hidden.length > 1 ? "s" : ""}
                  </button>
                </>
              ) : null}
            </p>

            {list.length ? (
              <div className="flex flex-col gap-2.5">
                {list.map(({ thesis, reasons }, i) => (
                  <ThesisCard
                    key={thesis.id}
                    thesis={thesis}
                    reasons={reasons}
                    index={i}
                    onOpen={open}
                    onCounter={(id) => setOverlay({ kind: "counter", id })}
                    onReport={(id) => setOverlay({ kind: "report", id })}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title={
                  q
                    ? "Nenhuma tese corresponde à pesquisa"
                    : tab === "seguindo"
                      ? "Ainda não segue nenhuma tese"
                      : "Nada para rever"
                }
                hint={
                  q
                    ? "Tente outro nome, código ou tema."
                    : tab === "seguindo"
                      ? "Use Seguir num cartão para acompanhar revisões e contra-teses."
                      : "Teses com revisão devida aparecem aqui."
                }
                action={
                  q ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="mt-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/16"
                    >
                      Limpar pesquisa
                    </button>
                  ) : tab !== "paraMim" ? (
                    <button
                      type="button"
                      onClick={() => setTab("paraMim")}
                      className="mt-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/16"
                    >
                      Ver Para mim
                    </button>
                  ) : undefined
                }
              />
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
            <DuePanel
              due={myDue}
              onReview={(id) => setOverlay({ kind: "review", id })}
              onOpen={open}
            />
            <ReputationPanel />
            <FeedControls prefs={pm.prefs} onChange={pm.setPrefs} />
            <ReportsPanel />
            <p className="px-1 text-[10.5px] leading-relaxed text-white/38">
              A ProofMarket não executa ordens, não guarda ativos, não faz copy trading e não dá
              aconselhamento financeiro. Os badges dizem apenas o que foi verificado.
            </p>
          </aside>
        </div>
      </div>

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

function DuePanel({
  due,
  onReview,
  onOpen,
}: {
  due: Thesis[];
  onReview: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const today = iso(Date.now());
  return (
    <RailCard title="As suas revisões" icon={Clock3}>
      {due.length ? (
        <ul className="flex flex-col gap-2">
          {due.map((t) => {
            const late = daysBetween(t.reviewDue, today);
            return (
              <li
                key={t.id}
                className="flex flex-col gap-1.5 rounded-[12px] p-2.5"
                style={{ background: "var(--aurora-surface-1)" }}
              >
                <button
                  type="button"
                  onClick={() => onOpen(t.id)}
                  className="text-left text-[12px] font-semibold leading-snug text-white/90 hover:underline"
                >
                  {latest(t).claim.slice(0, 90)}…
                </button>
                <div className="flex items-center justify-between gap-2">
                  <Tag tone={late > 0 ? "warn" : "accent"}>
                    {late > 0
                      ? `Devida há ${late} dia${late > 1 ? "s" : ""}`
                      : late === 0
                        ? "Devida hoje"
                        : `Em ${-late} dias`}
                  </Tag>
                  <GhostButton onClick={() => onReview(t.id)}>Rever</GhostButton>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[11.5px] text-white/50">
          Nenhuma revisão devida. Crédito por rever no prazo conta para a sua reputação.
        </p>
      )}
    </RailCard>
  );
}

function ReputationPanel() {
  const pm = useProofMarket();
  const [authorId, setAuthorId] = useState("ines");
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
