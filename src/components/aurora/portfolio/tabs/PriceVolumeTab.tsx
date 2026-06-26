import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "../../GlassCard";
import { Pill } from "../../primitives";
import { getEnrichedHoldings } from "@/data/portfolioEnriched";
import { formatNum, formatPct, formatCompact } from "@/lib/finance/calculations";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";

export function PriceVolumeTab() {
  const enriched = getEnrichedHoldings();
  const [selected, setSelected] = useState(enriched[0]?.holding.symbol ?? "AAPL");

  const stock = enriched.find((e) => e.holding.symbol === selected) ?? enriched[0]!;
  const priceUp = stock.price.changePct >= 0;

  // 52-week range percentage
  const range52 = stock.price.week52High - stock.price.week52Low;
  const posIn52 = range52 > 0 ? (stock.price.current - stock.price.week52Low) / range52 : 0.5;

  // Chart data
  const chartData = stock.priceSeries.slice(-30).map((p) => ({
    date: p.date.slice(5), // MM-DD
    price: p.close,
    volume: p.volume,
  }));

  return (
    <div className="space-y-4">
      {/* Stock Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Price & Volume</Pill>
        <div className="flex flex-wrap gap-1">
          {enriched.map((e) => (
            <button
              key={e.holding.symbol}
              onClick={() => setSelected(e.holding.symbol)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-lg",
                selected === e.holding.symbol
                  ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-[#4a9eff]/40"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent",
              )}
            >
              {e.holding.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Price Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Price Action — {stock.holding.symbol}
          </Pill>
          {/* Current Price */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-black tabular-nums text-white">
              ${formatNum(stock.price.current)}
            </span>
            <div className="flex items-center gap-1 pb-1">
              {priceUp ? (
                <TrendingUp size={14} className="text-[#00D17A]" />
              ) : (
                <TrendingDown size={14} className="text-[#FF4D4F]" />
              )}
              <span
                className="text-[13px] font-bold tabular-nums"
                style={{ color: priceUp ? "#00D17A" : "#FF4D4F" }}
              >
                {priceUp ? "+" : ""}
                {formatPct(stock.price.changePct)}
              </span>
              <span className="text-[11px] text-white/40 tabular-nums">
                ({priceUp ? "+" : ""}${formatNum(stock.price.change)})
              </span>
            </div>
          </div>

          {/* OHLC Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <span className="text-white/40 text-[9px] uppercase tracking-wider block">Open</span>
              <span className="font-semibold tabular-nums text-white">
                ${formatNum(stock.price.open)}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <span className="text-white/40 text-[9px] uppercase tracking-wider block">
                Prev Close
              </span>
              <span className="font-semibold tabular-nums text-white">
                ${formatNum(stock.price.previousClose)}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <span className="text-white/40 text-[9px] uppercase tracking-wider block">
                Day High
              </span>
              <span className="font-semibold tabular-nums text-[#00D17A]">
                ${formatNum(stock.price.high)}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <span className="text-white/40 text-[9px] uppercase tracking-wider block">
                Day Low
              </span>
              <span className="font-semibold tabular-nums text-[#FF4D4F]">
                ${formatNum(stock.price.low)}
              </span>
            </div>
          </div>

          {/* 52-Week Range */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-white/40">
              <span>52W Low: ${formatNum(stock.price.week52Low)}</span>
              <span>52W High: ${formatNum(stock.price.week52High)}</span>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${posIn52 * 100}%`,
                  background: "linear-gradient(90deg, #FF4D4F 0%, #FFB020 50%, #00D17A 100%)",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                style={{ left: `calc(${posIn52 * 100}% - 5px)` }}
              />
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-white/50">
                YTD:{" "}
                <span
                  style={{ color: stock.price.ytdChangePct >= 0 ? "#00D17A" : "#FF4D4F" }}
                  className="font-semibold"
                >
                  {stock.price.ytdChangePct >= 0 ? "+" : ""}
                  {formatPct(stock.price.ytdChangePct)}
                </span>
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Volume */}
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Volume Analysis
          </Pill>
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
            <VolumeCard
              icon={Activity}
              label="Current Volume"
              value={formatCompact(stock.volume.current)}
            />
            <VolumeCard
              icon={BarChart3}
              label="Avg 10D"
              value={formatCompact(stock.volume.avg10D)}
            />
            <VolumeCard
              icon={BarChart3}
              label="Avg 30D"
              value={formatCompact(stock.volume.avg30D)}
            />
            <VolumeCard icon={Activity} label="VWAP" value={`$${formatNum(stock.volume.vwap)}`} />
          </div>

          {/* Volume Ratio Gauge */}
          <div className="bg-white/5 rounded-xl border border-white/5 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] uppercase tracking-wider text-white/40">
                Relative Volume
              </span>
              <span
                className="text-[13px] font-bold tabular-nums"
                style={{
                  color:
                    stock.volume.relativeVolume > 2
                      ? "#FF4D4F"
                      : stock.volume.relativeVolume > 1.2
                        ? "#FFB020"
                        : "#00D17A",
                }}
              >
                {stock.volume.relativeVolume.toFixed(2)}x
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, stock.volume.relativeVolume * 33)}%`,
                  background:
                    stock.volume.relativeVolume > 2
                      ? "linear-gradient(90deg, #FFB020, #FF4D4F)"
                      : stock.volume.relativeVolume > 1.2
                        ? "linear-gradient(90deg, #00D17A, #FFB020)"
                        : "#00D17A",
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-white/30 mt-1">
              <span>Low</span>
              <span>Normal (1x)</span>
              <span>High (3x)</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mini Price Chart */}
        <GlassCard className="!p-4 min-h-[260px]">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-2">
            30-Day Price Trend
          </Pill>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient
                    id={`priceGrad-${stock.holding.symbol}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={priceUp ? "rgba(0,209,122,0.4)" : "rgba(255,77,79,0.4)"}
                    />
                    <stop
                      offset="100%"
                      stopColor={priceUp ? "rgba(0,209,122,0)" : "rgba(255,77,79,0)"}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={8}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={8}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="glass-pill px-2.5 py-1 text-[10px] font-semibold text-white">
                          ${formatNum(payload[0]!.value as number)}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={priceUp ? "#00D17A" : "#FF4D4F"}
                  strokeWidth={2}
                  fill={`url(#priceGrad-${stock.holding.symbol})`}
                  activeDot={{
                    r: 4,
                    fill: priceUp ? "#00D17A" : "#FF4D4F",
                    strokeWidth: 1.5,
                    stroke: "#FFF",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Volume Chart */}
        <GlassCard className="!p-4 min-h-[260px]">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-2">
            30-Day Volume
          </Pill>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={8}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={8}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="glass-pill px-2.5 py-1 text-[10px] font-semibold text-white">
                          Vol: {formatCompact(payload[0]!.value as number)}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="volume" radius={[3, 3, 0, 0]} fill="rgba(74, 158, 255, 0.6)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function VolumeCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon size={10} className="text-white/40" />
        <span className="text-[8px] uppercase tracking-wider text-white/40">{label}</span>
      </div>
      <span className="text-[13px] font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}
