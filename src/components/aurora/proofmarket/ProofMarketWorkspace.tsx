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
import {
  auroraGlass,
  ChatView,
  FeedView,
  ProfileView,
  StepControl,
  type Step,
} from "./social/AuroraChat";
import { AnimatePresence, motion } from "framer-motion";
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
  | { kind: "pick"; convId: string }
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
  const [query] = useState("");
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("feed");
  const [profileId, setProfileId] = useState<string>(ME_ID);
  const [openConv, setOpenConv] = useState<string | null>(null);
  const [shareThesis, setShareThesis] = useState<Thesis | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    action?: { label: string; run: () => void };
  } | null>(null);
  const setToast = (text: string, action?: { label: string; run: () => void }) =>
    setToastMsg(text ? { text, action } : null);
  const today = iso(Date.now());

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 6000);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

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
  const go = (s: Step) => {
    setStep(s);
    document.getElementById("ac-stage")?.scrollIntoView({ block: "nearest" });
  };
  const toProfile = (authorId: string) => {
    setProfileId(authorId);
    setOverlay(null);
    go("perfil");
  };
  const toMessage = (authorId: string) => {
    setOpenConv(pm.conversationWith(authorId));
    go("chat");
  };
  const unread = pm.conversations
    .filter((c) => c.folder !== "pedidos")
    .reduce((n, c) => n + c.unread, 0);
  const shareTo = (convId: string, t: Thesis) => {
    pm.sendMessage(convId, "", t.id);
    const conv = pm.conversations.find((c) => c.id === convId);
    setShareThesis(null);
    setToast(`Enviada a ${conv?.name ?? "conversa"}.`, {
      label: "Abrir chat",
      run: () => {
        setOpenConv(convId);
        go("chat");
      },
    });
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3">
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 top-[88px] z-40 flex justify-center px-4"
      >
        <AnimatePresence>
          {toastMsg ? (
            <motion.p
              key={toastMsg.text}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2.5 text-[12.5px] font-medium text-white"
              style={{ ...auroraGlass, borderRadius: 999, background: "rgba(20,17,15,0.94)" }}
            >
              <CheckCircle2 size={15} aria-hidden className="text-[#86efac]" /> {toastMsg.text}
              {toastMsg.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toastMsg.action!.run();
                    setToastMsg(null);
                  }}
                  className="font-semibold text-[#93c5fd] hover:underline"
                >
                  {toastMsg.action.label}
                </button>
              ) : null}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <StepControl step={step} onStep={go} unread={unread} />

      <div
        id="ac-stage"
        role="tabpanel"
        aria-labelledby={`ac-step-${step}`}
        className="flex h-[calc(100dvh-210px)] min-h-[560px] flex-col lg:h-auto lg:min-h-0 lg:flex-1"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {step === "feed" ? (
              <FeedView
                items={feedItems}
                mode={tab}
                onMode={setTab}
                counts={{
                  paraMim: paraMim.length,
                  seguindo: seguindo.length,
                  revisao: revisao.length,
                }}
                authorFilter={authorFilter}
                onAuthor={setAuthorFilter}
                onOpen={(id, t) => open(id, t ?? "resumo")}
                onCounter={(id) => setOverlay({ kind: "counter", id })}
                onReport={(id) => setOverlay({ kind: "report", id })}
                onCreate={() => setOverlay({ kind: "builder" })}
                onControls={() => setOverlay({ kind: "controls" })}
                onProfile={toProfile}
                onShare={setShareThesis}
                onNext={() => toProfile(ME_ID)}
                toast={setToast}
              />
            ) : step === "perfil" ? (
              <ProfileView
                authorId={profileId}
                onOpen={(id) => open(id)}
                onCreate={() => setOverlay({ kind: "builder" })}
                onReview={(id) => setOverlay({ kind: "review", id })}
                onMessage={toMessage}
                onBackToMe={() => setProfileId(ME_ID)}
                onNext={() => go("chat")}
                toast={setToast}
              />
            ) : (
              <ChatView
                openId={openConv}
                setOpenId={setOpenConv}
                onOpenThesis={(id) => open(id)}
                onProfile={toProfile}
                onShareFromChat={(convId) => setOverlay({ kind: "pick", convId })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Drawer
        open={!!shareThesis}
        onClose={() => setShareThesis(null)}
        width={420}
        title="Partilhar num chat"
      >
        <div className="flex flex-col gap-2 p-5">
          {shareThesis ? (
            <p className="mb-2 rounded-[14px] bg-white/8 p-3 text-[12.5px] text-white/85">
              <b className="text-white">{shareThesis.id}</b> · {latest(shareThesis).claim}
            </p>
          ) : null}
          <ul className="flex flex-col gap-1">
            {pm.authors
              .filter((a) => a.id !== ME_ID)
              .map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => shareThesis && shareTo(pm.conversationWith(a.id), shareThesis)}
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[13px] text-white hover:bg-white/10"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white/14 text-[12px] font-semibold">
                      {a.initials}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{a.name}</span>
                      <span className="block text-[11.5px] text-white/60">{a.handle}</span>
                    </span>
                    <span className="rounded-full bg-[var(--aurora-accent-strong)] px-3 py-1 text-[11.5px] font-semibold">
                      Enviar
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          <button
            type="button"
            onClick={async () => {
              if (!shareThesis) return;
              try {
                await navigator.clipboard.writeText(
                  `${shareThesis.id} · ${latest(shareThesis).claim}`,
                );
                setToast(`Referência copiada: ${shareThesis.id}`);
              } catch {
                setToast(`Referência da tese: ${shareThesis.id}`);
              }
              setShareThesis(null);
            }}
            className="mt-2 rounded-xl bg-white/10 py-2.5 text-[12.5px] font-semibold text-white hover:bg-white/16"
          >
            Copiar referência
          </button>
        </div>
      </Drawer>
      <Drawer
        open={overlay?.kind === "pick"}
        onClose={() => setOverlay(null)}
        width={420}
        title="Escolher tese para partilhar"
      >
        <ul className="flex flex-col gap-1 p-5">
          {pm.theses.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  if (overlay?.kind === "pick") shareTo(overlay.convId, t);
                  setOverlay(null);
                }}
                className="flex w-full flex-col gap-0.5 rounded-[14px] px-3 py-2.5 text-left hover:bg-white/10"
              >
                <span className="text-[11.5px] font-semibold text-white/65">
                  {t.id} · {t.entity.code ?? t.entity.name}
                </span>
                <span className="line-clamp-2 text-[13px] text-white">{latest(t).claim}</span>
              </button>
            </li>
          ))}
        </ul>
      </Drawer>

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
          setStep("feed");
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
