/**
 * multiTickerEngine.ts
 *
 * Universal Financial Modeling & Valuation Engine for all supported tickers:
 * TSLA, MSFT, GOOGL, AAPL, NVDA, AMZN.
 *
 * Capabilities:
 * - 3-Case Projections (Best / Base / Worst)
 * - Real-Time Recalculation across editable driver parameters
 * - Integrated CAPM WACC Calculation
 * - Dual Terminal Value DCF (Gordon Growth + Exit Multiple)
 * - 5x6 WACC x Terminal Growth Sensitivity Matrix
 * - Balance Sheet Integrity Verification ($A = L + E$)
 */

import {
  type TechTicker,
  MULTI_TICKER_DATABASE,
  YEARS_15,
  YEAR_LABELS_15,
  type TickerFullModel,
  type CompanyMeta,
} from "@/data/multiTickerFinancialData";

export type CaseScenario = "best" | "base" | "worst";

export interface UniversalEditableDrivers {
  primaryVolumeGrowth: number;
  primaryPriceGrowth: number;
  primaryGrossMargin: number;
  secondaryGrowthRate: number;
  secondaryGrossMargin: number;
  opexPctOfRev: number;
  dso: number;
  dio: number;
  dpo: number;
  taxRate: number;
  wacc: number;
  terminalGrowthRate: number;
  exitEvEbitdaMultiple: number;
}

export interface UniversalModelOutput {
  ticker: TechTicker;
  years: number[];
  yearLabels: string[];
  totalRevenue: number[];
  primaryRevenue: number[];
  secondaryRevenue: number[];
  grossProfit: number[];
  gpMargin: number[];
  opex: number[];
  ebit: number[];
  ebitMargin: number[];
  netIncome: number[];
  netMargin: number[];
  totalAssets: number[];
  totalLiabilities: number[];
  equity: number[];
  cash: number[];
  ufcf: number[];
  balanceCheckPass: boolean;
}

export interface UniversalDCFOutput {
  wacc: number;
  costOfEquity: number;
  costOfDebt: number;
  riskFreeRate: number;
  beta: number;
  marketPremium: number;
  taxRate: number;
  forecastUFCF: number[];
  discountFactors: number[];
  pvUFCF: number[];
  sumPvUFCF: number;
  terminalGrowthRate: number;
  gordonGrowthTV: number;
  exitMultipleTV: number;
  avgTV: number;
  pvTV: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  sharesOutstanding: number;
  impliedSharePrice: number;
  currentSharePrice: number;
  upsidePct: number;
  sensitivityMatrix: { wacc: number; growth: number; price: number }[];
}

export interface UniversalTriCaseOutput {
  best: UniversalModelOutput;
  base: UniversalModelOutput;
  worst: UniversalModelOutput;
}

// ─── Get Default Editable Drivers for a Given Ticker ───────────────────────

export function getDefaultDriversForTicker(ticker: TechTicker): UniversalEditableDrivers {
  const model = MULTI_TICKER_DATABASE[ticker];
  return {
    primaryVolumeGrowth: model.segment.primaryVolumeGrowth,
    primaryPriceGrowth: model.segment.primaryPriceGrowth,
    primaryGrossMargin: model.segment.primaryGrossMargin,
    secondaryGrowthRate: model.segment.secondaryGrowthRate,
    secondaryGrossMargin: model.segment.secondaryGrossMargin,
    opexPctOfRev: model.opexPctOfRev,
    dso: model.dso,
    dio: model.dio,
    dpo: model.dpo,
    taxRate: model.meta.taxRate,
    wacc: 0.0, // 0 indicates automatic calculation via CAPM
    terminalGrowthRate: model.terminalGrowthRate,
    exitEvEbitdaMultiple: model.exitEvEbitdaMultiple,
  };
}

// ─── CAPM WACC Calculation ──────────────────────────────────────────────────

export function calculateUniversalWACC(
  meta: CompanyMeta,
  overrideWacc: number = 0.0,
): { wacc: number; costOfEquity: number; costOfDebtAfterTax: number } {
  const costOfEquity = meta.riskFreeRate + meta.beta * meta.marketRiskPremium;
  const costOfDebtAfterTax = meta.bondYield * (1 - meta.taxRate);
  const calculatedWacc = meta.equityWeight * costOfEquity + meta.debtWeight * costOfDebtAfterTax;
  const finalWacc = overrideWacc > 0 ? overrideWacc : calculatedWacc;
  return { wacc: finalWacc, costOfEquity, costOfDebtAfterTax };
}

// ─── Run Universal Model for a Single Scenario Case ─────────────────────────

export function runUniversalModelForCase(
  ticker: TechTicker,
  caseScenario: CaseScenario,
  drivers: UniversalEditableDrivers,
): UniversalModelOutput {
  const model = MULTI_TICKER_DATABASE[ticker];
  const years = YEARS_15;
  const n = years.length;

  const caseMultiplier = caseScenario === "best" ? 1.03 : caseScenario === "worst" ? 0.97 : 1.0;
  const basePL = model.plRows.find((r) => r.label === "Total Revenues")!.values;

  // Revenue adjustments for forecast years (2020 onwards, index 5+)
  const totalRevenue = basePL.map((v, i) => (i >= 5 ? Math.round(v * caseMultiplier) : v));
  const primaryRevenue = totalRevenue.map((v) => Math.round(v * 0.7));
  const secondaryRevenue = totalRevenue.map((v) => Math.round(v * 0.3));

  // Gross profit derived from custom or case gross margin
  const marginAdj = caseScenario === "best" ? 0.02 : caseScenario === "worst" ? -0.02 : 0.0;
  const effectiveMargin = drivers.primaryGrossMargin + marginAdj;
  const grossProfit = totalRevenue.map((r, i) => (i >= 5 ? Math.round(r * effectiveMargin) : Math.round(r * model.segment.primaryGrossMargin)));
  const gpMargin = grossProfit.map((gp, i) => (totalRevenue[i]! > 0 ? gp / totalRevenue[i]! : 0));

  // Operating Expenses
  const opex = totalRevenue.map((r, i) => (i >= 5 ? Math.round(-r * drivers.opexPctOfRev) : Math.round(-r * model.opexPctOfRev)));

  // Operating Income (EBIT)
  const ebit = grossProfit.map((gp, i) => gp + opex[i]!);
  const ebitMargin = ebit.map((e, i) => (totalRevenue[i]! > 0 ? e / totalRevenue[i]! : 0));

  // Tax Shield & Net Income
  const taxes = ebit.map((e) => (e > 0 ? Math.round(-e * drivers.taxRate) : 0));
  const netIncome = ebit.map((e, i) => e + taxes[i]!);
  const netMargin = netIncome.map((ni, i) => (totalRevenue[i]! > 0 ? ni / totalRevenue[i]! : 0));

  // Balance Sheet Rows
  const totalAssets = model.bsRows.find((r) => r.label.includes("Total Assets"))!.values;
  const totalLiab = model.bsRows.find((r) => r.label.includes("Total Liabilities"))!.values;
  const equity = model.bsRows.find((r) => r.label.includes("Equity"))!.values;
  const cash = model.bsRows.find((r) => r.label.includes("Cash"))!.values;

  // Balance Sheet Integrity Verification
  const balanceCheckPass = totalAssets.every((a, i) => Math.abs(a - (totalLiab[i]! + equity[i]!)) < 5);

  // Cash Flow
  const ufcf = model.cfRows.find((r) => r.label.includes("Unlevered Free Cash Flow"))?.values ?? netIncome.map((ni) => Math.round(ni * 0.95));

  return {
    ticker,
    years,
    yearLabels: YEAR_LABELS_15,
    totalRevenue,
    primaryRevenue,
    secondaryRevenue,
    grossProfit,
    gpMargin,
    opex,
    ebit,
    ebitMargin,
    netIncome,
    netMargin,
    totalAssets,
    totalLiabilities: totalLiab,
    equity,
    cash,
    ufcf,
    balanceCheckPass,
  };
}

// ─── Run Universal Tri-Case Projections ─────────────────────────────────────

export function runUniversalTriCaseModel(
  ticker: TechTicker,
  drivers: UniversalEditableDrivers,
): UniversalTriCaseOutput {
  return {
    best: runUniversalModelForCase(ticker, "best", drivers),
    base: runUniversalModelForCase(ticker, "base", drivers),
    worst: runUniversalModelForCase(ticker, "worst", drivers),
  };
}

// ─── Run Universal DCF Valuation Engine ─────────────────────────────────────

export function runUniversalDCFValuation(
  ticker: TechTicker,
  drivers: UniversalEditableDrivers,
  modelOutput: UniversalModelOutput,
): UniversalDCFOutput {
  const model = MULTI_TICKER_DATABASE[ticker];
  const meta = model.meta;
  const { wacc, costOfEquity, costOfDebtAfterTax } = calculateUniversalWACC(meta, drivers.wacc);

  // Forecast UFCF (2020-2029 forecast period, 10 years)
  const forecastUFCF = modelOutput.ufcf.slice(5);
  const forecastYears = forecastUFCF.length;

  // Discount Factors & Present Value of UFCF
  const discountFactors: number[] = [];
  const pvUFCF: number[] = [];
  for (let i = 0; i < forecastYears; i++) {
    const df = 1 / Math.pow(1 + wacc, i + 1);
    discountFactors.push(df);
    pvUFCF.push(forecastUFCF[i]! * df);
  }
  const sumPvUFCF = pvUFCF.reduce((a, b) => a + b, 0);

  // Terminal Value Calculation (Gordon Growth Model & Exit Multiple)
  const lastUFCF = forecastUFCF[forecastYears - 1]!;
  const terminalGrowth = drivers.terminalGrowthRate;
  const gordonGrowthTV = wacc > terminalGrowth ? (lastUFCF * (1 + terminalGrowth)) / (wacc - terminalGrowth) : lastUFCF * 20;

  const lastEBIT = Math.abs(modelOutput.ebit[modelOutput.ebit.length - 1]!);
  const exitMultipleTV = lastEBIT * drivers.exitEvEbitdaMultiple;
  const avgTV = (gordonGrowthTV + exitMultipleTV) / 2;
  const pvTV = avgTV / Math.pow(1 + wacc, forecastYears);

  // Enterprise Value & Equity Bridge
  const enterpriseValue = sumPvUFCF + pvTV;
  const cash = modelOutput.cash[modelOutput.cash.length - 1]!;
  const debt = Math.round(modelOutput.totalLiabilities[modelOutput.totalLiabilities.length - 1]! * 0.4);
  const netDebt = debt - cash;
  const equityValue = enterpriseValue - netDebt;

  // Shares Outstanding & Implied Price per Share
  const sharesOutstanding = meta.sharesOutstanding;
  const impliedSharePrice = Math.max(0, (equityValue / sharesOutstanding) * 1000);
  const currentSharePrice = meta.sharePrice;
  const upsidePct = (impliedSharePrice - currentSharePrice) / currentSharePrice;

  // 5x6 WACC x Growth Sensitivity Matrix
  const waccRange = [wacc - 0.02, wacc - 0.01, wacc, wacc + 0.01, wacc + 0.02];
  const growthRange = [0.015, 0.02, 0.025, 0.03, 0.035, 0.04];
  const sensitivityMatrix: UniversalDCFOutput["sensitivityMatrix"] = [];

  for (const w of waccRange) {
    for (const g of growthRange) {
      if (w <= g) {
        sensitivityMatrix.push({ wacc: w, growth: g, price: 0 });
        continue;
      }
      const tvLocal = (lastUFCF * (1 + g)) / (w - g);
      const pvTvLocal = tvLocal / Math.pow(1 + w, forecastYears);
      let sumPvLocal = 0;
      for (let i = 0; i < forecastYears; i++) {
        sumPvLocal += forecastUFCF[i]! / Math.pow(1 + w, i + 1);
      }
      const evLocal = sumPvLocal + pvTvLocal;
      const eqValLocal = evLocal - netDebt;
      const priceLocal = Math.max(0, (eqValLocal / sharesOutstanding) * 1000);
      sensitivityMatrix.push({ wacc: w, growth: g, price: priceLocal });
    }
  }

  return {
    wacc,
    costOfEquity,
    costOfDebt: costOfDebtAfterTax,
    riskFreeRate: meta.riskFreeRate,
    beta: meta.beta,
    marketPremium: meta.marketRiskPremium,
    taxRate: drivers.taxRate,
    forecastUFCF,
    discountFactors,
    pvUFCF,
    sumPvUFCF,
    terminalGrowthRate: terminalGrowth,
    gordonGrowthTV,
    exitMultipleTV,
    avgTV,
    pvTV,
    enterpriseValue,
    netDebt,
    equityValue,
    sharesOutstanding,
    impliedSharePrice,
    currentSharePrice,
    upsidePct,
    sensitivityMatrix,
  };
}
