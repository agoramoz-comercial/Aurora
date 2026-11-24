/**
 * UF-05 counter-thesis, UF-08 report and UF-09 review, each as an Ollympius drawer.
 */
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Flag, RefreshCcw, Scale, ShieldAlert } from "lucide-react";
import { Drawer } from "../primitives";
import { useProofMarket } from "@/data/proofmarket/store";
import { ME_ID } from "@/data/proofmarket/seed";
import type {
  CounterTargetKind,
  CounterType,
  PositionBand,
  ReportReason,
  ReviewDecision,
  Source,
  Thesis,
} from "@/data/proofmarket/types";
import {
  checkCounterText,
  checkUrl,
  countersToday,
  formatDate,
  iso,
  latest,
} from "@/lib/proofmarket/rules";
import { ChoiceGroup, Field, GhostButton, PrimaryButton, Tag, inputCls } from "./atoms";

/* ── UF-05 · Contra-tese ─────────────────────────────────────────────── */

const TYPES: { id: CounterType; label: string }[] = [
  { id: "evidencia_contraria", label: "Evidência contrária" },
  { id: "metodologia", label: "Problema metodológico" },
  { id: "confundidor", label: "Confundidor" },
  { id: "conflito", label: "Conflito" },
  { id: "risco_omitido", label: "Risco omitido" },
  { id: "interpretacao", label: "Interpretação alternativa" },
];

export function CounterBuilder({
  thesisId,
  onClose,
  onDone,
}: {
  thesisId: string | null;
  onClose: () => void;
  onDone: (thesisId: string) => void;
}) {
  const pm = useProofMarket();
  const t = thesisId ? pm.getThesis(thesisId) : undefined;
  const [target, setTarget] = useState("");
  const [type, setType] = useState<CounterType | "">("");
  const [body, setBody] = useState("");
  const [alternative, setAlternative] = useState("");
  const [wouldChange, setWouldChange] = useState("");
  const [src, setSrc] = useState({ title: "", publisher: "", url: "", date: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setTarget("");
    setType("");
    setBody("");
    setAlternative("");
    setWouldChange("");
    setSrc({ title: "", publisher: "", url: "", date: "" });
    setSubmitted(false);
  }, [thesisId]);

  const targets = useMemo(() => {
    if (!t) return [] as { key: string; kind: CounterTargetKind; text: string; label: string }[];
    const v = latest(t);
    return [
      { key: "a", kind: "afirmacao" as const, text: v.claim, label: "Afirmação" },
      ...v.assumptions.map((p, i) => ({
        key: `p${i}`,
        kind: "premissa" as const,
        text: p,
        label: `Premissa ${i + 1}`,
      })),
      ...v.sources.map((s, i) => ({
        key: `e${i}`,
        kind: "evidencia" as const,
        text: `${s.title} (${s.publisher})`,
        label: `Evidência ${i + 1}`,
      })),
      ...v.scenarios.map((s) => ({
        key: `c${s.kind}`,
        kind: "cenario" as const,
        text: `${s.kind} ${s.probability}%: ${s.outcome}`,
        label: `Cenário ${s.kind}`,
      })),
    ];
  }, [t]);

  if (!t)
    return (
      <Drawer open={false} onClose={onClose} title="">
        <div />
      </Drawer>
    );
  const v = latest(t);
  const chosen = targets.find((x) => x.key === target);
  const textIssues = checkCounterText([body, alternative, wouldChange].join(" "));
  const hasSource = !!(src.title || src.url);
  const urlCheck = hasSource ? checkUrl(src.url) : { ok: true };
  const needsSource = type === "evidencia_contraria";
  const limit = countersToday(pm.allCounters, t.id, ME_ID, iso(Date.now())) >= 3;
  const errors: string[] = [];
  if (!chosen) errors.push("Escolha o elemento que contesta.");
  if (!type) errors.push("Escolha o tipo de contestação.");
  if (body.trim().length < 80) errors.push("Descreva a contestação em pelo menos 80 caracteres.");
  if (alternative.trim().length < 20) errors.push("Apresente o mecanismo alternativo.");
  if (wouldChange.trim().length < 20) errors.push("Diga o que mudaria a sua opinião.");
  if (needsSource && (!src.title || !src.url || !src.date))
    errors.push("Evidência contrária precisa de fonte com título, link e data.");
  if (hasSource && !urlCheck.ok) errors.push(`Fonte: ${urlCheck.reason}`);
  if (limit) errors.push("Já publicou 3 contra-teses a esta tese hoje. Volte amanhã.");
  textIssues.filter((i) => i.level === "bloqueio").forEach((i) => errors.push(i.message));

  const submit = () => {
    setSubmitted(true);
    if (errors.length || !chosen || !type) return;
    const source: Source | undefined = hasSource
      ? {
          id: "cs",
          title: src.title.trim(),
          publisher: src.publisher.trim() || "—",
          url: src.url.trim(),
          date: src.date,
          kind: "secundaria",
        }
      : undefined;
    pm.addCounter({
      thesisId: t.id,
      targetKind: chosen.kind,
      targetText: chosen.text,
      targetVersion: v.version,
      type,
      body: body.trim(),
      alternative: alternative.trim(),
      wouldChange: wouldChange.trim(),
      source,
    });
    onDone(t.id);
  };

  return (
    <Drawer
      open={!!thesisId}
      onClose={onClose}
      width={640}
      title="Contestar com evidência"
      eyebrow={
        <>
          <Tag tone="violet" icon={Scale}>
            Contra-tese
          </Tag>
          <Tag>
            {t.id} · v{v.version}
          </Tag>
        </>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton icon={Scale} onClick={submit} disabled={limit}>
            Publicar contra-tese
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <p
          className="rounded-[12px] px-3 py-2 text-[12px] text-white/75"
          style={{ background: "var(--aurora-surface-2)" }}
        >
          Conteste a evidência, não a pessoa. O autor é notificado e pode responder.
        </p>
        <Field label="O que contesta" hint="A contra-tese fica ligada a esta versão da tese.">
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-describedby={describedBy}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={inputCls}
            >
              <option value="">Escolher…</option>
              {targets.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}: {x.text.slice(0, 70)}
                  {x.text.length > 70 ? "…" : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
        {chosen ? (
          <blockquote className="border-l-2 border-white/25 pl-2.5 text-[12px] italic text-white/60">
            {chosen.text}
          </blockquote>
        ) : null}
        <ChoiceGroup name="ctype" legend="Tipo" value={type} onChange={setType} options={TYPES} />
        <Field label="Contestação" count={`${body.trim().length}/80 mín.`}>
          {({ id }) => (
            <textarea
              id={id}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={inputCls}
            />
          )}
        </Field>
        <Field label="Mecanismo alternativo" hint="Se X, então Y.">
          {({ id, describedBy }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              rows={2}
              value={alternative}
              onChange={(e) => setAlternative(e.target.value)}
              className={inputCls}
            />
          )}
        </Field>
        <Field label="O que mudaria a minha opinião">
          {({ id }) => (
            <textarea
              id={id}
              rows={2}
              value={wouldChange}
              onChange={(e) => setWouldChange(e.target.value)}
              className={inputCls}
            />
          )}
        </Field>
        <fieldset
          className="grid gap-3 rounded-[12px] p-3 sm:grid-cols-2"
          style={{ border: "1px solid var(--aurora-hairline)" }}
        >
          <legend className="px-1 text-[12px] font-semibold text-white/85">
            Fonte {needsSource ? "(obrigatória)" : "(opcional)"}
          </legend>
          <Field label="Título">
            {({ id }) => (
              <input
                id={id}
                value={src.title}
                onChange={(e) => setSrc({ ...src, title: e.target.value })}
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Quem publicou">
            {({ id }) => (
              <input
                id={id}
                value={src.publisher}
                onChange={(e) => setSrc({ ...src, publisher: e.target.value })}
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Link (https://)">
            {({ id }) => (
              <input
                id={id}
                type="url"
                value={src.url}
                onChange={(e) => setSrc({ ...src, url: e.target.value })}
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Data">
            {({ id }) => (
              <input
                id={id}
                type="date"
                max={iso(Date.now())}
                value={src.date}
                onChange={(e) => setSrc({ ...src, date: e.target.value })}
                className={inputCls}
              />
            )}
          </Field>
        </fieldset>
        {textIssues
          .filter((i) => i.level === "aviso")
          .map((i) => (
            <p key={i.id} className="text-[12px] text-[#fcd34d]">
              Aviso: {i.message}
            </p>
          ))}
        {submitted && errors.length ? (
          <ul
            role="alert"
            className="flex flex-col gap-1 rounded-[12px] p-3 text-[12px] text-[#fca5a5]"
            style={{ background: "rgba(248,113,113,0.08)" }}
          >
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </Drawer>
  );
}

/* ── UF-08 · Reportar ────────────────────────────────────────────────── */

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "fraude", label: "Fraude" },
  { id: "promessa_retorno", label: "Promessa de retorno" },
  { id: "conflito_oculto", label: "Conflito oculto" },
  { id: "promocao_nao_identificada", label: "Promoção não identificada" },
  { id: "identidade_falsa", label: "Identidade falsa" },
  { id: "manipulacao", label: "Manipulação de mercado" },
  { id: "informacao_enganosa", label: "Informação enganosa" },
  { id: "assedio", label: "Assédio" },
  { id: "dados_pessoais", label: "Dados pessoais" },
  { id: "spam", label: "Spam" },
  { id: "outro", label: "Outro" },
];
const PRIORITY: Partial<Record<ReportReason, string>> = {
  fraude: "alta",
  manipulacao: "alta",
  dados_pessoais: "alta",
  promessa_retorno: "alta",
};

export function ReportDrawer({
  thesisId,
  onClose,
}: {
  thesisId: string | null;
  onClose: () => void;
}) {
  const pm = useProofMarket();
  const t = thesisId ? pm.getThesis(thesisId) : undefined;
  const [reason, setReason] = useState<ReportReason | "">("");
  const [part, setPart] = useState("");
  const [context, setContext] = useState("");
  const [caseId, setCaseId] = useState("");
  useEffect(() => {
    setReason("");
    setPart("");
    setContext("");
    setCaseId("");
  }, [thesisId]);
  if (!t)
    return (
      <Drawer open={false} onClose={onClose} title="">
        <div />
      </Drawer>
    );
  const v = latest(t);
  const parts = ["Afirmação", "Mecanismo", "Uma fonte", "Conflitos declarados", "Perfil do autor"];
  return (
    <Drawer
      open={!!thesisId}
      onClose={onClose}
      width={560}
      title={caseId ? "Denúncia recebida" : "Reportar tese"}
      eyebrow={
        <Tag tone="crit" icon={Flag}>
          {t.id}
        </Tag>
      }
      footer={
        caseId ? (
          <PrimaryButton onClick={onClose}>Fechar</PrimaryButton>
        ) : (
          <div className="flex justify-between gap-2">
            <GhostButton onClick={onClose}>Cancelar</GhostButton>
            <PrimaryButton
              icon={Flag}
              disabled={!reason || !part}
              onClick={() =>
                reason &&
                setCaseId(
                  pm.report({
                    targetId: t.id,
                    targetLabel: v.claim,
                    reason,
                    part,
                    context: context.trim(),
                  }),
                )
              }
            >
              Enviar denúncia
            </PrimaryButton>
          </div>
        )
      }
    >
      {caseId ? (
        <div className="flex flex-col gap-3 p-5" role="status">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-[#86efac]">
            <CheckCircle2 size={16} aria-hidden /> Recebemos a sua denúncia
          </p>
          <p className="text-[13px] text-white/80">
            Caso <b className="tabular-nums text-white">{caseId}</b>. Prioridade{" "}
            {PRIORITY[reason as ReportReason] ?? "normal"}.
          </p>
          <p className="text-[12px] text-white/60">
            Uma pessoa da moderação decide com base na política aplicável. O autor é notificado e
            pode recorrer a um revisor diferente. Nesta versão de demonstração o caso fica registado
            só neste browser.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-5">
          <ChoiceGroup
            name="reason"
            legend="Motivo"
            value={reason}
            onChange={setReason}
            options={REASONS}
          />
          <ChoiceGroup
            name="part"
            legend="Que parte do conteúdo"
            value={part}
            onChange={setPart}
            options={parts.map((p) => ({ id: p, label: p }))}
          />
          <Field label="Contexto (opcional)" hint="Não inclua dados pessoais de terceiros.">
            {({ id, describedBy }) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className={inputCls}
              />
            )}
          </Field>
        </div>
      )}
    </Drawer>
  );
}

/* ── UF-09 · Revisão ─────────────────────────────────────────────────── */

const DECISIONS: { id: ReviewDecision; label: string; hint: string }[] = [
  {
    id: "manter",
    label: "Manter",
    hint: "A tese continua válida; nova data de revisão em 6 meses.",
  },
  { id: "atualizar", label: "Atualizar", hint: "Mantém-se ativa com notas de atualização." },
  { id: "concluir", label: "Concluir", hint: "O horizonte terminou e a tese verificou-se." },
  { id: "invalidar", label: "Invalidar", hint: "O critério de invalidação foi cumprido." },
  { id: "inconclusiva", label: "Inconclusiva", hint: "Não há evidência suficiente para decidir." },
];

export function ReviewDrawer({
  thesisId,
  onClose,
  onDone,
}: {
  thesisId: string | null;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const pm = useProofMarket();
  const t: Thesis | undefined = thesisId ? pm.getThesis(thesisId) : undefined;
  const [decision, setDecision] = useState<ReviewDecision | "">("");
  const [justification, setJustification] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [position, setPosition] = useState<PositionBand>("nenhuma");
  const [confirmConflict, setConfirmConflict] = useState(false);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!t) return;
    const v = latest(t);
    setDecision("");
    setJustification("");
    setStatus(v.assumptions.map(() => "indeterminada"));
    setPosition(v.conflict.position);
    setConfirmConflict(false);
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesisId]);
  if (!t || t.authorId !== ME_ID)
    return (
      <Drawer open={false} onClose={onClose} title="">
        <div />
      </Drawer>
    );
  const v = latest(t);
  const errors = [
    !decision && "Escolha uma decisão.",
    justification.trim().length < 80 && "Justifique em pelo menos 80 caracteres.",
    !confirmConflict && "Confirme a declaração de conflitos.",
  ].filter(Boolean) as string[];
  return (
    <Drawer
      open={!!thesisId}
      onClose={onClose}
      width={640}
      title="Rever tese"
      eyebrow={
        <>
          <Tag tone="warn" icon={RefreshCcw}>
            Revisão devida a {formatDate(t.reviewDue)}
          </Tag>
          <Tag>
            {t.id} · v{v.version}
          </Tag>
        </>
      }
      footer={
        <div className="flex flex-wrap justify-between gap-2">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton
            icon={CheckCircle2}
            onClick={() => {
              setTried(true);
              if (errors.length || !decision) return;
              pm.review(t.id, {
                decision,
                justification: justification.trim(),
                conflict: { ...v.conflict, position },
                assumptionStatus: status,
              });
              onDone(t.id);
            }}
          >
            Publicar revisão
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <section className="flex flex-col gap-1.5">
          <h4 className="text-micro font-semibold uppercase tracking-[0.14em] text-white/50">
            Afirmação original
          </h4>
          <p className="text-[13px] text-white/85">{v.claim}</p>
          <p
            className="rounded-[10px] px-2.5 py-1.5 text-[12px] text-white/75"
            style={{ background: "rgba(248,113,113,0.08)" }}
          >
            {v.invalidation}
          </p>
        </section>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[12px] font-semibold text-white/85">
            Estado de cada premissa
          </legend>
          {v.assumptions.map((a, i) => (
            <div
              key={a}
              className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center"
            >
              <label htmlFor={`as-${i}`} className="text-[12px] text-white/75">
                {i + 1}. {a}
              </label>
              <select
                id={`as-${i}`}
                value={status[i] ?? "indeterminada"}
                onChange={(e) => setStatus(status.map((s, j) => (j === i ? e.target.value : s)))}
                className={inputCls}
              >
                <option value="confirmada">Confirmada</option>
                <option value="falhada">Falhada</option>
                <option value="indeterminada">Indeterminada</option>
              </select>
            </div>
          ))}
        </fieldset>
        <section className="flex flex-col gap-1">
          <h4 className="text-micro font-semibold uppercase tracking-[0.14em] text-white/50">
            Eventos materiais
          </h4>
          {t.events.length ? (
            t.events.map((e) => (
              <p key={e.date} className="text-[12px] text-white/75">
                {formatDate(e.date)}: {e.text}
              </p>
            ))
          ) : (
            <p className="text-[12px] text-white/50">Nenhum evento material registado.</p>
          )}
        </section>
        <ChoiceGroup
          name="decision"
          legend="Decisão"
          value={decision}
          onChange={setDecision}
          options={DECISIONS}
        />
        {decision ? (
          <p className="-mt-2 text-[11.5px] text-white/55">
            {DECISIONS.find((x) => x.id === decision)?.hint}
          </p>
        ) : null}
        <Field
          label="Justificação"
          count={`${justification.trim().length}/80 mín.`}
          hint="Fica pública no histórico. Uma hipótese legítima que falhou não penaliza a reputação de evidência."
        >
          {({ id, describedBy }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className={inputCls}
            />
          )}
        </Field>
        <ChoiceGroup
          name="rposition"
          legend="Posição financeira atual nesta entidade"
          value={position}
          onChange={setPosition}
          options={[
            { id: "nenhuma", label: "Nenhuma" },
            { id: "longa", label: "Ganho se subir" },
            { id: "curta", label: "Ganho se descer" },
          ]}
        />
        <label className="flex items-start gap-2 text-[12px] text-white/80">
          <input
            type="checkbox"
            checked={confirmConflict}
            onChange={(e) => setConfirmConflict(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#4a9eff]"
          />
          Confirmo que a declaração de conflitos está atualizada.
        </label>
        <p className="flex items-start gap-1.5 text-[11.5px] text-white/50">
          <ShieldAlert size={12} aria-hidden className="mt-0.5 shrink-0" /> A revisão cria a versão{" "}
          {Number(v.version.split(".")[0]) + 1}.0. As versões anteriores continuam visíveis.
        </p>
        {tried && errors.length ? (
          <ul role="alert" className="flex flex-col gap-1 text-[12px] text-[#fca5a5]">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </Drawer>
  );
}
