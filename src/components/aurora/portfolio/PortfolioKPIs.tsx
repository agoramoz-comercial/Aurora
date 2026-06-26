import { GlassCard } from "../GlassCard";
import { Pill } from "../primitives";
import { formatCompact, formatPct } from "@/lib/finance/calculations";
import { portfolioMetrics } from "@/data/portfolio";

export function PortfolioKPIs() {
  const m = portfolioMetrics;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* AUM Card */}
      <GlassCard className="flex flex-col justify-between !p-4 min-h-[110px]">
        <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] text-white/70">
          Assets Under Management
        </Pill>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold tabular-nums text-white">
            ${m.aum.toLocaleString()}
          </span>
          <Pill tone="mute" className="!text-[10px]">
            Capital: {formatPct(m.grossCapitalDeployed)}
          </Pill>
        </div>
      </GlassCard>

      {/* Performance Card */}
      <GlassCard className="flex flex-col justify-between !p-4 min-h-[110px]">
        <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] text-white/70">
          Performance (YTD)
        </Pill>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: m.ytdPerf >= 0 ? "#00D17A" : "#FF4D4F" }}
          >
            {m.ytdPerf >= 0 ? "+" : ""}
            {formatPct(m.ytdPerf)}
          </span>
          <div className="flex flex-col items-end text-[10px] text-white/60">
            <span>MTD: {formatPct(m.mtdPerf)}</span>
            <span>Inception: {formatPct(m.perfSinceInception)}</span>
          </div>
        </div>
      </GlassCard>

      {/* Alpha Card */}
      <GlassCard className="flex flex-col justify-between !p-4 min-h-[110px]">
        <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] text-white/70">
          Alpha Generated (YTD)
        </Pill>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: m.ytdAlpha >= 0 ? "#00D17A" : "#FF4D4F" }}
          >
            {m.ytdAlpha >= 0 ? "+" : ""}
            {formatPct(m.ytdAlpha)}
          </span>
          <Pill tone="mute" className="!text-[10px]">
            MTD: {m.mtdAlpha >= 0 ? "+" : ""}
            {formatPct(m.mtdAlpha)}
          </Pill>
        </div>
      </GlassCard>

      {/* Exposure Card */}
      <GlassCard className="flex flex-col justify-between !p-4 min-h-[110px]">
        <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] text-white/70">Net Exposure</Pill>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold tabular-nums text-white">
            {formatPct(m.netExposure)}
          </span>
          <div className="flex flex-col items-end text-[10px] text-white/60">
            <span>Beta Net: {formatPct(m.betaNetExposure)}</span>
            <span>Max Sector: {formatPct(m.largestSectorExposurePct)}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
