import {
  classifyDrawdown,
  classifySharpe,
  classifyVaR,
  classifyVol,
  formatNum,
  formatPct,
  type Verdict,
} from "@/lib/finance/calculations";
import type { TickerSnapshot } from "@/lib/alphaVantage.types";
import { GlassCard } from "../GlassCard";
import { Pill } from "../primitives";

const verdictColor: Record<Verdict, string> = {
  good: "#00D17A",
  warn: "#FFB020",
  bad: "#FF4D4F",
  neutral: "rgba(255,255,255,0.5)",
};

function Row({
  label,
  value,
  verdict,
  hint,
}: {
  label: string;
  value: string;
  verdict: Verdict;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="h-2 w-2 rounded-full"
          style={{
            background: verdictColor[verdict],
            boxShadow: verdict !== "neutral" ? `0 0 8px ${verdictColor[verdict]}88` : "none",
          }}
        />
        <span className="truncate text-[11px] text-white/65">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[12px] font-semibold tabular-nums text-white">{value}</span>
        {hint ? <span className="text-[10px] text-white/40">{hint}</span> : null}
      </div>
    </div>
  );
}

export function RiskScoreCard({ data }: { data: TickerSnapshot | undefined }) {
  const sharpe = data?.sharpe ?? null;
  const sortino = data?.sortino ?? null;
  const vol = data?.annualVolPct ?? null;
  const dd = data?.maxDrawdownPct ?? null;
  const v95 = data?.var95 ?? null;

  // Composite 0..100 score (higher = safer/better)
  const score = (() => {
    let s = 50;
    if (sharpe !== null) s += Math.max(-15, Math.min(20, sharpe * 12));
    if (vol !== null) s -= Math.max(0, Math.min(25, (vol - 0.2) * 100));
    if (dd !== null) s -= Math.max(0, Math.min(20, Math.abs(dd) * 60));
    return Math.max(0, Math.min(100, Math.round(s)));
  })();
  const scoreColor = score >= 65 ? "#00D17A" : score >= 40 ? "#FFB020" : "#FF4D4F";

  return (
    <GlassCard className="lg:h-full lg:min-h-0 !p-4">
      <div className="flex shrink-0 items-center justify-between">
        <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Risk score</Pill>
        <span
          className="text-[18px] font-semibold tabular-nums"
          style={{ color: scoreColor, textShadow: `0 0 12px ${scoreColor}66` }}
        >
          {score}
        </span>
      </div>
      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-around">
        <Row
          label="Sharpe"
          value={formatNum(sharpe)}
          verdict={classifySharpe(sharpe)}
          hint=">1 good"
        />
        <Row label="Sortino" value={formatNum(sortino)} verdict={classifySharpe(sortino)} />
        <Row label="σ annual" value={formatPct(vol, 1)} verdict={classifyVol(vol)} />
        <Row label="Max DD" value={formatPct(dd, 1)} verdict={classifyDrawdown(dd)} />
        <Row label="VaR 95%" value={formatPct(v95, 2)} verdict={classifyVaR(v95)} hint="1d" />
      </div>
    </GlassCard>
  );
}
