/**
 * ProofMarket atoms built on the Ollympius language (glass pills, accent blue,
 * tabular numerals). State is always spelled out in text, never colour alone.
 */
import { useId, useState, type ReactNode } from "react";
import { AlertTriangle, BadgeCheck, ChevronDown, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Author,
  Horizon,
  ReactionId,
  RiskLevel,
  Stance,
  ThesisKind,
  ThesisStatus,
} from "@/data/proofmarket/types";
import { formatDate, STATUS_LABEL, type Banner } from "@/lib/proofmarket/rules";

export const HORIZON_LABEL: Record<Horizon, string> = {
  lt3m: "< 3 meses",
  "3-12m": "3–12 meses",
  "1-3a": "1–3 anos",
  gt3a: "> 3 anos",
};
export const KIND_LABEL: Record<ThesisKind, string> = {
  valuation: "Valuation",
  resultados: "Resultados",
  macro: "Macro",
  regulacao: "Regulação",
  risco: "Risco",
  governacao: "Governação",
};
export const STANCE_LABEL: Record<Stance, string> = {
  positiva: "Positiva",
  negativa: "Negativa",
  neutra: "Neutra",
  condicional: "Condicional",
};
export const RISK_LABEL: Record<RiskLevel, string> = {
  baixo: "Risco baixo",
  moderado: "Risco moderado",
  elevado: "Risco elevado",
  especulativo: "Especulativo",
};
export const REACTIONS: { id: ReactionId; label: string }[] = [
  { id: "evidencia_util", label: "Evidência útil" },
  { id: "premissa_questionavel", label: "Premissa questionável" },
  { id: "quero_fonte", label: "Quero fonte" },
  { id: "risco_subestimado", label: "Risco subestimado" },
  { id: "explicacao_clara", label: "Explicação clara" },
  { id: "necessita_atualizacao", label: "Necessita atualização" },
];
export const LEVEL_LABEL: Record<Author["level"], string> = {
  N1: "Canal confirmado",
  N2: "Identidade verificada",
  N3: "Profissional verificado",
  N4: "Credencial verificada",
  N5: "Organização verificada",
  N6: "Entidade regulada",
};

const TONE = {
  accent: { bg: "rgba(74,158,255,0.14)", border: "rgba(74,158,255,0.34)", color: "#93c5fd" },
  ok: { bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)", color: "#86efac" },
  warn: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.32)", color: "#fcd34d" },
  crit: { bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.36)", color: "#fca5a5" },
  violet: { bg: "rgba(192,132,252,0.13)", border: "rgba(192,132,252,0.32)", color: "#d8b4fe" },
  mute: {
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.68)",
  },
} as const;
export type Tone = keyof typeof TONE;

export function Tag({
  tone = "mute",
  children,
  icon: Icon,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: React.ElementType;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        className,
      )}
      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}
    >
      {Icon ? <Icon size={11} aria-hidden /> : null}
      {children}
    </span>
  );
}

export const riskTone = (r: RiskLevel): Tone =>
  r === "especulativo" ? "crit" : r === "elevado" ? "warn" : r === "moderado" ? "accent" : "ok";
export const statusTone = (s: ThesisStatus): Tone =>
  s === "ativa"
    ? "ok"
    : s === "invalidada"
      ? "crit"
      : s === "concluida"
        ? "accent"
        : s === "arquivada"
          ? "mute"
          : "warn";

export function StatusTag({ status }: { status: ThesisStatus }) {
  return <Tag tone={statusTone(status)}>{STATUS_LABEL[status]}</Tag>;
}

export function LevelTag({ author }: { author: Author }) {
  return (
    <Tag tone={author.level === "N1" ? "mute" : "accent"} icon={BadgeCheck}>
      {LEVEL_LABEL[author.level]}
    </Tag>
  );
}

/** Explains exactly what a badge proves (spec §6). Disclosure, not a tooltip. */
export function BadgeExplainer({ author }: { author: Author }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 self-start rounded-full text-[11px] font-semibold text-[var(--aurora-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <Info size={12} aria-hidden /> O que foi verificado
        <ChevronDown
          size={12}
          aria-hidden
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <dl
          id={id}
          className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-[12px] p-3 text-[11.5px]"
          style={{ background: "var(--aurora-surface-2)" }}
        >
          <dt className="text-white/45">Verificado</dt>
          <dd className="text-white/85">{author.verifiedWhat}</dd>
          <dt className="text-white/45">Por</dt>
          <dd className="text-white/85">{author.verifiedBy}</dd>
          <dt className="text-white/45">Data</dt>
          <dd className="text-white/85 tabular-nums">{formatDate(author.verifiedAt)}</dd>
          <dt className="text-white/45">Validade</dt>
          <dd className="text-white/85 tabular-nums">
            {author.validUntil ? `até ${formatDate(author.validUntil)}` : "Sem data de expiração"}
          </dd>
          <dt className="text-white/45">Limites</dt>
          <dd className="text-white/85">{author.limits}</dd>
          <dt className="text-white/45">Contestar</dt>
          <dd className="text-white/85">
            Use Reportar › Identidade falsa. A decisão pode ser revogada.
          </dd>
          {author.declared ? (
            <>
              <dt className="text-white/45">Declarado</dt>
              <dd className="text-white/60">{author.declared} (não verificado)</dd>
            </>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

export function Banners({ items }: { items: Banner[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1.5" role="status">
      {items.map((b) => {
        const t = TONE[b.tone === "crit" ? "crit" : b.tone === "warn" ? "warn" : "accent"];
        const Icon = b.tone === "info" ? Info : b.tone === "warn" ? AlertTriangle : ShieldAlert;
        return (
          <p
            key={b.text}
            className="flex items-start gap-2 rounded-[12px] px-3 py-2 text-[12px] leading-snug"
            style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}
          >
            <Icon size={13} aria-hidden className="mt-0.5 shrink-0" />
            <span>{b.text}</span>
          </p>
        );
      })}
    </div>
  );
}

/* ── Form atoms with programmatic labels and errors (ACC-001/002) ───── */

export function Field({
  label,
  hint,
  error,
  children,
  id,
  count,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
  id?: string;
  count?: string;
}) {
  const auto = useId();
  const fid = id ?? auto;
  const hintId = hint ? `${fid}-hint` : undefined;
  const errId = error ? `${fid}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={fid} className="text-[12px] font-semibold text-white/85">
          {label}
        </label>
        {count ? <span className="text-[10.5px] tabular-nums text-white/40">{count}</span> : null}
      </div>
      {children({ id: fid, describedBy })}
      {hint ? (
        <p id={hintId} className="text-[11px] leading-snug text-white/45">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="text-[11px] font-medium text-[#fca5a5]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputCls =
  "w-full min-w-0 rounded-[12px] border border-white/12 bg-black/25 px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition-[border-color,box-shadow] focus:border-[rgba(74,158,255,0.6)] focus:shadow-[0_0_0_3px_rgba(74,158,255,0.18)]";

export function ChoiceGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  name,
}: {
  legend: string;
  options: { id: T; label: string; hint?: string }[];
  value: T | "";
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-[12px] font-semibold text-white/85">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const checked = value === o.id;
          return (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors focus-within:ring-2 focus-within:ring-white/50",
                checked
                  ? "border-[rgba(74,158,255,0.6)] bg-[rgba(74,158,255,0.22)] text-white"
                  : "border-white/12 bg-white/6 text-white/65 hover:text-white",
              )}
              title={o.hint}
            >
              <input
                type="radio"
                name={name}
                value={o.id}
                checked={checked}
                onChange={() => onChange(o.id)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: React.ElementType;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[12px] font-bold text-white transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        background: "var(--aurora-accent-strong)",
        boxShadow: "0 0 18px rgba(74,158,255,0.4)",
      }}
    >
      {Icon ? <Icon size={13} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  icon: Icon,
  pressed,
  label,
  className,
}: {
  children?: ReactNode;
  onClick?: () => void;
  icon?: React.ElementType;
  pressed?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        pressed
          ? "bg-[rgba(74,158,255,0.22)] text-white shadow-[inset_0_0_0_1px_rgba(74,158,255,0.45)]"
          : "bg-white/8 text-white/70 hover:bg-white/14 hover:text-white",
        className,
      )}
    >
      {Icon ? <Icon size={13} aria-hidden /> : null}
      {children}
    </button>
  );
}
