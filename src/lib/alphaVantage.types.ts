export interface SeriesPoint {
  date: string;
  close: number;
  /** OHLC + volume are optional: baseline series carry them, external feeds may not. */
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export type DataSource = "live" | "partial" | "baseline";

export interface TickerSnapshot {
  symbol: string;
  name: string;
  sector: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  prevClose: number;
  volume: number;
  // Overview fundamentals
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  evToEbitda: number | null;
  profitMargin: number | null; // 0..1
  operatingMargin: number | null;
  grossMargin: number | null;
  roe: number | null;
  roa: number | null;
  dividendYield: number | null;
  beta: number | null;
  week52High: number | null;
  week52Low: number | null;
  eps: number | null;
  // Derived from daily series
  series: SeriesPoint[];
  rsi14: number | null;
  annualVolPct: number | null;
  maxDrawdownPct: number | null;
  sma20: number | null;
  sma50: number | null;
  macd: number | null;
  macdSignal: number | null;
  sharpe: number | null;
  sortino: number | null;
  var95: number | null; // 1-day historical VaR (negative number, e.g. -0.034 = -3.4%)
  // meta
  fetchedAt: number;
  rateLimited: boolean;
  stale: boolean;
  source: DataSource;
}
