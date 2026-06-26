import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "../GlassCard";
import { Pill } from "../primitives";
import { AlertTriangle, CheckCircle2, XCircle, Shield } from "lucide-react";
import { formatPct, formatNum } from "@/lib/finance/calculations";
import { macroSnapshot, redFlags, RedFlag, holdingsData } from "@/data/portfolio";
import { getEnrichedHoldings } from "@/data/portfolioEnriched";

export function RiskEngine() {
  const [filter, setFilter] = useState<"all" | "alerts" | "passed">("all");
  const enriched = getEnrichedHoldings();

  const filteredFlags = redFlags.filter((flag) => {
    if (filter === "alerts") return flag.status === "warn" || flag.status === "fail";
    if (filter === "passed") return flag.status === "pass";
    return true;
  });

  // Portfolio-level risk metrics (weighted average)
  const total = holdingsData.reduce((a, h) => a + h.positionSize, 0);
  const portBeta = enriched.reduce((a, e) => a + e.risk.beta * (e.holding.positionSize / total), 0);
  const portSharpe = enriched.reduce(
    (a, e) => a + e.risk.sharpe * (e.holding.positionSize / total),
    0,
  );
  const portSortino = enriched.reduce(
    (a, e) => a + e.risk.sortino * (e.holding.positionSize / total),
    0,
  );
  const portVaR = enriched.reduce((a, e) => a + e.risk.var95 * (e.holding.positionSize / total), 0);
  const portMaxDD = Math.min(...enriched.map((e) => e.risk.maxDrawdown));
  const portVol = enriched.reduce(
    (a, e) => a + e.risk.annualizedVol * (e.holding.positionSize / total),
    0,
  );

  // Stop-loss proximity sorted
  const stopLossProximity = [...holdingsData]
    .filter((h) => h.pctFromStopLoss >= 0)
    .sort((a, b) => a.pctFromStopLoss - b.pctFromStopLoss)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Portfolio-Level Risk Metrics */}
      <GlassCard className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-[#4a9eff]" />
          <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">
            Portfolio Risk Metrics
          </Pill>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <RiskMetricCard
            label="Portfolio β"
            value={formatNum(portBeta)}
            verdict={portBeta > 1.3 ? "bad" : portBeta > 1 ? "warn" : "good"}
          />
          <RiskMetricCard
            label="Sharpe Ratio"
            value={formatNum(portSharpe)}
            verdict={portSharpe > 1 ? "good" : portSharpe > 0.5 ? "warn" : "bad"}
          />
          <RiskMetricCard
            label="Sortino Ratio"
            value={formatNum(portSortino)}
            verdict={portSortino > 1.5 ? "good" : portSortino > 0.5 ? "warn" : "bad"}
          />
          <RiskMetricCard
            label="VaR 95%"
            value={formatPct(portVaR)}
            verdict={portVaR < -0.03 ? "bad" : portVaR < -0.02 ? "warn" : "good"}
          />
          <RiskMetricCard
            label="Max Drawdown"
            value={formatPct(portMaxDD)}
            verdict={portMaxDD < -0.2 ? "bad" : portMaxDD < -0.1 ? "warn" : "good"}
          />
          <RiskMetricCard
            label="Ann. Volatility"
            value={formatPct(portVol)}
            verdict={portVol > 0.3 ? "bad" : portVol > 0.2 ? "warn" : "good"}
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Block 1: Red Flags Checklist */}
        <GlassCard className="flex flex-col !p-4 min-h-[300px] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 shrink-0">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">
              Potential Economic & Portfolio Red Flags
            </Pill>

            {/* Segmented Filter */}
            <div className="glass-soft flex gap-0.5 p-0.5" style={{ borderRadius: 8 }}>
              {(["all", "alerts", "passed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider transition-all duration-200",
                    filter === f
                      ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-white/60 hover:text-white",
                  )}
                  style={{ borderRadius: 6 }}
                >
                  {f === "all" ? "All" : f === "alerts" ? "Alerts" : "Passed"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[350px] pr-1 flex-1">
            {filteredFlags.map((flag: RedFlag) => {
              const isPass = flag.status === "pass";
              const isWarn = flag.status === "warn";
              const isFail = flag.status === "fail";

              return (
                <div
                  key={flag.id}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-xl border transition hover:bg-white/5",
                    isPass ? "bg-green-500/5 border-green-500/10 text-white/90" : "",
                    isWarn ? "bg-amber-500/5 border-amber-500/15 text-white/90" : "",
                    isFail ? "bg-red-500/5 border-red-500/15 text-white/90" : "",
                  )}
                >
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5 shrink-0">
                    {isPass && <CheckCircle2 size={16} className="text-[#00D17A]" />}
                    {isWarn && <AlertTriangle size={16} className="text-[#FFB020]" />}
                    {isFail && <XCircle size={16} className="text-[#FF4D4F]" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-normal text-white">
                      {flag.question}
                    </p>
                    <p
                      className="text-[10px] font-semibold tabular-nums mt-0.5"
                      style={{
                        color: isPass ? "#00D17A" : isWarn ? "#FFB020" : "#FF4D4F",
                      }}
                    >
                      {flag.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Block 2: Macroeconomic Snapshot + Stop-Loss Proximity */}
        <div className="flex flex-col gap-4">
          <GlassCard className="flex flex-col !p-4">
            <Pill className="self-start !px-3 !py-1 !text-[12px] !font-semibold mb-3">
              Macroeconomic Market Drivers
            </Pill>

            <div className="grid grid-cols-2 gap-2 text-left">
              {macroSnapshot.map((driver) => {
                let formattedVal = "";
                if (driver.formatType === "pct") {
                  formattedVal = formatPct(driver.value);
                } else if (driver.formatType === "currency") {
                  formattedVal = `$${driver.value.toLocaleString()}`;
                } else if (driver.formatType === "rate") {
                  formattedVal = formatNum(driver.value, 4);
                } else {
                  formattedVal = formatNum(driver.value);
                }

                return (
                  <div
                    key={driver.label}
                    className="flex flex-col justify-center rounded-xl bg-white/5 border border-white/5 p-2 transition hover:bg-white/10"
                  >
                    <span className="text-[9px] uppercase tracking-wider text-white/50 truncate">
                      {driver.label}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums text-white mt-0.5">
                      {formattedVal}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Stop-Loss Proximity */}
          <GlassCard className="flex flex-col !p-4">
            <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
              Stop-Loss Proximity
            </Pill>
            <div className="space-y-2">
              {stopLossProximity.map((h) => (
                <div key={h.symbol} className="flex items-center gap-2 text-[10px]">
                  <span className="font-bold text-white w-10">{h.symbol}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, h.pctFromStopLoss * 500)}%`,
                        background:
                          h.pctFromStopLoss < 0.05
                            ? "#FF4D4F"
                            : h.pctFromStopLoss < 0.15
                              ? "#FFB020"
                              : "#00D17A",
                      }}
                    />
                  </div>
                  <span
                    className="font-semibold tabular-nums w-12 text-right"
                    style={{
                      color:
                        h.pctFromStopLoss < 0.05
                          ? "#FF4D4F"
                          : h.pctFromStopLoss < 0.15
                            ? "#FFB020"
                            : "#00D17A",
                    }}
                  >
                    {formatPct(h.pctFromStopLoss)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function RiskMetricCard({
  label,
  value,
  verdict,
}: {
  label: string;
  value: string;
  verdict: "good" | "warn" | "bad";
}) {
  const color = verdict === "good" ? "#00D17A" : verdict === "warn" ? "#FFB020" : "#FF4D4F";
  return (
    <div className="bg-white/5 rounded-xl border border-white/5 p-2.5 text-center transition hover:bg-white/10">
      <span className="text-[8px] uppercase tracking-wider text-white/40 block">{label}</span>
      <span className="text-[16px] font-black tabular-nums text-white block mt-0.5">{value}</span>
      <span
        className="inline-block h-1.5 w-1.5 rounded-full mt-1"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
