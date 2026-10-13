import { AlertTriangle, TrendingDown, TrendingUp, Activity, Shield } from "lucide-react";
import type { TickerSnapshot } from "@/lib/alphaVantage.types";
import { GlassCard } from "../GlassCard";
import { Pill } from "../primitives";
import { CHART } from "../chartTheme";

type Severity = "info" | "warn" | "danger";

interface Alert {
  id: string;
  severity: Severity;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  detail: string;
}

const sevTone: Record<Severity, { color: string; bg: string }> = {
  info: { color: CHART.accent, bg: "rgba(74,158,255,0.12)" },
  warn: { color: CHART.warn, bg: "rgba(251,191,36,0.12)" },
  danger: { color: CHART.negative, bg: "rgba(248,113,113,0.14)" },
};

function buildAlerts(d: TickerSnapshot): Alert[] {
  const a: Alert[] = [];
  if (d.rsi14 !== null && d.rsi14 >= 70)
    a.push({
      id: "rsi-hi",
      severity: "danger",
      icon: TrendingUp,
      title: `RSI overbought · ${d.rsi14.toFixed(1)}`,
      detail: "Potential mean-reversion risk in short term",
    });
  if (d.rsi14 !== null && d.rsi14 <= 30)
    a.push({
      id: "rsi-lo",
      severity: "info",
      icon: TrendingDown,
      title: `RSI oversold · ${d.rsi14.toFixed(1)}`,
      detail: "Contrarian entry signal triggered",
    });
  if (d.maxDrawdownPct !== null && Math.abs(d.maxDrawdownPct) >= 0.2)
    a.push({
      id: "dd",
      severity: "warn",
      icon: TrendingDown,
      title: `Drawdown ${(d.maxDrawdownPct * 100).toFixed(1)}%`,
      detail: "Deep drawdown over the observed window",
    });
  if (d.peRatio !== null && d.peRatio > 40)
    a.push({
      id: "pe",
      severity: "warn",
      icon: AlertTriangle,
      title: `P/E elevated · ${d.peRatio.toFixed(1)}`,
      detail: "Valuation above market average",
    });
  if (d.annualVolPct !== null && d.annualVolPct >= 0.35)
    a.push({
      id: "vol",
      severity: "warn",
      icon: Activity,
      title: `Volatility ${(d.annualVolPct * 100).toFixed(1)}%`,
      detail: "Annualized σ above 35%",
    });
  if (d.macd !== null && d.macdSignal !== null && d.macd > d.macdSignal)
    a.push({
      id: "macd-bull",
      severity: "info",
      icon: TrendingUp,
      title: "MACD bullish crossover",
      detail: "Momentum line above signal",
    });
  if (d.sma20 !== null && d.sma50 !== null && d.sma20 < d.sma50)
    a.push({
      id: "death",
      severity: "danger",
      icon: AlertTriangle,
      title: "Bearish: SMA20 < SMA50",
      detail: "Short-term trend below long-term",
    });
  if (a.length === 0)
    a.push({
      id: "calm",
      severity: "info",
      icon: Shield,
      title: "Sem alertas ativos",
      detail: "Todos os limiares de risco dentro da tolerância",
    });
  return a.slice(0, 5);
}

export function AlertEngine({ data }: { data: TickerSnapshot | undefined }) {
  const alerts = data ? buildAlerts(data) : [];
  return (
    <GlassCard className="lg:h-full lg:min-h-0 !p-4">
      <div className="flex shrink-0 items-center justify-between">
        <Pill className="!px-3 !py-1 !text-[12px] !font-semibold">Motor de alertas</Pill>
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/45">
          {alerts.length} active
        </span>
      </div>
      <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
        {alerts.map((a) => {
          const tone = sevTone[a.severity];
          const Icon = a.icon;
          return (
            <li
              key={a.id}
              className="flex items-start gap-2 rounded-xl px-1.5 py-1.5"
              style={{ background: tone.bg }}
            >
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md"
                style={{ background: "rgba(255,255,255,0.08)", color: tone.color }}
              >
                <Icon size={12} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold" style={{ color: tone.color }}>
                  {a.title}
                </p>
                <p className="truncate text-[10px] text-white/55">{a.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
