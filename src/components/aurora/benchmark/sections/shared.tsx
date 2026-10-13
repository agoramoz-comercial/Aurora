import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { AlertLevel } from "@/lib/finance/iipaEngine";
import { CHART } from "../../chartTheme";
import { cn } from "@/lib/utils";
import { riseItem } from "../motionKit";

export const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
/** Rounds first so a tiny negative never prints as "-0.00". */
const signed = (x: number, d: number) => {
  const v = Number((x * 100).toFixed(d));
  return `${v > 0 ? "+" : ""}${(v === 0 ? 0 : v).toFixed(d)}`;
};
export const signedPct = (x: number, d = 1) => `${signed(x, d)}%`;
export const pp = (x: number, d = 1) => `${signed(x, d)} pp`;

/** $174.7M / $1.2B — compact money for results. */
export function money(n: number, d?: number) {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(d ?? 2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(d ?? 1)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(d ?? 0)}K`;
  return `${s}$${a.toFixed(0)}`;
}

export const LEVEL_META: Record<
  AlertLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  green: {
    label: "Dentro da tolerância",
    color: CHART.positive,
    bg: "rgba(74,222,128,0.12)",
    border: "rgba(74,222,128,0.35)",
  },
  amber: {
    label: "Perto do limite",
    color: CHART.warn,
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.4)",
  },
  red: {
    label: "Limite ultrapassado",
    color: CHART.negative,
    bg: "rgba(248,113,113,0.14)",
    border: "rgba(248,113,113,0.45)",
  },
  black: {
    label: "Risco crítico",
    color: "#f5f5f5",
    bg: "rgba(0,0,0,0.65)",
    border: "rgba(248,113,113,0.7)",
  },
};

export function LevelChip({ level, compact = false }: { level: AlertLevel; compact?: boolean }) {
  const m = LEVEL_META[level];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {level === "red" || level === "black" ? (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
            style={{ background: level === "black" ? CHART.negative : m.color }}
          />
        ) : null}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: level === "black" ? CHART.negative : m.color }}
        />
      </span>
      {compact ? null : m.label}
    </span>
  );
}

/** A compact metric row: label left, value right, optional hint. */
export function MetricRow({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="min-w-0 truncate text-[11px] text-white/55">{label}</span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: tone ?? "#fff" }}>
          {value}
        </span>
        {hint ? <span className="text-[10px] text-white/40">{hint}</span> : null}
      </span>
    </div>
  );
}

/** Motion wrapper for a staggered item inside a `staggerContainer`. */
export function Rise({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={riseItem} className={cn("min-w-0", className)}>
      {children}
    </motion.div>
  );
}

export const panelTone = (level: AlertLevel) =>
  level === "green"
    ? undefined
    : {
        boxShadow: `inset 0 0 0 1px ${LEVEL_META[level].border}, 0 0 24px ${LEVEL_META[level].bg}`,
      };
