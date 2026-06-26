import { useState } from "react";
import { GlassCard } from "../../GlassCard";
import { Pill } from "../../primitives";
import { getEnrichedHoldings } from "@/data/portfolioEnriched";
import { formatNum, formatPct } from "@/lib/finance/calculations";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

type Verdict = "good" | "warn" | "bad" | "neutral";

function getVerdictColor(v: Verdict): string {
  if (v === "good") return "#00D17A";
  if (v === "warn") return "#FFB020";
  if (v === "bad") return "#FF4D4F";
  return "rgba(255,255,255,0.5)";
}

export function TechnicalTab() {
  const enriched = getEnrichedHoldings();
  const [selected, setSelected] = useState(enriched[0]?.holding.symbol ?? "AAPL");

  const stock = enriched.find((e) => e.holding.symbol === selected) ?? enriched[0]!;
  const t = stock.technical;
  const price = stock.price.current;

  return (
    <div className="space-y-4">
      {/* Stock Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Technical Analysis</Pill>
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

      {/* Moving Averages */}
      <GlassCard className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-[#4a9eff]" />
          <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">Moving Averages</Pill>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <MACard label="SMA 20" value={t.sma20} price={price} />
          <MACard label="SMA 50" value={t.sma50} price={price} />
          <MACard label="SMA 200" value={t.sma200} price={price} />
          <MACard label="EMA 12" value={t.ema12} price={price} />
          <MACard label="EMA 26" value={t.ema26} price={price} />
        </div>
      </GlassCard>

      {/* Momentum & Oscillators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RSI */}
        <GlassCard className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={14} className="text-[#4a9eff]" />
            <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">RSI (14)</Pill>
          </div>
          <div className="flex items-center gap-4">
            {/* Radial Gauge */}
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={t.rsi14 > 70 ? "#FF4D4F" : t.rsi14 < 30 ? "#00D17A" : "#FFB020"}
                  strokeWidth="8"
                  strokeDasharray={`${(t.rsi14 / 100) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[18px] font-black tabular-nums text-white">
                  {t.rsi14.toFixed(1)}
                </span>
                <span
                  className="text-[8px] font-bold uppercase"
                  style={{ color: t.rsi14 > 70 ? "#FF4D4F" : t.rsi14 < 30 ? "#00D17A" : "#FFB020" }}
                >
                  {t.rsi14 > 70 ? "Overbought" : t.rsi14 < 30 ? "Oversold" : "Neutral"}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/50">Overbought Zone</span>
                <span className="text-[#FF4D4F] font-semibold">&gt; 70</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Neutral Zone</span>
                <span className="text-[#FFB020] font-semibold">30 — 70</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Oversold Zone</span>
                <span className="text-[#00D17A] font-semibold">&lt; 30</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* MACD */}
        <GlassCard className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-[#4a9eff]" />
            <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">MACD</Pill>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <MACDCard label="MACD Line" value={t.macdLine} />
              <MACDCard label="Signal" value={t.macdSignal} />
              <MACDCard label="Histogram" value={t.macdHistogram} />
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/50">Signal</span>
                <span
                  className="font-bold"
                  style={{ color: t.macdLine > t.macdSignal ? "#00D17A" : "#FF4D4F" }}
                >
                  {t.macdLine > t.macdSignal ? "Bullish Crossover" : "Bearish Crossover"}
                </span>
              </div>
            </div>

            {/* Stochastic */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                  Stochastic %K
                </span>
                <span className="text-[14px] font-bold tabular-nums text-white">
                  {t.stochK.toFixed(1)}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                  Stochastic %D
                </span>
                <span className="text-[14px] font-bold tabular-nums text-white">
                  {t.stochD.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Volatility & Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bollinger Bands + Volatility */}
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Volatility
          </Pill>
          <div className="space-y-2 text-[11px]">
            <TechRow
              label="Bollinger Upper"
              value={`$${formatNum(t.bollingerUpper)}`}
              verdict={price > t.bollingerUpper ? "bad" : "neutral"}
            />
            <TechRow
              label="Bollinger Middle"
              value={`$${formatNum(t.bollingerMiddle)}`}
              verdict="neutral"
            />
            <TechRow
              label="Bollinger Lower"
              value={`$${formatNum(t.bollingerLower)}`}
              verdict={price < t.bollingerLower ? "good" : "neutral"}
            />
            <div className="border-t border-white/5 pt-2 mt-2">
              <TechRow label="ATR (14)" value={`$${formatNum(t.atr14)}`} verdict="neutral" />
              <TechRow
                label="BB Width"
                value={formatPct((t.bollingerUpper - t.bollingerLower) / t.bollingerMiddle)}
                verdict="neutral"
              />
            </div>
          </div>
        </GlassCard>

        {/* Trend */}
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Trend Strength
          </Pill>
          <div className="space-y-3">
            {/* ADX Gauge */}
            <div className="bg-white/5 rounded-xl border border-white/5 p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase tracking-wider text-white/40">
                  ADX Strength
                </span>
                <span className="text-[14px] font-bold tabular-nums text-white">
                  {t.adx.toFixed(1)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, t.adx)}%`,
                    background:
                      t.adx > 40 ? "#00D17A" : t.adx > 25 ? "#FFB020" : "rgba(255,255,255,0.3)",
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-white/30 mt-1">
                <span>Weak (&lt;20)</span>
                <span>Moderate (20-40)</span>
                <span>Strong (&gt;40)</span>
              </div>
            </div>

            {/* OBV & Cross */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                  OBV Trend
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  {t.obvTrend === "rising" ? (
                    <ArrowUpRight size={12} className="text-[#00D17A]" />
                  ) : t.obvTrend === "falling" ? (
                    <ArrowDownRight size={12} className="text-[#FF4D4F]" />
                  ) : (
                    <Minus size={12} className="text-white/40" />
                  )}
                  <span
                    className="text-[12px] font-bold capitalize"
                    style={{
                      color:
                        t.obvTrend === "rising"
                          ? "#00D17A"
                          : t.obvTrend === "falling"
                            ? "#FF4D4F"
                            : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {t.obvTrend}
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                  Cross Status
                </span>
                <span
                  className={cn(
                    "inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    t.goldenCrossStatus === "golden"
                      ? "bg-green-500/15 text-[#00D17A] border border-green-500/25"
                      : t.goldenCrossStatus === "death"
                        ? "bg-red-500/15 text-[#FF4D4F] border border-red-500/25"
                        : "bg-white/10 text-white/60 border border-white/10",
                  )}
                >
                  {t.goldenCrossStatus === "golden"
                    ? "Golden Cross"
                    : t.goldenCrossStatus === "death"
                      ? "Death Cross"
                      : "Neutral"}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MACard({ label, value, price }: { label: string; value: number; price: number }) {
  const aboveMA = price > value;
  const distPct = (price - value) / value;
  return (
    <div className="bg-white/5 rounded-xl border border-white/5 p-2.5 text-center">
      <span className="text-[8px] uppercase tracking-wider text-white/40 block">{label}</span>
      <span className="text-[13px] font-bold tabular-nums text-white block mt-0.5">
        ${formatNum(value)}
      </span>
      <div className="flex items-center justify-center gap-0.5 mt-0.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: aboveMA ? "#00D17A" : "#FF4D4F" }}
        />
        <span
          className="text-[9px] font-semibold tabular-nums"
          style={{ color: aboveMA ? "#00D17A" : "#FF4D4F" }}
        >
          {aboveMA ? "+" : ""}
          {formatPct(distPct, 1)}
        </span>
      </div>
    </div>
  );
}

function MACDCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
      <span className="text-[8px] uppercase tracking-wider text-white/40 block">{label}</span>
      <span
        className="text-[13px] font-bold tabular-nums block mt-0.5"
        style={{ color: value >= 0 ? "#00D17A" : "#FF4D4F" }}
      >
        {value >= 0 ? "+" : ""}
        {value.toFixed(3)}
      </span>
    </div>
  );
}

function TechRow({ label, value, verdict }: { label: string; value: string; verdict: Verdict }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold tabular-nums text-white">{value}</span>
        {verdict !== "neutral" && (
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: getVerdictColor(verdict) }}
          />
        )}
      </div>
    </div>
  );
}
