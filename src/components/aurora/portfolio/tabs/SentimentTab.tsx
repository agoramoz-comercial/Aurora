import { useState } from "react";
import { GlassCard } from "../../GlassCard";
import { Pill } from "../../primitives";
import { getEnrichedHoldings } from "@/data/portfolioEnriched";
import { cn } from "@/lib/utils";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MessageSquare,
  Newspaper,
  UserCheck,
} from "lucide-react";

export function SentimentTab() {
  const enriched = getEnrichedHoldings();

  // Global Fear & Greed (average across holdings)
  const avgFearGreed = Math.round(
    enriched.reduce((a, e) => a + e.sentiment.fearGreedScore, 0) / enriched.length,
  );

  const [selectedView, setSelectedView] = useState<"overview" | "perStock">("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Market Sentiment</Pill>
        <div className="glass-soft flex gap-0.5 p-0.5" style={{ borderRadius: 8 }}>
          {(["overview", "perStock"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSelectedView(v)}
              className={cn(
                "px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider transition-all duration-200",
                selectedView === v
                  ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-white/60 hover:text-white",
              )}
              style={{ borderRadius: 6 }}
            >
              {v === "overview" ? "Overview" : "Per Stock"}
            </button>
          ))}
        </div>
      </div>

      {selectedView === "overview" ? (
        <>
          {/* Fear & Greed Gauge */}
          <GlassCard className="!p-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={14} className="text-[#EC4899]" />
              <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">
                Fear & Greed Index
              </Pill>
            </div>
            <div className="flex flex-col items-center">
              {/* Large Radial Gauge */}
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Background arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                    strokeDasharray="198 66"
                    strokeLinecap="round"
                  />
                  {/* Value arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={getFearGreedColor(avgFearGreed)}
                    strokeWidth="10"
                    strokeDasharray={`${(avgFearGreed / 100) * 198} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[32px] font-black tabular-nums text-white">
                    {avgFearGreed}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: getFearGreedColor(avgFearGreed) }}
                  >
                    {getFearGreedLabel(avgFearGreed)}
                  </span>
                </div>
              </div>
              {/* Scale */}
              <div className="flex justify-between w-full max-w-xs mt-3 text-[8px] text-white/40">
                <span>Extreme Fear</span>
                <span>Fear</span>
                <span>Neutral</span>
                <span>Greed</span>
                <span>Extreme Greed</span>
              </div>
              <div
                className="w-full max-w-xs h-2 rounded-full mt-1 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(90deg, #FF4D4F 0%, #FFB020 25%, #FFD700 50%, #90EE90 75%, #00D17A 100%)",
                }}
              >
                <div
                  className="h-full w-0.5 bg-white shadow-[0_0_4px_white] rounded-full"
                  style={{ marginLeft: `${avgFearGreed}%` }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Sentiment Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Analyst Consensus Aggregate */}
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-[#4a9eff]" />
                <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">
                  Analyst Consensus
                </Pill>
              </div>
              <div className="space-y-2">
                {enriched.slice(0, 6).map((e) => {
                  const total =
                    e.sentiment.analystBuy + e.sentiment.analystHold + e.sentiment.analystSell;
                  const buyPct = total > 0 ? (e.sentiment.analystBuy / total) * 100 : 0;
                  const holdPct = total > 0 ? (e.sentiment.analystHold / total) * 100 : 0;
                  return (
                    <div key={e.holding.symbol} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-bold text-white">{e.holding.symbol}</span>
                        <span className="text-white/50">
                          {e.sentiment.analystBuy}B / {e.sentiment.analystHold}H /{" "}
                          {e.sentiment.analystSell}S
                        </span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#00D17A]" style={{ width: `${buyPct}%` }} />
                        <div className="bg-[#FFB020]" style={{ width: `${holdPct}%` }} />
                        <div
                          className="bg-[#FF4D4F]"
                          style={{ width: `${100 - buyPct - holdPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Social Sentiment */}
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-[#8B5CF6]" />
                <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">
                  Social Sentiment
                </Pill>
              </div>
              <div className="space-y-2">
                {enriched.map((e) => (
                  <div
                    key={e.holding.symbol}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="font-bold text-white w-10">{e.holding.symbol}</span>
                    <SentimentBar value={e.sentiment.socialSentiment} />
                    <span
                      className="font-semibold tabular-nums w-10 text-right"
                      style={{ color: e.sentiment.socialSentiment >= 0 ? "#00D17A" : "#FF4D4F" }}
                    >
                      {e.sentiment.socialSentiment >= 0 ? "+" : ""}
                      {e.sentiment.socialSentiment.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Insider Activity */}
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck size={14} className="text-[#00D17A]" />
                <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">
                  Insider Activity
                </Pill>
              </div>
              <div className="space-y-2">
                {enriched.map((e) => (
                  <div
                    key={e.holding.symbol}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="font-bold text-white">{e.holding.symbol}</span>
                    <div className="flex items-center gap-1">
                      {e.sentiment.insiderSignal === "buying" ? (
                        <TrendingUp size={10} className="text-[#00D17A]" />
                      ) : e.sentiment.insiderSignal === "selling" ? (
                        <TrendingDown size={10} className="text-[#FF4D4F]" />
                      ) : (
                        <Minus size={10} className="text-white/40" />
                      )}
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                          e.sentiment.insiderSignal === "buying"
                            ? "bg-green-500/15 text-[#00D17A] border border-green-500/25"
                            : e.sentiment.insiderSignal === "selling"
                              ? "bg-red-500/15 text-[#FF4D4F] border border-red-500/25"
                              : "bg-white/10 text-white/50 border border-white/10",
                        )}
                      >
                        {e.sentiment.insiderSignal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </>
      ) : (
        /* Per-Stock Detail View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {enriched.map((e) => (
            <GlassCard key={e.holding.symbol} className="!p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-white">{e.holding.symbol}</span>
                <span className="text-[10px] text-white/50">{e.holding.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <SentimentMetric icon={Newspaper} label="News" value={e.sentiment.newsSentiment} />
                <SentimentMetric
                  icon={MessageSquare}
                  label="Social"
                  value={e.sentiment.socialSentiment}
                />
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                    Analysts
                  </span>
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-[#00D17A] font-bold">{e.sentiment.analystBuy}B</span>
                    <span className="text-[#FFB020] font-bold">{e.sentiment.analystHold}H</span>
                    <span className="text-[#FF4D4F] font-bold">{e.sentiment.analystSell}S</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                    Target Price
                  </span>
                  <span className="text-[13px] font-bold tabular-nums text-white">
                    ${e.sentiment.averageTargetPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFearGreedColor(score: number): string {
  if (score < 20) return "#FF4D4F";
  if (score < 40) return "#FFB020";
  if (score < 60) return "#FFD700";
  if (score < 80) return "#90EE90";
  return "#00D17A";
}

function getFearGreedLabel(score: number): string {
  if (score < 20) return "Extreme Fear";
  if (score < 40) return "Fear";
  if (score < 60) return "Neutral";
  if (score < 80) return "Greed";
  return "Extreme Greed";
}

function SentimentBar({ value }: { value: number }) {
  // value: -1 to 1
  const normalized = (value + 1) / 2; // 0 to 1
  return (
    <div className="flex-1 mx-2 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: value >= 0 ? "50%" : `${normalized * 100}%`,
          width: `${Math.abs(value) * 50}%`,
          backgroundColor: value >= 0 ? "#00D17A" : "#FF4D4F",
        }}
      />
    </div>
  );
}

function SentimentMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Newspaper;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon size={9} className="text-white/40" />
        <span className="text-[8px] uppercase tracking-wider text-white/40">{label}</span>
      </div>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color: value >= 0 ? "#00D17A" : "#FF4D4F" }}
      >
        {value >= 0 ? "+" : ""}
        {value.toFixed(2)}
      </span>
    </div>
  );
}
