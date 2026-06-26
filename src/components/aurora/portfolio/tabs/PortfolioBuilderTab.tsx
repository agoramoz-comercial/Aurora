import { useState } from "react";
import { GlassCard } from "../../GlassCard";
import { Pill } from "../../primitives";
import { usePortfolioStore, AVAILABLE_SYMBOLS, type CustomHolding } from "@/data/portfolioStore";
import { formatNum, formatPct } from "@/lib/finance/calculations";
import { cn } from "@/lib/utils";
import { Plus, Trash2, RotateCcw, Briefcase, PieChart } from "lucide-react";
import { Pie, PieChart as RechartsPie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const SECTOR_COLORS: Record<string, string> = {
  "Information Technology": "#00D17A",
  Industrials: "#3B82F6",
  Energy: "#FFB020",
  "Health Care": "#EC4899",
  "Consumer Staples": "#8B5CF6",
  "Consumer Discretionary": "#FF4D4F",
  Semiconductors: "#06B6D4",
  Automotive: "#F97316",
  "Consumer Cyclical": "#FBBF24",
  "Communication Services": "#A855F7",
};

// Estimate current prices (deterministic based on symbol)
function estimatePrice(symbol: string, purchasePrice: number): number {
  // Simple deterministic estimate based on symbol hash
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0;
  const factor = 0.8 + ((h >>> 0) % 60) / 100;
  return Math.round(purchasePrice * factor * 100) / 100;
}

export function PortfolioBuilderTab() {
  const { holdings, addHolding, removeHolding, resetToDefault, isCustomized } = usePortfolioStore();

  const [showForm, setShowForm] = useState(false);
  const [formSymbol, setFormSymbol] = useState("");
  const [formShares, setFormShares] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDate, setFormDate] = useState("2024-01-01");

  // Available symbols not yet in portfolio
  const available = AVAILABLE_SYMBOLS.filter((s) => !holdings.some((h) => h.symbol === s.symbol));

  // Portfolio calculations
  const totalValue = holdings.reduce(
    (a, h) => a + estimatePrice(h.symbol, h.purchasePrice) * h.shares,
    0,
  );
  const totalCost = holdings.reduce((a, h) => a + h.purchasePrice * h.shares, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? totalPnL / totalCost : 0;

  // Sector allocation for pie
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    const val = estimatePrice(h.symbol, h.purchasePrice) * h.shares;
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + val;
  });
  const sectorData = Object.entries(sectorMap)
    .map(([name, value]) => ({ name, value, pct: totalValue > 0 ? value / totalValue : 0 }))
    .sort((a, b) => b.value - a.value);

  const handleAdd = () => {
    const sym = AVAILABLE_SYMBOLS.find((s) => s.symbol === formSymbol);
    if (!sym || !formShares || !formPrice) return;

    const newHolding: CustomHolding = {
      symbol: sym.symbol,
      name: sym.name,
      shares: parseInt(formShares, 10) || 100,
      purchasePrice: parseFloat(formPrice) || 100,
      purchaseDate: formDate,
      sector: sym.sector,
    };

    addHolding(newHolding);
    setShowForm(false);
    setFormSymbol("");
    setFormShares("");
    setFormPrice("");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Portfolio Builder</Pill>
          {isCustomized && (
            <span className="glass-pill px-2 py-0.5 text-[9px] font-bold text-[#FFB020]">
              Customized
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isCustomized && (
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition border border-white/10"
            >
              <RotateCcw size={10} />
              Reset to Default
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-[#00D17A]/20 hover:bg-[#00D17A]/30 rounded-lg transition border border-[#00D17A]/30"
          >
            <Plus size={10} />
            Add Holding
          </button>
        </div>
      </div>

      {/* Add Holding Form */}
      {showForm && (
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Add New Holding
          </Pill>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">
                Symbol
              </label>
              <select
                value={formSymbol}
                onChange={(e) => {
                  setFormSymbol(e.target.value);
                  const sym = AVAILABLE_SYMBOLS.find((s) => s.symbol === e.target.value);
                  if (sym) setFormPrice(estimatePrice(sym.symbol, 100).toString());
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-[#4a9eff]/40"
              >
                <option value="" className="bg-[#1a1a2e]">
                  Select...
                </option>
                {available.map((s) => (
                  <option key={s.symbol} value={s.symbol} className="bg-[#1a1a2e]">
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">
                Shares
              </label>
              <input
                type="number"
                value={formShares}
                onChange={(e) => setFormShares(e.target.value)}
                placeholder="100"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#4a9eff]/40"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">
                Purchase Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="100.00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#4a9eff]/40"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-[#4a9eff]/40"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleAdd}
              disabled={!formSymbol || !formShares || !formPrice}
              className={cn(
                "px-4 py-1.5 text-[11px] font-bold rounded-lg transition",
                formSymbol && formShares && formPrice
                  ? "bg-[#00D17A]/20 text-[#00D17A] border border-[#00D17A]/30 hover:bg-[#00D17A]/30"
                  : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed",
              )}
            >
              Add to Portfolio
            </button>
          </div>
        </GlassCard>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="!p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={14} className="text-[#4a9eff]" />
            <span className="text-[9px] uppercase tracking-wider text-white/40">
              Portfolio Value
            </span>
          </div>
          <span className="text-2xl font-black tabular-nums text-white block">
            ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-white/50">{holdings.length} holdings</span>
        </GlassCard>

        <GlassCard className="!p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] uppercase tracking-wider text-white/40">Total P&L</span>
          </div>
          <span
            className="text-2xl font-black tabular-nums block"
            style={{ color: totalPnL >= 0 ? "#00D17A" : "#FF4D4F" }}
          >
            {totalPnL >= 0 ? "+" : ""}$
            {totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span
            className="text-[10px] font-semibold"
            style={{ color: totalPnLPct >= 0 ? "#00D17A" : "#FF4D4F" }}
          >
            {totalPnLPct >= 0 ? "+" : ""}
            {formatPct(totalPnLPct)}
          </span>
        </GlassCard>

        {/* Mini Allocation Pie */}
        <GlassCard className="!p-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChart size={14} className="text-[#8B5CF6]" />
            <span className="text-[9px] uppercase tracking-wider text-white/40">Allocation</span>
          </div>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={60} height={60}>
              <RechartsPie>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={16}
                  outerRadius={28}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((entry) => (
                    <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] ?? "#6B7280"} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0]!.payload;
                      return (
                        <div className="glass-pill px-2 py-0.5 text-[9px] font-semibold text-white">
                          {d.name}: {formatPct(d.pct, 1)}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex-1 space-y-0.5">
              {sectorData.slice(0, 4).map((s) => (
                <div key={s.name} className="flex items-center gap-1 text-[9px]">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: SECTOR_COLORS[s.name] ?? "#6B7280" }}
                  />
                  <span className="text-white/60 truncate">{s.name}</span>
                  <span className="font-semibold text-white ml-auto">{formatPct(s.pct, 1)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Holdings Table */}
      <GlassCard className="!p-4">
        <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
          Your Holdings ({holdings.length})
        </Pill>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-white/10 text-white/50 font-medium">
                <th className="px-2 py-2">Symbol</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2 text-right">Shares</th>
                <th className="px-2 py-2 text-right">Buy Price</th>
                <th className="px-2 py-2 text-right">Current</th>
                <th className="px-2 py-2 text-right">Value</th>
                <th className="px-2 py-2 text-right">P&L</th>
                <th className="px-2 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const currentPrice = estimatePrice(h.symbol, h.purchasePrice);
                const value = currentPrice * h.shares;
                const pnl = (currentPrice - h.purchasePrice) * h.shares;
                const pnlPct = h.purchasePrice > 0 ? currentPrice / h.purchasePrice - 1 : 0;
                return (
                  <tr
                    key={h.symbol}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-2 py-2 font-bold text-white">{h.symbol}</td>
                    <td className="px-2 py-2 text-white/70 max-w-[120px] truncate">{h.name}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-white/80">{h.shares}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-white/70">
                      ${formatNum(h.purchasePrice)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-white">
                      ${formatNum(currentPrice)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-semibold text-white">
                      ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: pnl >= 0 ? "#00D17A" : "#FF4D4F" }}
                      >
                        {pnl >= 0 ? "+" : ""}$
                        {pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span
                        className="block text-[9px]"
                        style={{ color: pnlPct >= 0 ? "#00D17A" : "#FF4D4F" }}
                      >
                        {pnlPct >= 0 ? "+" : ""}
                        {formatPct(pnlPct)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeHolding(h.symbol)}
                        className="p-1 rounded hover:bg-red-500/15 text-white/40 hover:text-[#FF4D4F] transition"
                        title={`Remove ${h.symbol}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
