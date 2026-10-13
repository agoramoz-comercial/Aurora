import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import { formatNum, formatPct } from "@/lib/finance/calculations";
import { TickerCell } from "./TickerCell";
import type { AssetClass } from "@/lib/assets/types";
import { CHART } from "../chartTheme";

export interface WatchRow {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  sparkline: number[];
  assetClass?: AssetClass;
}

export function Watchlist({
  rows,
  active,
  onSelect,
}: {
  rows: WatchRow[];
  active: string;
  onSelect: (s: string) => void;
}) {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      {rows.map((r) => {
        const up = r.changePct >= 0;
        const selected = r.symbol === active;
        return (
          <li key={r.symbol}>
            <button
              onClick={() => onSelect(r.symbol)}
              className={cn(
                "group grid w-full grid-cols-[36px_minmax(0,1fr)_52px_44px] items-center gap-2 rounded-2xl px-1.5 py-1 text-left transition sm:grid-cols-[44px_minmax(0,1fr)_64px_56px]",
                selected ? "bg-white/15" : "hover:bg-white/8",
              )}
              style={
                selected
                  ? {
                      boxShadow:
                        "inset 0 0 0 1px rgba(74,158,255,0.45), 0 0 18px rgba(74,158,255,0.18)",
                    }
                  : undefined
              }
            >
              <TickerCell symbol={r.symbol} assetClass={r.assetClass} />

              <div className="min-w-0">
                <Sparkline values={r.sparkline} up={up} height={22} />
              </div>
              <span className="text-right text-[11px] font-semibold tabular-nums text-white/90">
                ${formatNum(r.price)}
              </span>
              <span
                className="text-right text-[11px] font-semibold tabular-nums"
                style={{ color: up ? CHART.positive : CHART.negative }}
              >
                {up ? "+" : ""}
                {formatPct(r.changePct)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
