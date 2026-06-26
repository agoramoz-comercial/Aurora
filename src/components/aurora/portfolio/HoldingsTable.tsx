import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNum, formatPct } from "@/lib/finance/calculations";
import { TickerCell } from "../analytics/TickerCell";
import { holdingsData, Holding } from "@/data/portfolio";

export interface HoldingsTableProps {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
}

export function HoldingsTable({ activeSymbol, onSelect }: HoldingsTableProps) {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>("AAPL");

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Desktop view: Standard responsive Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <table className="w-full text-left border-collapse text-[11px] sm:text-[12px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
              <th className="px-3 py-2">Asset</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Change</th>
              <th className="px-3 py-2 text-right">Shares</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2 text-right">Exposure</th>
              <th className="px-3 py-2 text-right">Return Since Inception</th>
              <th className="px-3 py-2 text-right">Beta</th>
              <th className="px-3 py-2 text-right">Stop Loss</th>
              <th className="px-3 py-2 hidden lg:table-cell">Sector</th>
              <th className="px-3 py-2 text-center">Cross</th>
            </tr>
          </thead>
          <tbody>
            {holdingsData.map((h: Holding) => {
              const isSelected = h.symbol === activeSymbol;
              const up = h.dailyChangePct >= 0;
              const returnUp = h.profitSinceInception >= 0;
              const returnPct = h.profitSinceInception / (h.purchasePrice * h.shares);

              return (
                <tr
                  key={h.symbol}
                  onClick={() => onSelect(h.symbol)}
                  className={cn(
                    "cursor-pointer border-b border-white/5 transition hover:bg-white/10",
                    isSelected ? "bg-white/15" : "",
                  )}
                  style={
                    isSelected
                      ? {
                          boxShadow:
                            "inset 0 0 0 1px rgba(74,158,255,0.45), 0 0 12px rgba(74,158,255,0.12)",
                        }
                      : undefined
                  }
                >
                  {/* Symbol & Name */}
                  <td className="px-3 py-2.5 font-semibold">
                    <TickerCell symbol={h.symbol} assetClass="equity" />
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-white/90">
                    ${formatNum(h.price)}
                  </td>

                  {/* Daily Change */}
                  <td
                    className="px-3 py-2.5 text-right font-semibold tabular-nums"
                    style={{ color: up ? "#00D17A" : "#FF4D4F" }}
                  >
                    {up ? "+" : ""}
                    {formatPct(h.dailyChangePct)}
                  </td>

                  {/* Shares */}
                  <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{h.shares}</td>

                  {/* Position Value */}
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-white">
                    ${h.positionSize.toLocaleString()}
                  </td>

                  {/* % Exposure */}
                  <td className="px-3 py-2.5 text-right tabular-nums text-white/80">
                    {formatPct(h.exposurePct)}
                  </td>

                  {/* Return Since Inception */}
                  <td
                    className="px-3 py-2.5 text-right font-semibold tabular-nums"
                    style={{ color: returnUp ? "#00D17A" : "#FF4D4F" }}
                  >
                    {returnUp ? "+" : ""}
                    {formatPct(returnPct)}
                    <span className="block text-[9px] font-normal text-white/45">
                      {returnUp ? "+" : ""}${h.profitSinceInception.toLocaleString()}
                    </span>
                  </td>

                  {/* Beta */}
                  <td className="px-3 py-2.5 text-right tabular-nums text-white/75">
                    {formatNum(h.beta)}
                  </td>

                  {/* Stop Loss */}
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-white/75">
                    ${formatNum(h.stopLossPrice)}
                    <span
                      className="block text-[9px] font-semibold"
                      style={{ color: h.pctFromStopLoss >= 0 ? "#00D17A" : "#FFB020" }}
                    >
                      {h.pctFromStopLoss >= 0 ? "+" : ""}
                      {formatPct(h.pctFromStopLoss)}
                    </span>
                  </td>

                  {/* Sector */}
                  <td className="px-3 py-2.5 hidden lg:table-cell text-white/60 max-w-[120px] truncate">
                    {h.sector}
                  </td>

                  {/* Potential Negative Golden Cross */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        h.potNegativeCross
                          ? "bg-red-500/20 text-[#FF4D4F] border border-red-500/35"
                          : "bg-green-500/10 text-[#00D17A] border border-green-500/20",
                      )}
                    >
                      {h.potNegativeCross ? "Cross" : "OK"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view: List of premium glassmorphic cards */}
      <div className="md:hidden space-y-2">
        {holdingsData.map((h: Holding) => {
          const isSelected = h.symbol === activeSymbol;
          const isExpanded = expandedSymbol === h.symbol;
          const up = h.dailyChangePct >= 0;
          const returnUp = h.profitSinceInception >= 0;
          const returnPct = h.profitSinceInception / (h.purchasePrice * h.shares);

          return (
            <div
              key={h.symbol}
              onClick={() => {
                onSelect(h.symbol);
                if (isSelected) {
                  setExpandedSymbol(isExpanded ? null : h.symbol);
                } else {
                  setExpandedSymbol(h.symbol);
                }
              }}
              className={cn(
                "glass-soft flex flex-col p-3 transition-all duration-300 cursor-pointer border text-left",
                isSelected
                  ? "bg-white/15 border-[#4a9eff]/40 shadow-[0_0_10px_rgba(74,158,255,0.1)]"
                  : "border-white/10 hover:bg-white/10",
              )}
            >
              {/* Card Header (Visible summary stats) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <TickerCell symbol={h.symbol} assetClass="equity" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/50 truncate max-w-[80px] xs:max-w-[120px]">
                      {h.sector}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[12px] font-bold tabular-nums text-white">
                      ${formatNum(h.price)}
                    </span>
                    <span
                      className="block text-[9.5px] font-semibold tabular-nums text-right"
                      style={{ color: up ? "#00D17A" : "#FF4D4F" }}
                    >
                      {up ? "+" : ""}
                      {formatPct(h.dailyChangePct)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[12px] font-bold tabular-nums text-white/90">
                      ${h.positionSize.toLocaleString()}
                    </span>
                    <span className="block text-[9.5px] text-white/50 text-right tabular-nums">
                      {formatPct(h.exposurePct)} exp
                    </span>
                  </div>

                  {/* Expand Chevron */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-white/60 pl-1"
                  >
                    <ChevronDown size={14} />
                  </motion.div>
                </div>
              </div>

              {/* Accordion Detail Area */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-white/80">
                      {/* Left Column details */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-white/50">Shares Held:</span>
                          <span className="font-semibold tabular-nums text-white">{h.shares}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Purchase Price:</span>
                          <span className="font-semibold tabular-nums text-white">
                            ${formatNum(h.purchasePrice)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/50">Beta (Risk):</span>
                          <span className="font-semibold tabular-nums text-white">
                            {formatNum(h.beta)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/50">Technical Cross:</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              h.potNegativeCross
                                ? "bg-red-500/20 text-[#FF4D4F] border border-red-500/35"
                                : "bg-green-500/10 text-[#00D17A] border border-green-500/20",
                            )}
                          >
                            {h.potNegativeCross ? "Negative" : "Healthy"}
                          </span>
                        </div>
                      </div>

                      {/* Right Column details */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-white/50">Return since inc:</span>
                          <div className="text-right">
                            <span
                              className="font-bold tabular-nums"
                              style={{ color: returnUp ? "#00D17A" : "#FF4D4F" }}
                            >
                              {returnUp ? "+" : ""}
                              {formatPct(returnPct)}
                            </span>
                            <span className="block text-[9px] text-white/40 font-normal">
                              {returnUp ? "+" : ""}${h.profitSinceInception.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-white/50">Stop Loss Price:</span>
                          <div className="text-right">
                            <span className="font-semibold tabular-nums text-white">
                              ${formatNum(h.stopLossPrice)}
                            </span>
                            <span
                              className="block text-[9px] font-bold"
                              style={{ color: h.pctFromStopLoss >= 0 ? "#00D17A" : "#FFB020" }}
                            >
                              {h.pctFromStopLoss >= 0 ? "+" : ""}
                              {formatPct(h.pctFromStopLoss)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
