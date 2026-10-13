/**
 * excelModelEngine.ts
 *
 * Systemic Financial & Operational Model Engine extracted directly from
 * '20.+Complete+the+BS_before.xlsx'.
 *
 * Covers the complete 7-step modeling pipeline:
 * 1. Driver Assumptions (Volumes, Pricing, Margin %, Working Capital Days, Capex %, Debt Rates)
 * 2. Revenue & Cost of Sales Segment Modeling
 * 3. PP&E Roll-forward & Working Capital (AR, Inventory, AP)
 * 4. Income Statement (P&L: Rev, COGS, Gross Profit, OPEX, EBITDA, D&A, EBIT, EBT, Tax, Net Income)
 * 5. Balance Sheet (Assets = Liabilities + Equity balance check)
 * 6. Cash Flow Statement (Operating, Investing, Financing, Ending Cash)
 * 7. DCF Valuation & Peer Multiples Comparison (WACC, Gordon Growth TV, Exit Multiples, UFCF Bridge)
 *
 * Broadened to dynamically accept parameters for all market sectors.
 */

export interface ModelDrivers {
  sector: string;
  companyName: string;
  ticker: string;
  baseYear: number;
  // Volume & Price Drivers
  unitVolumeBase: number;
  volumeGrowthRate: number; // e.g. 0.08 for 8%
  averageUnitPrice: number; // $ per unit
  priceGrowthRate: number; // e.g. 0.02
  // Secondary Segment Drivers
  secondaryRevenueBase: number;
  secondaryGrowthRate: number;
  // Margin Drivers
  grossMarginPct: number; // e.g. 0.28
  secondaryGrossMarginPct: number;
  sgaPctOfRev: number; // e.g. 0.10
  rdPctOfRev: number; // e.g. 0.05
  // Working Capital Drivers (Days)
  dso: number; // Days Sales Outstanding (AR)
  dio: number; // Days Inventory Outstanding
  dpo: number; // Days Payable Outstanding (AP)
  // Capital Structure & Financing Drivers
  capexPctOfRev: number; // Capex as % of Revenue
  deprPctOfPpe: number; // Depreciation as % of PP&E
  taxRate: number; // Effective Tax Rate (e.g. 0.21)
  interestRateOnDebt: number; // Cost of Debt (e.g. 0.045)
  minCashBalance: number; // Minimum Cash Required
  initialCash: number;
  initialAr: number;
  initialInventory: number;
  initialPpeNet: number;
  initialAp: number;
  initialDebt: number;
  initialEquity: number;
  // Valuation Drivers
  wacc: number; // e.g. 0.085
  perpetualGrowthRate: number; // e.g. 0.025
  exitEvEbitdaMultiple: number; // e.g. 14.5
  sharesOutstanding: number; // millions
}

export interface FinancialYearReport {
  year: number;
  // P&L
  volume: number;
  unitPrice: number;
  primaryRevenue: number;
  secondaryRevenue: number;
  totalRevenue: number;
  primaryCogs: number;
  secondaryCogs: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  sgaOpex: number;
  rdOpex: number;
  totalOpex: number;
  ebitda: number;
  ebitdaMargin: number;
  depreciation: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  taxExpense: number;
  netIncome: number;
  netMargin: number;

  // PP&E & Capital Expenditures
  beginningPpe: number;
  capex: number;
  endingPpe: number;

  // Balance Sheet
  cash: number;
  accountsReceivable: number;
  inventory: number;
  totalCurrentAssets: number;
  ppeNet: number;
  totalAssets: number;

  accountsPayable: number;
  shortTermDebt: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  totalLiabilities: number;

  commonStock: number;
  retainedEarnings: number;
  totalEquity: number;

  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  balanceDifference: number;

  // Cash Flow Statement
  cfoNetIncome: number;
  cfoDepreciation: number;
  cfoChangeAr: number;
  cfoChangeInventory: number;
  cfoChangeAp: number;
  cashFromOperations: number;

  cfiCapex: number;
  cashFromInvesting: number;

  cffDebtChange: number;
  cashFromFinancing: number;

  netCashChange: number;
  beginningCash: number;
  endingCash: number;

  // Valuation Free Cash Flows
  ufcf: number; // Unlevered Free Cash Flow = EBIT*(1-T) + D&A - Capex - Change in NWC
}

export interface ValuationOutput {
  wacc: number;
  perpetualGrowthRate: number;
  exitMultiple: number;
  dcfEnterpriseValueGordon: number;
  dcfEnterpriseValueMultiple: number;
  impliedEquityValueGordon: number;
  impliedEquityValueMultiple: number;
  impliedSharePriceGordon: number;
  impliedSharePriceMultiple: number;
  /** Net debt at the valuation date (opening balance sheet). */
  netDebtAtValuation: number;
  /** Share of Gordon EV that comes from the terminal value (0–1). */
  tvShareOfEv: number;
  /** Perpetual growth actually used after the g < WACC guard. */
  effectiveGrowthRate: number;
  sensitivityMatrix: {
    wacc: number;
    gordonPrice: number;
    multiplePrice: number;
  }[];
  comparableMultiples: {
    peRatio: number;
    evToEbitda: number;
    evToSales: number;
    pbRatio: number;
  };
}

export interface SectorBenchmarkPreset {
  id: string;
  name: string;
  description: string;
  defaultDrivers: ModelDrivers;
}

export const SECTOR_PRESETS: Record<string, SectorBenchmarkPreset> = {
  automotive: {
    id: "automotive",
    name: "Automotive & Electric Vehicles",
    description: "Model based directly on Tesla/EV automotive delivery and battery energy storage drivers.",
    defaultDrivers: {
      sector: "Automotive",
      companyName: "Veloce Motors Corp",
      ticker: "VELO",
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
  tech: {
    id: "tech",
    name: "Enterprise Software & Cloud AI",
    description: "High gross margin subscription ARR model with strong operating leverage.",
    defaultDrivers: {
      sector: "Technology",
      companyName: "Apex Cloud AI Inc",
      ticker: "APEX",
      baseYear: 2025,
      unitVolumeBase: 4500,
      volumeGrowthRate: 0.22,
      averageUnitPrice: 1200000,
      priceGrowthRate: 0.04,
      secondaryRevenueBase: 1200000000,
      secondaryGrowthRate: 0.18,
      grossMarginPct: 0.76,
      secondaryGrossMarginPct: 0.45,
      sgaPctOfRev: 0.28,
      rdPctOfRev: 0.18,
      dso: 42,
      dio: 10,
      dpo: 30,
      capexPctOfRev: 0.05,
      deprPctOfPpe: 0.20,
      taxRate: 0.21,
      interestRateOnDebt: 0.05,
      minCashBalance: 2000000000,
      initialCash: 6500000000,
      initialAr: 950000000,
      initialInventory: 120000000,
      initialPpeNet: 2800000000,
      initialAp: 540000000,
      initialDebt: 1200000000,
      initialEquity: 8630000000,
      wacc: 0.085,
      perpetualGrowthRate: 0.035,
      exitEvEbitdaMultiple: 22.0,
      sharesOutstanding: 1450,
    },
  },
  energy: {
    id: "energy",
    name: "Renewable Energy & Infrastructure",
    description: "Capital intensive model with long-term PPA agreements and steady cash flow yields.",
    defaultDrivers: {
      sector: "Energy",
      companyName: "Helios Renewable Power",
      ticker: "HELI",
      baseYear: 2025,
      unitVolumeBase: 25000, // GWh
      volumeGrowthRate: 0.12,
      averageUnitPrice: 68000, // $ per GWh
      priceGrowthRate: 0.015,
      secondaryRevenueBase: 450000000,
      secondaryGrowthRate: 0.08,
      grossMarginPct: 0.52,
      secondaryGrossMarginPct: 0.35,
      sgaPctOfRev: 0.06,
      rdPctOfRev: 0.015,
      dso: 45,
      dio: 15,
      dpo: 40,
      capexPctOfRev: 0.22,
      deprPctOfPpe: 0.06,
      taxRate: 0.19,
      interestRateOnDebt: 0.055,
      minCashBalance: 800000000,
      initialCash: 2100000000,
      initialAr: 310000000,
      initialInventory: 90000000,
      initialPpeNet: 14500000000,
      initialAp: 280000000,
      initialDebt: 8200000000,
      initialEquity: 8520000000,
      wacc: 0.075,
      perpetualGrowthRate: 0.02,
      exitEvEbitdaMultiple: 12.0,
      sharesOutstanding: 890,
    },
  },
  healthcare: {
    id: "healthcare",
    name: "Biotech & Pharmaceuticals",
    description: "R&D heavy commercialization model with high specialty drug margins.",
    defaultDrivers: {
      sector: "Healthcare",
      companyName: "Genomics Vanguard Pharma",
      ticker: "GNVX",
      baseYear: 2025,
      unitVolumeBase: 420000,
      volumeGrowthRate: 0.18,
      averageUnitPrice: 18500,
      priceGrowthRate: 0.03,
      secondaryRevenueBase: 850000000,
      secondaryGrowthRate: 0.10,
      grossMarginPct: 0.82,
      secondaryGrossMarginPct: 0.60,
      sgaPctOfRev: 0.24,
      rdPctOfRev: 0.22,
      dso: 50,
      dio: 60,
      dpo: 45,
      capexPctOfRev: 0.045,
      deprPctOfPpe: 0.15,
      taxRate: 0.16,
      interestRateOnDebt: 0.048,
      minCashBalance: 1500000000,
      initialCash: 4800000000,
      initialAr: 1200000000,
      initialInventory: 1400000000,
      initialPpeNet: 3900000000,
      initialAp: 880000000,
      initialDebt: 2100000000,
      initialEquity: 8320000000,
      wacc: 0.088,
      perpetualGrowthRate: 0.028,
      exitEvEbitdaMultiple: 18.5,
      sharesOutstanding: 1120,
    },
  },
};

/**
 * Executes a 5-year systemic financial projection using the rules of 20.+Complete+the+BS_before.xlsx
 */
export function runSystemicFinancialModel(drivers: ModelDrivers): {
  reports: FinancialYearReport[];
  valuation: ValuationOutput;
} {
  const yearsCount = 5;
  const reports: FinancialYearReport[] = [];

  let prevCash = drivers.initialCash;
  let prevAr = drivers.initialAr;
  let prevInventory = drivers.initialInventory;
  let prevPpeNet = drivers.initialPpeNet;
  let prevAp = drivers.initialAp;
  let prevDebt = drivers.initialDebt;
  let prevRetainedEarnings = drivers.initialEquity * 0.6;
  const commonStock = drivers.initialEquity * 0.4;

  let vol = drivers.unitVolumeBase;
  let unitPrice = drivers.averageUnitPrice;
  let secRev = drivers.secondaryRevenueBase;

  for (let i = 0; i < yearsCount; i++) {
    const yr = drivers.baseYear + i + 1;

    // 1. Revenue Workings
    vol = vol * (1 + drivers.volumeGrowthRate);
    unitPrice = unitPrice * (1 + drivers.priceGrowthRate);
    secRev = secRev * (1 + drivers.secondaryGrowthRate);

    const primaryRev = vol * unitPrice;
    const totalRev = primaryRev + secRev;

    // 2. Cost of Sales & Gross Profit
    const primaryCogs = primaryRev * (1 - drivers.grossMarginPct);
    const secCogs = secRev * (1 - drivers.secondaryGrossMarginPct);
    const totalCogs = primaryCogs + secCogs;
    const grossProfit = totalRev - totalCogs;
    const grossMargin = totalRev > 0 ? grossProfit / totalRev : 0;

    // 3. Operating Expenses
    const sga = totalRev * drivers.sgaPctOfRev;
    const rd = totalRev * drivers.rdPctOfRev;
    const totalOpex = sga + rd;
    const ebitda = grossProfit - totalOpex;

    // 4. PP&E Roll-forward & Depreciation
    const beginningPpe = prevPpeNet;
    const capex = totalRev * drivers.capexPctOfRev;
    const depr = (beginningPpe + capex) * drivers.deprPctOfPpe;
    const endingPpe = beginningPpe + capex - depr;

    // 5. EBIT & Financing
    const ebit = ebitda - depr;
    const interestExp = prevDebt * drivers.interestRateOnDebt;
    const ebt = ebit - interestExp;
    const taxExp = Math.max(0, ebt * drivers.taxRate);
    const netInc = ebt - taxExp;
    const netMargin = totalRev > 0 ? netInc / totalRev : 0;

    // 6. Working Capital Requirements (Days Formula directly from Excel workings)
    const newAr = (totalRev * drivers.dso) / 365;
    const newInv = (totalCogs * drivers.dio) / 365;
    const newAp = (totalCogs * drivers.dpo) / 365;

    const changeAr = newAr - prevAr;
    const changeInv = newInv - prevInventory;
    const changeAp = newAp - prevAp;

    // 7. Cash Flow Statement
    const cfo = netInc + depr - changeAr - changeInv + changeAp;
    const cfi = -capex;

    // Debt repayment / financing check
    let debtChange = 0;
    let endingDebt = prevDebt;

    // Retained Earnings Update
    const endingRetainedEarnings = prevRetainedEarnings + netInc;
    const totalEquity = commonStock + endingRetainedEarnings;

    // Preliminary Cash before balancing
    const netCashBeforeBalancing = cfo + cfi + debtChange;
    let endingCash = prevCash + netCashBeforeBalancing;

    // Balance Sheet plug verification: Assets = Liabilities + Equity
    // Assets: Cash + AR + Inv + PP&E
    // Liab: AP + ShortDebt + LongDebt
    // Eq: CommonStock + RetainedEarnings
    if (endingCash < drivers.minCashBalance) {
      // Draw debt if cash falls below threshold
      const debtPlug = drivers.minCashBalance - endingCash;
      debtChange += debtPlug;
      endingDebt += debtPlug;
      endingCash = drivers.minCashBalance;
    }

    const cff = debtChange;
    const netCashChange = cfo + cfi + cff;
    const finalEndingCash = prevCash + netCashChange;

    const totalCurrentAssets = finalEndingCash + newAr + newInv;
    const totalAssets = totalCurrentAssets + endingPpe;
    const totalCurrentLiab = newAp;
    const totalLiab = totalCurrentLiab + endingDebt;
    const finalLiabAndEq = totalLiab + totalEquity;

    const balanceDiff = Math.abs(totalAssets - finalLiabAndEq);
    const isBalanced = balanceDiff < 1.0; // within floating point cent threshold

    // Unlevered Free Cash Flow = NOPAT + D&A - Capex - Change in NWC.
    // Operating losses carry no negative tax, so NOPAT only taxes positive EBIT.
    const changeNwc = changeAr + changeInv - changeAp;
    const nopat = ebit - Math.max(0, ebit) * drivers.taxRate;
    const ufcf = nopat + depr - capex - changeNwc;

    const report: FinancialYearReport = {
      year: yr,
      volume: Math.round(vol),
      unitPrice: Math.round(unitPrice * 100) / 100,
      primaryRevenue: Math.round(primaryRev),
      secondaryRevenue: Math.round(secRev),
      totalRevenue: Math.round(totalRev),
      primaryCogs: Math.round(primaryCogs),
      secondaryCogs: Math.round(secCogs),
      totalCogs: Math.round(totalCogs),
      grossProfit: Math.round(grossProfit),
      grossMargin: Math.round(grossMargin * 1000) / 1000,
      sgaOpex: Math.round(sga),
      rdOpex: Math.round(rd),
      totalOpex: Math.round(totalOpex),
      ebitda: Math.round(ebitda),
      ebitdaMargin: totalRev > 0 ? Math.round((ebitda / totalRev) * 1000) / 1000 : 0,
      depreciation: Math.round(depr),
      ebit: Math.round(ebit),
      interestExpense: Math.round(interestExp),
      ebt: Math.round(ebt),
      taxExpense: Math.round(taxExp),
      netIncome: Math.round(netInc),
      netMargin: Math.round(netMargin * 1000) / 1000,

      beginningPpe: Math.round(beginningPpe),
      capex: Math.round(capex),
      endingPpe: Math.round(endingPpe),

      cash: Math.round(finalEndingCash),
      accountsReceivable: Math.round(newAr),
      inventory: Math.round(newInv),
      totalCurrentAssets: Math.round(totalCurrentAssets),
      ppeNet: Math.round(endingPpe),
      totalAssets: Math.round(totalAssets),

      accountsPayable: Math.round(newAp),
      shortTermDebt: 0,
      totalCurrentLiabilities: Math.round(totalCurrentLiab),
      longTermDebt: Math.round(endingDebt),
      totalLiabilities: Math.round(totalLiab),

      commonStock: Math.round(commonStock),
      retainedEarnings: Math.round(endingRetainedEarnings),
      totalEquity: Math.round(totalEquity),

      totalLiabilitiesAndEquity: Math.round(finalLiabAndEq),
      isBalanced,
      balanceDifference: Math.round(balanceDiff),

      cfoNetIncome: Math.round(netInc),
      cfoDepreciation: Math.round(depr),
      cfoChangeAr: Math.round(-changeAr),
      cfoChangeInventory: Math.round(-changeInv),
      cfoChangeAp: Math.round(changeAp),
      cashFromOperations: Math.round(cfo),

      cfiCapex: Math.round(cfi),
      cashFromInvesting: Math.round(cfi),

      cffDebtChange: Math.round(cff),
      cashFromFinancing: Math.round(cff),

      netCashChange: Math.round(netCashChange),
      beginningCash: Math.round(prevCash),
      endingCash: Math.round(finalEndingCash),

      ufcf: Math.round(ufcf),
    };

    reports.push(report);

    // Roll-forward state for next year
    prevCash = finalEndingCash;
    prevAr = newAr;
    prevInventory = newInv;
    prevPpeNet = endingPpe;
    prevAp = newAp;
    prevDebt = endingDebt;
    prevRetainedEarnings = endingRetainedEarnings;
  }

  // 8. DCF Valuation & Multiples Calculation
  const valuation = calculateValuation(reports, drivers);

  return { reports, valuation };
}

/** Minimum spread kept between WACC and perpetual growth. */
export const MIN_WACC_G_SPREAD = 0.005;

/**
 * Discounted-cash-flow core shared by the headline valuation and every
 * sensitivity grid, so all of them describe the same maths.
 *
 * Valuation date = start of the projection, therefore:
 *  - cash flows are discounted from year 1 (end-of-year convention);
 *  - the EV -> equity bridge uses the OPENING net debt. Using year-5 net debt
 *    adds back the cash those same discounted UFCFs generated — a double
 *    count that inflated every target price.
 *  - perpetual growth is capped at WACC - 0.5pp so Gordon never divides by
 *    zero or flips sign.
 */
export function discountCashFlows(
  reports: FinancialYearReport[],
  opts: { wacc: number; g: number; exitMultiple: number; netDebt: number; shares: number },
) {
  const { wacc, exitMultiple, netDebt } = opts;
  const g = Math.min(opts.g, wacc - MIN_WACC_G_SPREAD);
  const shares = Math.max(1, opts.shares);
  const n = reports.length;
  const last = reports[n - 1]!;

  const pvUfcf = reports.reduce((acc, r, idx) => acc + r.ufcf / Math.pow(1 + wacc, idx + 1), 0);
  const discountN = Math.pow(1 + wacc, n);

  const tvGordon = (last.ufcf * (1 + g)) / (wacc - g);
  const pvTvGordon = tvGordon / discountN;
  const evGordon = pvUfcf + pvTvGordon;

  const tvMultiple = last.ebitda * exitMultiple;
  const evMultiple = pvUfcf + tvMultiple / discountN;

  const eqGordon = Math.max(0, evGordon - netDebt);
  const eqMultiple = Math.max(0, evMultiple - netDebt);

  return {
    g,
    pvUfcf,
    evGordon,
    evMultiple,
    eqGordon,
    eqMultiple,
    tvShareOfEv: evGordon > 0 ? Math.min(1, Math.max(0, pvTvGordon / evGordon)) : 1,
    priceGordon: eqGordon / shares / 1e6,
    priceMultiple: eqMultiple / shares / 1e6,
  };
}

function calculateValuation(reports: FinancialYearReport[], drivers: ModelDrivers): ValuationOutput {
  const wacc = drivers.wacc;
  const exitMult = drivers.exitEvEbitdaMultiple;
  const netDebt = drivers.initialDebt - drivers.initialCash;
  const base = {
    g: drivers.perpetualGrowthRate,
    exitMultiple: exitMult,
    netDebt,
    shares: drivers.sharesOutstanding,
  };

  const core = discountCashFlows(reports, { wacc, ...base });

  // WACC sensitivity strip (Gordon & exit multiple)
  const sensitivityMatrix: ValuationOutput["sensitivityMatrix"] = [
    wacc - 0.015,
    wacc - 0.0075,
    wacc,
    wacc + 0.0075,
    wacc + 0.015,
  ].map((w) => {
    const run = discountCashFlows(reports, { wacc: w, ...base });
    return {
      wacc: Math.round(w * 10000) / 100,
      gordonPrice: Math.round(run.priceGordon * 100) / 100,
      multiplePrice: Math.round(run.priceMultiple * 100) / 100,
    };
  });

  // Forward multiples: priced today, measured on the first projected year.
  const fwd = reports[0]!;
  const ratio = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 10) / 10 : 0);

  return {
    wacc,
    perpetualGrowthRate: drivers.perpetualGrowthRate,
    effectiveGrowthRate: core.g,
    exitMultiple: exitMult,
    dcfEnterpriseValueGordon: Math.round(core.evGordon),
    dcfEnterpriseValueMultiple: Math.round(core.evMultiple),
    impliedEquityValueGordon: Math.round(core.eqGordon),
    impliedEquityValueMultiple: Math.round(core.eqMultiple),
    impliedSharePriceGordon: Math.round(core.priceGordon * 100) / 100,
    impliedSharePriceMultiple: Math.round(core.priceMultiple * 100) / 100,
    netDebtAtValuation: Math.round(netDebt),
    tvShareOfEv: core.tvShareOfEv,
    sensitivityMatrix,
    comparableMultiples: {
      peRatio: ratio(core.eqGordon, fwd.netIncome),
      evToEbitda: ratio(core.evGordon, fwd.ebitda),
      evToSales: ratio(core.evGordon, fwd.totalRevenue),
      pbRatio: ratio(core.eqGordon, drivers.initialEquity),
    },
  };
}
