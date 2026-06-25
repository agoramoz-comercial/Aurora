import type { SeriesPoint } from "@/lib/alphaVantage.types";

export type Verdict = "good" | "warn" | "bad" | "neutral";

export function classifyPE(pe: number | null): Verdict {
  if (pe === null || !isFinite(pe) || pe <= 0) return "neutral";
  if (pe < 15) return "good";
  if (pe <= 30) return "warn";
  return "bad";
}

export function classifyPB(pb: number | null): Verdict {
  if (pb === null || !isFinite(pb) || pb <= 0) return "neutral";
  if (pb < 1) return "good";
  if (pb <= 3) return "warn";
  return "bad";
}

export function classifyPEG(peg: number | null): Verdict {
  if (peg === null || !isFinite(peg) || peg <= 0) return "neutral";
  if (peg < 1) return "good";
  if (peg <= 2) return "warn";
  return "bad";
}

export function classifyMargin(m: number | null, goodAbove: number): Verdict {
  if (m === null || !isFinite(m)) return "neutral";
  if (m >= goodAbove) return "good";
  if (m >= goodAbove * 0.5) return "warn";
  return "bad";
}

export function classifyROE(roe: number | null): Verdict {
  if (roe === null || !isFinite(roe)) return "neutral";
  if (roe >= 0.15) return "good";
  if (roe >= 0.05) return "warn";
  return "bad";
}

export function classifyBeta(beta: number | null): Verdict {
  if (beta === null || !isFinite(beta)) return "neutral";
  if (beta <= 1) return "good";
  if (beta <= 1.5) return "warn";
  return "bad";
}

export function classifyRSI(rsi: number | null): Verdict {
  if (rsi === null) return "neutral";
  if (rsi >= 70) return "bad"; // overbought
  if (rsi <= 30) return "good"; // oversold opportunity
  return "warn";
}

export function classifyDrawdown(dd: number | null): Verdict {
  if (dd === null) return "neutral";
  const v = Math.abs(dd);
  if (v <= 0.1) return "good";
  if (v <= 0.25) return "warn";
  return "bad";
}

export function classifyVol(vol: number | null): Verdict {
  if (vol === null) return "neutral";
  if (vol <= 0.2) return "good";
  if (vol <= 0.35) return "warn";
  return "bad";
}

// --- math helpers ---

export function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgG = gains / period;
  const avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

export function annualizedVol(closes: number[]): number | null {
  if (closes.length < 30) return null;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    rets.push(Math.log(closes[i] / closes[i - 1]));
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance =
    rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

export function maxDrawdown(closes: number[]): number | null {
  if (closes.length < 2) return null;
  let peak = closes[0];
  let mdd = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (c - peak) / peak;
    if (dd < mdd) mdd = dd;
  }
  return mdd; // negative
}

export function sliceSeriesByTimeframe(
  series: SeriesPoint[],
  tf: string,
): SeriesPoint[] {
  const days: Record<string, number> = {
    "1M": 22,
    "3M": 66,
    "6M": 130,
    "1Y": 252,
    "5Y": 1260,
  };
  const n = days[tf] ?? 66;
  return series.slice(-n);
}

export function formatCompact(n: number | null): string {
  if (n === null || !isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}

export function formatPct(n: number | null, digits = 2): string {
  if (n === null || !isFinite(n)) return "—";
  return (n * 100).toFixed(digits) + "%";
}

export function formatNum(n: number | null, digits = 2): string {
  if (n === null || !isFinite(n)) return "—";
  return n.toFixed(digits);
}

// --- advanced indicators ---

export function returnsFromCloses(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) r.push(closes[i] / closes[i - 1] - 1);
  }
  return r;
}

export function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  let s = 0;
  for (let i = closes.length - period; i < closes.length; i++) s += closes[i];
  return s / period;
}

function ema(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): { macd: number | null; signal: number | null } {
  if (closes.length < slow + signal) return { macd: null, signal: null };
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = ema(macdLine.slice(slow - 1), signal);
  return {
    macd: macdLine.at(-1) ?? null,
    signal: signalLine.at(-1) ?? null,
  };
}

export function sharpeRatio(closes: number[], rf = 0): number | null {
  const r = returnsFromCloses(closes);
  if (r.length < 30) return null;
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const variance = r.reduce((a, b) => a + (b - mean) ** 2, 0) / (r.length - 1);
  const sd = Math.sqrt(variance);
  if (sd === 0) return null;
  return ((mean - rf / 252) / sd) * Math.sqrt(252);
}

export function sortinoRatio(closes: number[], rf = 0): number | null {
  const r = returnsFromCloses(closes);
  if (r.length < 30) return null;
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const downs = r.filter((x) => x < 0);
  if (downs.length === 0) return null;
  const dd = Math.sqrt(downs.reduce((a, b) => a + b * b, 0) / downs.length);
  if (dd === 0) return null;
  return ((mean - rf / 252) / dd) * Math.sqrt(252);
}

export function historicalVaR(closes: number[], confidence = 0.95): number | null {
  const r = returnsFromCloses(closes);
  if (r.length < 30) return null;
  const sorted = [...r].sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor((1 - confidence) * sorted.length));
  return sorted[idx] ?? null; // negative number
}

export function classifySharpe(s: number | null): Verdict {
  if (s === null || !isFinite(s)) return "neutral";
  if (s >= 1) return "good";
  if (s >= 0) return "warn";
  return "bad";
}

export function classifyVaR(v: number | null): Verdict {
  if (v === null) return "neutral";
  const a = Math.abs(v);
  if (a <= 0.02) return "good";
  if (a <= 0.04) return "warn";
  return "bad";
}

