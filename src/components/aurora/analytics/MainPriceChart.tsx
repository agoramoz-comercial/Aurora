import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { sma } from "@/lib/finance/calculations";
import type { SeriesPoint } from "@/lib/alphaVantage.types";
import { useMemo } from "react";

export function MainPriceChart({
  series,
  up,
}: {
  series: SeriesPoint[];
  up: boolean;
}) {
  const color = up ? "#00D17A" : "#FF4D4F";

  const data = useMemo(() => {
    return series.map((p, i) => {
      const window20 = series.slice(Math.max(0, i - 19), i + 1).map((s) => s.close);
      const window50 = series.slice(Math.max(0, i - 49), i + 1).map((s) => s.close);
      return {
        date: p.date,
        close: p.close,
        sma20: window20.length === 20 ? sma(window20, 20) : null,
        sma50: window50.length === 50 ? sma(window50, 50) : null,
      };
    });
  }, [series]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mpcFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis
          hide
          domain={[
            (dataMin: number) => dataMin * 0.98,
            (dataMax: number) => dataMax * 1.02,
          ]}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.35)", strokeDasharray: "3 3" }}
          content={({ active, payload }) =>
            active && payload && payload.length ? (
              <div className="glass-pill flex gap-2 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-white shadow-lg">
                <span>${Number(payload[0]?.payload?.close).toFixed(2)}</span>
                {payload[0]?.payload?.sma20 ? (
                  <span className="text-[#74C7FF]">
                    20:${Number(payload[0].payload.sma20).toFixed(2)}
                  </span>
                ) : null}
                {payload[0]?.payload?.sma50 ? (
                  <span className="text-[#FFB020]">
                    50:${Number(payload[0].payload.sma50).toFixed(2)}
                  </span>
                ) : null}
                <span className="text-white/55">{payload[0]?.payload?.date}</span>
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={2}
          fill="url(#mpcFill)"
          isAnimationActive={false}
          activeDot={{ r: 4, fill: color, stroke: "white", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="sma20"
          stroke="#74C7FF"
          strokeWidth={1.25}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="sma50"
          stroke="#FFB020"
          strokeWidth={1.25}
          strokeDasharray="4 3"
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
