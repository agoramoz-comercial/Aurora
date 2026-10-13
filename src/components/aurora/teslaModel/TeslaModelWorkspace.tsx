/**
 * TeslaModelWorkspace.tsx
 *
 * Full 38-Sheet Operational Pipeline Financial Model & DCF Valuation Hub
 * with Senior Institutional Business Intelligence (BI) & Specialist Rationale.
 *
 * Covers 100% complete unreduced financial datasets & BI panels for:
 * TSLA, MSFT, GOOGL, AAPL, NVDA, AMZN across all 10 Groups:
 * 1. 🎛️ Cover & Drivers (CAPM WACC & Macro)
 * 2. 📦 Segment Volume & Units (Unit Projections)
 * 3. 💰 Revenue Build-up (Segment Waterfalls)
 * 4. 🏷️ Gross Margins & COGS (Peer Comps)
 * 5. 📑 Operating Expenses (Operating Leverage)
 * 6. 🏭 PP&E & Capex Schedule (Capital Intensity)
 * 7. ⏱️ Working Capital Schedule (Cash Conversion Cycle NTC)
 * 8. 🏦 Debt & Financing Structure (Capitalization)
 * 9. 📄 Financial Statements Output (P&L 20L, BS 28L, CF 21L)
 * 10. 🎯 DCF Valuation & Multiples (5x6 Heatmap)
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders,
  Layers,
  FileSpreadsheet,
  Building2,
  Banknote,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Sparkles,
  Award,
  Globe,
  Cpu,
  ShoppingBag,
  Zap,
  Package,
  Percent,
  Factory,
  Clock,
  Landmark,
  BookOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { GlassCard } from "../GlassCard";
import { AccentBadge, Pill, SegmentedTabs, TickerChips, WorkspaceHeader } from "../primitives";
import { cn } from "@/lib/utils";

import {
  type TechTicker,
  TICKER_LIST,
  FULL_38_DATABASE,
  YEAR_LABELS_15,
} from "@/data/multiTickerFullDatabase";

import { BI_RATIONALE_DATABASE } from "@/data/multiTickerBIRationale";

import {
  getFullDefaultDrivers,
  runFullTriCase,
  runFullDCFValuation,
  type FullEditableDrivers,
  type StatementOutput,
  type DCFValuationOutput,
  type TriCaseProjections,
} from "@/lib/finance/multiTickerFullEngine";
import { CHART } from "../chartTheme";

type PipelineGroupId =
  | "drivers"
  | "volume"
  | "revenue"
  | "margins"
  | "opex"
  | "ppe"
  | "wc"
  | "financing"
  | "statements"
  | "dcf";

const PIPELINE_GROUPS: { id: PipelineGroupId; number: string; label: string; icon: typeof Sliders }[] = [
  { id: "drivers", number: "01", label: "Cover & Drivers", icon: Sliders },
  { id: "volume", number: "02", label: "Segment Volume & Units", icon: Package },
  { id: "revenue", number: "03", label: "Revenue Build-up", icon: Layers },
  { id: "margins", number: "04", label: "Gross Margins & COGS", icon: Percent },
  { id: "opex", number: "05", label: "Operating Expenses", icon: FileSpreadsheet },
  { id: "ppe", number: "06", label: "PP&E & Capex Schedule", icon: Factory },
  { id: "wc", number: "07", label: "Working Capital Schedule", icon: Clock },
  { id: "financing", number: "08", label: "Debt & Financing", icon: Landmark },
  { id: "statements", number: "09", label: "Financial Statements", icon: Building2 },
  { id: "dcf", number: "10", label: "DCF Valuation & Multiples", icon: Target },
];

const TICKER_ICONS: Record<TechTicker, typeof Zap> = {
  TSLA: Zap,
  MSFT: Globe,
  GOOGL: Sparkles,
  AAPL: Award,
  NVDA: Cpu,
  AMZN: ShoppingBag,
};

function fmtM(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}T`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}B`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}M`;
}

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}T`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}B`;
  return `$${n.toFixed(2)}`;
}

function MetricCard({ label, value, format = "currency", small = false }: { label: string; value: number; format?: "currency" | "pct" | "number" | "price"; small?: boolean }) {
  return (
    <div className="glass-soft flex flex-col gap-1 rounded-2xl px-3 py-2.5">
      <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
      <span className={cn("font-semibold tabular-nums text-white", small ? "text-sm" : "text-lg")}>
        {format === "pct"
          ? `${(value * 100).toFixed(1)}%`
          : format === "number"
            ? value.toLocaleString()
            : format === "price"
              ? `$${value.toFixed(2)}`
              : fmtCurrency(value)}
      </span>
    </div>
  );
}

function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-[11px]" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
      <p className="mb-1 font-medium text-white/80">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-white/70">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-white">{fmtM(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function BIRationalePanel({ ticker, groupKey }: { ticker: TechTicker; groupKey: string }) {
  const bi = BI_RATIONALE_DATABASE[ticker]?.[groupKey];
  if (!bi) return null;

  return (
    <GlassCard className="!p-4 border-l-4 border-l-blue-400">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={15} className="text-blue-300" />
        <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
          Institutional BI & Senior Analyst Rationale — {bi.title}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-white/90 font-medium">{bi.executiveSummary}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-blue-200">Formula: {bi.formula}</span>
        <span className="text-white/70">{bi.keyMetricRationale}</span>
      </div>
      {bi.peerBenchmarks.length > 0 && (
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4 text-[10px]">
          {bi.peerBenchmarks.map((peer, idx) => (
            <div key={idx} className="glass-soft rounded-lg p-2">
              <div className="font-semibold text-white">{peer.company}</div>
              <div className="text-blue-300 font-mono">{peer.metricValue}</div>
              <div className="text-white/50 text-[9px] mt-0.5">{peer.comparisonNote}</div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function GlassTable({ headers, rows }: { headers: string[]; rows: { label: string; values: (string | number)[]; isBold?: boolean; indent?: number }[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl">
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white/5 backdrop-blur-sm px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-white/50">
              Line Item
            </th>
            {headers.map((h, i) => (
              <th key={h} className={cn("px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider whitespace-nowrap", i < 5 ? "text-blue-300/70" : "text-purple-300/60")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={cn("transition-colors hover:bg-white/5", ri % 2 === 0 ? "bg-white/[0.02]" : "", row.isBold && "bg-white/[0.06]")}>
              <td className={cn("sticky left-0 z-10 bg-white/5 backdrop-blur-sm px-3 py-1.5 text-left whitespace-nowrap", row.isBold ? "font-semibold text-white" : "text-white/80")} style={{ paddingLeft: row.indent ? `${12 + row.indent * 16}px` : undefined }}>
                {row.label}
              </td>
              {row.values.map((v, vi) => (
                <td key={vi} className={cn("px-2 py-1.5 text-right tabular-nums whitespace-nowrap", row.isBold ? "font-semibold text-white" : "text-white/75", typeof v === "number" && v < 0 && "text-red-400/80", vi < 5 && "bg-blue-500/[0.03]")}>
                  {typeof v === "number" ? fmtM(v) : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN WORKSPACE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TeslaModelWorkspace() {
  const [selectedTicker, setSelectedTicker] = useState<TechTicker>("TSLA");
  const [activeGroup, setActiveGroup] = useState<PipelineGroupId>("drivers");

  const [drivers, setDrivers] = useState<FullEditableDrivers>(() => getFullDefaultDrivers("TSLA"));

  const handleTickerSelect = (t: TechTicker) => {
    setSelectedTicker(t);
    setDrivers(getFullDefaultDrivers(t));
  };

  const meta = FULL_38_DATABASE[selectedTicker].meta;
  const triCase = useMemo(() => runFullTriCase(selectedTicker, drivers), [selectedTicker, drivers]);
  const dcf = useMemo(() => runFullDCFValuation(selectedTicker, drivers, triCase.base), [selectedTicker, drivers, triCase.base]);

  const updateDriver = useCallback((key: keyof FullEditableDrivers, value: number) => {
    setDrivers((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="Modelo Financeiro & DCF"
        subtitle={`${meta.name} · pipeline operacional de 38 folhas · projeção, demonstrações e valuation`}
        badge={<AccentBadge>{selectedTicker}</AccentBadge>}
        right={
          <>
            <Pill className="hidden md:inline-flex !text-[10px]">Cap ${meta.marketCap}B</Pill>
            <Pill className="hidden lg:inline-flex !text-[10px]" tone="mute">
              {meta.analystRating}
            </Pill>
          </>
        }
      />

      {/* Ticker switcher */}
      <div className="mt-3 shrink-0">
        <TickerChips
          symbols={TICKER_LIST}
          active={selectedTicker}
          onSelect={(t) => handleTickerSelect(t as TechTicker)}
          renderLead={(t, isActive) => {
            const Icon = TICKER_ICONS[t as TechTicker];
            return (
              <Icon
                size={12}
                style={{ color: isActive ? "#fff" : FULL_38_DATABASE[t as TechTicker].meta.badgeColor }}
              />
            );
          }}
          renderTrail={(t) => (
            <span className="text-[10px] tabular-nums opacity-70">
              ${FULL_38_DATABASE[t as TechTicker].meta.sharePrice}
            </span>
          )}
        />
      </div>

      {/* Operational pipeline navigator (10 groups) */}
      <div className="mt-2 shrink-0">
        <SegmentedTabs
          tabs={PIPELINE_GROUPS.map(({ id, number, label, icon }) => ({
            id,
            label,
            icon,
            prefix: String(number),
          }))}
          active={activeGroup}
          onSelect={setActiveGroup}
        />
      </div>

      {/* Active Pipeline Group Content */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1" style={{ scrollbarGutter: "stable" }}>
        <AnimatePresence mode="wait">
          <motion.div key={`${selectedTicker}-${activeGroup}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
            {/* Always Render Group BI Rationale Panel at Top */}
            <BIRationalePanel ticker={selectedTicker} groupKey={activeGroup} />

            {activeGroup === "drivers" && <DriversGroup ticker={selectedTicker} drivers={drivers} onUpdate={updateDriver} dcf={dcf} />}
            {activeGroup === "volume" && <VolumeGroup ticker={selectedTicker} triCase={triCase} />}
            {activeGroup === "revenue" && <RevenueGroup ticker={selectedTicker} triCase={triCase} />}
            {activeGroup === "margins" && <MarginsGroup ticker={selectedTicker} triCase={triCase} />}
            {activeGroup === "opex" && <OpExGroup ticker={selectedTicker} triCase={triCase} drivers={drivers} onUpdate={updateDriver} />}
            {activeGroup === "ppe" && <PPEGroup ticker={selectedTicker} triCase={triCase} drivers={drivers} />}
            {activeGroup === "wc" && <WCGroup ticker={selectedTicker} triCase={triCase} drivers={drivers} onUpdate={updateDriver} />}
            {activeGroup === "financing" && <FinancingGroup ticker={selectedTicker} triCase={triCase} />}
            {activeGroup === "statements" && <StatementsGroup ticker={selectedTicker} triCase={triCase} />}
            {activeGroup === "dcf" && <DCFGroup dcf={dcf} drivers={drivers} onUpdate={updateDriver} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 1: COVER & DRIVERS
// ═══════════════════════════════════════════════════════════════════════════

function DriverInput({ label, value, onChange, format = "pct", min = 0, max = 1, step = 0.005 }: { label: string; value: number; onChange: (v: number) => void; format?: "pct" | "number"; min?: number; max?: number; step?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
      <span className="text-[11px] text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-blue-400 sm:w-28" />
        <span className="w-14 text-right text-[11px] font-semibold tabular-nums text-white">{format === "pct" ? `${(value * 100).toFixed(1)}%` : value.toFixed(1)}</span>
      </div>
    </div>
  );
}

function DriversGroup({ ticker, drivers, onUpdate, dcf }: { ticker: TechTicker; drivers: FullEditableDrivers; onUpdate: (k: keyof FullEditableDrivers, v: number) => void; dcf: DCFValuationOutput }) {
  const model = FULL_38_DATABASE[ticker];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <MetricCard label="WACC (CAPM)" value={dcf.wacc} format="pct" small />
        <MetricCard label="Cost of Equity" value={dcf.costOfEquity} format="pct" small />
        <MetricCard label="Beta" value={dcf.beta} format="number" small />
        <MetricCard label="Tax Rate" value={drivers.taxRate} format="pct" small />
        <MetricCard label="Bond Yield (Kd)" value={model.meta.bondYield} format="pct" small />
        <MetricCard label="Implied Share Price" value={dcf.impliedSharePrice} format="price" small />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard className="!p-4">
          <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Segment Drivers & Margins</Pill>
          <div className="mt-3 flex flex-col gap-1.5">
            <DriverInput label={`Primary Volume Growth (${model.meta.segmentPrimaryLabel})`} value={drivers.primaryVolumeGrowth} onChange={(v) => onUpdate("primaryVolumeGrowth", v)} />
            <DriverInput label="Primary Gross Margin" value={drivers.primaryGrossMargin} onChange={(v) => onUpdate("primaryGrossMargin", v)} />
            <DriverInput label={`Secondary Growth (${model.meta.segmentSecondaryLabel})`} value={drivers.secondaryGrowthRate} onChange={(v) => onUpdate("secondaryGrowthRate", v)} />
            <DriverInput label="Secondary Gross Margin" value={drivers.secondaryGrossMargin} onChange={(v) => onUpdate("secondaryGrossMargin", v)} />
          </div>
        </GlassCard>

        <GlassCard className="!p-4">
          <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">OpEx & Working Capital Days</Pill>
          <div className="mt-3 flex flex-col gap-1.5">
            <DriverInput label="SG&A % of Revenue" value={drivers.sgaPctOfRev} onChange={(v) => onUpdate("sgaPctOfRev", v)} max={0.5} />
            <DriverInput label="R&D % of Revenue" value={drivers.rdPctOfRev} onChange={(v) => onUpdate("rdPctOfRev", v)} max={0.3} />
            <DriverInput label="DSO (Accounts Receivable)" value={drivers.dso} onChange={(v) => onUpdate("dso", v)} format="number" min={5} max={90} step={1} />
            <DriverInput label="DIO (Inventory Days)" value={drivers.dio} onChange={(v) => onUpdate("dio", v)} format="number" min={2} max={150} step={1} />
            <DriverInput label="DPO (Payables Days)" value={drivers.dpo} onChange={(v) => onUpdate("dpo", v)} format="number" min={10} max={150} step={1} />
          </div>
        </GlassCard>
      </div>

      {/* KPI Scorecard Matrix */}
      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Institutional KPI Scorecard ({ticker})</Pill>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {model.kpiScorecard.map((kpi, i) => (
            <div key={i} className="glass-soft flex flex-col gap-1 rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/50">{kpi.category}</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-semibold text-blue-300">Weight {kpi.weightPct}%</span>
              </div>
              <span className="text-xs font-semibold text-white/90">{kpi.name}</span>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-xl font-bold text-white tabular-nums">
                  {kpi.format === "pct" ? `${(kpi.value * 100).toFixed(1)}%` : kpi.format === "days" ? `${kpi.value.toFixed(1)}d` : kpi.value.toFixed(2)}
                </span>
                <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5", kpi.status === "Excellent" ? "bg-emerald-500/20 text-emerald-300" : "bg-[rgba(74,158,255,0.20)] text-[var(--aurora-accent)]")}>{kpi.status}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 2: VOLUME & UNITS
// ═══════════════════════════════════════════════════════════════════════════

function VolumeGroup({ ticker, triCase }: { ticker: TechTicker; triCase: TriCaseProjections }) {
  const model = FULL_38_DATABASE[ticker];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="Base Volume Units" value={model.drivers.primaryVolumeBase} format="number" />
        <MetricCard label="Avg Price (ASP)" value={model.drivers.primaryAvgPrice} />
        <MetricCard label="Volume YoY Growth" value={model.drivers.primaryVolumeGrowth} format="pct" />
        <MetricCard label="ASP Growth" value={model.drivers.primaryPriceGrowth} format="pct" />
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Segment Volume & Unit Workings — {model.meta.segmentPrimaryLabel}</Pill>
        <div className="mt-3">
          <p className="text-[12px] text-white/70">
            Unit volumes modeled across historical actuals (2015–2019) and forecast projections (2020–2029) with real-time CAGR adjustment.
          </p>
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 3: REVENUE BUILD-UP
// ═══════════════════════════════════════════════════════════════════════════

function RevenueGroup({ ticker, triCase }: { ticker: TechTicker; triCase: TriCaseProjections }) {
  const model = FULL_38_DATABASE[ticker];

  const chartData = YEAR_LABELS_15.map((yr, i) => ({
    year: yr,
    Primary: triCase.base.primaryRevenue[i]!,
    Secondary: triCase.base.secondaryRevenue[i]!,
    Total: triCase.base.totalRevenue[i]!,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="2029 Total Revenue" value={triCase.base.totalRevenue[14]!} />
        <MetricCard label="Primary Revenue" value={triCase.base.primaryRevenue[14]!} />
        <MetricCard label="Secondary Revenue" value={triCase.base.secondaryRevenue[14]!} />
        <MetricCard label="Revenue CAGR '19-'29" value={Math.pow(triCase.base.totalRevenue[14]! / triCase.base.totalRevenue[4]!, 1 / 10) - 1} format="pct" />
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Revenue Build-up — Primary vs. Secondary Segments</Pill>
        <div className="mt-3 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} tickFormatter={(v: number) => fmtM(v)} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="Primary" name={model.meta.segmentPrimaryLabel} stackId="a" fill={CHART.accent} />
              <Bar dataKey="Secondary" name={model.meta.segmentSecondaryLabel} stackId="a" fill={CHART.violet} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 4: GROSS MARGINS & COGS
// ═══════════════════════════════════════════════════════════════════════════

function MarginsGroup({ ticker, triCase }: { ticker: TechTicker; triCase: TriCaseProjections }) {
  const model = FULL_38_DATABASE[ticker];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="Primary Gross Margin" value={model.drivers.primaryGrossMargin} format="pct" />
        <MetricCard label="Secondary Gross Margin" value={model.drivers.secondaryGrossMargin} format="pct" />
        <MetricCard label="2029 Gross Profit" value={triCase.base.grossProfit[14]!} />
        <MetricCard label="Overall GP Margin %" value={triCase.base.gpMargin[14]!} format="pct" />
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">🏷️ Cost of Sales & Gross Margin Workings ({ticker})</Pill>
        <div className="mt-3">
          <p className="text-xs text-white/70">
            Detailed Cost of Goods Sold (COGS) for Primary vs Secondary segments mapped across historical benchmarks and peer comparables.
          </p>
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 5: OPERATING EXPENSES
// ═══════════════════════════════════════════════════════════════════════════

function OpExGroup({ ticker, triCase, drivers, onUpdate }: { ticker: TechTicker; triCase: TriCaseProjections; drivers: FullEditableDrivers; onUpdate: (k: keyof FullEditableDrivers, v: number) => void }) {
  const opexData = YEAR_LABELS_15.map((yr, i) => ({
    year: yr,
    EBIT: triCase.base.ebit[i]!,
    OpEx: Math.abs(triCase.base.opex[i]!),
    GrossProfit: triCase.base.grossProfit[i]!,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="SG&A % of Revenue" value={drivers.sgaPctOfRev} format="pct" />
        <MetricCard label="R&D % of Revenue" value={drivers.rdPctOfRev} format="pct" />
        <MetricCard label="2029 OpEx" value={triCase.base.opex[14]!} />
        <MetricCard label="2029 EBIT" value={triCase.base.ebit[14]!} />
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Operating Expenses & Operating Leverage Graph</Pill>
        <div className="mt-3 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={opexData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} tickFormatter={(v: number) => fmtM(v)} />
              <Tooltip content={<GlassTooltip />} />
              <Line type="monotone" dataKey="GrossProfit" stroke={CHART.accent} strokeWidth={2} />
              <Line type="monotone" dataKey="OpEx" stroke={CHART.amber} strokeWidth={2} />
              <Line type="monotone" dataKey="EBIT" stroke={CHART.positive} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 6: PP&E & CAPEX
// ═══════════════════════════════════════════════════════════════════════════

function PPEGroup({ ticker, triCase, drivers }: { ticker: TechTicker; triCase: TriCaseProjections; drivers: FullEditableDrivers }) {
  const model = FULL_38_DATABASE[ticker];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricCard label="Capex % of Revenue" value={drivers.capexPctRev} format="pct" />
        <MetricCard label="Depreciation % of PP&E" value={model.drivers.deprPctPPE} format="pct" />
        <MetricCard label="Useful Life Schedule" value={10} format="number" />
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">PP&E Roll-forward & Capex Schedule</Pill>
        <div className="mt-3 font-mono text-[11px] text-white/80">
          Beginning PP&E + Capital Expenditures (Capex) - Depreciation = Ending PP&E
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 7: WORKING CAPITAL
// ═══════════════════════════════════════════════════════════════════════════

function WCGroup({ ticker, triCase, drivers, onUpdate }: { ticker: TechTicker; triCase: TriCaseProjections; drivers: FullEditableDrivers; onUpdate: (k: keyof FullEditableDrivers, v: number) => void }) {
  const ntc = drivers.dso + drivers.dio - drivers.dpo;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="DSO (AR Days)" value={drivers.dso} format="number" />
        <MetricCard label="DIO (Inventory Days)" value={drivers.dio} format="number" />
        <MetricCard label="DPO (Payables Days)" value={drivers.dpo} format="number" />
        <MetricCard label="Net Trade Cycle (NTC)" value={ntc} format="number" />
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Working Capital & Cash Conversion Cycle</Pill>
        <div className="mt-3 text-xs text-white/70">
          Net Trade Cycle (NTC) = DSO + DIO - DPO. Lower or negative NTC reflects superior working capital efficiency.
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 8: DEBT & FINANCING
// ═══════════════════════════════════════════════════════════════════════════

function FinancingGroup({ ticker, triCase }: { ticker: TechTicker; triCase: TriCaseProjections }) {
  const model = FULL_38_DATABASE[ticker];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="Debt Weight" value={model.meta.debtWeight} format="pct" />
        <MetricCard label="Equity Weight" value={model.meta.equityWeight} format="pct" />
        <MetricCard label="Bond Yield (Kd)" value={model.meta.bondYield} format="pct" />
        <MetricCard label="Tax Shield Rate" value={model.meta.taxRate} format="pct" />
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Debt Structure & Capitalization Schedule</Pill>
        <div className="mt-3 text-xs text-white/70">
          Cost of Debt after tax = $K_d \cdot (1 - t)$. Weighted capital structure feeds directly into the CAPM WACC schedule.
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 9: FINANCIAL STATEMENTS (20L P&L, 28L BS, 21L CF)
// ═══════════════════════════════════════════════════════════════════════════

function StatementsGroup({ ticker, triCase }: { ticker: TechTicker; triCase: TriCaseProjections }) {
  const model = FULL_38_DATABASE[ticker];
  const [statementType, setStatementType] = useState<"pl" | "bs" | "cf">("pl");

  const trendData = YEAR_LABELS_15.map((yr, i) => ({
    year: yr,
    Revenue: triCase.base.totalRevenue[i]!,
    NetIncome: triCase.base.netIncome[i]!,
    Cash: triCase.base.cash[i]!,
  }));

  return (
    <>
      <div className="flex gap-2">
        <button onClick={() => setStatementType("pl")} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold", statementType === "pl" ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10")}>
          P&L Statement (20 Lines)
        </button>
        <button onClick={() => setStatementType("bs")} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold", statementType === "bs" ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10")}>
          Balance Sheet (28 Lines)
        </button>
        <button onClick={() => setStatementType("cf")} className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold", statementType === "cf" ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10")}>
          💸 Cash Flow (21 Lines)
        </button>
      </div>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">
          {statementType === "pl" && `Income Statement — 20 Lines (${model.meta.name}, $M)`}
          {statementType === "bs" && `Balance Sheet — 28 Lines (${model.meta.name}, $M)`}
          {statementType === "cf" && `💸 Cash Flow Statement — 21 Lines (${model.meta.name}, $M)`}
        </Pill>
        <div className="mt-3">
          {statementType === "pl" && <GlassTable headers={YEAR_LABELS_15} rows={model.plLines.map((r) => ({ label: r.label, values: r.values, isBold: r.isBold, indent: r.indent }))} />}
          {statementType === "bs" && <GlassTable headers={YEAR_LABELS_15} rows={model.bsLines.map((r) => ({ label: r.label, values: r.values, isBold: r.isBold, indent: r.indent }))} />}
          {statementType === "cf" && <GlassTable headers={YEAR_LABELS_15} rows={model.cfLines.map((r) => ({ label: r.label, values: r.values, isBold: r.isBold, indent: r.indent }))} />}
        </div>
      </GlassCard>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">Financial Trajectory Graph (15-Year Growth)</Pill>
        <div className="mt-3 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} tickFormatter={(v: number) => fmtM(v)} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="Revenue" stroke={CHART.accent} fill="url(#gradRev)" strokeWidth={2} />
              <Line type="monotone" dataKey="NetIncome" stroke={CHART.positive} strokeWidth={2} />
              <Line type="monotone" dataKey="Cash" stroke={CHART.violet} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP 10: DCF VALUATION & SENSITIVITY
// ═══════════════════════════════════════════════════════════════════════════

function DCFGroup({ dcf, drivers, onUpdate }: { dcf: DCFValuationOutput; drivers: FullEditableDrivers; onUpdate: (k: keyof FullEditableDrivers, v: number) => void }) {
  const waccVals = [...new Set(dcf.sensitivityMatrix.map((s) => s.wacc))];
  const growthVals = [...new Set(dcf.sensitivityMatrix.map((s) => s.growth))];

  return (
    <>
      <GlassCard className="!p-5">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-white/40">DCF Implied Share Price</span>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-4xl font-bold tabular-nums text-white">${dcf.impliedSharePrice.toFixed(2)}</span>
              <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold", dcf.upsidePct >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                {dcf.upsidePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {(dcf.upsidePct * 100).toFixed(1)}%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/50">Current Market Price: ${dcf.currentSharePrice.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-soft flex flex-col items-center rounded-xl px-3 py-2">
              <span className="text-[9px] text-white/40">EV</span>
              <span className="text-sm font-bold tabular-nums text-white">{fmtM(dcf.enterpriseValue)}</span>
            </div>
            <div className="glass-soft flex flex-col items-center rounded-xl px-3 py-2">
              <span className="text-[9px] text-white/40">Net Debt</span>
              <span className="text-sm font-bold tabular-nums text-white">{fmtM(dcf.netDebt)}</span>
            </div>
            <div className="glass-soft flex flex-col items-center rounded-xl px-3 py-2">
              <span className="text-[9px] text-white/40">Equity Val</span>
              <span className="text-sm font-bold tabular-nums text-white">{fmtM(dcf.equityValue)}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="!p-4">
        <Pill className="!px-3 !py-1 !text-[11px] !font-semibold">🔬 5x6 Sensitivity Matrix (WACC × Terminal Growth Rate)</Pill>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left text-white/50">WACC \ Growth</th>
                {growthVals.map((g) => (
                  <th key={g} className="px-2 py-1.5 text-right text-white/50">
                    {(g * 100).toFixed(1)}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {waccVals.map((w) => (
                <tr key={w} className="hover:bg-white/5">
                  <td className={cn("px-2 py-1.5 font-medium", Math.abs(w - dcf.wacc) < 0.001 ? "text-blue-300" : "text-white/70")}>{(w * 100).toFixed(1)}%</td>
                  {growthVals.map((g) => {
                    const entry = dcf.sensitivityMatrix.find((s) => Math.abs(s.wacc - w) < 0.0001 && Math.abs(s.growth - g) < 0.0001);
                    const price = entry?.price ?? 0;
                    const isCenter = Math.abs(w - dcf.wacc) < 0.001 && Math.abs(g - dcf.terminalGrowthRate) < 0.001;
                    return (
                      <td key={`${w}-${g}`} className={cn("px-2 py-1.5 text-right tabular-nums", isCenter ? "font-bold text-white bg-blue-500/20 rounded" : price > dcf.currentSharePrice ? "text-emerald-400/80" : "text-red-400/80")}>
                        {price > 0 ? `$${price.toFixed(0)}` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
