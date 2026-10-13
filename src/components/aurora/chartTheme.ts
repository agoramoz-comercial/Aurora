/**
 * Single chart vocabulary for the whole app.
 * Every recharts surface pulls its colors, grid and tooltip from here so the
 * Ollympius look holds across Home, Analytics, Benchmark and the model hubs.
 *
 * Values mirror the `--aurora-*` tokens in styles.css. Recharts needs literal
 * colors (it writes SVG attributes), so the hex values live here once.
 */

export const CHART = {
  accent: "#4a9eff",
  accentSoft: "rgba(74,158,255,0.35)",
  positive: "#4ade80",
  negative: "#f87171",
  warn: "#fbbf24",
  violet: "#c084fc",
  amber: "#fbbf24",
  teal: "#2dd4bf",
  muted: "rgba(255,255,255,0.5)",
  grid: "rgba(255,255,255,0.07)",
  axis: "rgba(255,255,255,0.42)",
} as const;

/** Categorical series order — used left-to-right for multi-series charts. */
export const SERIES_COLORS = [
  CHART.accent,
  CHART.positive,
  CHART.violet,
  CHART.amber,
  CHART.teal,
  CHART.negative,
] as const;

/** Sign → color, the one rule for every delta in the app. */
export const signColor = (n: number) => (n >= 0 ? CHART.positive : CHART.negative);

export const axisProps = {
  stroke: CHART.axis,
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 10, fill: CHART.axis },
} as const;

export const tooltipStyle = {
  background: "linear-gradient(135deg, rgba(16,20,30,0.96) 0%, rgba(10,14,22,0.94) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  fontSize: 11,
  color: "#fff",
  padding: "8px 10px",
} as const;

export const tooltipProps = {
  contentStyle: tooltipStyle,
  itemStyle: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  labelStyle: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginBottom: 4 },
  cursor: { fill: "rgba(255,255,255,0.05)" },
} as const;

export const legendProps = {
  wrapperStyle: { fontSize: 10, color: "rgba(255,255,255,0.55)", paddingTop: 6 },
  iconType: "circle" as const,
  iconSize: 7,
};
