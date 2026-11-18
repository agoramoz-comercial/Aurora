import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Drawer } from "../primitives";
import { useProofMarket } from "@/data/proofmarket/store";
import { ENTITIES } from "@/data/proofmarket/seed";
import type {
  Horizon,
  PositionBand,
  RiskLevel,
  Source,
  SourceKind,
  Stance,
  ThesisKind,
} from "@/data/proofmarket/types";
import {
  DAY,
  HORIZON_DAYS,
  checkUrl,
  daysBetween,
  findPromises,
  iso,
  validateThesis,
  type StepId,
} from "@/lib/proofmarket/rules";
import {
  ChoiceGroup,
  Field,
  GhostButton,
  HORIZON_LABEL,
  KIND_LABEL,
  PrimaryButton,
  RISK_LABEL,
  STANCE_LABEL,
  Tag,
  inputCls,
} from "./atoms";

const DRAFT_KEY = "ollympius.proofmarket.draft";

interface Draft {
  entityId: string;
  kind: ThesisKind | "";
  stance: Stance | "";
  horizon: Horizon | "";
  risk: RiskLevel | "";
  claim: string;
  mechanism: string;
  assumptions: string[];
  risks: string[];
  counterHypothesis: string;
  sources: Source[];
  scenarios: { kind: "base" | "positivo" | "adverso"; probability: number; outcome: string }[];
  invalidation: string;
  position: PositionBand | "";
  remunerated: "sim" | "nao" | "";
  sponsor: string;
  relation: string;
  conflictConfirmed: boolean;
  counterOpen: boolean;
  reviewDue: string;
  accepted: string[];
}

const EMPTY_DRAFT: Draft = {
  entityId: "",
  kind: "",
  stance: "",
  horizon: "",
  risk: "",
  claim: "",
  mechanism: "",
  assumptions: ["", ""],
  risks: ["", ""],
  counterHypothesis: "",
  sources: [],
  scenarios: [
    { kind: "base", probability: 50, outcome: "" },
    { kind: "positivo", probability: 25, outcome: "" },
    { kind: "adverso", probability: 25, outcome: "" },
  ],
  invalidation: "",
  position: "",
  remunerated: "",
  sponsor: "",
  relation: "",
  conflictConfirmed: false,
  counterOpen: true,
  reviewDue: "",
  accepted: [],
};

const STEPS: { id: StepId | "verificar"; label: string }[] = [
  { id: "entidade", label: "Entidade" },
  { id: "afirmacao", label: "Afirmação" },
  { id: "premissas", label: "Premissas e riscos" },
  { id: "fontes", label: "Fontes" },
  { id: "cenarios", label: "Cenários e invalidação" },
  { id: "conflitos", label: "Conflitos" },
  { id: "verificar", label: "Verificar e publicar" },
];

function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

export function ThesisBuilder({
  open,
  onClose,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  onPublished: (id: string) => void;
}) {
  const pm = useProofMarket();
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [restored, setRestored] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const draft = loadDraft();
    setD(draft);
    setRestored(draft !== EMPTY_DRAFT && JSON.stringify(draft) !== JSON.stringify(EMPTY_DRAFT));
    setStep(0);
    setConfirming(false);
    setPublishing(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      } catch {
        /* draft stays in memory; warning shown */
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [d, open]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const entity = ENTITIES.find((e) => e.id === d.entityId);
  const today = iso(Date.now());
  const defaultReview = d.horizon ? iso(Date.now() + HORIZON_DAYS[d.horizon] * DAY) : "";
  const reviewDue = d.reviewDue || defaultReview;

  const issues = useMemo(
    () =>
      validateThesis({
        entityId: d.entityId,
        claim: d.claim,
        mechanism: d.mechanism,
        assumptions: d.assumptions,
        risks: d.risks,
        counterHypothesis: d.counterHypothesis,
        invalidation: d.invalidation,
        scenarios: d.scenarios,
        sources: d.sources,
        conflictDeclared: d.conflictConfirmed && !!d.position && !!d.remunerated,
        sponsor: d.sponsor,
      }).concat(
        !d.kind || !d.stance || !d.horizon || !d.risk
          ? [
              {
                id: "classify",
                level: "bloqueio" as const,
                step: "entidade" as const,
                message: "Escolha o tipo, a posição, o horizonte e o nível de risco.",
              },
            ]
          : [],
      ),
    [d],
  );
  const blocks = issues.filter((i) => i.level === "bloqueio");
  const warnings = issues.filter((i) => i.level === "aviso");
  const pendingWarnings = warnings.filter((w) => !d.accepted.includes(w.id));
  const stepIssues = (id: string) => issues.filter((i) => i.step === id);
  const canPublish =
    !blocks.length && !pendingWarnings.length && !!reviewDue && daysBetween(today, reviewDue) >= 1;

  const go = (i: number) => {
    setStep(i);
    setConfirming(false);
    requestAnimationFrame(() => bodyRef.current?.querySelector<HTMLElement>("h3")?.focus());
  };

  const publish = () => {
    if (!entity || !d.kind || !d.stance || !d.horizon || !d.risk || publishing) return;
    setPublishing(true);
    const id = pm.publish({
      entity,
      kind: d.kind,
      stance: d.stance,
      horizon: d.horizon,
      risk: d.risk,
      counterOpen: d.counterOpen,
      reviewDue,
      tags: [KIND_LABEL[d.kind]],
      version: {
        claim: d.claim.trim(),
        mechanism: d.mechanism.trim(),
        assumptions: d.assumptions.map((s) => s.trim()).filter(Boolean),
        risks: d.risks.map((s) => s.trim()).filter(Boolean),
        counterHypothesis: d.counterHypothesis.trim(),
        invalidation: /^esta tese é falsa se/i.test(d.invalidation.trim())
          ? d.invalidation.trim()
          : `Esta tese é falsa se ${d.invalidation.trim()}`,
        scenarios: d.scenarios,
        sources: d.sources,
        conflict: {
          position: d.position || "nenhuma",
          remunerated: d.remunerated === "sim",
          sponsor: d.sponsor.trim(),
          relation: d.relation.trim(),
          declaredAt: today,
        },
        justifications: warnings.map((w) => w.message),
      },
    });
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    onPublished(id);
  };

  const cur = STEPS[step]!;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      title="Nova tese auditável"
      eyebrow={
        <Tag tone="accent">
          Passo {step + 1} de {STEPS.length} · {cur.label}
        </Tag>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <GhostButton icon={ArrowLeft} onClick={() => (step === 0 ? onClose() : go(step - 1))}>
            {step === 0 ? "Fechar (rascunho guardado)" : "Voltar"}
          </GhostButton>
          {cur.id !== "verificar" ? (
            <PrimaryButton icon={ArrowRight} onClick={() => go(step + 1)}>
              Seguinte
              {stepIssues(cur.id).some((i) => i.level === "bloqueio")
                ? ` · ${stepIssues(cur.id).filter((i) => i.level === "bloqueio").length} por resolver`
                : ""}
            </PrimaryButton>
          ) : confirming ? null : (
            <PrimaryButton
              icon={CheckCircle2}
              onClick={() => setConfirming(true)}
              disabled={!canPublish}
            >
              Publicar
            </PrimaryButton>
          )}
        </div>
      }
    >
      <div ref={bodyRef} className="flex flex-col gap-5 p-5">
        <nav aria-label="Passos da tese">
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => {
              const bad =
                s.id !== "verificar" && stepIssues(s.id).some((x) => x.level === "bloqueio");
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === step ? "step" : undefined}
                    className={
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 " +
                      (i === step
                        ? "bg-[rgba(74,158,255,0.25)] text-white shadow-[inset_0_0_0_1px_rgba(74,158,255,0.5)]"
                        : "bg-white/6 text-white/60 hover:text-white")
                    }
                  >
                    <span className="tabular-nums text-white/45">{i + 1}</span>
                    {s.label}
                    {bad && i < step ? (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#f87171]"
                        aria-label="tem campos por resolver"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {restored && step === 0 ? (
          <p
            className="flex items-center justify-between gap-2 rounded-[12px] px-3 py-2 text-[12px] text-white/75"
            style={{ background: "var(--aurora-surface-2)" }}
          >
            Recuperámos o seu rascunho anterior.
            <button
              type="button"
              className="font-semibold text-[var(--aurora-accent)] hover:underline"
              onClick={() => {
                setD(EMPTY_DRAFT);
                setRestored(false);
              }}
            >
              Começar de novo
            </button>
          </p>
        ) : null}
        {!pm.storageOk ? (
          <p
            className="rounded-[12px] px-3 py-2 text-[12px] text-[#fcd34d]"
            style={{ background: "rgba(251,191,36,0.1)" }}
          >
            O browser não permite guardar dados. O rascunho fica só nesta sessão.
          </p>
        ) : null}

        <h3 tabIndex={-1} className="text-[16px] font-semibold text-white outline-none">
          {cur.label}
        </h3>

        {cur.id === "entidade" ? <StepEntity d={d} set={set} /> : null}
        {cur.id === "afirmacao" ? <StepClaim d={d} set={set} /> : null}
        {cur.id === "premissas" ? <StepPremises d={d} set={set} /> : null}
        {cur.id === "fontes" ? <StepSources d={d} set={set} today={today} /> : null}
        {cur.id === "cenarios" ? <StepScenarios d={d} set={set} /> : null}
        {cur.id === "conflitos" ? <StepConflicts d={d} set={set} /> : null}
        {cur.id === "verificar" ? (
          <StepVerify
            d={d}
            set={set}
            blocks={blocks}
            warnings={warnings}
            reviewDue={reviewDue}
            today={today}
            go={(sid) => go(STEPS.findIndex((s) => s.id === sid))}
            confirming={confirming}
            onCancel={() => setConfirming(false)}
            onConfirm={publish}
            publishing={publishing}
            entityLabel={entity ? `${entity.code ?? entity.name}` : ""}
          />
        ) : null}

        {cur.id !== "verificar" && stepIssues(cur.id).length ? (
          <ul
            className="flex flex-col gap-1 rounded-[12px] p-3 text-[11.5px]"
            style={{
              background: "var(--aurora-surface-1)",
              border: "1px solid var(--aurora-hairline)",
            }}
            aria-label="Por resolver neste passo"
          >
            {stepIssues(cur.id).map((i) => (
              <li
                key={i.id}
                className={i.level === "bloqueio" ? "text-[#fca5a5]" : "text-[#fcd34d]"}
              >
                {i.level === "bloqueio" ? "Obrigatório: " : "Aviso: "}
                {i.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Drawer>
  );
}

type SetFn = <K extends keyof Draft>(k: K, v: Draft[K]) => void;

function StepEntity({ d, set }: { d: Draft; set: SetFn }) {
  const [q, setQ] = useState("");
  const matches = ENTITIES.filter(
    (e) => !q.trim() || `${e.name} ${e.code ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const similar =
    q.trim().length >= 3 && matches.length > 1 && matches.some((m) => m.kind === "empresa");
  return (
    <div className="flex flex-col gap-4">
      <Field label="Pesquisar empresa, ativo, setor ou tema" hint="Pesquise pelo nome ou código.">
        {({ id, describedBy }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={inputCls}
            placeholder="Ex.: NVIDIA, metical, taxa MIMO"
          />
        )}
      </Field>
      {similar ? (
        <p className="flex items-center gap-1.5 text-[11.5px] text-[#fcd34d]">
          <AlertTriangle size={12} aria-hidden /> Há nomes semelhantes. Confirme a bolsa e o código
          antes de escolher.
        </p>
      ) : null}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[12px] font-semibold text-white/85">Entidade</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {matches.map((e) => (
            <label
              key={e.id}
              className={
                "flex cursor-pointer items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] focus-within:ring-2 focus-within:ring-white/50 " +
                (d.entityId === e.id
                  ? "border-[rgba(74,158,255,0.6)] bg-[rgba(74,158,255,0.16)] text-white"
                  : "border-white/10 bg-white/5 text-white/75")
              }
            >
              <input
                type="radio"
                name="entity"
                className="sr-only"
                checked={d.entityId === e.id}
                onChange={() => set("entityId", e.id)}
              />
              <span className="rounded-md bg-white/12 px-1.5 py-0.5 text-micro font-bold text-white">
                {e.code ?? e.kind}
              </span>
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              {e.market ? <span className="text-micro text-white/45">{e.market}</span> : null}
            </label>
          ))}
          {!matches.length ? (
            <p className="text-[12px] text-white/55">
              Sem resultados. Pedir nova entidade fica disponível na versão com servidor.
            </p>
          ) : null}
        </div>
      </fieldset>
      <ChoiceGroup
        name="kind"
        legend="Tipo de tese"
        value={d.kind}
        onChange={(v) => set("kind", v)}
        options={(Object.keys(KIND_LABEL) as ThesisKind[]).map((k) => ({
          id: k,
          label: KIND_LABEL[k],
        }))}
      />
      <ChoiceGroup
        name="stance"
        legend="Posição"
        value={d.stance}
        onChange={(v) => set("stance", v)}
        options={(Object.keys(STANCE_LABEL) as Stance[]).map((k) => ({
          id: k,
          label: STANCE_LABEL[k],
        }))}
      />
      <ChoiceGroup
        name="horizon"
        legend="Horizonte (define a data de revisão)"
        value={d.horizon}
        onChange={(v) => set("horizon", v)}
        options={(Object.keys(HORIZON_LABEL) as Horizon[]).map((k) => ({
          id: k,
          label: HORIZON_LABEL[k],
        }))}
      />
      <ChoiceGroup
        name="risk"
        legend="Nível de risco do que descreve"
        value={d.risk}
        onChange={(v) => set("risk", v)}
        options={(Object.keys(RISK_LABEL) as RiskLevel[]).map((k) => ({
          id: k,
          label: RISK_LABEL[k],
        }))}
      />
    </div>
  );
}

function StepClaim({ d, set }: { d: Draft; set: SetFn }) {
  const promises = findPromises(`${d.claim} ${d.mechanism}`);
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Afirmação principal"
        count={`${d.claim.length}/240`}
        hint="Uma frase verificável, com métrica e prazo. Ex.: «A margem fica acima de 18% em 2027 se…»"
        error={d.claim.length > 240 ? "Reduza para 240 caracteres." : undefined}
      >
        {({ id, describedBy }) => (
          <textarea
            id={id}
            aria-describedby={describedBy}
            rows={3}
            value={d.claim}
            onChange={(e) => set("claim", e.target.value)}
            className={inputCls}
          />
        )}
      </Field>
      <Field
        label="Mecanismo"
        count={`${d.mechanism.trim().length}/80 mín.`}
        hint="Se X, então Y, porque Z."
      >
        {({ id, describedBy }) => (
          <textarea
            id={id}
            aria-describedby={describedBy}
            rows={4}
            value={d.mechanism}
            onChange={(e) => set("mechanism", e.target.value)}
            className={inputCls}
          />
        )}
      </Field>
      {promises.length ? (
        <p
          className="flex items-start gap-1.5 rounded-[12px] px-3 py-2 text-[12px] text-[#fca5a5]"
          style={{ background: "rgba(248,113,113,0.1)" }}
          role="alert"
        >
          <ShieldAlert size={13} aria-hidden className="mt-0.5 shrink-0" />
          Linguagem proibida detetada: {promises.join(", ")}. Não é possível publicar com esta
          frase.
        </p>
      ) : null}
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  min,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  min: number;
  placeholder: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[12px] font-semibold text-white/85">
        {label} <span className="font-normal text-white/45">(mín. {min})</span>
      </legend>
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor={`${label}-${i}`}>{`${label} ${i + 1}`}</label>
          <input
            id={`${label}-${i}`}
            value={v}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            className={inputCls}
          />
          <button
            type="button"
            aria-label={`Remover ${label.toLowerCase()} ${i + 1}`}
            disabled={items.length <= 1}
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-white/60 hover:text-white disabled:opacity-30"
          >
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      ))}
      <div>
        <GhostButton icon={Plus} onClick={() => onChange([...items, ""])}>
          Adicionar
        </GhostButton>
      </div>
    </fieldset>
  );
}

function StepPremises({ d, set }: { d: Draft; set: SetFn }) {
  return (
    <div className="flex flex-col gap-5">
      <ListEditor
        label="Premissas"
        items={d.assumptions}
        onChange={(v) => set("assumptions", v)}
        min={2}
        placeholder="O que tem de ser verdade, de preferência com um limiar"
      />
      <ListEditor
        label="Riscos"
        items={d.risks}
        onChange={(v) => set("risks", v)}
        min={2}
        placeholder="O que pode correr mal"
      />
      <Field
        label="A melhor razão para eu estar errado"
        count={`${d.counterHypothesis.trim().length}/30 mín.`}
      >
        {({ id }) => (
          <textarea
            id={id}
            rows={3}
            value={d.counterHypothesis}
            onChange={(e) => set("counterHypothesis", e.target.value)}
            className={inputCls}
          />
        )}
      </Field>
    </div>
  );
}

function StepSources({ d, set, today }: { d: Draft; set: SetFn; today: string }) {
  const [f, setF] = useState({
    title: "",
    publisher: "",
    url: "",
    date: "",
    kind: "primaria" as SourceKind,
  });
  const [err, setErr] = useState("");
  const add = () => {
    if (!f.title.trim() || !f.publisher.trim()) return setErr("Indique o título e quem publicou.");
    const u = checkUrl(f.url);
    if (!u.ok) return setErr(u.reason ?? "Link inválido.");
    if (!f.date) return setErr("A data da fonte é obrigatória.");
    if (f.date > today) return setErr("A data não pode estar no futuro.");
    setErr("");
    set("sources", [
      ...d.sources,
      {
        ...f,
        id: `s${Date.now().toString(36)}`,
        title: f.title.trim(),
        publisher: f.publisher.trim(),
        url: f.url.trim(),
      },
    ]);
    setF({ title: "", publisher: "", url: "", date: "", kind: "primaria" });
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título da fonte">
          {({ id }) => (
            <input
              id={id}
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              className={inputCls}
            />
          )}
        </Field>
        <Field label="Quem publicou">
          {({ id }) => (
            <input
              id={id}
              value={f.publisher}
              onChange={(e) => setF({ ...f, publisher: e.target.value })}
              className={inputCls}
            />
          )}
        </Field>
        <Field
          label="Link (https://)"
          hint="Verificamos links encurtados, IP e domínios disfarçados."
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              type="url"
              inputMode="url"
              value={f.url}
              onChange={(e) => setF({ ...f, url: e.target.value })}
              className={inputCls}
            />
          )}
        </Field>
        <Field label="Data de publicação">
          {({ id }) => (
            <input
              id={id}
              type="date"
              max={today}
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
              className={inputCls}
            />
          )}
        </Field>
      </div>
      <ChoiceGroup
        name="source-kind"
        legend="Tipo de fonte"
        value={f.kind}
        onChange={(v) => setF({ ...f, kind: v })}
        options={[
          { id: "primaria", label: "Primária" },
          { id: "oficial", label: "Oficial" },
          { id: "secundaria", label: "Secundária" },
        ]}
      />
      {err ? (
        <p role="alert" className="text-[12px] text-[#fca5a5]">
          {err}
        </p>
      ) : null}
      <div>
        <GhostButton icon={Plus} onClick={add}>
          Adicionar fonte
        </GhostButton>
      </div>
      <ul className="flex flex-col gap-1.5" aria-label="Fontes adicionadas">
        {d.sources.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-[12px]"
            style={{
              background: "var(--aurora-surface-1)",
              border: "1px solid var(--aurora-hairline)",
            }}
          >
            <Tag tone={s.kind === "secundaria" ? "mute" : "ok"}>{s.kind}</Tag>
            <span className="min-w-0 flex-1 truncate text-white/85">
              {s.title} · {s.publisher}
            </span>
            <span className="tabular-nums text-white/45">{s.date}</span>
            <button
              type="button"
              aria-label={`Remover fonte ${s.title}`}
              onClick={() =>
                set(
                  "sources",
                  d.sources.filter((x) => x.id !== s.id),
                )
              }
              className="text-white/50 hover:text-white"
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </li>
        ))}
        {!d.sources.length ? (
          <li className="text-[12px] text-white/45">Ainda sem fontes.</li>
        ) : null}
      </ul>
    </div>
  );
}

function StepScenarios({ d, set }: { d: Draft; set: SetFn }) {
  const sum = d.scenarios.reduce((s, x) => s + (Number(x.probability) || 0), 0);
  const label = {
    base: "Cenário base",
    positivo: "Cenário positivo",
    adverso: "Cenário adverso (obrigatório)",
  } as const;
  return (
    <div className="flex flex-col gap-4">
      {d.scenarios.map((s, i) => (
        <div key={s.kind} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
          <Field label={`${label[s.kind]} · %`}>
            {({ id }) => (
              <input
                id={id}
                type="number"
                min={0}
                max={100}
                value={s.probability}
                onChange={(e) =>
                  set(
                    "scenarios",
                    d.scenarios.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            probability: Math.max(
                              0,
                              Math.min(100, Math.round(Number(e.target.value) || 0)),
                            ),
                          }
                        : x,
                    ),
                  )
                }
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Resultado">
            {({ id }) => (
              <input
                id={id}
                value={s.outcome}
                onChange={(e) =>
                  set(
                    "scenarios",
                    d.scenarios.map((x, j) => (j === i ? { ...x, outcome: e.target.value } : x)),
                  )
                }
                className={inputCls}
              />
            )}
          </Field>
        </div>
      ))}
      <p
        aria-live="polite"
        className={
          "text-[12px] font-semibold tabular-nums " +
          (sum === 100 ? "text-[#86efac]" : "text-[#fca5a5]")
        }
      >
        Soma das probabilidades: {sum}%{sum === 100 ? "" : " (tem de ser 100%)"}
      </p>
      <Field
        label="Esta tese é falsa se…"
        hint="Use um indicador e uma data. Ex.: a margem do 2.º semestre de 2027 ficar abaixo de 15%."
        count={`${d.invalidation.trim().length}/30 mín.`}
      >
        {({ id, describedBy }) => (
          <textarea
            id={id}
            aria-describedby={describedBy}
            rows={3}
            value={d.invalidation}
            onChange={(e) => set("invalidation", e.target.value)}
            className={inputCls}
          />
        )}
      </Field>
    </div>
  );
}

function StepConflicts({ d, set }: { d: Draft; set: SetFn }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-white/60">
        A declaração aparece em todos os cartões e partilhas. "Nenhum" também é uma declaração e
        fica registada.
      </p>
      <ChoiceGroup
        name="position"
        legend="Tem posição financeira nesta entidade?"
        value={d.position}
        onChange={(v) => set("position", v)}
        options={[
          { id: "nenhuma", label: "Não" },
          { id: "longa", label: "Sim, ganho se subir" },
          { id: "curta", label: "Sim, ganho se descer" },
        ]}
      />
      <ChoiceGroup
        name="paid"
        legend="É remunerado por esta publicação?"
        value={d.remunerated}
        onChange={(v) => set("remunerated", v)}
        options={[
          { id: "nao", label: "Não" },
          { id: "sim", label: "Sim" },
        ]}
      />
      <Field label="Patrocinador (se houver)" hint="Se preencher, o cartão mostra «Patrocinado».">
        {({ id, describedBy }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            value={d.sponsor}
            onChange={(e) => set("sponsor", e.target.value)}
            className={inputCls}
          />
        )}
      </Field>
      <Field label="Relação com a entidade (emprego, cliente, família…)">
        {({ id }) => (
          <input
            id={id}
            value={d.relation}
            onChange={(e) => set("relation", e.target.value)}
            className={inputCls}
          />
        )}
      </Field>
      <label className="flex items-start gap-2 text-[12px] text-white/80">
        <input
          type="checkbox"
          checked={d.conflictConfirmed}
          onChange={(e) => set("conflictConfirmed", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#4a9eff]"
        />
        Confirmo que esta declaração é completa e verdadeira.
      </label>
    </div>
  );
}

function StepVerify({
  d,
  set,
  blocks,
  warnings,
  reviewDue,
  today,
  go,
  confirming,
  onCancel,
  onConfirm,
  publishing,
  entityLabel,
}: {
  d: Draft;
  set: SetFn;
  blocks: { id: string; message: string; step: StepId }[];
  warnings: { id: string; message: string; step: StepId }[];
  reviewDue: string;
  today: string;
  go: (s: StepId) => void;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  publishing: boolean;
  entityLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" className="flex flex-col gap-2">
        {blocks.length ? (
          <section
            className="flex flex-col gap-1.5 rounded-[12px] p-3"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.3)",
            }}
          >
            <h4 className="text-[12px] font-semibold text-[#fca5a5]">
              {blocks.length} bloqueio{blocks.length > 1 ? "s" : ""}: corrija antes de publicar
            </h4>
            <ul className="flex flex-col gap-1">
              {blocks.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-white/80"
                >
                  <span>{b.message}</span>
                  <button
                    type="button"
                    onClick={() => go(b.step)}
                    className="shrink-0 font-semibold text-[var(--aurora-accent)] hover:underline"
                  >
                    Corrigir
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#86efac]">
            <CheckCircle2 size={14} aria-hidden /> Sem bloqueios.
          </p>
        )}
        {warnings.length ? (
          <section
            className="flex flex-col gap-1.5 rounded-[12px] p-3"
            style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            <h4 className="text-[12px] font-semibold text-[#fcd34d]">
              Avisos: corrija ou aceite publicar com eles visíveis ao leitor
            </h4>
            {warnings.map((w) => (
              <label key={w.id} className="flex items-start gap-2 text-[12px] text-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#fbbf24]"
                  checked={d.accepted.includes(w.id)}
                  onChange={(e) =>
                    set(
                      "accepted",
                      e.target.checked
                        ? [...d.accepted, w.id]
                        : d.accepted.filter((x) => x !== w.id),
                    )
                  }
                />
                <span>{w.message}</span>
              </label>
            ))}
          </section>
        ) : null}
      </div>
      <Field
        label="Data de revisão"
        hint="Proposta a partir do horizonte. Recebe lembretes 7 e 1 dia antes."
      >
        {({ id, describedBy }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            type="date"
            min={iso(Date.now() + DAY)}
            value={reviewDue}
            onChange={(e) => set("reviewDue", e.target.value)}
            className={inputCls}
          />
        )}
      </Field>
      {reviewDue && daysBetween(today, reviewDue) < 1 ? (
        <p className="text-[12px] text-[#fca5a5]">A revisão tem de ser pelo menos amanhã.</p>
      ) : null}
      <label className="flex items-start gap-2 text-[12px] text-white/80">
        <input
          type="checkbox"
          checked={d.counterOpen}
          onChange={(e) => set("counterOpen", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#4a9eff]"
        />
        Permitir contra-teses. Se desligar, o cartão mostra "Contraditório fechado".
      </label>
      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="pm-confirm-title"
          className="flex flex-col gap-3 rounded-[14px] p-4"
          style={{ background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.4)" }}
        >
          <h4 id="pm-confirm-title" className="text-[13px] font-semibold text-white">
            Publicar a versão 1.0 sobre {entityLabel}
          </h4>
          <p className="text-[12px] text-white/75">
            Não é possível apagar uma tese publicada. Pode corrigir, arquivar ou publicar uma nova
            versão, e cada alteração fica registada.
          </p>
          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={onCancel}>Cancelar</GhostButton>
            <PrimaryButton onClick={onConfirm} disabled={publishing}>
              {publishing ? "A publicar…" : "Confirmar publicação"}
            </PrimaryButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
