/**
 * portfolioEnriched.ts
 *
 * Deep per-stock enriched data for the professional portfolio system.
 * Generates deterministic, realistic financial metrics using the same
 * seeded-RNG approach as baseline.ts — no external API calls required.
 */

import type { Holding } from "./portfolio";
import { holdingsData } from "./portfolio";

// ─── Deterministic seeded RNG (mulberry32) ───────────────────────────────────

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
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CompanyProfile {
  name: string;
  symbol: string;
  sector: string;
  industry: string;
  exchange: string;
  currency: string;
  description: string;
  employees: number;
  founded: string;
}

export interface PriceData {
  current: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePct: number;
  week52High: number;
  week52Low: number;
  ytdChangePct: number;
  dayRange: [number, number];
}

export interface VolumeData {
  current: number;
  avg10D: number;
  avg30D: number;
  volumeRatio: number;
  relativeVolume: number;
  vwap: number;
}

export interface TechnicalData {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi14: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  atr14: number;
  stochK: number;
  stochD: number;
  adx: number;
  obvTrend: "rising" | "falling" | "flat";
  goldenCrossStatus: "golden" | "death" | "neutral";
}

export interface ValuationData {
  peRatio: number;
  forwardPE: number;
  pbRatio: number;
  psRatio: number;
  pegRatio: number;
  evToEbitda: number;
  evToRevenue: number;
  priceToFcf: number;
  dividendYield: number;
  payoutRatio: number;
}

export interface FundamentalData {
  revenue: number;
  netIncome: number;
  ebitda: number;
  freeCashFlow: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  roe: number;
  roa: number;
  roic: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  interestCoverage: number;
  sharesOutstanding: number;
  enterpriseValue: number;
}

export interface RiskMetrics {
  beta: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  var95: number;
  annualizedVol: number;
  correlationSpy: number;
  informationRatio: number;
}

export interface SentimentData {
  analystBuy: number;
  analystHold: number;
  analystSell: number;
  averageTargetPrice: number;
  socialSentiment: number;
  newsSentiment: number;
  insiderSignal: "buying" | "selling" | "neutral";
  fearGreedScore: number;
}

export interface PriceSeriesPoint {
  date: string;
  close: number;
  volume: number;
}

export interface EnrichedHolding {
  holding: Holding;
  profile: CompanyProfile;
  price: PriceData;
  volume: VolumeData;
  technical: TechnicalData;
  valuation: ValuationData;
  fundamental: FundamentalData;
  risk: RiskMetrics;
  sentiment: SentimentData;
  priceSeries: PriceSeriesPoint[];
}

// ─── Static data tables ──────────────────────────────────────────────────────

const INDUSTRY_MAP: Record<string, string> = {
  MSFT: "Software — Infrastructure",
  AAPL: "Consumer Electronics",
  GE: "Diversified Industrials",
  CAT: "Farm & Heavy Construction Machinery",
  DE: "Farm & Heavy Construction Machinery",
  XOM: "Oil & Gas Integrated",
  GILD: "Drug Manufacturers — General",
  FB: "Internet Content & Information",
  KO: "Beverages — Non-Alcoholic",
  IBM: "Information Technology Services",
  F: "Auto Manufacturers",
};

const EXCHANGE_MAP: Record<string, string> = {
  MSFT: "NASDAQ",
  AAPL: "NASDAQ",
  GE: "NYSE",
  CAT: "NYSE",
  DE: "NYSE",
  XOM: "NYSE",
  GILD: "NASDAQ",
  FB: "NASDAQ",
  KO: "NYSE",
  IBM: "NYSE",
  F: "NYSE",
};

const DESCRIPTION_MAP: Record<string, string> = {
  MSFT: "Develops and supports software, services, devices, and solutions worldwide through Productivity, Intelligent Cloud, and Personal Computing segments.",
  AAPL: "Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories with integrated hardware, software, and services.",
  GE: "Global diversified technology and financial services company operating in aviation, healthcare, power, and renewable energy segments.",
  CAT: "Manufactures and sells construction and mining equipment, diesel and natural gas engines, industrial gas turbines, and diesel-electric locomotives.",
  DE: "Manufactures and distributes equipment used in agriculture, construction, forestry, and turf care with a focus on precision agriculture technology.",
  XOM: "Explores for and produces crude oil and natural gas worldwide through Upstream, Downstream, and Chemical segments.",
  GILD: "Researches, discovers, develops, and commercializes medicines in areas of unmet medical need including HIV, liver diseases, and oncology.",
  FB: "Builds products enabling people to connect through mobile devices, PCs, VR headsets, wearables, and in-home devices via apps and technologies.",
  KO: "Manufactures, markets, and distributes beverage concentrates and syrups with a portfolio of more than 500 brands worldwide.",
  IBM: "Provides integrated solutions and products leveraging data, IT, and expertise in industries and business processes across hybrid cloud and AI.",
  F: "Designs, manufactures, markets, and services a line of Ford trucks, cars, sport utility vehicles, electrified vehicles, and Lincoln luxury vehicles.",
};

const EMPLOYEE_MAP: Record<string, number> = {
  MSFT: 228000,
  AAPL: 161000,
  GE: 174000,
  CAT: 107700,
  DE: 83000,
  XOM: 62000,
  GILD: 17000,
  FB: 86000,
  KO: 79000,
  IBM: 282000,
  F: 186000,
};

const FOUNDED_MAP: Record<string, string> = {
  MSFT: "1975",
  AAPL: "1976",
  GE: "1892",
  CAT: "1925",
  DE: "1837",
  XOM: "1870",
  GILD: "1987",
  FB: "2004",
  KO: "1886",
  IBM: "1911",
  F: "1903",
};

// Revenue estimates in billions
const REVENUE_MAP: Record<string, number> = {
  MSFT: 87.25e9,
  AAPL: 220.46e9,
  GE: 120.3e9,
  CAT: 45.5e9,
  DE: 29.7e9,
  XOM: 237.16e9,
  GILD: 26.1e9,
  FB: 40.65e9,
  KO: 35.41e9,
  IBM: 79.6e9,
  F: 156.8e9,
};

const SHARES_MAP: Record<string, number> = {
  MSFT: 7549.35e6,
  AAPL: 5081.25e6,
  GE: 8730.0e6,
  CAT: 590.0e6,
  DE: 318.0e6,
  XOM: 4230.0e6,
  GILD: 1260.0e6,
  FB: 2380.0e6,
  KO: 4270.0e6,
  IBM: 920.0e6,
  F: 3930.0e6,
};

// ─── Builder ─────────────────────────────────────────────────────────────────

function buildPriceSeries(holding: Holding, r: () => number): PriceSeriesPoint[] {
  const N = 60; // 60 trading days
  const points: PriceSeriesPoint[] = [];
  let price = holding.purchasePrice;
  const today = new Date();
  const dailyDrift = (holding.price / holding.purchasePrice - 1) / 365;
  const vol = 0.015 + r() * 0.02;

  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const step = dailyDrift + vol * gaussian(r);
    price = Math.max(1, price * Math.exp(step));
    const baseVol = SHARES_MAP[holding.symbol] ?? 1e6;
    const volume = Math.round(baseVol * 0.003 * (0.5 + r() * 1.5));
    points.push({
      date: d.toISOString().slice(0, 10),
      close: Math.round(price * 100) / 100,
      volume,
    });
  }
  // Ensure the last point matches the actual current price
  if (points.length > 0) {
    points[points.length - 1]!.close = holding.price;
  }
  return points;
}

export function buildEnrichedHolding(holding: Holding): EnrichedHolding {
  const sym = holding.symbol;
  const r = rng(seedFor(sym + "-enriched"));

  const series = buildPriceSeries(holding, r);
  const closes = series.map((s) => s.close);
  const volumes = series.map((s) => s.volume);

  const prevClose = closes.length >= 2 ? closes[closes.length - 2]! : holding.price;
  const high = Math.max(...closes.slice(-5)) * (1 + r() * 0.02);
  const low = Math.min(...closes.slice(-5)) * (1 - r() * 0.02);
  const week52High = Math.max(...closes) * (1 + r() * 0.05);
  const week52Low = Math.min(...closes) * (1 - r() * 0.05);

  // Volume calculations
  const avg10D = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const avg30D = volumes.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, volumes.length);
  const currentVol = volumes[volumes.length - 1] ?? avg30D;

  // Technical indicators
  const sma = (arr: number[], period: number) => {
    if (arr.length < period) return arr[arr.length - 1] ?? 0;
    const slice = arr.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  };

  const ema = (arr: number[], period: number) => {
    const k = 2 / (period + 1);
    let prev = arr[0] ?? 0;
    for (let i = 1; i < arr.length; i++) {
      prev = arr[i]! * k + prev * (1 - k);
    }
    return prev;
  };

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = holding.price * (0.92 + r() * 0.16); // approximate
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12 - ema26;
  const macdSignal = macdLine * (0.7 + r() * 0.3);
  const macdHistogram = macdLine - macdSignal;

  // RSI
  let gains = 0;
  let losses = 0;
  const rsiPeriod = Math.min(14, closes.length - 1);
  for (let i = closes.length - rsiPeriod; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgG = gains / rsiPeriod;
  const avgL = losses / rsiPeriod || 0.001;
  const rsi14 = 100 - 100 / (1 + avgG / avgL);

  // Bollinger Bands
  const bb20 = closes.slice(-20);
  const bbMean = bb20.reduce((a, b) => a + b, 0) / bb20.length;
  const bbStd = Math.sqrt(bb20.reduce((a, b) => a + (b - bbMean) ** 2, 0) / bb20.length);

  // ATR (simplified)
  const atr14 = holding.price * (0.01 + r() * 0.03);

  // Stochastic
  const stochK = 20 + r() * 60;
  const stochD = stochK * (0.85 + r() * 0.3);

  // ADX
  const adx = 15 + r() * 45;

  // OBV trend
  const obvTrend: "rising" | "falling" | "flat" =
    r() > 0.6 ? "rising" : r() > 0.3 ? "flat" : "falling";

  // Golden/death cross
  const goldenCrossStatus: "golden" | "death" | "neutral" = holding.potNegativeCross
    ? "death"
    : sma50 > sma200
      ? "golden"
      : "neutral";

  // Valuation
  const revenue = REVENUE_MAP[sym] ?? holding.positionSize * 1000;
  const shares = SHARES_MAP[sym] ?? holding.shares * 1e6;
  const marketCap = holding.price * shares;
  const netIncome = revenue * (0.05 + r() * 0.25);
  const ebitda = revenue * (0.1 + r() * 0.3);
  const fcf = revenue * (0.03 + r() * 0.15);

  const peRatio = marketCap / Math.max(netIncome, 1);
  const forwardPE = peRatio * (0.75 + r() * 0.35);
  const pbRatio = 1 + r() * 15;
  const psRatio = marketCap / Math.max(revenue, 1);
  const pegRatio = peRatio / Math.max(8 + r() * 20, 1);
  const evToEbitda = (marketCap * 1.1) / Math.max(ebitda, 1);
  const evToRevenue = (marketCap * 1.1) / Math.max(revenue, 1);
  const priceToFcf = marketCap / Math.max(fcf, 1);
  const dividendYield = r() > 0.3 ? r() * 0.04 : 0;
  const payoutRatio = dividendYield > 0 ? 0.2 + r() * 0.5 : 0;

  // Fundamentals
  const grossMargin = 0.2 + r() * 0.55;
  const operatingMargin = grossMargin * (0.3 + r() * 0.5);
  const netMargin = netIncome / Math.max(revenue, 1);
  const roe = 0.05 + r() * 0.4;
  const roa = roe * (0.3 + r() * 0.4);
  const roic = roe * (0.5 + r() * 0.5);
  const debtToEquity = 0.2 + r() * 2.5;
  const currentRatio = 0.8 + r() * 2.5;
  const quickRatio = currentRatio * (0.5 + r() * 0.4);
  const interestCoverage = 2 + r() * 20;
  const enterpriseValue = marketCap * (1.05 + r() * 0.15);

  // Risk
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(closes[i]! / closes[i - 1]! - 1);
  }
  const meanRet = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length
    ? returns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / (returns.length - 1)
    : 0;
  const dailyVol = Math.sqrt(variance);
  const annualVol = dailyVol * Math.sqrt(252);

  let peak = closes[0] ?? holding.price;
  let mdd = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (c - peak) / peak;
    if (dd < mdd) mdd = dd;
  }

  const sharpe = dailyVol > 0 ? (meanRet / dailyVol) * Math.sqrt(252) : 0;
  const downs = returns.filter((x) => x < 0);
  const downDev = downs.length
    ? Math.sqrt(downs.reduce((a, b) => a + b * b, 0) / downs.length)
    : 0.01;
  const sortino = (meanRet / downDev) * Math.sqrt(252);

  const sorted = [...returns].sort((a, b) => a - b);
  const varIdx = Math.max(0, Math.floor(0.05 * sorted.length));
  const var95 = sorted[varIdx] ?? -0.03;

  // Sentiment
  const totalAnalysts = 10 + Math.floor(r() * 30);
  const buyPct = 0.3 + r() * 0.5;
  const sellPct = r() * 0.2;
  const holdPct = 1 - buyPct - sellPct;
  const analystBuy = Math.round(totalAnalysts * buyPct);
  const analystSell = Math.round(totalAnalysts * sellPct);
  const analystHold = totalAnalysts - analystBuy - analystSell;
  const avgTarget = holding.price * (1 + (r() * 0.4 - 0.1));
  const socialSentiment = r() * 2 - 1; // -1 to 1
  const newsSentiment = r() * 2 - 1;
  const insiderSignal: "buying" | "selling" | "neutral" =
    r() > 0.7 ? "buying" : r() > 0.4 ? "neutral" : "selling";
  const fearGreed = Math.round(20 + r() * 60);

  return {
    holding,
    profile: {
      name: holding.name,
      symbol: sym,
      sector: holding.sector,
      industry: INDUSTRY_MAP[sym] ?? holding.sector,
      exchange: EXCHANGE_MAP[sym] ?? "NYSE",
      currency: "USD",
      description:
        DESCRIPTION_MAP[sym] ??
        `${holding.name} is a publicly traded company in the ${holding.sector} sector.`,
      employees: EMPLOYEE_MAP[sym] ?? 10000 + Math.floor(r() * 50000),
      founded: FOUNDED_MAP[sym] ?? "1990",
    },
    price: {
      current: holding.price,
      open: prevClose * (1 + (r() - 0.5) * 0.005),
      high,
      low,
      previousClose: prevClose,
      change: holding.dailyChangeAmt,
      changePct: holding.dailyChangePct,
      week52High,
      week52Low,
      ytdChangePct: holding.profitSinceInception / (holding.purchasePrice * holding.shares),
      dayRange: [low, high],
    },
    volume: {
      current: currentVol,
      avg10D,
      avg30D,
      volumeRatio: avg30D > 0 ? currentVol / avg30D : 1,
      relativeVolume: avg10D > 0 ? currentVol / avg10D : 1,
      vwap: holding.price * (0.998 + r() * 0.004),
    },
    technical: {
      sma20,
      sma50,
      sma200,
      ema12,
      ema26,
      rsi14,
      macdLine,
      macdSignal,
      macdHistogram,
      bollingerUpper: bbMean + 2 * bbStd,
      bollingerMiddle: bbMean,
      bollingerLower: bbMean - 2 * bbStd,
      atr14,
      stochK,
      stochD: Math.min(100, stochD),
      adx,
      obvTrend,
      goldenCrossStatus,
    },
    valuation: {
      peRatio,
      forwardPE,
      pbRatio,
      psRatio,
      pegRatio,
      evToEbitda,
      evToRevenue,
      priceToFcf,
      dividendYield,
      payoutRatio,
    },
    fundamental: {
      revenue,
      netIncome,
      ebitda,
      freeCashFlow: fcf,
      grossMargin,
      operatingMargin,
      netMargin,
      roe,
      roa,
      roic,
      debtToEquity,
      currentRatio,
      quickRatio,
      interestCoverage,
      sharesOutstanding: shares,
      enterpriseValue,
    },
    risk: {
      beta: holding.beta,
      sharpe,
      sortino,
      maxDrawdown: mdd,
      var95,
      annualizedVol: annualVol,
      correlationSpy: 0.5 + r() * 0.45,
      informationRatio: sharpe * (0.3 + r() * 0.7),
    },
    sentiment: {
      analystBuy,
      analystHold,
      analystSell,
      averageTargetPrice: Math.round(avgTarget * 100) / 100,
      socialSentiment: Math.round(socialSentiment * 100) / 100,
      newsSentiment: Math.round(newsSentiment * 100) / 100,
      insiderSignal,
      fearGreedScore: fearGreed,
    },
    priceSeries: series,
  };
}

// ─── Pre-built enriched holdings cache ───────────────────────────────────────

let _cache: EnrichedHolding[] | null = null;

export function getEnrichedHoldings(): EnrichedHolding[] {
  if (!_cache) {
    _cache = holdingsData.map(buildEnrichedHolding);
  }
  return _cache;
}

export function getEnrichedBySymbol(symbol: string): EnrichedHolding | undefined {
  return getEnrichedHoldings().find((e) => e.holding.symbol === symbol);
}
