import { BROKER_BY_ID } from "@/data/brokers";
import { cn } from "@/lib/utils";

/** Monogram tile standing in for a broker logo (no third-party marks shipped). */
export function BrokerMark({
  brokerId,
  size = 32,
  className,
}: {
  brokerId: string;
  size?: number;
  className?: string;
}) {
  const b = BROKER_BY_ID[brokerId];
  const color = b?.color ?? "#64748b";
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-[10px] font-bold tracking-tight text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * (b && b.mark.length > 2 ? 0.3 : 0.36)),
        background: `linear-gradient(140deg, ${color} 0%, color-mix(in oklab, ${color} 55%, #0a0e16) 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 14px color-mix(in oklab, ${color} 35%, transparent)`,
      }}
    >
      {b?.mark ?? "?"}
    </span>
  );
}
