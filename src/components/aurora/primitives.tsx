import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Pill({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "active" | "mute";
}) {
  return (
    <span
      className={cn(
        "glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium leading-none whitespace-nowrap text-white/90 tabular-nums",
        tone === "active" && "bg-white/30 text-white",
        tone === "mute" && "text-white/60",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white/90"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.1))",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      {initials}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: "rgba(255,255,255,0.18)" }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped}%`,
          background:
            "linear-gradient(90deg, var(--aurora-accent), color-mix(in oklab, var(--aurora-accent) 60%, white))",
          boxShadow: "0 0 12px var(--aurora-accent-glow)",
        }}
      />
    </div>
  );
}
