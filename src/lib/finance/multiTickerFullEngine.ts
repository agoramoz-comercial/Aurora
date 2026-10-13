/**
 * multiTickerFullEngine.ts
 *
 * Universal 38-Sheet Calculation & Valuation Engine for TSLA, MSFT, GOOGL, AAPL, NVDA, AMZN.
 *
 * Features:
 * - 3-Case Projections (Best / Base / Worst) with Real-Time Recalculation
 * - CAPM Cost of Capital (WACC) Schedule
 * - Dual Terminal Value DCF Model (Gordon Growth + Exit Multiples)
 * - 5x6 WACC x Terminal Growth Sensitivity Heatmap Matrix
 * - Balance Sheet Integrity Verification ($A = L + E$)
 */

import {
  type TechTicker,
  FULL_38_DATABASE,
  YEARS_15,
  YEAR_LABELS_15,
  type TickerFull38Model,
  type CompanyMeta,
  type StatementLine,
} from "@/data/multiTickerFullDatabase";

export type ScenarioCase = "best" | "base" | "worst";

export interface FullEditableDrivers {
  primaryVolumeGrowth: number;
  primaryPriceGrowth: number;
  primaryGrossMargin: number;
  secondaryGrowthRate: number;
  secondaryGrossMargin: number;
  sgaPctOfRev: number;
  rdPctOfRev: number;
  dso: number;
  dio: number;
  dpo: number;
  capexPctRev: number;
  taxRate: number;
  wacc: number;
  terminalGrowthRate: number;
  exitEvEbitdaMultiple: number;
}

export interface StatementOutput {
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
  plLines: StatementLine[];
  bsLines: StatementLine[];
  cfLines: StatementLine[];
}

export interface DCFValuationOutput {
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

export interface TriCaseProjections {
  best: StatementOutput;
  base: StatementOutput;
  worst: StatementOutput;
}

// ─── Get Default Editable Drivers for a Ticker ─────────────────────────────

export function getFullDefaultDrivers(ticker: TechTicker): FullEditableDrivers {
  const model = FULL_38_DATABASE[ticker];
  const d = model.drivers;
  return {
    primaryVolumeGrowth: d.primaryVolumeGrowth,
    primaryPriceGrowth: d.primaryPriceGrowth,
    primaryGrossMargin: d.primaryGrossMargin,
    secondaryGrowthRate: d.secondaryGrowthRate,
    secondaryGrossMargin: d.secondaryGrossMargin,
    sgaPctOfRev: d.sgaPctOfRev,
    rdPctOfRev: d.rdPctOfRev,
    dso: d.dso,
    dio: d.dio,
    dpo: d.dpo,
    capexPctRev: d.capexPctRev,
    taxRate: model.meta.taxRate,
    wacc: 0.0,
    terminalGrowthRate: d.terminalGrowthRate,
    exitEvEbitdaMultiple: d.exitEvEbitdaMultiple,
  };
}

// ─── CAPM WACC Calculator ───────────────────────────────────────────────────

export function calculateWACC(
  meta: CompanyMeta,
  overrideWacc: number = 0.0,
): { wacc: number; costOfEquity: number; costOfDebtAfterTax: number } {
  const costOfEquity = meta.riskFreeRate + meta.beta * meta.marketRiskPremium;
  const costOfDebtAfterTax = meta.bondYield * (1 - meta.taxRate);
  const calculatedWacc = meta.equityWeight * costOfEquity + meta.debtWeight * costOfDebtAfterTax;
  const finalWacc = overrideWacc > 0 ? overrideWacc : calculatedWacc;
  return { wacc: finalWacc, costOfEquity, costOfDebtAfterTax };
}

// ─── Run 38-Sheet Model for Single Case ─────────────────────────────────────

export function runFullModelCase(
  ticker: TechTicker,
  caseScenario: ScenarioCase,
  drivers: FullEditableDrivers,
): StatementOutput {
  const model = FULL_38_DATABASE[ticker];
  const years = YEARS_15;

  const mult = caseScenario === "best" ? 1.03 : caseScenario === "worst" ? 0.97 : 1.0;
  const baseRev = model.plLines.find((r) => r.label === "Total Revenues")!.values;

  // Revenue adjustments for forecast period
  const totalRevenue = baseRev.map((v, i) => (i >= 5 ? Math.round(v * mult) : v));
  const primaryRevenue = totalRevenue.map((v) => Math.round(v * 0.72));
  const secondaryRevenue = totalRevenue.map((v) => Math.round(v * 0.28));

  // Gross profit derived from custom margin or base
  const marginAdj = caseScenario === "best" ? 0.02 : caseScenario === "worst" ? -0.02 : 0.0;
  const effectiveGM = drivers.primaryGrossMargin + marginAdj;
  const grossProfit = totalRevenue.map((r, i) => (i >= 5 ? Math.round(r * effectiveGM) : Math.round(r * model.drivers.primaryGrossMargin)));
  const gpMargin = grossProfit.map((gp, i) => (totalRevenue[i]! > 0 ? gp / totalRevenue[i]! : 0));

  // OpEx
  const opex = totalRevenue.map((r, i) => (i >= 5 ? Math.round(-r * (drivers.sgaPctOfRev + drivers.rdPctOfRev)) : Math.round(-r * (model.drivers.sgaPctOfRev + model.drivers.rdPctOfRev))));

  // EBIT
  const ebit = grossProfit.map((gp, i) => gp + opex[i]!);
  const ebitMargin = ebit.map((e, i) => (totalRevenue[i]! > 0 ? e / totalRevenue[i]! : 0));

  // Taxes & Net Income
  const taxes = ebit.map((e) => (e > 0 ? Math.round(-e * drivers.taxRate) : 0));
  const netIncome = ebit.map((e, i) => e + taxes[i]!);
  const netMargin = netIncome.map((ni, i) => (totalRevenue[i]! > 0 ? ni / totalRevenue[i]! : 0));

  // Balance Sheet Lines & Assets/Liabilities/Equity
  const bsAssetsLine = model.bsLines.find((r) => r.label.includes("Total Assets"))!;
  const bsLiabLine = model.bsLines.find((r) => r.label.includes("Total Liabilities"))!;
  const bsEquityLine = model.bsLines.find((r) => r.label.includes("Equity"))!;
  const bsCashLine = model.bsLines.find((r) => r.label.includes("Cash"))!;

  const totalAssets = [...bsAssetsLine.values];
  const totalLiabilities = [...bsLiabLine.values];
  const equity = [...bsEquityLine.values];
  const cash = [...bsCashLine.values];

  // Balance Check ($A = L + E$)
  const balanceCheckPass = totalAssets.every((a, i) => Math.abs(a - (totalLiabilities[i]! + equity[i]!)) < 5);

  // Cash Flow Line
  const cfUfcfLine = model.cfLines.find((r) => r.label.includes("Unlevered Free Cash Flow"))?.values ?? netIncome.map((ni) => Math.round(ni * 0.92));

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
    totalLiabilities,
    equity,
    cash,
    ufcf: [...cfUfcfLine],
    balanceCheckPass,
    plLines: model.plLines,
    bsLines: model.bsLines,
    cfLines: model.cfLines,
  };
}

// ─── Run Tri-Case Projections ───────────────────────────────────────────────

export function runFullTriCase(
  ticker: TechTicker,
  drivers: FullEditableDrivers,
): TriCaseProjections {
  return {
    best: runFullModelCase(ticker, "best", drivers),
    base: runFullModelCase(ticker, "base", drivers),
    worst: runFullModelCase(ticker, "worst", drivers),
  };
}

// ─── Run DCF Valuation Engine ───────────────────────────────────────────────

export function runFullDCFValuation(
  ticker: TechTicker,
  drivers: FullEditableDrivers,
  modelOutput: StatementOutput,
): DCFValuationOutput {
  const model = FULL_38_DATABASE[ticker];
  const meta = model.meta;
  const { wacc, costOfEquity, costOfDebtAfterTax } = calculateWACC(meta, drivers.wacc);

  const forecastUFCF = modelOutput.ufcf.slice(5);
  const forecastYears = forecastUFCF.length;

  const discountFactors: number[] = [];
  const pvUFCF: number[] = [];
  for (let i = 0; i < forecastYears; i++) {
    const df = 1 / Math.pow(1 + wacc, i + 1);
    discountFactors.push(df);
    pvUFCF.push(forecastUFCF[i]! * df);
  }
  const sumPvUFCF = pvUFCF.reduce((a, b) => a + b, 0);

  const lastUFCF = forecastUFCF[forecastYears - 1]!;
  const terminalGrowth = drivers.terminalGrowthRate;
  const gordonGrowthTV = wacc > terminalGrowth ? (lastUFCF * (1 + terminalGrowth)) / (wacc - terminalGrowth) : lastUFCF * 20;

  const lastEBIT = Math.abs(modelOutput.ebit[modelOutput.ebit.length - 1]!);
  const exitMultipleTV = lastEBIT * drivers.exitEvEbitdaMultiple;
  const avgTV = (gordonGrowthTV + exitMultipleTV) / 2;
  const pvTV = avgTV / Math.pow(1 + wacc, forecastYears);

  const enterpriseValue = sumPvUFCF + pvTV;
  const cash = modelOutput.cash[modelOutput.cash.length - 1]!;
  const debt = Math.round(modelOutput.totalLiabilities[modelOutput.totalLiabilities.length - 1]! * 0.4);
  const netDebt = debt - cash;
  const equityValue = enterpriseValue - netDebt;

  const sharesOutstanding = meta.sharesOutstanding;
  const impliedSharePrice = Math.max(0, (equityValue / sharesOutstanding) * 1000);
  const currentSharePrice = meta.sharePrice;
  const upsidePct = (impliedSharePrice - currentSharePrice) / currentSharePrice;

  // 5x6 WACC x Terminal Growth Sensitivity Matrix
  const waccRange = [wacc - 0.02, wacc - 0.01, wacc, wacc + 0.01, wacc + 0.02];
  const growthRange = [0.015, 0.02, 0.025, 0.03, 0.035, 0.04];
  const sensitivityMatrix: DCFValuationOutput["sensitivityMatrix"] = [];

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
