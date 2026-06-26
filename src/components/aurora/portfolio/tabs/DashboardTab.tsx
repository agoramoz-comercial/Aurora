import { PortfolioKPIs } from "../PortfolioKPIs";
import { PortfolioCharts } from "../PortfolioCharts";
import { evaluateAlerts, type AlertSeverity } from "@/data/alertsEngine";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { GlassCard } from "../../GlassCard";
import { Pill } from "../../primitives";

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { icon: typeof AlertTriangle; color: string; bg: string }
> = {
  critical: { icon: ShieldAlert, color: "#FF4D4F", bg: "rgba(255, 77, 79, 0.08)" },
  warning: { icon: AlertTriangle, color: "#FFB020", bg: "rgba(255, 176, 32, 0.08)" },
  info: { icon: Info, color: "#4a9eff", bg: "rgba(74, 158, 255, 0.08)" },
};

export function DashboardTab() {
  const alerts = evaluateAlerts().slice(0, 3);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <PortfolioKPIs />

      {/* Quick Alerts Summary */}
      {alerts.length > 0 && (
        <GlassCard className="!p-3">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="!px-2.5 !py-0.5 !text-[11px] !font-semibold">Active Alerts</Pill>
            <span className="text-[10px] text-white/50">Top {alerts.length} priority alerts</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {alerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-2 p-2 rounded-lg border border-white/5 transition hover:bg-white/5"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={14} className="mt-0.5 shrink-0" style={{ color: config.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-white truncate">
                      {alert.ruleName}
                    </p>
                    <p className="text-[9px] text-white/50 truncate">{alert.message}</p>
                  </div>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: config.bg,
                      color: config.color,
                      border: `1px solid ${config.color}33`,
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Charts */}
      <PortfolioCharts />
    </div>
  );
}
