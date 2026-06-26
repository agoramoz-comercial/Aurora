import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/alphaVantage.types";
import { useMemo } from "react";

function rsiSeries(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  for (let i = period; i < closes.length; i++) {
    let g = 0;
    let l = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff >= 0) g += diff;
      else l -= diff;
    }
    const avgG = g / period;
    const avgL = l / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

export function RsiChart({ series }: { series: SeriesPoint[] }) {
  const data = useMemo(() => {
    const closes = series.map((s) => s.close);
    const r = rsiSeries(closes, 14);
    return series.map((p, i) => ({ date: p.date, rsi: r[i] }));
  }, [series]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <YAxis hide domain={[0, 100]} />
        <ReferenceArea y1={70} y2={100} fill="#FF4D4F" fillOpacity={0.08} />
        <ReferenceArea y1={0} y2={30} fill="#00D17A" fillOpacity={0.08} />
        <ReferenceLine y={70} stroke="#FF4D4F" strokeOpacity={0.4} strokeDasharray="3 3" />
        <ReferenceLine y={30} stroke="#00D17A" strokeOpacity={0.4} strokeDasharray="3 3" />
        <ReferenceLine y={50} stroke="rgba(255,255,255,0.18)" />
        <Line
          type="monotone"
          dataKey="rsi"
          stroke="#A78BFA"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
