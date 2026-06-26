import type { SeriesPoint, TickerSnapshot } from "@/lib/alphaVantage.types";
import {
  annualizedVol,
  computeRSI,
  historicalVaR,
  macd,
  maxDrawdown,
  sharpeRatio,
  sma,
  sortinoRatio,
} from "./calculations";

interface BaselineMeta {
  name: string;
  sector: string;
  startPrice: number;
  drift: number; // daily log drift
  vol: number; // daily log vol
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  pegRatio: number;
  evToEbitda: number;
  profitMargin: number;
  operatingMargin: number;
  grossMargin: number;
  roe: number;
  roa: number;
  dividendYield: number;
  beta: number;
  eps: number;
}

const META: Record<string, BaselineMeta> = {
  AAPL: {
    name: "Apple Inc.",
    sector: "Technology",
    startPrice: 185,
    drift: 0.0006,
    vol: 0.0145,
    marketCap: 3.4e12,
    peRatio: 32.1,
    pbRatio: 48.2,
    pegRatio: 2.3,
    evToEbitda: 24.5,
    profitMargin: 0.258,
    operatingMargin: 0.31,
    grossMargin: 0.45,
    roe: 1.56,
    roa: 0.28,
    dividendYield: 0.0045,
    beta: 1.24,
    eps: 6.42,
  },
  MSFT: {
    name: "Microsoft Corp.",
    sector: "Technology",
    startPrice: 410,
    drift: 0.0007,
    vol: 0.0138,
    marketCap: 3.1e12,
    peRatio: 35.4,
    pbRatio: 12.1,
    pegRatio: 2.1,
    evToEbitda: 23.2,
    profitMargin: 0.362,
    operatingMargin: 0.44,
    grossMargin: 0.69,
    roe: 0.39,
    roa: 0.18,
    dividendYield: 0.0072,
    beta: 0.91,
    eps: 11.8,
  },
  NVDA: {
    name: "NVIDIA Corp.",
    sector: "Semiconductors",
    startPrice: 880,
    drift: 0.0015,
    vol: 0.032,
    marketCap: 2.8e12,
    peRatio: 68.4,
    pbRatio: 52.1,
    pegRatio: 1.4,
    evToEbitda: 52.1,
    profitMargin: 0.488,
    operatingMargin: 0.55,
    grossMargin: 0.75,
    roe: 1.15,
    roa: 0.55,
    dividendYield: 0.0002,
    beta: 1.72,
    eps: 12.85,
  },
  TSLA: {
    name: "Tesla Inc.",
    sector: "Automotive",
    startPrice: 245,
    drift: -0.0002,
    vol: 0.038,
    marketCap: 7.8e11,
    peRatio: 72.5,
    pbRatio: 11.8,
    pegRatio: 3.8,
    evToEbitda: 48.2,
    profitMargin: 0.072,
    operatingMargin: 0.085,
    grossMargin: 0.18,
    roe: 0.19,
    roa: 0.08,
    dividendYield: 0,
    beta: 2.31,
    eps: 3.35,
  },
  AMZN: {
    name: "Amazon.com Inc.",
    sector: "Consumer Cyclical",
    startPrice: 195,
    drift: 0.0008,
    vol: 0.019,
    marketCap: 2.05e12,
    peRatio: 48.2,
    pbRatio: 8.4,
    pegRatio: 1.6,
    evToEbitda: 18.5,
    profitMargin: 0.082,
    operatingMargin: 0.11,
    grossMargin: 0.48,
    roe: 0.22,
    roa: 0.07,
    dividendYield: 0,
    beta: 1.18,
    eps: 4.05,
  },
  GOOGL: {
    name: "Alphabet Inc.",
    sector: "Communication Services",
    startPrice: 178,
    drift: 0.0006,
    vol: 0.017,
    marketCap: 2.2e12,
    peRatio: 26.4,
    pbRatio: 6.9,
    pegRatio: 1.5,
    evToEbitda: 17.8,
    profitMargin: 0.272,
    operatingMargin: 0.32,
    grossMargin: 0.57,
    roe: 0.31,
    roa: 0.21,
    dividendYield: 0.0044,
    beta: 1.05,
    eps: 6.74,
  },
  META: {
    name: "Meta Platforms Inc.",
    sector: "Communication Services",
    startPrice: 510,
    drift: 0.0009,
    vol: 0.024,
    marketCap: 1.3e12,
    peRatio: 28.5,
    pbRatio: 8.1,
    pegRatio: 1.3,
    evToEbitda: 16.4,
    profitMargin: 0.342,
    operatingMargin: 0.41,
    grossMargin: 0.81,
    roe: 0.34,
    roa: 0.21,
    dividendYield: 0.0042,
    beta: 1.22,
    eps: 17.9,
  },
  AMD: {
    name: "Advanced Micro Devices",
    sector: "Semiconductors",
    startPrice: 165,
    drift: 0.0005,
    vol: 0.028,
    marketCap: 2.7e11,
    peRatio: 195.4,
    pbRatio: 4.2,
    pegRatio: 2.8,
    evToEbitda: 42.1,
    profitMargin: 0.045,
    operatingMargin: 0.08,
    grossMargin: 0.47,
    roe: 0.034,
    roa: 0.025,
    dividendYield: 0,
    beta: 1.68,
    eps: 0.85,
  },
};

// Deterministic seeded RNG (mulberry32) per symbol so baseline is stable.
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(sym: string): number {
  let h = 2166136261;
  for (let i = 0; i < sym.length; i++) {
    h ^= sym.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function gaussian(r: () => number): number {
  // Box-Muller
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildSeries(meta: BaselineMeta, sym: string): SeriesPoint[] {
  const r = rng(seedFor(sym));
  const N = 260; // ~1Y trading days
  const out: SeriesPoint[] = [];
  let price = meta.startPrice;
  const today = new Date();
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const step = meta.drift + meta.vol * gaussian(r);
    price = price * Math.exp(step);
    out.push({
      date: d.toISOString().slice(0, 10),
      close: Math.max(1, Math.round(price * 100) / 100),
    });
  }
  return out;
}

export function buildBaselineSnapshot(symbol: string): TickerSnapshot {
  const sym = symbol.toUpperCase();
  const meta = META[sym] ?? META.AAPL;
  const series = buildSeries(meta, sym);
  const closes = series.map((s) => s.close);
  const price = closes.at(-1)!;
  const prevClose = closes.at(-2) ?? price;
  const change = price - prevClose;
  const changePct = prevClose ? change / prevClose : 0;
  const last20 = closes.slice(-20);
  const dayHigh = Math.max(price, prevClose) * (1 + Math.abs(meta.vol) * 0.6);
  const dayLow = Math.min(price, prevClose) * (1 - Math.abs(meta.vol) * 0.6);
  const week52High = Math.max(...closes);
  const week52Low = Math.min(...closes);
  const m = macd(closes);

  return {
    symbol: sym,
    name: meta.name,
    sector: meta.sector,
    currency: "USD",
    price,
    change,
    changePct,
    dayHigh,
    dayLow,
    open: prevClose,
    prevClose,
    volume: Math.round((meta.marketCap / price) * 0.003 * (0.7 + (last20.length % 5) * 0.1)),
    marketCap: meta.marketCap,
    peRatio: meta.peRatio,
    pbRatio: meta.pbRatio,
    pegRatio: meta.pegRatio,
    evToEbitda: meta.evToEbitda,
    profitMargin: meta.profitMargin,
    operatingMargin: meta.operatingMargin,
    grossMargin: meta.grossMargin,
    roe: meta.roe,
    roa: meta.roa,
    dividendYield: meta.dividendYield,
    beta: meta.beta,
    week52High,
    week52Low,
    eps: meta.eps,
    series,
    rsi14: computeRSI(closes, 14),
    annualVolPct: annualizedVol(closes),
    maxDrawdownPct: maxDrawdown(closes),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    macd: m.macd,
    macdSignal: m.signal,
    sharpe: sharpeRatio(closes),
    sortino: sortinoRatio(closes),
    var95: historicalVaR(closes, 0.95),
    fetchedAt: Date.now(),
    rateLimited: false,
    stale: false,
    source: "baseline",
  };
}

export const BASELINE_SYMBOLS = Object.keys(META);
