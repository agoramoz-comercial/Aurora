import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CHART } from "../chartTheme";

export function Sparkline({
  values,
  up,
  height = 28,
}: {
  values: number[];
  up: boolean;
  height?: number;
}) {
  const color = up ? CHART.positive : CHART.negative;
  const data = values.map((v, i) => ({ i, v }));
  const id = `sp-${color.slice(1)}-${values.length}-${Math.round(values[0] ?? 0)}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
