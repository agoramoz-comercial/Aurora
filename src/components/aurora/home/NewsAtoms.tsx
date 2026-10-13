import { Bookmark } from "lucide-react";
import type { AttentionLevel } from "@/data/newsData";
import { cn } from "@/lib/utils";
import { ATTENTION_LABEL, attentionColor } from "./newsUtils";

export function EvidenceDots({ count, max = 6 }: { count: number; max?: number }) {
  return (
    <div
      className="flex items-center gap-[3px]"
      aria-label={`${count} de ${max} camadas de evidência`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: i < count ? "var(--aurora-accent)" : "rgba(255,255,255,0.15)",
            boxShadow: i < count ? "0 0 5px rgba(74,158,255,0.6)" : "none",
          }}
        />
      ))}
    </div>
  );
}

export function ImpactRing({
  score,
  level,
  size = 56,
}: {
  score: number;
  level: AttentionLevel;
  size?: number;
}) {
  const col = attentionColor(level);
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={3.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col.dot}
          strokeWidth={3.5}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${col.dot})` }}
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className="text-[13px] font-bold tabular-nums text-white">{score}</span>
        <span className="text-[8px] uppercase tracking-[0.1em] text-white/45">impacto</span>
      </div>
    </div>
  );
}

export function AttentionBadge({
  level,
  pulse = false,
}: {
  level: AttentionLevel;
  pulse?: boolean;
}) {
  const col = attentionColor(level);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{
        background: col.bg,
        border: `1px solid ${col.border}`,
        color: col.text,
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && level === "critical" ? (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:hidden"
            style={{ background: col.dot }}
          />
        ) : null}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: col.dot }}
        />
      </span>
      {ATTENTION_LABEL[level]}
    </span>
  );
}

/** Horizontal impact meter (0–100) tinted by attention level. */
export function ImpactMeter({ score, level }: { score: number; level: AttentionLevel }) {
  const col = attentionColor(level);
  return (
    <div className="flex items-center gap-2" title={`Impacto ${score}/100`}>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${col.dot}, var(--aurora-accent))`,
          }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-white/55">{score}</span>
    </div>
  );
}

export function SaveButton({
  saved,
  onToggle,
  className,
}: {
  saved: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remover dos guardados" : "Guardar notícia"}
      title={saved ? "Guardada" : "Guardar"}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        saved
          ? "bg-[rgba(74,158,255,0.2)] text-[var(--aurora-accent)]"
          : "text-white/40 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

/** Generated editorial art for stories without photography. */
export function StoryArt({ ticker, level }: { ticker: string; level: AttentionLevel }) {
  const col = attentionColor(level);
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 70% 80% at 85% 10%, ${col.bg}, transparent 65%), radial-gradient(ellipse 60% 60% at 10% 100%, rgba(74,158,255,0.18), transparent 70%), linear-gradient(135deg, #0b1020 0%, #111827 100%)`,
      }}
    >
      <span
        className="absolute -right-4 -top-6 select-none text-[120px] font-black leading-none tracking-tighter"
        style={{ color: "rgba(255,255,255,0.05)" }}
      >
        {ticker}
      </span>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
