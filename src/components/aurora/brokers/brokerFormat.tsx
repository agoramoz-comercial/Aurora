import { Loader2 } from "lucide-react";
import type { ConnectionStatus } from "@/data/brokerStore";

/** Unit price with precision that suits the instrument (FX needs 4dp, BTC none). */
export function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n < 10) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function fmtPct(n: number, digits = 1): string {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;
}

export function fmtQty(n: number): string {
  return Number.isInteger(n)
    ? n.toLocaleString("en-US")
    : n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  return status === "syncing" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(74,158,255,0.15)] px-2 py-0.5 text-[10px] font-semibold text-[var(--aurora-accent)]">
      <Loader2 size={10} className="animate-spin motion-reduce:animate-none" />A sincronizar
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Ligada
    </span>
  );
}
