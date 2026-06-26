import { useState } from "react";
import { GlassCard } from "../../GlassCard";
import { Pill } from "../../primitives";
import {
  evaluateAlerts,
  getAlertCounts,
  type AlertCategory,
  type AlertSeverity,
  type TriggeredAlert,
} from "@/data/alertsEngine";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Globe,
  Building2,
  Atom,
  Heart,
  Filter,
} from "lucide-react";

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { icon: typeof ShieldAlert; color: string; bg: string; border: string }
> = {
  critical: {
    icon: ShieldAlert,
    color: "#FF4D4F",
    bg: "rgba(255, 77, 79, 0.08)",
    border: "rgba(255, 77, 79, 0.2)",
  },
  warning: {
    icon: AlertTriangle,
    color: "#FFB020",
    bg: "rgba(255, 176, 32, 0.08)",
    border: "rgba(255, 176, 32, 0.2)",
  },
  info: {
    icon: Info,
    color: "#4a9eff",
    bg: "rgba(74, 158, 255, 0.08)",
    border: "rgba(74, 158, 255, 0.2)",
  },
};

const CATEGORY_CONFIG: Record<AlertCategory, { icon: typeof Globe; label: string; color: string }> =
  {
    macro: { icon: Globe, label: "Macro", color: "#8B5CF6" },
    micro: { icon: Building2, label: "Micro", color: "#3B82F6" },
    nano: { icon: Atom, label: "Nano", color: "#EC4899" },
    sentiment: { icon: Heart, label: "Sentiment", color: "#FFB020" },
  };

type CategoryFilter = "all" | AlertCategory;
type SeverityFilter = "all" | AlertSeverity;

export function AlertsTab() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const allAlerts = evaluateAlerts();
  const counts = getAlertCounts();

  const filtered = allAlerts.filter((a) => {
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Alerts Engine</Pill>
          <span className="text-[10px] text-white/50">{allAlerts.length} active alerts</span>
        </div>
      </div>

      {/* Alert Count Summary */}
      <div className="grid grid-cols-3 gap-2">
        {(["critical", "warning", "info"] as const).map((sev) => {
          const config = SEVERITY_CONFIG[sev];
          const Icon = config.icon;
          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border transition-all",
                severityFilter === sev ? "ring-1" : "",
              )}
              style={{
                backgroundColor: config.bg,
                borderColor: severityFilter === sev ? config.color : config.border,
                ...(severityFilter === sev ? { ringColor: config.color } : {}),
              }}
            >
              <Icon size={16} style={{ color: config.color }} />
              <div className="text-left">
                <span className="block text-[18px] font-black tabular-nums text-white">
                  {counts[sev]}
                </span>
                <span
                  className="block text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: config.color }}
                >
                  {sev}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter size={12} className="text-white/40" />
        <div className="glass-soft flex gap-0.5 p-0.5" style={{ borderRadius: 8 }}>
          <FilterButton
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
            label="All"
          />
          {(Object.keys(CATEGORY_CONFIG) as AlertCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <FilterButton
                key={cat}
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                label={config.label}
              />
            );
          })}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <GlassCard className="!p-6 flex items-center justify-center">
            <span className="text-[12px] text-white/40">
              No alerts match the current filter criteria.
            </span>
          </GlassCard>
        ) : (
          filtered.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider transition-all duration-200",
        active
          ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "text-white/60 hover:text-white",
      )}
      style={{ borderRadius: 6 }}
    >
      {label}
    </button>
  );
}

function AlertCard({ alert }: { alert: TriggeredAlert }) {
  const sevConfig = SEVERITY_CONFIG[alert.severity];
  const catConfig = CATEGORY_CONFIG[alert.category];
  const SevIcon = sevConfig.icon;
  const CatIcon = catConfig.icon;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border transition hover:bg-white/5"
      style={{ backgroundColor: sevConfig.bg, borderColor: sevConfig.border }}
    >
      <SevIcon size={18} className="mt-0.5 shrink-0" style={{ color: sevConfig.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[12px] font-bold text-white">{alert.ruleName}</span>
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: catConfig.color + "22",
              color: catConfig.color,
              border: `1px solid ${catConfig.color}44`,
            }}
          >
            <CatIcon size={8} />
            {catConfig.label}
          </span>
        </div>
        <p className="text-[11px] text-white/70 leading-relaxed">{alert.message}</p>
        {alert.affectedAssets.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {alert.affectedAssets.map((sym) => (
              <span key={sym} className="glass-pill px-2 py-0.5 text-[9px] font-bold text-white/80">
                {sym}
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        className="shrink-0 rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: sevConfig.bg,
          color: sevConfig.color,
          border: `1px solid ${sevConfig.border}`,
        }}
      >
        {alert.severity}
      </span>
    </div>
  );
}
