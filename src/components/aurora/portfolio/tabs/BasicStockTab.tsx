import { useState } from "react";
import { GlassCard } from "../../GlassCard";
import { Pill } from "../../primitives";
import { getEnrichedHoldings, type EnrichedHolding } from "@/data/portfolioEnriched";
import { formatCompact, formatPct, formatNum } from "@/lib/finance/calculations";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Wallet,
} from "lucide-react";

export function BasicStockTab() {
  const enriched = getEnrichedHoldings();
  const [selected, setSelected] = useState(enriched[0]?.holding.symbol ?? "AAPL");

  const stock = enriched.find((e) => e.holding.symbol === selected) ?? enriched[0]!;

  return (
    <div className="space-y-4">
      {/* Stock Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Basic Stock Data</Pill>
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

      {/* Company Profile */}
      <GlassCard className="!p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[16px] font-bold text-white">{stock.profile.name}</h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              {stock.profile.symbol} · {stock.profile.exchange} · {stock.profile.currency}
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className="glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-white/80">
              {stock.profile.sector}
            </span>
            <span className="glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-white/80">
              {stock.profile.industry}
            </span>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-white/60 mb-3">
          {stock.profile.description}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <MetaItem icon={Building2} label="Exchange" value={stock.profile.exchange} />
          <MetaItem icon={MapPin} label="Industry" value={stock.profile.industry} />
          <MetaItem
            icon={Users}
            label="Employees"
            value={stock.profile.employees.toLocaleString()}
          />
          <MetaItem icon={Calendar} label="Founded" value={stock.profile.founded} />
        </div>
      </GlassCard>

      {/* Key Stats & Fundamentals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Stats */}
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Key Statistics
          </Pill>
          <div className="space-y-2">
            <StatRow
              icon={DollarSign}
              label="Market Cap"
              value={formatCompact(stock.fundamental.enterpriseValue * 0.9)}
            />
            <StatRow
              icon={BarChart3}
              label="Enterprise Value"
              value={formatCompact(stock.fundamental.enterpriseValue)}
            />
            <StatRow
              icon={Wallet}
              label="Shares Outstanding"
              value={formatCompact(stock.fundamental.sharesOutstanding)}
            />
            <StatRow icon={TrendingUp} label="Beta" value={formatNum(stock.risk.beta)} />
            <StatRow
              icon={DollarSign}
              label="Dividend Yield"
              value={
                stock.valuation.dividendYield > 0 ? formatPct(stock.valuation.dividendYield) : "—"
              }
            />
            <StatRow
              icon={Wallet}
              label="Payout Ratio"
              value={stock.valuation.payoutRatio > 0 ? formatPct(stock.valuation.payoutRatio) : "—"}
            />
          </div>
        </GlassCard>

        {/* Fundamentals */}
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Fundamentals
          </Pill>
          <div className="space-y-2">
            <StatRow label="Revenue (TTM)" value={formatCompact(stock.fundamental.revenue)} />
            <StatRow label="Net Income" value={formatCompact(stock.fundamental.netIncome)} />
            <StatRow label="EBITDA" value={formatCompact(stock.fundamental.ebitda)} />
            <StatRow label="Free Cash Flow" value={formatCompact(stock.fundamental.freeCashFlow)} />
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            <StatRow
              label="Gross Margin"
              value={formatPct(stock.fundamental.grossMargin)}
              verdict={classifyMargin(stock.fundamental.grossMargin, 0.4)}
            />
            <StatRow
              label="Operating Margin"
              value={formatPct(stock.fundamental.operatingMargin)}
              verdict={classifyMargin(stock.fundamental.operatingMargin, 0.2)}
            />
            <StatRow
              label="Net Margin"
              value={formatPct(stock.fundamental.netMargin)}
              verdict={classifyMargin(stock.fundamental.netMargin, 0.1)}
            />
          </div>
        </GlassCard>
      </div>

      {/* Profitability & Balance Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Profitability
          </Pill>
          <div className="space-y-2">
            <StatRow
              label="ROE"
              value={formatPct(stock.fundamental.roe)}
              verdict={classifyReturn(stock.fundamental.roe)}
            />
            <StatRow
              label="ROA"
              value={formatPct(stock.fundamental.roa)}
              verdict={classifyReturn(stock.fundamental.roa * 2)}
            />
            <StatRow
              label="ROIC"
              value={formatPct(stock.fundamental.roic)}
              verdict={classifyReturn(stock.fundamental.roic)}
            />
          </div>
        </GlassCard>

        <GlassCard className="!p-4">
          <Pill className="self-start !px-2.5 !py-0.5 !text-[11px] !font-semibold mb-3">
            Balance Sheet Health
          </Pill>
          <div className="space-y-2">
            <StatRow
              label="Debt-to-Equity"
              value={formatNum(stock.fundamental.debtToEquity)}
              verdict={classifyDebt(stock.fundamental.debtToEquity)}
            />
            <StatRow
              label="Current Ratio"
              value={formatNum(stock.fundamental.currentRatio)}
              verdict={classifyRatio(stock.fundamental.currentRatio)}
            />
            <StatRow
              label="Quick Ratio"
              value={formatNum(stock.fundamental.quickRatio)}
              verdict={classifyRatio(stock.fundamental.quickRatio)}
            />
            <StatRow
              label="Interest Coverage"
              value={formatNum(stock.fundamental.interestCoverage, 1) + "x"}
              verdict={
                stock.fundamental.interestCoverage > 5
                  ? "good"
                  : stock.fundamental.interestCoverage > 2
                    ? "warn"
                    : "bad"
              }
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

type Verdict = "good" | "warn" | "bad";

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 p-2">
      <Icon size={12} className="text-white/40 shrink-0" />
      <div className="min-w-0">
        <span className="block text-[8px] uppercase tracking-wider text-white/40">{label}</span>
        <span className="block text-[11px] font-semibold text-white truncate">{value}</span>
      </div>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  verdict,
}: {
  icon?: typeof Building2;
  label: string;
  value: string;
  verdict?: Verdict;
}) {
  const verdictColor =
    verdict === "good"
      ? "#00D17A"
      : verdict === "warn"
        ? "#FFB020"
        : verdict === "bad"
          ? "#FF4D4F"
          : undefined;
  return (
    <div className="flex items-center justify-between text-[11px]">
      <div className="flex items-center gap-1.5 text-white/60">
        {Icon && <Icon size={12} className="shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold tabular-nums text-white">{value}</span>
        {verdict && (
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: verdictColor }}
          />
        )}
      </div>
    </div>
  );
}

function classifyMargin(v: number, good: number): Verdict {
  if (v >= good) return "good";
  if (v >= good * 0.5) return "warn";
  return "bad";
}

function classifyReturn(v: number): Verdict {
  if (v >= 0.15) return "good";
  if (v >= 0.05) return "warn";
  return "bad";
}

function classifyDebt(v: number): Verdict {
  if (v <= 0.5) return "good";
  if (v <= 1.5) return "warn";
  return "bad";
}

function classifyRatio(v: number): Verdict {
  if (v >= 1.5) return "good";
  if (v >= 1.0) return "warn";
  return "bad";
}
