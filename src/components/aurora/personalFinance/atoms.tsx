/** Shared atoms for Finanças Pessoais — built on the Aurora primitives and type scale. */
import { useEffect, useId, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { mzn } from "@/lib/finance/personal";

export const fieldCls =
  "h-10 w-full rounded-[12px] border border-white/14 bg-black/30 px-3 text-body text-white placeholder:text-white/45 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/25";

export function Field({
  label,
  hint,
  children,
  error,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}) {
  const id = useId();
  const d = hint || error ? `${id}-d` : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-caption font-semibold text-white/80">
        {label}
      </label>
      {children(id, d)}
      {error ? (
        <p id={d} role="alert" className="text-micro text-[#fca5a5]">
          {error}
        </p>
      ) : hint ? (
        <p id={d} className="text-micro text-white/55">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Money with sign color. */
export function Money({
  value,
  sign,
  tone,
  className,
  compact,
}: {
  value: number;
  sign?: boolean;
  tone?: "auto" | "none";
  className?: string;
  compact?: boolean;
}) {
  const color =
    tone === "none" ? undefined : value < 0 ? "#fca5a5" : sign && value > 0 ? "#86efac" : undefined;
  return (
    <span className={cn("tabular-nums", className)} style={{ color }}>
      {mzn(value, { sign, compact })}
    </span>
  );
}

/** Thin progress meter with role=meter semantics. */
export function Meter({
  value,
  label,
  tone = "accent",
}: {
  value: number;
  label: string;
  tone?: "accent" | "warn" | "bad" | "good";
}) {
  const v = Math.max(0, Math.min(1, value));
  const color =
    tone === "bad"
      ? "#f87171"
      : tone === "warn"
        ? "#fbbf24"
        : tone === "good"
          ? "#4ade80"
          : "var(--aurora-accent)";
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${v * 100}%`, background: color }}
      />
    </div>
  );
}

/** Explains a metric: label + value + "how is this calculated" disclosure. */
export function Metric({
  label,
  value,
  hint,
  how,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  how: string;
  tone?: "accent" | "good" | "warn" | "bad";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const color =
    tone === "good"
      ? "#86efac"
      : tone === "warn"
        ? "#fcd34d"
        : tone === "bad"
          ? "#fca5a5"
          : tone === "accent"
            ? "var(--aurora-accent)"
            : "#fff";
  return (
    <div className="glass flex min-w-0 flex-col gap-1 p-4">
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-micro font-semibold uppercase leading-tight tracking-[0.1em] text-white/65">
          {label}
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          aria-label={`Como se calcula: ${label}`}
          title="Como se calcula"
          className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Info size={14} aria-hidden />
        </button>
      </div>
      <span className="truncate text-metric font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
      {hint ? <span className="text-micro leading-snug text-white/65">{hint}</span> : null}
      {open ? (
        <p
          id={id}
          className="mt-1 border-t border-white/10 pt-2 text-caption leading-relaxed text-white/80"
        >
          {how}
        </p>
      ) : null}
    </div>
  );
}

/** Inline money editor: shows value, becomes an input on click. */
export function MoneyInput({
  value,
  onCommit,
  label,
}: {
  value: number;
  onCommit: (n: number) => void;
  label: string;
}) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(String(value));
  useEffect(() => {
    if (!edit) setV(String(value));
  }, [value, edit]);
  if (!edit)
    return (
      <button
        type="button"
        onClick={() => setEdit(true)}
        aria-label={`${label}: ${mzn(value)}. Editar`}
        className="rounded-[10px] px-2 py-1 text-right text-body font-semibold tabular-nums text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {mzn(value)}
      </button>
    );
  const commit = () => {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) onCommit(n);
    setEdit(false);
  };
  return (
    <input
      autoFocus
      inputMode="numeric"
      aria-label={label}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEdit(false);
      }}
      className="h-8 w-28 rounded-[10px] border border-white/30 bg-black/40 px-2 text-right text-body tabular-nums text-white outline-none focus:ring-2 focus:ring-white/40"
    />
  );
}
