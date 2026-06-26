import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Sector,
} from "recharts";
import { GlassCard } from "../GlassCard";
import { Pill } from "../primitives";
import { formatPct, formatCompact } from "@/lib/finance/calculations";
import { monthlyPerformance, holdingsData } from "@/data/portfolio";
import { cn } from "@/lib/utils";

// Colors aligned with the dashboard theme
const SECTOR_COLORS: Record<string, string> = {
  "Information Technology": "#00D17A", // neon green
  Industrials: "#3B82F6", // bright blue
  Energy: "#FFB020", // amber
  "Health Care": "#EC4899", // pink
  "Consumer Staples": "#8B5CF6", // purple
  "Consumer Discretionary": "#FF4D4F", // red
};

export function PortfolioCharts() {
  const [activeChart, setActiveChart] = useState<"allocation" | "performance" | "contribution">(
    "performance",
  );

  // Interactive hover states
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [hoveredBarTicker, setHoveredBarTicker] = useState<string | null>(null);

  // 1. Sector Allocation Data Calculation
  const sectorMap: Record<string, number> = {};
  holdingsData.forEach((h) => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.positionSize;
  });
  const totalVal = Object.values(sectorMap).reduce((a, b) => a + b, 0);
  const sectorData = Object.entries(sectorMap)
    .map(([name, val]) => ({
      name,
      value: val,
      percentage: val / totalVal,
    }))
    .sort((a, b) => b.value - a.value);

  // 2. Bar Chart Data (P&L Contribution Since Inception)
  const barData = holdingsData
    .map((h) => ({
      ticker: h.symbol,
      pnl: h.profitSinceInception,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const chartTabs = [
    { id: "performance", label: "Performance" },
    { id: "allocation", label: "Allocation" },
    { id: "contribution", label: "P&L Contribution" },
  ] as const;

  // Custom active shape for the Pie donut chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        {/* Subtle shadow glow */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.2}
        />
        {/* Outer expanding segment */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 2.5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile Chart Selector */}
      <div className="lg:hidden flex shrink-0">
        <div className="glass-soft flex w-full gap-0.5 p-0.5" style={{ borderRadius: 10 }}>
          {chartTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveChart(t.id)}
              className={cn(
                "flex-1 text-center py-2 text-[11px] font-semibold transition-all duration-200",
                activeChart === t.id
                  ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
              style={{ borderRadius: 8 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart 1: Sector Allocation */}
        <GlassCard
          className={cn(
            "flex flex-col !p-4 min-h-[320px]",
            activeChart === "allocation" ? "flex" : "hidden lg:flex",
          )}
        >
          <Pill className="self-start !px-3 !py-1 !text-[12px] !font-semibold mb-2">
            Sector Allocation
          </Pill>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
            <div className="w-full h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="glass-pill px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg border border-white/10">
                            {data.name}: {formatPct(data.percentage)}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    activeIndex={activePieIndex ?? undefined}
                    activeShape={renderActiveShape}
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {sectorData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={SECTOR_COLORS[entry.name] || "#6B7280"}
                        opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.4}
                        style={{
                          transition: "opacity 0.2s ease, transform 0.2s ease",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Central Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-4px]">
                <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">
                  Total AUM
                </span>
                <span className="text-[13px] font-black text-white font-mono mt-0.5">
                  ${formatCompact(totalVal)}
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="w-full mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-white/70 border-t border-white/5 pt-2">
              {sectorData.map((entry, index) => (
                <div
                  key={entry.name}
                  className={cn(
                    "flex items-center gap-1.5 truncate cursor-pointer transition-all duration-200 p-0.5 rounded",
                    activePieIndex === null || activePieIndex === index
                      ? "opacity-100 bg-white/5"
                      : "opacity-35",
                  )}
                  onMouseEnter={() => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: SECTOR_COLORS[entry.name] || "#6B7280" }}
                  />
                  <span className="truncate">{entry.name}</span>
                  <span className="font-semibold text-white ml-auto">
                    {formatPct(entry.percentage, 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Chart 2: Performance Line Chart */}
        <GlassCard
          className={cn(
            "flex flex-col !p-4 min-h-[320px] lg:col-span-2",
            activeChart === "performance" ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 mb-2">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">
              Cumulative Performance (2017)
            </Pill>
            <div className="flex gap-2.5 text-[10px] text-white/60">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-sm bg-[#00D17A]" />
                <span className="font-semibold text-white/80">Portfolio (+21.0%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="h-1.5 w-3 rounded-sm bg-white/20"
                  style={{ borderTop: "1.5px dashed rgba(255,255,255,0.4)" }}
                />
                <span>S&P 500 (+19.5%)</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyPerformance}
                margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D17A" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="#00D17A" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#00D17A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.03)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={9}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={9}
                  tickLine={false}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  cursor={{
                    stroke: "rgba(255,255,255,0.1)",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-pill px-3 py-1.5 text-[11px] flex flex-col gap-1 text-white shadow-lg border border-white/10">
                          <span className="font-semibold text-white/50">{data.date}</span>
                          <span className="font-bold text-[#00D17A]">
                            Portfolio: {formatPct(data.cumulative)}
                          </span>
                          <span className="font-medium text-white/80">
                            S&P 500: {formatPct(data.spyCumulative)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spyCumulative"
                  stroke="rgba(255,255,255,0.3)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  fill="url(#spyGradient)"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#00D17A"
                  strokeWidth={2.5}
                  fill="url(#perfGradient)"
                  activeDot={{ r: 5, fill: "#00D17A", strokeWidth: 1.5, stroke: "#FFF" }}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 3: P&L Contributions */}
        <GlassCard
          className={cn(
            "flex flex-col !p-4 min-h-[300px] lg:col-span-3",
            activeChart === "contribution" ? "flex" : "hidden lg:flex",
          )}
        >
          <Pill className="self-start !px-3 !py-1 !text-[12px] !font-semibold mb-2">
            P&L Contribution Since Inception ($)
          </Pill>
          <div className="flex-1 min-h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: -22, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="positiveBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(0, 209, 122, 0.35)" />
                    <stop offset="100%" stopColor="rgba(0, 209, 122, 0.8)" />
                  </linearGradient>
                  <linearGradient id="negativeBar" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="rgba(255, 77, 79, 0.35)" />
                    <stop offset="100%" stopColor="rgba(255, 77, 79, 0.8)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.03)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={9}
                  tickLine={false}
                  tickFormatter={(v) => `${v >= 0 ? "+" : ""}$${v.toLocaleString()}`}
                  dy={4}
                />
                <YAxis
                  dataKey="ticker"
                  type="category"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={9}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-pill px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg border border-white/10">
                          {data.ticker}: {data.pnl >= 0 ? "+" : ""}${data.pnl.toLocaleString()}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} animationDuration={800}>
                  {barData.map((entry) => (
                    <Cell
                      key={entry.ticker}
                      fill={entry.pnl >= 0 ? "url(#positiveBar)" : "url(#negativeBar)"}
                      opacity={
                        hoveredBarTicker === null || hoveredBarTicker === entry.ticker ? 1 : 0.4
                      }
                      onMouseEnter={() => setHoveredBarTicker(entry.ticker)}
                      onMouseLeave={() => setHoveredBarTicker(null)}
                      style={{
                        transition: "opacity 0.2s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
