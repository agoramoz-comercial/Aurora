import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getTickerSnapshot, getWatchlist } from "@/lib/alphaVantage.functions";
import {
  classifyBeta,
  classifyMargin,
  classifyPB,
  classifyPE,
  classifyPEG,
  classifyROE,
  classifyRSI,
  formatCompact,
  formatNum,
  formatPct,
  sliceSeriesByTimeframe,
  type Verdict,
} from "@/lib/finance/calculations";
import type { TickerSnapshot } from "@/lib/alphaVantage.types";
import { GlassCard } from "../GlassCard";
import { Pill, SegmentedTabs, TickerChips, WorkspaceHeader } from "../primitives";
import { cn } from "@/lib/utils";
import { MainPriceChart } from "./MainPriceChart";
import { RsiChart } from "./RsiChart";
import { Watchlist } from "./Watchlist";
import { RiskScoreCard } from "./RiskScoreCard";
import { AlertEngine } from "./AlertEngine";
import { Sparkline } from "./Sparkline";
import { CHART } from "../chartTheme";

const TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL"] as const;
const TIMEFRAMES = ["1M", "3M", "6M", "1Y"] as const;

const verdictColor: Record<Verdict, string> = {
  good: CHART.positive,
  warn: CHART.warn,
  bad: CHART.negative,
  neutral: "rgba(255,255,255,0.5)",
};

function Dot({ v }: { v: Verdict }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: verdictColor[v],
        boxShadow: v !== "neutral" ? `0 0 8px ${verdictColor[v]}88` : "none",
      }}
    />
  );
}

function Metric({
  label,
  value,
  verdict = "neutral",
  hint,
}: {
  label: string;
  value: string;
  verdict?: Verdict;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="flex min-w-0 items-center gap-2">
        <Dot v={verdict} />
        <span className="truncate text-[11px] text-white/65">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[12px] font-semibold tabular-nums text-white">{value}</span>
        {hint ? <span className="text-[10px] text-white/40">{hint}</span> : null}
      </div>
    </div>
  );
}

function SourceBadge({ src }: { src: TickerSnapshot["source"] | undefined }) {
  const map = {
    live: { dot: CHART.positive, label: "Live" },
    partial: { dot: CHART.warn, label: "Partial" },
    baseline: { dot: CHART.violet, label: "Demo" },
  } as const;
  const cfg = map[src ?? "baseline"];
  return (
    <span className="glass-pill inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}88` }}
      />
      {cfg.label}
    </span>
  );
}

export function AnalyticsWorkspace() {
  const [symbol, setSymbol] = useState<(typeof TICKERS)[number]>("AAPL");
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("3M");

  const { data } = useQuery({
    queryKey: ["av", symbol],
    queryFn: () => getTickerSnapshot({ data: { symbol } }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    retry: 1,
  });

  const { data: watch } = useQuery({
    queryKey: ["av-watch", TICKERS.join(",")],
    queryFn: () => getWatchlist({ data: { symbols: [...TICKERS] } }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const slicedSeries = useMemo(
    () => (data ? sliceSeriesByTimeframe(data.series, tf) : []),
    [data, tf],
  );

  const up = (data?.change ?? 0) >= 0;
  const accent = up ? CHART.positive : CHART.negative;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="Analytics"
        subtitle={`${data?.name ?? symbol} · ${data?.sector ?? "—"} · ${
          data ? new Date(data.fetchedAt).toLocaleTimeString() : "a ligar…"
        }`}
        badge={
          <>
            <SourceBadge src={data?.source} />
            {data?.rateLimited && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--aurora-warn)]">
                API throttled
              </span>
            )}
          </>
        }
        right={
          <SegmentedTabs
            size="sm"
            tabs={TIMEFRAMES.map((t) => ({ id: t, label: t }))}
            active={tf}
            onSelect={setTf}
          />
        }
      />
      <div className="mt-3 shrink-0">
        <TickerChips
          symbols={TICKERS}
          active={symbol}
          onSelect={(s) => setSymbol(s as (typeof TICKERS)[number])}
        />
      </div>

      <motion.div
        key={symbol}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1.4fr)_minmax(0,1fr)]"
      >
        {/* Row 1 — KPI tiles */}
        <div className="lg:col-span-3">
          <PriceCard data={data} accent={accent} up={up} />
        </div>
        <div className="lg:col-span-3">
          <DayRangeCard data={data} />
        </div>
        <div className="lg:col-span-3">
          <Week52Card data={data} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <RiskScoreCard data={data} />
        </div>

        {/* Row 2 — Main chart + RSI + Watchlist */}
        <GlassCard className="sm:col-span-2 lg:col-span-8 lg:h-full lg:min-h-0 !p-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Close · {tf}</Pill>
              <span className="flex items-center gap-1 text-[10px] text-white/60">
                <span className="h-0.5 w-3 rounded-full bg-[var(--aurora-accent)]" /> SMA20
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/60">
                <span className="h-0.5 w-3 rounded-full bg-[var(--aurora-warn)]" /> SMA50
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Alpha Vantage
            </span>
          </div>
          <div className="relative mt-2 min-h-[220px] flex-[1.6] lg:min-h-0">
            {slicedSeries.length > 1 ? (
              <MainPriceChart series={slicedSeries} up={up} />
            ) : (
              <Skeleton />
            )}
          </div>
          <div className="mt-2 flex shrink-0 items-center justify-between">
            <Pill className="!px-2.5 !py-0.5 !text-[10px]">RSI(14)</Pill>
            <span className="text-[10px] text-white/45">30 oversold · 70 overbought</span>
          </div>
          <div className="relative mt-1 min-h-[100px] flex-1 lg:min-h-0">
            {slicedSeries.length > 14 ? <RsiChart series={slicedSeries} /> : <Skeleton />}
          </div>
        </GlassCard>

        <GlassCard className="sm:col-span-2 lg:col-span-4 lg:h-full lg:min-h-0 !p-4">
          <div className="flex shrink-0 items-center justify-between">
            <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Watchlist</Pill>
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">6 symbols</span>
          </div>
          <div className="mt-2 flex min-h-[240px] flex-1 flex-col lg:min-h-0">
            {watch && watch.length ? (
              <Watchlist
                rows={watch}
                active={symbol}
                onSelect={(s) => setSymbol(s as (typeof TICKERS)[number])}
              />
            ) : (
              <Skeleton />
            )}
          </div>
        </GlassCard>

        {/* Row 3 — Fundamentals + Alerts */}
        <div className="lg:col-span-3">
          <ValuationCard data={data} />
        </div>
        <div className="lg:col-span-3">
          <ProfitabilityCard data={data} />
        </div>
        <div className="lg:col-span-3">
          <SentimentCard data={data} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <AlertEngine data={data} />
        </div>
      </motion.div>
    </div>
  );
}

function Skeleton() {
  return <div className="glass-soft h-full w-full animate-pulse rounded-2xl" />;
}

function PriceCard({
  data,
  accent,
  up,
}: {
  data: TickerSnapshot | undefined;
  accent: string;
  up: boolean;
}) {
  const spark = (data?.series ?? []).slice(-30).map((p) => p.close);
  return (
    <GlassCard className="lg:h-full lg:min-h-0 justify-between !p-4">
      <div className="flex shrink-0 items-center justify-between">
        <Pill className="!px-2.5 !py-1 !text-[11px] text-white/70">Price</Pill>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          {data?.symbol ?? ""}
        </span>
      </div>
      <div className="mt-1">
        <div
          className="text-2xl font-semibold tabular-nums text-white"
          style={{ textShadow: `0 0 18px ${accent}33` }}
        >
          {data ? `$${formatNum(data.price)}` : "—"}
        </div>
        <div className="mt-0.5 text-[11px] font-semibold tabular-nums" style={{ color: accent }}>
          {data
            ? `${up ? "▲" : "▼"} ${formatNum(Math.abs(data.change))} (${formatPct(data.changePct)})`
            : "—"}
        </div>
      </div>
      <div className="mt-2 h-7 shrink-0">
        {spark.length > 1 ? <Sparkline values={spark} up={up} height={28} /> : null}
      </div>
    </GlassCard>
  );
}

function DayRangeCard({ data }: { data: TickerSnapshot | undefined }) {
  const pos =
    data && data.dayHigh > data.dayLow
      ? ((data.price - data.dayLow) / (data.dayHigh - data.dayLow)) * 100
      : 50;
  return (
    <GlassCard className="lg:h-full lg:min-h-0 justify-between !p-4">
      <Pill className="self-start !px-2.5 !py-1 !text-[11px] text-white/70">Day range</Pill>
      <div className="mt-1">
        <div className="flex items-baseline justify-between text-[11px] tabular-nums text-white/80">
          <span>L ${formatNum(data?.dayLow ?? null)}</span>
          <span>H ${formatNum(data?.dayHigh ?? null)}</span>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-white/15">
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
            style={{
              left: `${Math.max(0, Math.min(100, pos))}%`,
              transform: "translate(-50%, -50%)",
              background: "var(--aurora-accent)",
              boxShadow: "0 0 12px var(--aurora-accent-glow)",
            }}
          />
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
          Vol {formatCompact(data?.volume ?? null)} · Open ${formatNum(data?.open ?? null)}
        </div>
      </div>
    </GlassCard>
  );
}

function Week52Card({ data }: { data: TickerSnapshot | undefined }) {
  const pos =
    data && data.week52High && data.week52Low && data.week52High > data.week52Low
      ? ((data.price - data.week52Low) / (data.week52High - data.week52Low)) * 100
      : 50;
  return (
    <GlassCard className="lg:h-full lg:min-h-0 justify-between !p-4">
      <Pill className="self-start !px-2.5 !py-1 !text-[11px] text-white/70">52w range</Pill>
      <div className="mt-1">
        <div className="flex items-baseline justify-between text-[11px] tabular-nums text-white/80">
          <span>${formatNum(data?.week52Low ?? null)}</span>
          <span>${formatNum(data?.week52High ?? null)}</span>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-white/15">
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              width: `${Math.max(2, Math.min(100, pos))}%`,
              background:
                "linear-gradient(90deg, var(--aurora-accent), color-mix(in oklab, var(--aurora-accent) 60%, white))",
            }}
          />
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
          β {formatNum(data?.beta ?? null)} · Mkt {formatCompact(data?.marketCap ?? null)}
        </div>
      </div>
    </GlassCard>
  );
}

function ValuationCard({ data }: { data: TickerSnapshot | undefined }) {
  return (
    <GlassCard className="lg:h-full lg:min-h-0 !p-4">
      <Pill className="shrink-0 !px-3 !py-1 !text-[12px] !font-semibold">Valuation</Pill>
      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-around">
        <Metric
          label="P/E"
          value={formatNum(data?.peRatio ?? null)}
          verdict={classifyPE(data?.peRatio ?? null)}
          hint="<15 good"
        />
        <Metric
          label="P/B"
          value={formatNum(data?.pbRatio ?? null)}
          verdict={classifyPB(data?.pbRatio ?? null)}
          hint="<1 good"
        />
        <Metric
          label="PEG"
          value={formatNum(data?.pegRatio ?? null)}
          verdict={classifyPEG(data?.pegRatio ?? null)}
          hint="<1 good"
        />
        <Metric
          label="EV/EBITDA"
          value={formatNum(data?.evToEbitda ?? null)}
          verdict={classifyPE(data?.evToEbitda ?? null)}
        />
      </div>
    </GlassCard>
  );
}

function ProfitabilityCard({ data }: { data: TickerSnapshot | undefined }) {
  return (
    <GlassCard className="lg:h-full lg:min-h-0 !p-4">
      <Pill className="shrink-0 !px-3 !py-1 !text-[12px] !font-semibold">Profitability</Pill>
      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-around">
        <Metric
          label="Gross margin"
          value={formatPct(data?.grossMargin ?? null, 1)}
          verdict={classifyMargin(data?.grossMargin ?? null, 0.4)}
        />
        <Metric
          label="Op. margin"
          value={formatPct(data?.operatingMargin ?? null, 1)}
          verdict={classifyMargin(data?.operatingMargin ?? null, 0.15)}
        />
        <Metric
          label="Net margin"
          value={formatPct(data?.profitMargin ?? null, 1)}
          verdict={classifyMargin(data?.profitMargin ?? null, 0.1)}
        />
        <Metric
          label="ROE"
          value={formatPct(data?.roe ?? null, 1)}
          verdict={classifyROE(data?.roe ?? null)}
        />
      </div>
    </GlassCard>
  );
}

function SentimentCard({ data }: { data: TickerSnapshot | undefined }) {
  const distFromHigh =
    data?.week52High && data.price ? (data.price - data.week52High) / data.week52High : null;
  const macdBull =
    data?.macd !== null && data?.macdSignal !== null && data ? data.macd > data.macdSignal : null;
  return (
    <GlassCard className="lg:h-full lg:min-h-0 !p-4">
      <Pill className="shrink-0 !px-3 !py-1 !text-[12px] !font-semibold">Sentiment</Pill>
      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-around">
        <Metric
          label="RSI(14)"
          value={formatNum(data?.rsi14 ?? null, 1)}
          verdict={classifyRSI(data?.rsi14 ?? null)}
          hint=">70 hot"
        />
        <Metric
          label="MACD"
          value={data?.macd !== null && data?.macd !== undefined ? data.macd.toFixed(2) : "—"}
          verdict={macdBull === null ? "neutral" : macdBull ? "good" : "bad"}
          hint={macdBull === null ? undefined : macdBull ? "bull" : "bear"}
        />
        <Metric
          label="vs 52w high"
          value={formatPct(distFromHigh, 1)}
          verdict={
            distFromHigh === null
              ? "neutral"
              : distFromHigh >= -0.05
                ? "good"
                : distFromHigh >= -0.2
                  ? "warn"
                  : "bad"
          }
        />
        <Metric
          label="Beta"
          value={formatNum(data?.beta ?? null)}
          verdict={classifyBeta(data?.beta ?? null)}
          hint="vs S&P"
        />
      </div>
    </GlassCard>
  );
}
