import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { areaPeakIndex, areaSeries, barPeakValue, barSeries } from "@/data/aurora";

function TooltipPill({ children }: { children: ReactNode }) {
  return (
    <div className="glass-pill px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white shadow-lg">
      {children}
    </div>
  );
}

export function AreaChartViz() {
  const peakValue = areaSeries[areaPeakIndex].value;
  const peakLabel = areaSeries[areaPeakIndex].label;
  return (
    <div className="relative h-full min-h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={areaSeries} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="auroraArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis hide domain={[0, "dataMax + 20"]} />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.4)", strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <TooltipPill>{payload[0].value}</TooltipPill>
              ) : null
            }
          />
          <ReferenceLine x={peakLabel} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={2}
            fill="url(#auroraArea)"
            activeDot={{
              r: 6,
              fill: "var(--aurora-accent)",
              stroke: "white",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-[52%] top-2 flex items-center gap-2">
        <span
          className="block h-2.5 w-2.5 rounded-full"
          style={{
            background: "var(--aurora-accent)",
            boxShadow: "0 0 12px var(--aurora-accent-glow)",
          }}
        />
        <TooltipPill>{peakValue}k</TooltipPill>
      </div>
    </div>
  );
}

export function BarChartViz() {
  const peakIndex = barSeries.findIndex((b) => b.value === barPeakValue);
  return (
    <div className="relative h-full min-h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barSeries} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <TooltipPill>{Number(payload[0].value).toLocaleString()}</TooltipPill>
              ) : null
            }
          />
          <Bar dataKey="value" radius={[6, 6, 2, 2]}>
            {barSeries.map((entry, i) => (
              <Cell
                key={entry.label}
                fill={i === peakIndex ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div
        className="pointer-events-none absolute top-1"
        style={{
          left: `${((peakIndex + 0.5) / barSeries.length) * 100}%`,
          transform: "translateX(-50%)",
        }}
      >
        <TooltipPill>{barPeakValue.toLocaleString()}</TooltipPill>
      </div>
    </div>
  );
}
