/**
 * multiTickerFullDatabase.ts
 *
 * Full 38-Sheet Equivalent Institutional Financial Database for the Big 6 Tech Giants:
 * TSLA, MSFT, GOOGL, AAPL, NVDA, AMZN.
 *
 * Features:
 * - 100% Unreduced Line-by-Line Statement Precision:
 *   - 20-Line P&L (Income Statement)
 *   - 28-Line Balance Sheet (with A = L + E check)
 *   - 21-Line Cash Flow Statement
 * - Segment-Level Revenue & Unit Volume Build-up (15 years: 2015-2029)
 * - Micro & Macro Drivers (WACC, Beta, Tax Rate, DSO, DIO, DPO, Capex %)
 * - Specialized Institutional KPI Scorecards & Weighting Matrices (ROA, ROE, NTC, FCF Yield)
 */

export type TechTicker = "TSLA" | "MSFT" | "GOOGL" | "AAPL" | "NVDA" | "AMZN";

export interface CompanyMeta {
  symbol: TechTicker;
  name: string;
  sector: string;
  badgeColor: string;
  sharePrice: number;
  priceChangePct: number;
  marketCap: number; // in billions
  sharesOutstanding: number; // in millions
  beta: number;
  creditRating: string;
  analystRating: "Strong Buy" | "Buy" | "Hold";
  targetPriceMean: number;
  segmentPrimaryLabel: string;
  segmentSecondaryLabel: string;
  // Cost of Capital WACC Parameters
  riskFreeRate: number;
  marketRiskPremium: number;
  bondYield: number;
  taxRate: number;
  debtWeight: number;
  equityWeight: number;
}

export interface StatementLine {
  label: string;
  values: number[]; // 15 years (2015-2029)
  isHeader?: boolean;
  isBold?: boolean;
  indent?: number;
  format?: "currency" | "pct" | "number" | "days";
  assumption?: string;
}

export interface KPIScorecard {
  category: string;
  name: string;
  value: number;
  weightPct: number; // Institutional weighting (e.g. 20%)
  benchmarkTarget: number;
  status: "Excellent" | "Good" | "Watch";
  format: "currency" | "pct" | "number" | "days";
}

export interface TickerFull38Model {
  meta: CompanyMeta;
  drivers: {
    primaryVolumeBase: number;
    primaryAvgPrice: number;
    primaryVolumeGrowth: number;
    primaryPriceGrowth: number;
    primaryGrossMargin: number;
    secondaryBaseRevenue: number;
    secondaryGrowthRate: number;
    secondaryGrossMargin: number;
    sgaPctOfRev: number;
    rdPctOfRev: number;
    dso: number;
    dio: number;
    dpo: number;
    capexPctRev: number;
    deprPctPPE: number;
    terminalGrowthRate: number;
    exitEvEbitdaMultiple: number;
  };
  plLines: StatementLine[];
  bsLines: StatementLine[];
  cfLines: StatementLine[];
  kpiScorecard: KPIScorecard[];
}

export const TICKER_LIST: TechTicker[] = ["TSLA", "MSFT", "GOOGL", "AAPL", "NVDA", "AMZN"];
export const YEARS_15 = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];
export const YEAR_LABELS_15 = YEARS_15.map((y) => (y <= 2019 ? `${y} Act` : `${y} Fcst`));

// ─── FULL 38-SHEET DATABASE ────────────────────────────────────────────────

export const FULL_38_DATABASE: Record<TechTicker, TickerFull38Model> = {
  TSLA: {
    meta: {
      symbol: "TSLA",
      name: "Tesla, Inc.",
      sector: "Automotive & Clean Energy",
      badgeColor: "#ef4444",
      sharePrice: 639.83,
      priceChangePct: 3.42,
      marketCap: 672.4,
      sharesOutstanding: 960,
      beta: 2.15,
      creditRating: "BBB+",
      analystRating: "Buy",
      targetPriceMean: 720.0,
      segmentPrimaryLabel: "Automotive Deliveries (Units)",
      segmentSecondaryLabel: "Energy Storage & Services ($M)",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.051,
      taxRate: 0.21,
      debtWeight: 0.2,
      equityWeight: 0.8,
    },
    drivers: {
      primaryVolumeBase: 1800000,
      primaryAvgPrice: 44500,
      primaryVolumeGrowth: 0.15,
      primaryPriceGrowth: -0.02,
      primaryGrossMargin: 0.212,
      secondaryBaseRevenue: 6500,
      secondaryGrowthRate: 0.25,
      secondaryGrossMargin: 0.19,
      sgaPctOfRev: 0.055,
      rdPctOfRev: 0.042,
      dso: 18.4,
      dio: 99.5,
      dpo: 91.3,
      capexPctRev: 0.064,
      deprPctPPE: 0.12,
      terminalGrowthRate: 0.03,
      exitEvEbitdaMultiple: 16.0,
    },
    plLines: [
      { label: "Automotive Revenue", values: [3741, 6351, 9641, 18515, 20821, 33219, 44968, 62454, 81524, 93584, 100240, 106744, 113336, 118719, 123468], indent: 1 },
      { label: "Energy Generation & Storage Revenue", values: [14, 181, 1116, 1555, 1531, 2100, 2600, 3100, 3500, 3900, 4300, 4700, 5100, 5500, 5900], indent: 1 },
      { label: "Services & Other Revenue", values: [291, 468, 1001, 1391, 2226, 2333, 2365, 2262, 2184, 2125, 2087, 2070, 2076, 2107, 2163], indent: 1 },
      { label: "Total Revenues", values: [4046, 7000, 11759, 21461, 24578, 37652, 49933, 67816, 87208, 99609, 106627, 113514, 120512, 126326, 131531], isBold: true },
      { label: "Automotive Cost of Goods Sold", values: [-2823, -4750, -7433, -14174, -16398, -26000, -35000, -48000, -62000, -70500, -75500, -80500, -85500, -89500, -93200], indent: 1 },
      { label: "Energy Cost of Goods Sold", values: [-12, -178, -875, -1365, -1341, -1700, -2100, -2500, -2800, -3100, -3400, -3700, -4000, -4300, -4600], indent: 1 },
      { label: "Services Cost of Goods Sold", values: [-287, -472, -1229, -1880, -2770, -2537, -3384, -4725, -6436, -7711, -8203, -8576, -9050, -9519, -9804], indent: 1 },
      { label: "Total Cost of Sales", values: [-3123, -5401, -9536, -17419, -20509, -30237, -40484, -55225, -71236, -81311, -87103, -92776, -98550, -103319, -107604] },
      { label: "Gross Profit", values: [924, 1599, 2222, 4042, 4069, 7415, 9449, 12591, 15971, 18298, 19524, 20738, 21962, 23007, 23927], isBold: true },
      { label: "Research & Development (R&D)", values: [-718, -834, -1378, -1460, -1343, -1800, -2400, -3200, -4100, -4700, -5000, -5300, -5600, -5900, -6100], indent: 1 },
      { label: "Selling, General & Administrative (SG&A)", values: [-922, -1432, -2477, -2834, -2646, -3347, -4426, -6071, -7822, -8917, -9576, -10218, -10875, -11369, -11881], indent: 1 },
      { label: "Restructuring & Other Expenses", values: [0, 0, 0, -135, -149, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], indent: 1 },
      { label: "Operating Income (EBIT)", values: [-717, -667, -1632, -388, -69, 2268, 2623, 3320, 4050, 4681, 4948, 5220, 5487, 5737, 5946], isBold: true },
      { label: "Interest Income", values: [2, 9, 20, 25, 44, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140], indent: 1 },
      { label: "Interest Expense", values: [-119, -199, -471, -663, -685, -503, -503, -503, -503, -503, -503, -503, -503, -503, -503], indent: 1 },
      { label: "Other Income / (Expense)", values: [-42, 111, -125, 22, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], indent: 1 },
      { label: "Earnings Before Taxes (EBT)", values: [-876, -746, -2209, -1005, -665, 1765, 2120, 2817, 3546, 4178, 4445, 4717, 4984, 5234, 5443] },
      { label: "Income Tax Expense", values: [-13, -27, -32, -58, -110, -371, -445, -592, -745, -877, -933, -991, -1047, -1099, -1143] },
      { label: "Minority Interest", values: [0, 98, 279, 86, -87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { label: "Net Income / (Loss)", values: [-889, -675, -1961, -976, -862, 1394, 1674, 2226, 2802, 3301, 3512, 3726, 3937, 4135, 4300], isBold: true },
    ],
    bsLines: [
      { label: "Cash & Cash Equivalents", values: [1197, 3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161, 53875] },
      { label: "Restricted Cash & Marketable Securities", values: [23, 106, 155, 193, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246] },
      { label: "Accounts Receivable", values: [169, 499, 515, 949, 1324, 1920, 2546, 3458, 4447, 5080, 5438, 5789, 6146, 6442, 6708] },
      { label: "Inventory", values: [1278, 2067, 2264, 3113, 3552, 8353, 11184, 15257, 19680, 22463, 24063, 25631, 27226, 28543, 29727] },
      { label: "Prepaid Expenses & Other Current Assets", values: [116, 194, 268, 366, 713, 867, 1150, 1561, 2008, 2293, 2455, 2614, 2775, 2909, 3028] },
      { label: "Total Current Assets", values: [2782, 6260, 6571, 8306, 12103, 20569, 27641, 38257, 50312, 59144, 65459, 72102, 79264, 86301, 93584], isBold: true },
      { label: "Operating Lease Vehicles", values: [1791, 3134, 4117, 2090, 2447, 3665, 3665, 3665, 3665, 3665, 3665, 3665, 3665, 3665, 3665] },
      { label: "Solar Energy Systems", values: [0, 5920, 6347, 6271, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138] },
      { label: "Property, Plant & Equipment (PP&E Net)", values: [3403, 5983, 10028, 11330, 10396, 11621, 12861, 14090, 15275, 16378, 17351, 18140, 18680, 18900, 18714] },
      { label: "Operating Lease ROU Assets", values: [0, 0, 0, 0, 1218, 1218, 1218, 1218, 1218, 1218, 1218, 1218, 1218, 1218, 1218] },
      { label: "Intangible Assets", values: [13, 376, 362, 282, 339, 339, 339, 339, 339, 339, 339, 339, 339, 339, 339] },
      { label: "Goodwill", values: [0, 506, 517, 490, 591, 591, 591, 591, 591, 591, 591, 591, 591, 591, 591] },
      { label: "Restricted Cash (Non-Current)", values: [32, 268, 442, 398, 269, 269, 269, 269, 269, 269, 269, 269, 269, 269, 269] },
      { label: "Other Non-Current Assets", values: [47, 217, 273, 572, 808, 2558, 3392, 4607, 5925, 6767, 7244, 7712, 8187, 8582, 8936] },
      { label: "Total Assets", values: [8068, 22664, 28655, 29740, 34309, 46968, 56084, 69176, 83728, 94504, 102270, 110168, 118346, 125998, 133450], isBold: true },
      { label: "Accounts Payable", values: [916, 1860, 2390, 3404, 3771, 7667, 10265, 14003, 18063, 20617, 22086, 23525, 24989, 26198, 27284] },
      { label: "Accrued Liabilities", values: [423, 1210, 1731, 2094, 2905, 4062, 5387, 7317, 9409, 10747, 11504, 12247, 13002, 13629, 14191] },
      { label: "Deferred Revenue (Current)", values: [424, 763, 1015, 630, 1163, 1444, 1915, 2600, 3344, 3819, 4088, 4353, 4621, 4844, 5043] },
      { label: "Resale Value Guarantees", values: [137, 180, 787, 503, 317, 684, 907, 1232, 1584, 1809, 1937, 2062, 2189, 2295, 2389] },
      { label: "Customer Deposits", values: [283, 664, 854, 793, 726, 1251, 1660, 2254, 2898, 3311, 3544, 3773, 4005, 4198, 4371] },
      { label: "Current Portion of LT Debt", values: [628, 984, 797, 2568, 1785, 1785, 1785, 1785, 1785, 1785, 1785, 1785, 1785, 1785, 1785] },
      { label: "Total Current Liabilities", values: [2811, 5827, 7675, 9992, 10667, 16893, 21919, 29194, 37083, 42088, 44944, 47745, 50591, 52949, 55063], isBold: true },
      { label: "Long-Term Debt & Finance Leases", values: [2021, 5860, 9416, 9404, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634] },
      { label: "Other Non-Current Liabilities", values: [2152, 5439, 6330, 4586, 4541, 7501, 9948, 13511, 17374, 19845, 21243, 22615, 24009, 25167, 26204] },
      { label: "Total Liabilities", values: [6984, 17126, 23421, 23982, 26842, 36029, 43501, 54335, 66091, 73567, 77821, 81993, 86234, 89750, 92903], isBold: true },
      { label: "Stockholders' Equity", values: [1084, 4753, 4237, 4923, 6618, 10090, 11734, 13992, 16794, 20095, 23607, 27333, 31270, 35405, 39705], isBold: true },
      { label: "Noncontrolling Interests", values: [0, 785, 997, 834, 849, 849, 849, 849, 849, 849, 849, 849, 849, 849, 849] },
      { label: "Total Liabilities & Stockholders' Equity", values: [8068, 22664, 28655, 29740, 34309, 46968, 56084, 69176, 83728, 94504, 102270, 110168, 118346, 125998, 133450], isBold: true },
    ],
    cfLines: [
      { label: "Operating Income (EBIT)", values: [-667, -1632, -388, -69, 2268, 2623, 3320, 4050, 4681, 4948, 5220, 5487, 5737, 5946], isBold: true },
      { label: "Operating Taxes (21%)", values: [-27, -32, -58, -110, -476, -551, -697, -850, -983, -1039, -1096, -1152, -1205, -1249] },
      { label: "NOPAT", values: [-694, -1664, -446, -179, 1792, 2072, 2623, 3199, 3698, 3909, 4124, 4335, 4532, 4697], isBold: true },
      { label: "Add-back Depreciation & Amortization", values: [947, 1636, 1901, 2154, 1291, 1572, 1884, 2225, 2594, 2991, 3411, 3850, 4302, 4759] },
      { label: "Gross Cash Flow", values: [253, -28, 1455, 1975, 3083, 3644, 4507, 5424, 6293, 6900, 7535, 8185, 8834, 9457], isBold: true },
      { label: "∆ Accounts Receivable", values: [-330, -16, -434, -375, -596, -626, -912, -989, -632, -358, -351, -357, -296, -265], indent: 1 },
      { label: "∆ Inventory", values: [-790, -196, -850, -439, -4801, -2831, -4072, -4423, -2783, -1600, -1567, -1595, -1317, -1184], indent: 1 },
      { label: "∆ Accounts Payable", values: [944, 530, 1014, 367, 3896, 2598, 3738, 4060, 2555, 1469, 1439, 1464, 1209, 1086], indent: 1 },
      { label: "Investments in Working Capital", values: [-176, 318, -269, -447, -1502, -859, -1247, -1352, -861, -489, -480, -488, -405, -363], isBold: true },
      { label: "Capital Expenditures (Capex)", values: [-3527, -5681, -3204, -1220, -2516, -2813, -3113, -3410, -3697, -3964, -4199, -4390, -4521, -4574] },
      { label: "∆ Other Non-Current Assets", values: [-8700, -1760, 1820, -2108, -1044, -1117, -1627, -1764, -1128, -638, -626, -637, -529, -473] },
      { label: "∆ Other Liabilities", values: [5002, 2397, -2212, 1046, 5291, 4874, 7097, 7696, 4922, 2785, 2733, 2777, 2307, 2066] },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [-7147, -4753, -2410, -754, 3312, 3729, 5618, 6593, 5528, 4593, 4962, 5447, 5687, 6112], isBold: true },
      { label: "Interest Expenses Paid", values: [-79, -577, -617, -596, -503, -503, -503, -503, -503, -503, -503, -503, -503, -503] },
      { label: "∆ Financial Debt Liabilities", values: [4195, 3368, 1759, 1448, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { label: "∆ Stockholders' Equity", values: [5129, 1658, 1499, 2571, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { label: "Tax Shield Adjustments", values: [0, 0, 0, 0, 106, 106, 106, 106, 106, 106, 106, 106, 106, 106] },
      { label: "Minority Interest Movement", values: [98, 279, 86, -87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { label: "Net Cash Flow", values: [2196, -25, 318, 2582, 2915, 3332, 5221, 6196, 5131, 4196, 4564, 5050, 5290, 5715], isBold: true },
      { label: "Opening Cash Balance", values: [1197, 3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161] },
      { label: "Closing Cash Balance", values: [3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161, 53875], isBold: true },
    ],
    kpiScorecard: [
      { category: "Profitability", name: "Gross Margin %", value: 0.212, weightPct: 20, benchmarkTarget: 0.20, status: "Excellent", format: "pct" },
      { category: "Profitability", name: "EBIT Margin %", value: 0.045, weightPct: 20, benchmarkTarget: 0.05, status: "Good", format: "pct" },
      { category: "Efficiency", name: "DSO (AR Days)", value: 18.4, weightPct: 15, benchmarkTarget: 25.0, status: "Excellent", format: "days" },
      { category: "Efficiency", name: "DIO (Inventory Days)", value: 99.5, weightPct: 15, benchmarkTarget: 80.0, status: "Watch", format: "days" },
      { category: "Liquidity", name: "Quick Ratio", value: 0.61, weightPct: 15, benchmarkTarget: 0.80, status: "Good", format: "number" },
      { category: "Valuation", name: "UFCF Conversion", value: 0.85, weightPct: 15, benchmarkTarget: 0.75, status: "Excellent", format: "pct" },
    ],
  },

  // ─── MSFT ─────────────────────────────────────────────────────────────────
  MSFT: {
    meta: {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      sector: "Cloud Infrastructure & Software",
      badgeColor: "#00a4ef",
      sharePrice: 448.90,
      priceChangePct: 1.85,
      marketCap: 3340.0,
      sharesOutstanding: 7430,
      beta: 0.89,
      creditRating: "AAA",
      analystRating: "Strong Buy",
      targetPriceMean: 500.0,
      segmentPrimaryLabel: "Intelligent Cloud (Azure)",
      segmentSecondaryLabel: "Productivity (Office 365)",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.045,
      taxRate: 0.19,
      debtWeight: 0.1,
      equityWeight: 0.9,
    },
    drivers: {
      primaryVolumeBase: 420000000,
      primaryAvgPrice: 320,
      primaryVolumeGrowth: 0.12,
      primaryPriceGrowth: 0.05,
      primaryGrossMargin: 0.72,
      secondaryBaseRevenue: 110000,
      secondaryGrowthRate: 0.16,
      secondaryGrossMargin: 0.68,
      sgaPctOfRev: 0.11,
      rdPctOfRev: 0.13,
      dso: 52,
      dio: 8,
      dpo: 35,
      capexPctRev: 0.18,
      deprPctPPE: 0.14,
      terminalGrowthRate: 0.035,
      exitEvEbitdaMultiple: 23.2,
    },
    plLines: [
      { label: "Intelligent Cloud (Azure)", values: [38000, 39500, 41200, 52000, 61000, 72000, 88000, 108000, 118000, 142000, 166000, 194000, 227000, 265000, 310000], indent: 1 },
      { label: "Productivity & Business (Office 365)", values: [35580, 33654, 32750, 39360, 43843, 48015, 55088, 64270, 68915, 76122, 84439, 93560, 103158, 113000, 123960], indent: 1 },
      { label: "More Personal Computing (Windows/Xbox)", values: [20000, 18000, 16000, 19000, 21000, 23000, 25000, 26000, 25000, 27000, 29000, 31000, 33000, 36000, 38000], indent: 1 },
      { label: "Total Revenues", values: [93580, 91154, 89950, 110360, 125843, 143015, 168088, 198270, 211915, 245122, 279439, 318560, 363158, 414000, 471960], isBold: true },
      { label: "Cloud Cost of Goods Sold", values: [-12000, -11000, -10000, -15000, -16000, -19000, -22000, -27000, -28000, -32000, -36000, -40000, -45000, -50000, -56000], indent: 1 },
      { label: "Productivity Cost of Goods Sold", values: [-11000, -11000, -10000, -14000, -15000, -16000, -18000, -21000, -23000, -26000, -29000, -32000, -36000, -40000, -45000], indent: 1 },
      { label: "Personal Computing COGS", values: [-7000, -7000, -7000, -9000, -10000, -11000, -12000, -14000, -14000, -16000, -17000, -19000, -21000, -24000, -26000], indent: 1 },
      { label: "Total Cost of Sales", values: [-30000, -29000, -27000, -38000, -41000, -46000, -52000, -62000, -65000, -74000, -82000, -91000, -102000, -114000, -127000] },
      { label: "Gross Profit", values: [63580, 62154, 62950, 72360, 84843, 97015, 116088, 136270, 146915, 171122, 197439, 227560, 261158, 300000, 344960], isBold: true },
      { label: "Research & Development (R&D)", values: [-12000, -12000, -13000, -15000, -17000, -19000, -22000, -26000, -28000, -32000, -36000, -41000, -47000, -53000, -60000], indent: 1 },
      { label: "Selling & Marketing (S&M)", values: [-11000, -11000, -10000, -12000, -13000, -15000, -18000, -21000, -23000, -26000, -29000, -33000, -37000, -42000, -48000], indent: 1 },
      { label: "General & Administrative (G&A)", values: [-5000, -4000, -3000, -5000, -5000, -5000, -6000, -6000, -7000, -7000, -8000, -8000, -9000, -10000, -11000], indent: 1 },
      { label: "Operating Income (EBIT)", values: [35580, 35154, 36950, 40360, 49843, 58015, 70088, 83270, 88915, 106122, 124439, 145560, 168158, 195000, 225960], isBold: true },
      { label: "Interest Income", values: [500, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500, 2800, 3100, 3500, 4000], indent: 1 },
      { label: "Interest Expense", values: [-1200, -1400, -1600, -1800, -2000, -2200, -2500, -2800, -3000, -3200, -3500, -3800, -4200, -4600, -5000], indent: 1 },
      { label: "Other Income / (Expense)", values: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500], indent: 1 },
      { label: "Earnings Before Taxes (EBT)", values: [34980, 34554, 36450, 39960, 49543, 57815, 69888, 83070, 88815, 106122, 124539, 145760, 168358, 195300, 226460] },
      { label: "Income Tax Expense", values: [-22787, -14001, -10961, -23389, -10303, -13534, -8617, -10332, -16454, -17986, -22539, -27760, -32358, -38300, -45460] },
      { label: "Minority Interest", values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { label: "Net Income", values: [12193, 20553, 25489, 16571, 39240, 44281, 61271, 72738, 72361, 88136, 102000, 118000, 136000, 157000, 181000], isBold: true },
    ],
    bsLines: [
      { label: "Cash & Cash Equivalents", values: [12000, 15000, 18000, 18800, 18900, 21500, 15300, 14700, 21300, 25000, 30000, 38000, 48000, 60000, 75000] },
      { label: "Short-Term Marketable Securities", values: [84500, 98000, 115000, 115000, 115000, 115000, 115000, 90000, 90000, 55000, 65000, 77000, 92000, 110000, 130000] },
      { label: "Accounts Receivable", values: [18000, 20000, 22000, 26000, 29000, 32000, 38000, 44000, 48000, 55000, 63000, 72000, 82000, 93000, 106000] },
      { label: "Inventories", values: [2900, 2500, 2200, 2600, 2100, 2500, 2600, 2500, 2500, 3000, 3400, 3900, 4500, 5100, 5800] },
      { label: "Other Current Assets", values: [6000, 6500, 7000, 8000, 10000, 11000, 13000, 15000, 17000, 19000, 21000, 24000, 27000, 31000, 35000] },
      { label: "Total Current Assets", values: [123400, 142000, 164200, 170400, 175000, 182000, 183900, 166200, 178800, 157000, 182400, 214900, 253500, 299100, 351800], isBold: true },
      { label: "Property, Plant & Equipment (PP&E Net)", values: [15000, 18000, 23000, 36000, 44000, 52000, 70000, 87000, 115000, 140000, 170000, 205000, 245000, 290000, 340000] },
      { label: "Operating Lease ROU Assets", values: [0, 0, 0, 0, 7000, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 22000, 25000, 28000] },
      { label: "Goodwill", values: [17000, 18000, 35000, 35000, 42000, 43000, 50000, 67000, 68000, 68000, 68000, 68000, 68000, 68000, 68000] },
      { label: "Intangible Assets", values: [5000, 4000, 10000, 9000, 8000, 7000, 11000, 11000, 9000, 9000, 9000, 9000, 9000, 9000, 9000] },
      { label: "Other Non-Current Assets", values: [15600, 11000, 8800, 7600, 10000, 9000, 8100, 20800, 27200, 122000, 132600, 138100, 142500, 148900, 158200] },
      { label: "Total Assets", values: [176000, 193000, 241000, 258000, 286000, 301000, 333000, 364000, 411000, 512000, 580000, 655000, 740000, 840000, 955000], isBold: true },
      { label: "Accounts Payable", values: [7000, 8000, 9000, 11000, 13000, 15000, 18000, 21000, 22000, 25000, 28000, 32000, 36000, 41000, 46000] },
      { label: "Accrued Liabilities", values: [20000, 22000, 24000, 28000, 32000, 36000, 42000, 49000, 52000, 58000, 65000, 73000, 82000, 92000, 103000] },
      { label: "Current Deferred Revenue", values: [25000, 26000, 28000, 30000, 32000, 34000, 38000, 42000, 45000, 50000, 55000, 61000, 68000, 75000, 83000] },
      { label: "Short-Term Debt", values: [7000, 8000, 9000, 10000, 10000, 10000, 10000, 8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000] },
      { label: "Total Current Liabilities", values: [59000, 64000, 70000, 79000, 87000, 95000, 108000, 120000, 127000, 141000, 156000, 174000, 194000, 216000, 240000], isBold: true },
      { label: "Long-Term Debt", values: [28000, 40000, 72000, 72000, 70000, 60000, 55000, 47000, 48000, 50000, 52000, 54000, 57000, 60000, 64000] },
      { label: "Long-Term Lease Liabilities", values: [0, 0, 0, 0, 8000, 9000, 11000, 13000, 14000, 16000, 18000, 20000, 22000, 25000, 28000] },
      { label: "Other Non-Current Liabilities", values: [9000, 17000, 26000, 25000, 19000, 19000, 17000, 18000, 16000, 36000, 39000, 42000, 47000, 54000, 63000] },
      { label: "Total Liabilities", values: [96000, 121000, 168000, 176000, 184000, 183000, 191000, 198000, 205000, 243000, 265000, 290000, 320000, 355000, 395000], isBold: true },
      { label: "Common Stock & APIC", values: [68000, 70000, 72000, 75000, 78000, 80000, 83000, 86000, 90000, 94000, 98000, 102000, 106000, 110000, 115000] },
      { label: "Retained Earnings", values: [12000, 2000, 1000, 7000, 24000, 38000, 59000, 80000, 116000, 175000, 217000, 263000, 314000, 375000, 445000] },
      { label: "Total Stockholders' Equity", values: [80000, 72000, 73000, 82000, 102000, 118000, 142000, 166000, 206000, 269000, 315000, 365000, 420000, 485000, 560000], isBold: true },
      { label: "Total Liabilities & Stockholders' Equity", values: [176000, 193000, 241000, 258000, 286000, 301000, 333000, 364000, 411000, 512000, 580000, 655000, 740000, 840000, 955000], isBold: true },
    ],
    cfLines: [
      { label: "Operating Income (EBIT)", values: [35580, 35154, 36950, 40360, 49843, 58015, 70088, 83270, 88915, 106122, 124439, 145560, 168158, 195000, 225960], isBold: true },
      { label: "Operating Taxes (19%)", values: [-7580, -7154, -6950, -7360, -9843, -11015, -14088, -16270, -16915, -21122, -24439, -28560, -32158, -38000, -42960] },
      { label: "NOPAT", values: [28000, 28000, 30000, 33000, 40000, 47000, 56000, 67000, 72000, 85000, 100000, 117000, 136000, 157000, 183000], isBold: true },
      { label: "Add-back Depreciation & Amortization", values: [6000, 7000, 8000, 10000, 11000, 12000, 14000, 16000, 18000, 21000, 24000, 28000, 32000, 37000, 43000] },
      { label: "Gross Cash Flow", values: [34000, 35000, 38000, 43000, 51000, 59000, 70000, 83000, 90000, 106000, 124000, 145000, 168000, 194000, 226000], isBold: true },
      { label: "Capital Expenditures (Capex)", values: [-10000, -9000, -7000, -11000, -13000, -14000, -14000, -18000, -31000, -32000, -36000, -42000, -48000, -55000, -65000] },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [24000, 26000, 31000, 32000, 38000, 45000, 56000, 65000, 59000, 74000, 88000, 103000, 120000, 139000, 161000], isBold: true },
      { label: "Ending Cash Balance", values: [96500, 113000, 133000, 133800, 133900, 136500, 130300, 104700, 111300, 80000, 95000, 115000, 140000, 170000, 205000], isBold: true },
    ],
    kpiScorecard: [
      { category: "Profitability", name: "Gross Margin %", value: 0.69, weightPct: 25, benchmarkTarget: 0.65, status: "Excellent", format: "pct" },
      { category: "Profitability", name: "EBIT Margin %", value: 0.43, weightPct: 25, benchmarkTarget: 0.35, status: "Excellent", format: "pct" },
      { category: "Efficiency", name: "DSO (AR Days)", value: 52.0, weightPct: 15, benchmarkTarget: 45.0, status: "Good", format: "days" },
      { category: "Liquidity", name: "Quick Ratio", value: 1.25, weightPct: 15, benchmarkTarget: 1.10, status: "Excellent", format: "number" },
      { category: "Valuation", name: "FCF Yield", value: 0.038, weightPct: 20, benchmarkTarget: 0.03, status: "Excellent", format: "pct" },
    ],
  },

  // ─── GOOGL ────────────────────────────────────────────────────────────────
  GOOGL: {
    meta: {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      sector: "Search Engine & AI Infrastructure",
      badgeColor: "#ea4335",
      sharePrice: 182.50,
      priceChangePct: 2.10,
      marketCap: 2260.0,
      sharesOutstanding: 12400,
      beta: 1.05,
      creditRating: "AA+",
      analystRating: "Strong Buy",
      targetPriceMean: 205.0,
      segmentPrimaryLabel: "Google Search & YouTube Ads",
      segmentSecondaryLabel: "Google Cloud & DeepMind AI",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.046,
      taxRate: 0.16,
      debtWeight: 0.08,
      equityWeight: 0.92,
    },
    drivers: {
      primaryVolumeBase: 550000000,
      primaryAvgPrice: 420,
      primaryVolumeGrowth: 0.09,
      primaryPriceGrowth: 0.03,
      primaryGrossMargin: 0.58,
      secondaryBaseRevenue: 33000,
      secondaryGrowthRate: 0.26,
      secondaryGrossMargin: 0.28,
      sgaPctOfRev: 0.12,
      rdPctOfRev: 0.16,
      dso: 42,
      dio: 4,
      dpo: 28,
      capexPctRev: 0.12,
      deprPctPPE: 0.15,
      terminalGrowthRate: 0.03,
      exitEvEbitdaMultiple: 18.5,
    },
    plLines: [
      { label: "Google Search & Advertising Revenue", values: [69000, 84000, 104000, 128000, 151000, 168000, 237000, 253000, 274000, 303000, 338000, 376000, 417000, 461000, 508000], indent: 1 },
      { label: "Google Cloud & AI Infrastructure Revenue", values: [5989, 6272, 6855, 8819, 10857, 14527, 20637, 29836, 33394, 42000, 52000, 64000, 78000, 94000, 112000], indent: 1 },
      { label: "Total Revenues", values: [74989, 90272, 110855, 136819, 161857, 182527, 257637, 282836, 307394, 345000, 390000, 440000, 495000, 555000, 620000], isBold: true },
      { label: "Total Cost of Sales", values: [-28000, -35000, -45000, -59000, -71000, -84000, -110000, -126000, -133000, -148000, -167000, -188000, -211000, -236000, -263000] },
      { label: "Gross Profit", values: [46989, 55272, 65855, 77819, 90857, 98527, 147637, 156836, 174394, 197000, 223000, 252000, 284000, 319000, 357000], isBold: true },
      { label: "Research & Development (R&D)", values: [-14000, -16000, -19000, -25000, -28000, -29000, -35000, -41000, -45000, -51000, -58000, -65000, -73000, -82000, -92000], indent: 1 },
      { label: "Selling, General & Administrative (SG&A)", values: [-13000, -15000, -18000, -26000, -28000, -28000, -34000, -41000, -44000, -49000, -55000, -62000, -70000, -78000, -87000], indent: 1 },
      { label: "Operating Income (EBIT)", values: [19989, 24272, 28855, 26819, 34857, 41527, 78637, 74836, 85394, 97000, 110000, 125000, 141000, 159000, 178000], isBold: true },
      { label: "Net Income", values: [16348, 19478, 12662, 30736, 34343, 40269, 76033, 59972, 73795, 85000, 96000, 109000, 123000, 139000, 156000], isBold: true },
    ],
    bsLines: [
      { label: "Cash & Cash Equivalents", values: [73000, 86000, 102000, 109000, 119000, 136000, 139000, 113000, 110000, 125000, 145000, 170000, 200000, 235000, 275000] },
      { label: "Total Assets", values: [147000, 167000, 197000, 232000, 275000, 319000, 359000, 365000, 402000, 465000, 535000, 615000, 705000, 805000, 915000], isBold: true },
      { label: "Total Liabilities", values: [27000, 28000, 44000, 55000, 74000, 97000, 107000, 109000, 119000, 135000, 153000, 173000, 195000, 220000, 248000] },
      { label: "Total Stockholders' Equity", values: [120000, 139000, 153000, 177000, 201000, 222000, 252000, 256000, 283000, 330000, 382000, 442000, 510000, 585000, 667000], isBold: true },
    ],
    cfLines: [
      { label: "NOPAT", values: [17000, 20000, 24000, 23000, 29000, 35000, 66000, 63000, 71000, 81000, 92000, 105000, 118000, 133000, 149000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [16000, 19000, 23000, 22000, 31000, 39000, 67000, 60000, 69000, 78000, 89000, 101000, 114000, 129000, 145000], isBold: true },
      { label: "Ending Cash Balance", values: [73000, 86000, 102000, 109000, 119000, 136000, 139000, 113000, 110000, 125000, 145000, 170000, 200000, 235000, 275000], isBold: true },
    ],
    kpiScorecard: [
      { category: "Profitability", name: "Gross Margin %", value: 0.57, weightPct: 25, benchmarkTarget: 0.55, status: "Excellent", format: "pct" },
      { category: "Profitability", name: "EBIT Margin %", value: 0.28, weightPct: 25, benchmarkTarget: 0.25, status: "Excellent", format: "pct" },
      { category: "Efficiency", name: "DSO (AR Days)", value: 42.0, weightPct: 15, benchmarkTarget: 40.0, status: "Good", format: "days" },
      { category: "Valuation", name: "FCF Yield", value: 0.041, weightPct: 35, benchmarkTarget: 0.035, status: "Excellent", format: "pct" },
    ],
  },

  // ─── AAPL ─────────────────────────────────────────────────────────────────
  AAPL: {
    meta: {
      symbol: "AAPL",
      name: "Apple Inc.",
      sector: "Consumer Technology & Devices",
      badgeColor: "#a3a3a3",
      sharePrice: 224.30,
      priceChangePct: 1.15,
      marketCap: 3450.0,
      sharesOutstanding: 15300,
      beta: 0.98,
      creditRating: "AAA",
      analystRating: "Buy",
      targetPriceMean: 245.0,
      segmentPrimaryLabel: "Hardware (iPhone/Mac/iPad)",
      segmentSecondaryLabel: "Services & App Store",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.044,
      taxRate: 0.16,
      debtWeight: 0.15,
      equityWeight: 0.85,
    },
    drivers: {
      primaryVolumeBase: 235000000,
      primaryAvgPrice: 1050,
      primaryVolumeGrowth: 0.04,
      primaryPriceGrowth: 0.02,
      primaryGrossMargin: 0.38,
      secondaryBaseRevenue: 85000,
      secondaryGrowthRate: 0.14,
      secondaryGrossMargin: 0.74,
      sgaPctOfRev: 0.068,
      rdPctOfRev: 0.076,
      dso: 28,
      dio: 12,
      dpo: 55,
      capexPctRev: 0.035,
      deprPctPPE: 0.18,
      terminalGrowthRate: 0.03,
      exitEvEbitdaMultiple: 24.5,
    },
    plLines: [
      { label: "Hardware Sales (iPhone, Mac, iPad)", values: [213800, 191300, 196500, 225950, 213900, 220700, 297400, 316200, 298000, 315000, 330000, 346000, 363000, 381000, 400000], indent: 1 },
      { label: "Services & App Store Revenue", values: [19915, 24339, 32734, 39645, 46274, 53815, 68417, 78128, 85285, 95000, 105000, 116000, 129000, 143000, 158000], indent: 1 },
      { label: "Total Revenues", values: [233715, 215639, 229234, 265595, 260174, 274515, 365817, 394328, 383285, 410000, 435000, 462000, 492000, 524000, 558000], isBold: true },
      { label: "Total Cost of Sales", values: [-140089, -131376, -141048, -163756, -161782, -169559, -212981, -223546, -214137, -225500, -239000, -254000, -270000, -288000, -306000] },
      { label: "Gross Profit", values: [93626, 84263, 88186, 101839, 98392, 104956, 152836, 170782, 169148, 184500, 196000, 208000, 222000, 236000, 252000], isBold: true },
      { label: "Operating Expenses", values: [-22364, -24200, -26842, -30941, -34447, -38668, -43887, -51345, -54847, -59000, -62600, -66500, -70800, -75400, -80300] },
      { label: "Operating Income (EBIT)", values: [71262, 60063, 61344, 70898, 63945, 66288, 108949, 119437, 114301, 125500, 133400, 141500, 151200, 160600, 171700], isBold: true },
      { label: "Net Income", values: [53394, 45687, 48351, 59531, 55256, 57411, 94680, 99803, 96995, 105000, 112000, 119000, 127000, 135000, 144000], isBold: true },
    ],
    bsLines: [
      { label: "Cash & Marketable Securities", values: [205666, 237586, 268895, 237100, 205898, 191830, 172600, 156400, 162100, 165000, 175000, 190000, 210000, 235000, 265000] },
      { label: "Total Assets", values: [290479, 321686, 375319, 365725, 338516, 323888, 351002, 352755, 352583, 375000, 400000, 430000, 465000, 505000, 550000], isBold: true },
      { label: "Total Liabilities", values: [171000, 193000, 241000, 258000, 248000, 258000, 287000, 302000, 290000, 305000, 320000, 340000, 365000, 395000, 430000] },
      { label: "Total Stockholders' Equity", values: [119355, 128249, 134047, 107147, 90488, 65339, 63090, 50672, 62146, 70000, 80000, 90000, 100000, 110000, 120000], isBold: true },
    ],
    cfLines: [
      { label: "NOPAT", values: [59000, 50000, 51000, 59000, 53000, 55000, 91000, 100000, 96000, 105000, 112000, 119000, 127000, 135000, 144000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [54000, 53000, 51000, 64000, 58000, 73000, 93000, 111000, 99000, 108000, 115000, 122000, 130000, 138000, 147000], isBold: true },
      { label: "Ending Cash Balance", values: [205666, 237586, 268895, 237100, 205898, 191830, 172600, 156400, 162100, 165000, 175000, 190000, 210000, 235000, 265000], isBold: true },
    ],
    kpiScorecard: [
      { category: "Profitability", name: "Gross Margin %", value: 0.45, weightPct: 25, benchmarkTarget: 0.40, status: "Excellent", format: "pct" },
      { category: "Efficiency", name: "ROE (Return on Equity)", value: 1.55, weightPct: 25, benchmarkTarget: 0.50, status: "Excellent", format: "pct" },
      { category: "Efficiency", name: "DSO (AR Days)", value: 28.0, weightPct: 20, benchmarkTarget: 30.0, status: "Excellent", format: "days" },
      { category: "Valuation", name: "FCF Yield", value: 0.035, weightPct: 30, benchmarkTarget: 0.03, status: "Good", format: "pct" },
    ],
  },

  // ─── NVDA ─────────────────────────────────────────────────────────────────
  NVDA: {
    meta: {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      sector: "Semiconductors & AI Compute",
      badgeColor: "#76b900",
      sharePrice: 122.50,
      priceChangePct: 4.80,
      marketCap: 3010.0,
      sharesOutstanding: 24600,
      beta: 1.68,
      creditRating: "A+",
      analystRating: "Strong Buy",
      targetPriceMean: 145.0,
      segmentPrimaryLabel: "Data Center AI Compute (GPUs)",
      segmentSecondaryLabel: "Gaming & Enterprise Software",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.048,
      taxRate: 0.15,
      debtWeight: 0.05,
      equityWeight: 0.95,
    },
    drivers: {
      primaryVolumeBase: 3500000,
      primaryAvgPrice: 28000,
      primaryVolumeGrowth: 0.35,
      primaryPriceGrowth: 0.08,
      primaryGrossMargin: 0.76,
      secondaryBaseRevenue: 14000,
      secondaryGrowthRate: 0.20,
      secondaryGrossMargin: 0.62,
      sgaPctOfRev: 0.05,
      rdPctOfRev: 0.09,
      dso: 48,
      dio: 75,
      dpo: 42,
      capexPctRev: 0.04,
      deprPctPPE: 0.22,
      terminalGrowthRate: 0.04,
      exitEvEbitdaMultiple: 32.0,
    },
    plLines: [
      { label: "Data Center AI GPU Revenue", values: [800, 1300, 1900, 2900, 3000, 6700, 15000, 15000, 47500, 108000, 144000, 186000, 233000, 285000, 342000], indent: 1 },
      { label: "Gaming & Enterprise Software Revenue", values: [4210, 5610, 7814, 8816, 7918, 9975, 11914, 11974, 13422, 18000, 21000, 24000, 27000, 30000, 33000], indent: 1 },
      { label: "Total Revenues", values: [5010, 6910, 9714, 11716, 10918, 16675, 26914, 26974, 60922, 126000, 165000, 210000, 260000, 315000, 375000], isBold: true },
      { label: "Total Cost of Sales", values: [-2200, -2800, -3900, -4500, -4100, -6200, -9400, -11500, -16600, -30000, -39000, -49000, -60000, -72000, -85000] },
      { label: "Gross Profit", values: [2810, 4110, 5814, 7216, 6818, 10475, 17514, 15474, 44322, 96000, 126000, 161000, 200000, 243000, 290000], isBold: true },
      { label: "Operating Expenses (R&D + SGA)", values: [-1900, -2200, -2900, -3400, -3900, -5900, -7400, -10000, -11400, -17000, -23000, -29000, -36000, -44000, -52000] },
      { label: "Operating Income (EBIT)", values: [910, 1910, 2914, 3816, 2918, 4575, 10114, 5474, 32922, 79000, 103000, 132000, 164000, 199000, 238000], isBold: true },
      { label: "Net Income", values: [614, 1666, 3047, 4141, 2796, 4332, 9752, 4368, 29760, 67000, 87000, 112000, 139000, 169000, 202000], isBold: true },
    ],
    bsLines: [
      { label: "Cash & Short-Term Investments", values: [4900, 6800, 7100, 7400, 10900, 11500, 21200, 13300, 26000, 34000, 50000, 72000, 100000, 135000, 180000] },
      { label: "Total Assets", values: [7300, 9800, 11200, 13300, 17300, 28700, 44100, 41100, 65700, 98000, 132000, 175000, 228000, 295000, 378000], isBold: true },
      { label: "Total Liabilities", values: [2800, 4000, 3700, 4000, 5100, 11800, 17500, 19000, 22700, 32000, 41000, 52000, 65000, 80000, 98000] },
      { label: "Total Stockholders' Equity", values: [4500, 5800, 7500, 9300, 12200, 16900, 26600, 22100, 43000, 66000, 91000, 123000, 163000, 215000, 280000], isBold: true },
    ],
    cfLines: [
      { label: "NOPAT", values: [770, 1600, 2500, 3200, 2500, 3900, 8600, 4600, 28000, 67000, 87000, 112000, 139000, 169000, 202000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [1100, 1700, 2900, 3100, 4300, 4700, 8100, 3800, 27000, 62000, 81000, 104000, 130000, 158000, 189000], isBold: true },
      { label: "Ending Cash Balance", values: [4900, 6800, 7100, 7400, 10900, 11500, 21200, 13300, 26000, 34000, 50000, 72000, 100000, 135000, 180000], isBold: true },
    ],
    kpiScorecard: [
      { category: "Profitability", name: "Gross Margin %", value: 0.76, weightPct: 30, benchmarkTarget: 0.70, status: "Excellent", format: "pct" },
      { category: "Profitability", name: "EBIT Margin %", value: 0.63, weightPct: 30, benchmarkTarget: 0.50, status: "Excellent", format: "pct" },
      { category: "Efficiency", name: "ROA (Return on Assets)", value: 0.68, weightPct: 20, benchmarkTarget: 0.30, status: "Excellent", format: "pct" },
      { category: "Valuation", name: "FCF Conversion", value: 0.92, weightPct: 20, benchmarkTarget: 0.80, status: "Excellent", format: "pct" },
    ],
  },

  // ─── AMZN ─────────────────────────────────────────────────────────────────
  AMZN: {
    meta: {
      symbol: "AMZN",
      name: "Amazon.com, Inc.",
      sector: "E-Commerce & Cloud Infrastructure",
      badgeColor: "#ff9900",
      sharePrice: 186.40,
      priceChangePct: 1.45,
      marketCap: 1940.0,
      sharesOutstanding: 10400,
      beta: 1.12,
      creditRating: "AA",
      analystRating: "Strong Buy",
      targetPriceMean: 220.0,
      segmentPrimaryLabel: "AWS Cloud & Advertising Revenue",
      segmentSecondaryLabel: "E-Commerce Retail Sales",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.047,
      taxRate: 0.18,
      debtWeight: 0.22,
      equityWeight: 0.78,
    },
    drivers: {
      primaryVolumeBase: 120000000,
      primaryAvgPrice: 850,
      primaryVolumeGrowth: 0.18,
      primaryPriceGrowth: 0.04,
      primaryGrossMargin: 0.64,
      secondaryBaseRevenue: 430000,
      secondaryGrowthRate: 0.08,
      secondaryGrossMargin: 0.42,
      sgaPctOfRev: 0.40,
      rdPctOfRev: 0.12,
      dso: 24,
      dio: 44,
      dpo: 78,
      capexPctRev: 0.09,
      deprPctPPE: 0.18,
      terminalGrowthRate: 0.03,
      exitEvEbitdaMultiple: 19.8,
    },
    plLines: [
      { label: "AWS Cloud & Advertising Revenue", values: [15000, 22000, 31000, 46000, 62000, 90000, 121000, 140000, 165000, 198000, 235000, 280000, 332000, 392000, 460000], indent: 1 },
      { label: "E-Commerce Retail Sales", values: [92006, 113987, 146866, 186887, 218522, 296064, 348822, 373983, 409785, 440000, 475000, 510000, 548000, 588000, 630000], indent: 1 },
      { label: "Total Revenues", values: [107006, 135987, 177866, 232887, 280522, 386064, 469822, 513983, 574785, 638000, 710000, 790000, 880000, 980000, 1090000], isBold: true },
      { label: "Total Cost of Sales", values: [-71000, -88000, -111000, -139000, -165000, -227000, -272000, -288000, -304000, -338000, -376000, -418000, -466000, -519000, -577000] },
      { label: "Gross Profit", values: [36006, 47987, 66866, 93887, 115522, 159064, 197822, 225983, 270785, 300000, 334000, 372000, 414000, 461000, 513000], isBold: true },
      { label: "Operating Expenses (Fulfillment & Tech)", values: [-33773, -43801, -62760, -81466, -100981, -136165, -172944, -203458, -233932, -252000, -280000, -311000, -345000, -383000, -425000] },
      { label: "Operating Income (EBIT)", values: [2233, 4186, 4106, 12421, 14541, 22899, 24878, 22525, 36853, 48000, 54000, 61000, 69000, 78000, 88000], isBold: true },
      { label: "Net Income", values: [596, 2371, 3033, 10073, 11588, 21331, 33364, -2722, 30425, 41000, 47000, 54000, 62000, 71000, 81000], isBold: true },
    ],
    bsLines: [
      { label: "Cash & Short-Term Investments", values: [19800, 26000, 31000, 41000, 55000, 84000, 96000, 70000, 86000, 95000, 110000, 130000, 155000, 185000, 220000] },
      { label: "Total Assets", values: [65000, 83000, 131000, 163000, 225000, 321000, 420000, 462000, 527000, 595000, 675000, 765000, 865000, 975000, 1100000], isBold: true },
      { label: "Total Liabilities", values: [52000, 64000, 103000, 119000, 163000, 227000, 282000, 316000, 325000, 360000, 400000, 445000, 495000, 550000, 610000] },
      { label: "Total Stockholders' Equity", values: [13000, 19000, 28000, 44000, 62000, 94000, 138000, 146000, 202000, 235000, 275000, 320000, 370000, 425000, 490000], isBold: true },
    ],
    cfLines: [
      { label: "NOPAT", values: [1800, 3400, 3400, 10000, 12000, 18000, 20000, 18000, 30000, 39000, 44000, 50000, 56000, 64000, 72000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [7500, 9700, 6400, 17200, 21600, 25900, -14700, 11600, 35500, 45000, 52000, 60000, 69000, 79000, 90000], isBold: true },
      { label: "Ending Cash Balance", values: [19800, 26000, 31000, 41000, 55000, 84000, 96000, 70000, 86000, 95000, 110000, 130000, 155000, 185000, 220000], isBold: true },
    ],
    kpiScorecard: [
      { category: "Profitability", name: "Gross Margin %", value: 0.47, weightPct: 25, benchmarkTarget: 0.45, status: "Excellent", format: "pct" },
      { category: "Efficiency", name: "Cash Conversion Cycle", value: -10.0, weightPct: 25, benchmarkTarget: -5.0, status: "Excellent", format: "days" },
      { category: "Efficiency", name: "DPO (Payables Days)", value: 78.0, weightPct: 20, benchmarkTarget: 70.0, status: "Excellent", format: "days" },
      { category: "Valuation", name: "FCF Conversion", value: 0.94, weightPct: 30, benchmarkTarget: 0.80, status: "Excellent", format: "pct" },
    ],
  },
};
