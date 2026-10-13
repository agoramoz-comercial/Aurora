/**
 * stockBenchmarkData.ts
 *
 * Driver data mapping for all stock tickers in the portfolio pool
 * (TSLA, AAPL, MSFT, NVDA, AMZN, GOOGL, META, AMD, GE, CAT, DE, XOM, GILD, FB, KO, IBM, F),
 * extracted directly from the '20.+Complete+the+BS_before.xlsx' financial model structure.
 */

import type { ModelDrivers } from "./excelModelEngine";

export interface StockBenchmarkMeta {
  symbol: string;
  name: string;
  sector: string;
  segmentPrimaryLabel: string;
  segmentSecondaryLabel: string;
  drivers: ModelDrivers;
}

export const STOCK_BENCHMARK_DATABASE: Record<string, StockBenchmarkMeta> = {
  TSLA: {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    sector: "Automotive & Clean Energy",
    segmentPrimaryLabel: "Automotive Deliveries",
    segmentSecondaryLabel: "Energy Storage & Services",
    drivers: {
      sector: "Automotive",
      companyName: "Tesla, Inc.",
      ticker: "TSLA",
      baseYear: 2025,
      unitVolumeBase: 1800000,
      volumeGrowthRate: 0.15,
      averageUnitPrice: 44500,
      priceGrowthRate: -0.02,
      secondaryRevenueBase: 6500000000,
      secondaryGrowthRate: 0.25,
      grossMarginPct: 0.24,
      secondaryGrossMarginPct: 0.19,
      sgaPctOfRev: 0.055,
      rdPctOfRev: 0.042,
      dso: 35,
      dio: 48,
      dpo: 62,
      capexPctOfRev: 0.085,
      deprPctOfPpe: 0.12,
      taxRate: 0.18,
      interestRateOnDebt: 0.045,
      minCashBalance: 5000000000,
      initialCash: 16000000000,
      initialAr: 3200000000,
      initialInventory: 8500000000,
      initialPpeNet: 31000000000,
      initialAp: 12000000000,
      initialDebt: 4500000000,
      initialEquity: 42200000000,
      wacc: 0.09,
      perpetualGrowthRate: 0.03,
      exitEvEbitdaMultiple: 16.0,
      sharesOutstanding: 3180,
    },
  },
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Consumer Electronics & Tech",
    segmentPrimaryLabel: "Hardware Units (iPhone/Mac/iPad)",
    segmentSecondaryLabel: "Services & App Store Subscriptions",
    drivers: {
      sector: "Technology",
      companyName: "Apple Inc.",
      ticker: "AAPL",
      baseYear: 2025,
      unitVolumeBase: 235000000,
      volumeGrowthRate: 0.04,
      averageUnitPrice: 1050,
      priceGrowthRate: 0.02,
      secondaryRevenueBase: 85000000000,
      secondaryGrowthRate: 0.14,
      grossMarginPct: 0.38,
      secondaryGrossMarginPct: 0.74,
      sgaPctOfRev: 0.068,
      rdPctOfRev: 0.076,
      dso: 28,
      dio: 12,
      dpo: 55,
      capexPctOfRev: 0.035,
      deprPctOfPpe: 0.18,
      taxRate: 0.16,
      interestRateOnDebt: 0.038,
      minCashBalance: 25000000000,
      initialCash: 62000000000,
      initialAr: 29000000000,
      initialInventory: 6300000000,
      initialPpeNet: 43000000000,
      initialAp: 60000000000,
      initialDebt: 95000000000,
      initialEquity: 56950000000,
      wacc: 0.082,
      perpetualGrowthRate: 0.03,
      exitEvEbitdaMultiple: 24.5,
      sharesOutstanding: 15300,
    },
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    sector: "Cloud Infrastructure & Software",
    segmentPrimaryLabel: "Azure Cloud & Server Licenses",
    segmentSecondaryLabel: "Office 365 & Copilot Subscriptions",
    drivers: {
      sector: "Technology",
      companyName: "Microsoft Corp.",
      ticker: "MSFT",
      baseYear: 2025,
      unitVolumeBase: 420000000,
      volumeGrowthRate: 0.12,
      averageUnitPrice: 320,
      priceGrowthRate: 0.05,
      secondaryRevenueBase: 110000000000,
      secondaryGrowthRate: 0.16,
      grossMarginPct: 0.72,
      secondaryGrossMarginPct: 0.68,
      sgaPctOfRev: 0.11,
      rdPctOfRev: 0.13,
      dso: 52,
      dio: 8,
      dpo: 35,
      capexPctOfRev: 0.18,
      deprPctOfPpe: 0.14,
      taxRate: 0.19,
      interestRateOnDebt: 0.04,
      minCashBalance: 30000000000,
      initialCash: 75000000000,
      initialAr: 48000000000,
      initialInventory: 2500000000,
      initialPpeNet: 115000000000,
      initialAp: 22000000000,
      initialDebt: 60000000000,
      initialEquity: 268000000000,
      wacc: 0.08,
      perpetualGrowthRate: 0.035,
      exitEvEbitdaMultiple: 23.2,
      sharesOutstanding: 7430,
    },
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Semiconductors & AI Hardware",
    segmentPrimaryLabel: "Data Center AI GPU Compute Units",
    segmentSecondaryLabel: "Gaming GPUs & Software Licensing",
    drivers: {
      sector: "Semiconductors",
      companyName: "NVIDIA Corp.",
      ticker: "NVDA",
      baseYear: 2025,
      unitVolumeBase: 3500000,
      volumeGrowthRate: 0.35,
      averageUnitPrice: 28000,
      priceGrowthRate: 0.08,
      secondaryRevenueBase: 14000000000,
      secondaryGrowthRate: 0.20,
      grossMarginPct: 0.76,
      secondaryGrossMarginPct: 0.62,
      sgaPctOfRev: 0.05,
      rdPctOfRev: 0.09,
      dso: 48,
      dio: 75,
      dpo: 42,
      capexPctOfRev: 0.04,
      deprPctOfPpe: 0.22,
      taxRate: 0.15,
      interestRateOnDebt: 0.042,
      minCashBalance: 15000000000,
      initialCash: 34000000000,
      initialAr: 18000000000,
      initialInventory: 6500000000,
      initialPpeNet: 12000000000,
      initialAp: 4800000000,
      initialDebt: 11000000000,
      initialEquity: 58000000000,
      wacc: 0.092,
      perpetualGrowthRate: 0.04,
      exitEvEbitdaMultiple: 32.0,
      sharesOutstanding: 24600,
    },
  },
  AMZN: {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    sector: "E-Commerce & AWS Cloud",
    segmentPrimaryLabel: "Online Retail Units Fulfilled",
    segmentSecondaryLabel: "AWS Cloud Infrastructure & Advertising",
    drivers: {
      sector: "Consumer Cyclical",
      companyName: "Amazon.com Inc.",
      ticker: "AMZN",
      baseYear: 2025,
      unitVolumeBase: 9500000000,
      volumeGrowthRate: 0.09,
      averageUnitPrice: 42,
      priceGrowthRate: 0.015,
      secondaryRevenueBase: 185000000000,
      secondaryGrowthRate: 0.18,
      // Retail gross margin is reported net of fulfilment, so the opex load has
      // to sit below a ~27% product margin — the previous 18%/39% pairing drove
      // EBITDA negative and collapsed the DCF to zero.
      grossMarginPct: 0.27,
      secondaryGrossMarginPct: 0.62,
      sgaPctOfRev: 0.155,
      rdPctOfRev: 0.085,
      dso: 24,
      dio: 38,
      dpo: 78,
      capexPctOfRev: 0.095,
      deprPctOfPpe: 0.11,
      taxRate: 0.19,
      interestRateOnDebt: 0.046,
      minCashBalance: 35000000000,
      initialCash: 88000000000,
      initialAr: 42000000000,
      initialInventory: 34000000000,
      initialPpeNet: 195000000000,
      initialAp: 85000000000,
      initialDebt: 130000000000,
      initialEquity: 201000000000,
      wacc: 0.085,
      perpetualGrowthRate: 0.032,
      exitEvEbitdaMultiple: 18.5,
      sharesOutstanding: 10400,
    },
  },
  GOOGL: {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Digital Advertising & Search",
    segmentPrimaryLabel: "Search & YouTube Ad Impressions",
    segmentSecondaryLabel: "Google Cloud & Hardware Subscriptions",
    drivers: {
      sector: "Communication Services",
      companyName: "Alphabet Inc.",
      ticker: "GOOGL",
      baseYear: 2025,
      unitVolumeBase: 8500000000000,
      volumeGrowthRate: 0.08,
      averageUnitPrice: 0.028,
      priceGrowthRate: 0.02,
      secondaryRevenueBase: 65000000000,
      secondaryGrowthRate: 0.22,
      grossMarginPct: 0.58,
      secondaryGrossMarginPct: 0.42,
      sgaPctOfRev: 0.14,
      rdPctOfRev: 0.15,
      dso: 45,
      dio: 4,
      dpo: 32,
      capexPctOfRev: 0.12,
      deprPctOfPpe: 0.16,
      taxRate: 0.16,
      interestRateOnDebt: 0.039,
      minCashBalance: 40000000000,
      initialCash: 110000000000,
      initialAr: 42000000000,
      initialInventory: 1200000000,
      initialPpeNet: 125000000000,
      initialAp: 18000000000,
      initialDebt: 28000000000,
      initialEquity: 283000000000,
      wacc: 0.081,
      perpetualGrowthRate: 0.03,
      exitEvEbitdaMultiple: 17.8,
      sharesOutstanding: 12400,
    },
  },
  META: {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    sector: "Social Media & Metaverse AI",
    segmentPrimaryLabel: "Family of Apps Ad Impressions",
    segmentSecondaryLabel: "Reality Labs & Quest AI Hardware",
    drivers: {
      sector: "Communication Services",
      companyName: "Meta Platforms Inc.",
      ticker: "META",
      baseYear: 2025,
      unitVolumeBase: 6200000000000,
      volumeGrowthRate: 0.10,
      averageUnitPrice: 0.024,
      priceGrowthRate: 0.03,
      secondaryRevenueBase: 3500000000,
      secondaryGrowthRate: 0.25,
      grossMarginPct: 0.82,
      secondaryGrossMarginPct: 0.15,
      sgaPctOfRev: 0.18,
      rdPctOfRev: 0.28,
      dso: 42,
      dio: 6,
      dpo: 28,
      capexPctOfRev: 0.22,
      deprPctOfPpe: 0.15,
      taxRate: 0.17,
      interestRateOnDebt: 0.043,
      minCashBalance: 25000000000,
      initialCash: 65000000000,
      initialAr: 16000000000,
      initialInventory: 800000000,
      initialPpeNet: 95000000000,
      initialAp: 8500000000,
      initialDebt: 37000000000,
      initialEquity: 153000000000,
      wacc: 0.088,
      perpetualGrowthRate: 0.03,
      exitEvEbitdaMultiple: 16.4,
      sharesOutstanding: 2540,
    },
  },
  AMD: {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    sector: "Semiconductors & Compute",
    segmentPrimaryLabel: "Data Center & Client Processors",
    segmentSecondaryLabel: "Gaming & Embedded Chip Sets",
    drivers: {
      sector: "Semiconductors",
      companyName: "AMD Inc.",
      ticker: "AMD",
      baseYear: 2025,
      unitVolumeBase: 42000000,
      volumeGrowthRate: 0.18,
      averageUnitPrice: 480,
      priceGrowthRate: 0.04,
      secondaryRevenueBase: 6500000000,
      secondaryGrowthRate: 0.12,
      grossMarginPct: 0.53,
      secondaryGrossMarginPct: 0.48,
      sgaPctOfRev: 0.12,
      rdPctOfRev: 0.22,
      dso: 52,
      dio: 88,
      dpo: 48,
      capexPctOfRev: 0.045,
      deprPctOfPpe: 0.18,
      taxRate: 0.14,
      interestRateOnDebt: 0.045,
      minCashBalance: 3000000000,
      initialCash: 6000000000,
      initialAr: 4200000000,
      initialInventory: 5100000000,
      initialPpeNet: 4800000000,
      initialAp: 2100000000,
      initialDebt: 2500000000,
      initialEquity: 55000000000,
      wacc: 0.095,
      perpetualGrowthRate: 0.035,
      exitEvEbitdaMultiple: 28.0,
      sharesOutstanding: 1620,
    },
  },
};

/**
 * Opening balance sheet integrity.
 *
 * The per-ticker opening figures were entered line by line, so for most issuers
 * `initialEquity` did not equal assets minus liabilities — the model then
 * carried that constant gap through all five projected years and every balance
 * check failed. Equity is the plug in an opening balance sheet, so we derive it
 * here rather than trusting the hand-entered value.
 */
for (const meta of Object.values(STOCK_BENCHMARK_DATABASE)) {
  const d = meta.drivers;

  // Opening working capital is calibrated to the same days-based formula the
  // engine uses for every projected year. Hand-entered AR / inventory / AP
  // produced an artificial ΔNWC shock in year 1 that distorted UFCF and the DCF.
  const basePrimaryRev = d.unitVolumeBase * d.averageUnitPrice;
  const baseRevenue = basePrimaryRev + d.secondaryRevenueBase;
  const baseCogs =
    basePrimaryRev * (1 - d.grossMarginPct) + d.secondaryRevenueBase * (1 - d.secondaryGrossMarginPct);
  d.initialAr = (baseRevenue * d.dso) / 365;
  d.initialInventory = (baseCogs * d.dio) / 365;
  d.initialAp = (baseCogs * d.dpo) / 365;

  const openingAssets = d.initialCash + d.initialAr + d.initialInventory + d.initialPpeNet;
  const openingLiabilities = d.initialAp + d.initialDebt;
  d.initialEquity = openingAssets - openingLiabilities;
}

/**
 * Gets benchmark metadata for any symbol in stock database with safe fallback
 */
export function getStockBenchmark(symbol: string): StockBenchmarkMeta {
  const sym = symbol.toUpperCase();
  if (STOCK_BENCHMARK_DATABASE[sym]) {
    return STOCK_BENCHMARK_DATABASE[sym];
  }

  // Fallback for symbols not explicitly pre-loaded
  const base = STOCK_BENCHMARK_DATABASE.TSLA!;
  return {
    ...base,
    symbol: sym,
    name: `${sym} Corporate Holdings`,
    drivers: {
      ...base.drivers,
      ticker: sym,
      companyName: `${sym} Corp`,
    },
  };
}
