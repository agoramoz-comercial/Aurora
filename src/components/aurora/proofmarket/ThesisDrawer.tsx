import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Bell,
  Bookmark,
  ExternalLink,
  Flag,
  GitCompare,
  RefreshCcw,
  Scale,
} from "lucide-react";
import { Avatar, Drawer, SegmentedTabs } from "../primitives";
import type { Thesis, ThesisVersion } from "@/data/proofmarket/types";
import { useProofMarket } from "@/data/proofmarket/store";
import { ME_ID } from "@/data/proofmarket/seed";
import {
  bannersFor,
  daysBetween,
  evidenceQuality,
  formatDate,
  hasConflict,
  iso,
  latest,
} from "@/lib/proofmarket/rules";
import {
  BadgeExplainer,
  Banners,
  GhostButton,
  HORIZON_LABEL,
  KIND_LABEL,
  LevelTag,
  PrimaryButton,
  REACTIONS,
  RISK_LABEL,
  STANCE_LABEL,
  StatusTag,
  Tag,
  riskTone,
} from "./atoms";

type Tab = "resumo" | "evidencias" | "cenarios" | "conflitos" | "historico" | "contraditorio";

const SOURCE_KIND = { primaria: "Primária", oficial: "Oficial", secundaria: "Secundária" } as const;
const TARGET_LABEL = {
  afirmacao: "Afirmação",
  premissa: "Premissa",
  evidencia: "Evidência",
  cenario: "Cenário",
} as const;
const COUNTER_TYPE = {
  evidencia_contraria: "Evidência contrária",
  metodologia: "Problema metodológico",
  confundidor: "Confundidor",
  conflito: "Conflito",
  risco_omitido: "Risco omitido",
  interpretacao: "Interpretação alternativa",
} as const;

export function ThesisDrawer({
  thesisId,
  initialTab = "resumo",
  onClose,
  onCounter,
  onReport,
  onReview,
}: {
  thesisId: string | null;
  initialTab?: Tab;
  onClose: () => void;
  onCounter: (id: string) => void;
  onReport: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const pm = useProofMarket();
  const current = thesisId ? (pm.getThesis(thesisId) ?? null) : null;
  const last = useRef<Thesis | null>(current);
  if (current) last.current = current;
  const t = current ?? last.current;
  const [tab, setTab] = useState<Tab>(initialTab as Tab);
  useEffect(() => {
    setTab(initialTab as Tab);
  }, [thesisId, initialTab]);

  return (
    <Drawer
      open={!!current}
      onClose={onClose}
      width={700}
      title={t ? latest(t).claim : ""}
      eyebrow={
        t ? (
          <>
            <StatusTag status={t.status} />
            <Tag>
              {t.id} · v{latest(t).version}
            </Tag>
            <Tag tone="accent">{t.entity.code ?? t.entity.name}</Tag>
          </>
        ) : null
      }
      footer={
        t ? <Footer t={t} onCounter={onCounter} onReport={onReport} onReview={onReview} /> : null
      }
    >
      {t ? <Body t={t} tab={tab} setTab={setTab} onCounter={onCounter} /> : null}
    </Drawer>
  );
}

function Footer({
  t,
  onCounter,
  onReport,
  onReview,
}: {
  t: Thesis;
  onCounter: (id: string) => void;
  onReport: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const pm = useProofMarket();
  const mine = t.authorId === ME_ID;
  const due = daysBetween(t.reviewDue, iso(Date.now())) >= 0 && t.status === "ativa";
  const [confirmArchive, setConfirmArchive] = useState(false);
  if (confirmArchive)
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-2"
        role="alertdialog"
        aria-label="Confirmar arquivo"
      >
        <p className="text-[11.5px] text-white/75">
          Arquivar esta tese. Continua acessível com o rótulo "Arquivada" e todo o histórico.
        </p>
        <div className="flex gap-1.5">
          <GhostButton onClick={() => setConfirmArchive(false)}>Cancelar</GhostButton>
          <PrimaryButton
            onClick={() => {
              pm.archive(t.id);
              setConfirmArchive(false);
            }}
          >
            Arquivar
          </PrimaryButton>
        </div>
      </div>
    );
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {mine && due ? (
        <PrimaryButton icon={RefreshCcw} onClick={() => onReview(t.id)}>
          Rever tese
        </PrimaryButton>
      ) : !mine ? (
        <PrimaryButton icon={Scale} onClick={() => onCounter(t.id)} disabled={!t.counterOpen}>
          {t.counterOpen ? "Contestar" : "Contraditório fechado"}
        </PrimaryButton>
      ) : null}
      <GhostButton
        icon={Bell}
        pressed={pm.followed.includes(t.id)}
        onClick={() => pm.toggleFollowed(t.id)}
      >
        {pm.followed.includes(t.id) ? "A seguir" : "Seguir"}
      </GhostButton>
      <GhostButton
        icon={Bookmark}
        pressed={pm.saved.includes(t.id)}
        onClick={() => pm.toggleSaved(t.id)}
      >
        {pm.saved.includes(t.id) ? "Guardada" : "Guardar"}
      </GhostButton>
      {mine && t.status !== "arquivada" ? (
        <GhostButton icon={Archive} onClick={() => setConfirmArchive(true)}>
          Arquivar
        </GhostButton>
      ) : null}
      {!mine ? (
        <GhostButton icon={Flag} onClick={() => onReport(t.id)} className="ml-auto">
          Reportar
        </GhostButton>
      ) : null}
    </div>
  );
}

function Body({
  t,
  tab,
  setTab,
  onCounter,
}: {
  t: Thesis;
  tab: Tab;
  setTab: (t: Tab) => void;
  onCounter: (id: string) => void;
}) {
  const pm = useProofMarket();
  const v = latest(t);
  const author = pm.getAuthor(t.authorId);
  const counters = pm.allCounters.filter((c) => c.thesisId === t.id);
  return (
    <div className="flex flex-col gap-4 p-5">
      <Banners items={bannersFor(t)} />
      <div className="flex items-start gap-3">
        <Avatar initials={author.initials} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold text-white">{author.name}</span>
            <span className="text-[11px] text-white/45">{author.handle}</span>
            <LevelTag author={author} />
          </div>
          <BadgeExplainer author={author} />
        </div>
        {author.id !== ME_ID ? (
          <GhostButton
            pressed={pm.followedAuthors.includes(author.id)}
            onClick={() => pm.toggleFollowAuthor(author.id)}
          >
            {pm.followedAuthors.includes(author.id) ? "A seguir autor" : "Seguir autor"}
          </GhostButton>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Tag>
          {KIND_LABEL[t.kind]} · {STANCE_LABEL[t.stance]}
        </Tag>
        <Tag>{HORIZON_LABEL[t.horizon]}</Tag>
        <Tag tone={riskTone(t.risk)}>{RISK_LABEL[t.risk]}</Tag>
        <Tag>Revisão a {formatDate(t.reviewDue)}</Tag>
        <Tag tone={hasConflict(v) ? "warn" : "mute"}>
          {hasConflict(v) ? "Conflito declarado" : "Sem conflitos declarados"}
        </Tag>
      </div>
      <SegmentedTabs
        size="sm"
        active={tab}
        onSelect={setTab}
        tabs={[
          { id: "resumo", label: "Resumo" },
          { id: "evidencias", label: "Evidências", count: v.sources.length },
          { id: "cenarios", label: "Cenários" },
          { id: "conflitos", label: "Conflitos" },
          { id: "historico", label: "Histórico", count: t.versions.length },
          { id: "contraditorio", label: "Contraditório", count: counters.length },
        ]}
      />
      {tab === "resumo" ? <Resumo t={t} v={v} /> : null}
      {tab === "evidencias" ? <Evidencias v={v} /> : null}
      {tab === "cenarios" ? <Cenarios v={v} /> : null}
      {tab === "conflitos" ? <Conflitos t={t} /> : null}
      {tab === "historico" ? <Historico t={t} /> : null}
      {tab === "contraditorio" ? <Contraditorio t={t} onCounter={onCounter} /> : null}
      <p className="text-micro leading-relaxed text-white/38">
        Conteúdo de demonstração. Uma tese descreve cenários e evidência; não é aconselhamento
        financeiro nem recomendação de compra ou venda.
      </p>
    </div>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-1.5">
    <h4 className="text-micro font-semibold uppercase tracking-[0.14em] text-white/50">{title}</h4>
    {children}
  </section>
);

function Resumo({ t, v }: { t: Thesis; v: ThesisVersion }) {
  const pm = useProofMarket();
  const mine = pm.reactions[t.id] ?? [];
  return (
    <div className="flex flex-col gap-4">
      <Block title="Mecanismo">
        <p className="text-[13px] leading-relaxed text-white/80">{v.mechanism}</p>
      </Block>
      <Block title="Premissas">
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-[12.5px] text-white/75">
          {v.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </Block>
      <Block title="O que tornaria esta tese falsa">
        <p
          className="rounded-[12px] px-3 py-2 text-[12.5px] text-white/85"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}
        >
          {v.invalidation}
        </p>
      </Block>
      <div className="grid gap-3 sm:grid-cols-2">
        <Block title="Riscos">
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[12.5px] text-white/75">
            {v.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Block>
        <Block title="Melhor razão para estar errado">
          <p className="text-[12.5px] text-white/75">{v.counterHypothesis}</p>
        </Block>
      </div>
      {v.justifications?.length ? (
        <Block title="Avisos que o autor aceitou">
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[12px] text-[#fcd34d]">
            {v.justifications.map((j) => (
              <li key={j}>{j}</li>
            ))}
          </ul>
        </Block>
      ) : null}
      <Block title="Reações estruturadas">
        <p className="text-[11px] text-white/45">
          Nenhuma reação altera a validade da tese nem a reputação do autor.
        </p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reagir à tese">
          {REACTIONS.map((r) => {
            const on = mine.includes(r.id);
            const n = t.reactionCounts[r.id] + (on ? 1 : 0);
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={on}
                onClick={() => pm.toggleReaction(t.id, r.id)}
                className={
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 " +
                  (on
                    ? "bg-[rgba(74,158,255,0.22)] text-white shadow-[inset_0_0_0_1px_rgba(74,158,255,0.5)]"
                    : "bg-white/8 text-white/65 hover:bg-white/14 hover:text-white")
                }
              >
                {r.label}
                <span className="tabular-nums text-white/45">{n}</span>
              </button>
            );
          })}
        </div>
      </Block>
    </div>
  );
}

function Evidencias({ v }: { v: ThesisVersion }) {
  const [sort, setSort] = useState<"qualidade" | "data">("qualidade");
  const q = evidenceQuality(v);
  const rank = { primaria: 0, oficial: 1, secundaria: 2 } as const;
  const list = useMemo(
    () =>
      [...v.sources].sort((a, b) =>
        sort === "data"
          ? b.date.localeCompare(a.date)
          : rank[a.kind] - rank[b.kind] || b.date.localeCompare(a.date),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [v.sources, sort],
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-white/65">
          Evidência <b className="text-white">{q.label.toLowerCase()}</b>: {q.strong} de {q.n}{" "}
          fontes são primárias ou oficiais e datadas.
        </p>
        <SegmentedTabs
          size="sm"
          active={sort}
          onSelect={setSort}
          tabs={[
            { id: "qualidade", label: "Por qualidade" },
            { id: "data", label: "Mais recentes" },
          ]}
        />
      </div>
      <ul className="flex flex-col gap-2">
        {list.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-1 rounded-[12px] p-3"
            style={{
              background: "var(--aurora-surface-1)",
              border: "1px solid var(--aurora-hairline)",
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag tone={s.kind === "secundaria" ? "mute" : "ok"}>{SOURCE_KIND[s.kind]}</Tag>
              <span className="text-micro tabular-nums text-white/45">{formatDate(s.date)}</span>
              <span className="text-micro text-white/45">· {s.publisher}</span>
            </div>
            <p className="text-[12.5px] font-semibold text-white/90">{s.title}</p>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 self-start text-[11.5px] text-[var(--aurora-accent)] hover:underline"
            >
              {new URL(s.url).hostname}
              <ExternalLink size={11} aria-hidden />
              <span className="sr-only">(abre site externo)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cenarios({ v }: { v: ThesisVersion }) {
  const label = { base: "Base", positivo: "Positivo", adverso: "Adverso" } as const;
  const color = {
    base: "var(--aurora-accent)",
    positivo: "var(--aurora-positive)",
    adverso: "var(--aurora-negative)",
  } as const;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11.5px] text-white/50">
        Probabilidades declaradas pelo autor, não pela plataforma.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {v.scenarios.map((s) => (
          <div
            key={s.kind}
            className="flex flex-col gap-2 rounded-[12px] p-3"
            style={{ background: "var(--aurora-surface-2)" }}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
                {label[s.kind]}
              </span>
              <span className="text-[18px] font-semibold tabular-nums text-white">
                {s.probability}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
              <div
                className="h-full rounded-full"
                style={{ width: `${s.probability}%`, background: color[s.kind] }}
              />
            </div>
            <p className="text-[12px] text-white/75">{s.outcome}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Conflitos({ t }: { t: Thesis }) {
  const pos = {
    nenhuma: "Nenhuma posição",
    longa: "Posição longa (ganha se subir)",
    curta: "Posição curta (ganha se descer)",
  } as const;
  return (
    <ol className="flex flex-col gap-2">
      {[...t.versions].reverse().map((v) => (
        <li
          key={v.version}
          className="rounded-[12px] p-3 text-[12px]"
          style={{
            background: "var(--aurora-surface-1)",
            border: "1px solid var(--aurora-hairline)",
          }}
        >
          <p className="mb-1.5 text-micro tabular-nums text-white/45">
            v{v.version} · declarado a {formatDate(v.conflict.declaredAt)}
          </p>
          <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-3 gap-y-1">
            <dt className="text-white/45">Posição</dt>
            <dd className="text-white/85">{pos[v.conflict.position]}</dd>
            <dt className="text-white/45">Remunerado</dt>
            <dd className="text-white/85">{v.conflict.remunerated ? "Sim" : "Não"}</dd>
            <dt className="text-white/45">Patrocínio</dt>
            <dd className="text-white/85">{v.conflict.sponsor || "Nenhum"}</dd>
            <dt className="text-white/45">Relação com a entidade</dt>
            <dd className="text-white/85">{v.conflict.relation || "Nenhuma"}</dd>
          </dl>
        </li>
      ))}
    </ol>
  );
}

const FIELDS: [keyof ThesisVersion, string][] = [
  ["claim", "Afirmação"],
  ["mechanism", "Mecanismo"],
  ["assumptions", "Premissas"],
  ["risks", "Riscos"],
  ["invalidation", "Invalidação"],
  ["scenarios", "Cenários"],
  ["sources", "Fontes"],
  ["conflict", "Conflitos"],
];

function Historico({ t }: { t: Thesis }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(t.versions.length - 1);
  const va = t.versions[a]!;
  const vb = t.versions[b]!;
  const changed = FIELDS.filter(([k]) => {
    const strip = (x: unknown) =>
      JSON.stringify(x, (key, val) => (key === "declaredAt" ? undefined : val));
    return strip(va[k]) !== strip(vb[k]);
  });
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {[...t.versions].reverse().map((v) => (
          <li
            key={v.version}
            className="flex flex-col gap-1 rounded-[12px] p-3"
            style={{
              background: "var(--aurora-surface-1)",
              border: "1px solid var(--aurora-hairline)",
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <b className="text-[12px] tabular-nums text-white">v{v.version}</b>
              <Tag tone={v.material ? "warn" : "mute"}>
                {v.material ? "Alteração material" : "Correção menor"}
              </Tag>
              <span className="text-micro tabular-nums text-white/45">{formatDate(v.date)}</span>
            </div>
            <p className="text-[12px] text-white/70">{v.changeNote}</p>
          </li>
        ))}
      </ol>
      {t.versions.length > 1 ? (
        <div
          className="flex flex-col gap-2 rounded-[12px] p-3"
          style={{ background: "var(--aurora-surface-2)" }}
        >
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-white/85">
            <GitCompare size={13} aria-hidden /> Comparar versões
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/70">
            <label className="flex items-center gap-1.5">
              De
              <select
                value={a}
                onChange={(e) => setA(Number(e.target.value))}
                className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-white"
              >
                {t.versions.map((v, i) => (
                  <option key={v.version} value={i}>
                    v{v.version}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              para
              <select
                value={b}
                onChange={(e) => setB(Number(e.target.value))}
                className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-white"
              >
                {t.versions.map((v, i) => (
                  <option key={v.version} value={i}>
                    v{v.version}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-[12px] text-white/70" aria-live="polite">
            {a === b
              ? "Escolha duas versões diferentes."
              : changed.length
                ? `Campos alterados: ${changed.map(([, l]) => l).join(", ")}.`
                : "Sem alterações de conteúdo (só nota de versão)."}
          </p>
        </div>
      ) : null}
      {t.reviews.length ? (
        <Block title="Revisões">
          {t.reviews.map((r) => (
            <p key={r.date} className="text-[12px] text-white/75">
              <b className="text-white">
                {formatDate(r.date)} · {r.decision}
              </b>{" "}
              {r.onTime ? "(no prazo)" : "(fora do prazo)"}: {r.justification}
            </p>
          ))}
        </Block>
      ) : null}
    </div>
  );
}

function Contraditorio({ t, onCounter }: { t: Thesis; onCounter: (id: string) => void }) {
  const pm = useProofMarket();
  const list = pm.allCounters.filter((c) => c.thesisId === t.id);
  return (
    <div className="flex flex-col gap-3">
      {!list.length ? (
        <p
          className="rounded-[12px] p-3 text-[12px] text-white/60"
          style={{ border: "1px dashed rgba(255,255,255,0.14)" }}
        >
          Ainda ninguém contestou esta tese.{" "}
          {t.counterOpen && t.authorId !== ME_ID
            ? "Pode ser o primeiro: conteste uma premissa, evidência ou cenário específico."
            : ""}
        </p>
      ) : null}
      {list.map((c) => {
        const a = pm.getAuthor(c.authorId);
        return (
          <article
            key={c.id}
            className="flex flex-col gap-2 rounded-[12px] p-3"
            style={{
              background: "var(--aurora-surface-1)",
              border: "1px solid var(--aurora-hairline)",
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <b className="text-white">{a.name}</b>
              <LevelTag author={a} />
              <Tag tone="violet">{COUNTER_TYPE[c.type]}</Tag>
              <span className="tabular-nums text-white/45">{formatDate(c.date)}</span>
            </div>
            <blockquote className="border-l-2 border-white/25 pl-2.5 text-[11.5px] italic text-white/55">
              {TARGET_LABEL[c.targetKind]} (v{c.targetVersion}): {c.targetText}
            </blockquote>
            <p className="text-[12.5px] text-white/85">{c.body}</p>
            <p className="text-[12px] text-white/65">
              <b className="text-white/80">Mecanismo alternativo:</b> {c.alternative}
            </p>
            <p className="text-[12px] text-white/65">
              <b className="text-white/80">O que mudaria a opinião:</b> {c.wouldChange}
            </p>
            {c.source ? (
              <p className="text-[11.5px] text-white/55">
                Fonte: {c.source.publisher} · {formatDate(c.source.date)}
              </p>
            ) : null}
            {c.answer ? (
              <p
                className="rounded-[10px] px-2.5 py-2 text-[12px] text-white/75"
                style={{
                  background: "rgba(74,158,255,0.08)",
                  border: "1px solid rgba(74,158,255,0.2)",
                }}
              >
                <b className="text-[var(--aurora-accent)]">
                  Resposta do autor ({c.answer.stance}):
                </b>{" "}
                {c.answer.text}
              </p>
            ) : null}
          </article>
        );
      })}
      {t.counterOpen && t.authorId !== ME_ID ? (
        <div>
          <PrimaryButton icon={Scale} onClick={() => onCounter(t.id)}>
            Contestar com evidência
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}
