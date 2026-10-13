/**
 * multiTickerFinancialData.ts
 *
 * Institutional Financial Data & Drivers for the Big 6 Tech Giants:
 * TSLA, MSFT, GOOGL, AAPL, NVDA, AMZN.
 *
 * Provides complete 15-year pipeline datasets (2015-2029) with:
 * - Corporate & Market Metadata
 * - Primary & Secondary Segment Revenue Models
 * - Historical & Forecast Financial Statements (P&L, Balance Sheet, Cash Flow)
 * - Working Capital & PP&E Roll-forward Parameters
 * - Wall Street Analyst Consensus & DCF Benchmark Parameters
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
  // WACC Parameters
  riskFreeRate: number;
  marketRiskPremium: number;
  bondYield: number;
  taxRate: number;
  debtWeight: number;
  equityWeight: number;
}

export interface SegmentModel {
  primaryBaseVolume: number;
  primaryAvgPrice: number;
  primaryVolumeGrowth: number;
  primaryPriceGrowth: number;
  primaryGrossMargin: number;
  secondaryBaseRevenue: number; // in millions
  secondaryGrowthRate: number;
  secondaryGrossMargin: number;
}

export interface FinancialStatementRow {
  label: string;
  values: number[]; // 15 years (2015-2029)
  isHeader?: boolean;
  isBold?: boolean;
  indent?: number;
  format?: "currency" | "pct" | "number" | "days";
}

export interface TickerFullModel {
  meta: CompanyMeta;
  segment: SegmentModel;
  opexPctOfRev: number;
  dso: number;
  dio: number;
  dpo: number;
  capexPctRev: number;
  terminalGrowthRate: number;
  exitEvEbitdaMultiple: number;
  plRows: FinancialStatementRow[];
  bsRows: FinancialStatementRow[];
  cfRows: FinancialStatementRow[];
}

export const SUPPORTED_TICKERS: TechTicker[] = ["TSLA", "MSFT", "GOOGL", "AAPL", "NVDA", "AMZN"];

export const YEARS_15 = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];
export const YEAR_LABELS_15 = YEARS_15.map((y) => (y <= 2019 ? `${y} Act` : `${y} Fcst`));

// ─── Multi-Ticker Database ──────────────────────────────────────────────────

export const MULTI_TICKER_DATABASE: Record<TechTicker, TickerFullModel> = {
  TSLA: {
    meta: {
      symbol: "TSLA",
      name: "Tesla, Inc.",
      sector: "Automotive & Energy Storage",
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
    segment: {
      primaryBaseVolume: 1800000,
      primaryAvgPrice: 44500,
      primaryVolumeGrowth: 0.15,
      primaryPriceGrowth: -0.02,
      primaryGrossMargin: 0.212,
      secondaryBaseRevenue: 6500,
      secondaryGrowthRate: 0.25,
      secondaryGrossMargin: 0.19,
    },
    opexPctOfRev: 0.1367,
    dso: 18.4,
    dio: 99.5,
    dpo: 91.3,
    capexPctRev: 0.064,
    terminalGrowthRate: 0.03,
    exitEvEbitdaMultiple: 16.0,
    plRows: [
      { label: "Total Revenues", values: [4046, 7000, 11759, 21461, 24578, 37652, 49933, 67816, 87208, 99609, 106627, 113514, 120512, 126326, 131531], isBold: true },
      { label: "Automotive Revenue", values: [3741, 6351, 9641, 18515, 20821, 33219, 44968, 62454, 81524, 93584, 100240, 106744, 113336, 118719, 123468], indent: 1 },
      { label: "Energy & Services Revenue", values: [305, 649, 2117, 2946, 3757, 4433, 4965, 5362, 5684, 6025, 6387, 6770, 7176, 7607, 8063], indent: 1 },
      { label: "Cost of Sales", values: [-3123, -5401, -9536, -17419, -20509, -30237, -40484, -55225, -71236, -81311, -87103, -92776, -98550, -103319, -107604] },
      { label: "Gross Profit", values: [924, 1599, 2222, 4042, 4069, 7415, 9449, 12591, 15971, 18298, 19524, 20738, 21962, 23007, 23927], isBold: true },
      { label: "Operating Expenses (R&D + SGA)", values: [-1640, -2267, -3855, -4430, -4138, -5147, -6826, -9271, -11922, -13617, -14576, -15518, -16475, -17269, -17981] },
      { label: "Operating Income (EBIT)", values: [-717, -667, -1632, -388, -69, 2268, 2623, 3320, 4050, 4681, 4948, 5220, 5487, 5737, 5946], isBold: true },
      { label: "Net Income", values: [-889, -675, -1961, -976, -862, 1394, 1674, 2226, 2802, 3301, 3512, 3726, 3937, 4135, 4300], isBold: true },
    ],
    bsRows: [
      { label: "Cash & Equivalents", values: [1197, 3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161, 53875] },
      { label: "Total Assets", values: [8068, 22664, 28655, 29740, 34309, 35707, 41522, 49362, 57723, 63370, 66939, 70273, 73402, 75764, 77501], isBold: true },
      { label: "Total Liabilities", values: [6984, 17126, 23421, 23982, 26842, 36029, 43501, 54335, 66091, 73567, 77821, 81993, 86234, 89750, 92903] },
      { label: "Total Stockholders' Equity", values: [1084, 5538, 5235, 5758, 7467, 8861, 10536, 12762, 15563, 18864, 22376, 26102, 30039, 34174, 38474], isBold: true },
    ],
    cfRows: [
      { label: "NOPAT", values: [-694, -1664, -446, -179, 1792, 2072, 2623, 3199, 3698, 3909, 4124, 4335, 4532, 4697], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [-7147, -4753, -2410, -754, 3312, 3729, 5618, 6593, 5528, 4593, 4962, 5447, 5687, 6112], isBold: true },
      { label: "Ending Cash Balance", values: [3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161, 53875], isBold: true },
    ],
  },
  MSFT: {
    meta: {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      sector: "Cloud Infrastructure & Enterprise Software",
      badgeColor: "#00a4ef",
      sharePrice: 448.90,
      priceChangePct: 1.85,
      marketCap: 3340.0,
      sharesOutstanding: 7430,
      beta: 0.89,
      creditRating: "AAA",
      analystRating: "Strong Buy",
      targetPriceMean: 500.0,
      segmentPrimaryLabel: "Intelligent Cloud / Azure Revenue ($M)",
      segmentSecondaryLabel: "Productivity & Business Processes ($M)",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.045,
      taxRate: 0.19,
      debtWeight: 0.1,
      equityWeight: 0.9,
    },
    segment: {
      primaryBaseVolume: 420000000,
      primaryAvgPrice: 320,
      primaryVolumeGrowth: 0.12,
      primaryPriceGrowth: 0.05,
      primaryGrossMargin: 0.72,
      secondaryBaseRevenue: 110000,
      secondaryGrowthRate: 0.16,
      secondaryGrossMargin: 0.68,
    },
    opexPctOfRev: 0.24,
    dso: 52,
    dio: 8,
    dpo: 35,
    capexPctRev: 0.18,
    terminalGrowthRate: 0.035,
    exitEvEbitdaMultiple: 23.2,
    plRows: [
      { label: "Total Revenues", values: [93580, 91154, 89950, 110360, 125843, 143015, 168088, 198270, 211915, 245122, 279439, 318560, 363158, 414000, 471960], isBold: true },
      { label: "Intelligent Cloud (Azure)", values: [38000, 39500, 41200, 52000, 61000, 72000, 88000, 108000, 118000, 142000, 166000, 194000, 227000, 265000, 310000], indent: 1 },
      { label: "Productivity & Business (Office 365)", values: [35580, 33654, 32750, 39360, 43843, 48015, 55088, 64270, 68915, 76122, 84439, 93560, 103158, 113000, 123960], indent: 1 },
      { label: "Cost of Sales", values: [-30000, -29000, -27000, -38000, -41000, -46000, -52000, -62000, -65000, -74000, -82000, -91000, -102000, -114000, -127000] },
      { label: "Gross Profit", values: [63580, 62154, 62950, 72360, 84843, 97015, 116088, 136270, 146915, 171122, 197439, 227560, 261158, 300000, 344960], isBold: true },
      { label: "Operating Expenses (R&D + SGA)", values: [-28000, -27000, -26000, -32000, -35000, -39000, -46000, -53000, -58000, -65000, -73000, -82000, -93000, -105000, -119000] },
      { label: "Operating Income (EBIT)", values: [35580, 35154, 36950, 40360, 49843, 58015, 70088, 83270, 88915, 106122, 124439, 145560, 168158, 195000, 225960], isBold: true },
      { label: "Net Income", values: [12193, 20553, 25489, 16571, 39240, 44281, 61271, 72738, 72361, 88136, 102000, 118000, 136000, 157000, 181000], isBold: true },
    ],
    bsRows: [
      { label: "Cash & Short-Term Investments", values: [96500, 113000, 133000, 133800, 133900, 136500, 130300, 104700, 111300, 80000, 95000, 115000, 140000, 170000, 205000] },
      { label: "Total Assets", values: [176000, 193000, 241000, 258000, 286000, 301000, 333000, 364000, 411000, 512000, 580000, 655000, 740000, 840000, 955000], isBold: true },
      { label: "Total Liabilities", values: [96000, 121000, 168000, 176000, 184000, 183000, 191000, 198000, 205000, 243000, 265000, 290000, 320000, 355000, 395000] },
      { label: "Total Stockholders' Equity", values: [80000, 72000, 73000, 82000, 102000, 118000, 142000, 166000, 206000, 269000, 315000, 365000, 420000, 485000, 560000], isBold: true },
    ],
    cfRows: [
      { label: "NOPAT", values: [28000, 28000, 30000, 33000, 40000, 47000, 56000, 67000, 72000, 85000, 100000, 117000, 136000, 157000, 183000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [24000, 26000, 31000, 32000, 38000, 45000, 56000, 65000, 59000, 74000, 88000, 103000, 120000, 139000, 161000], isBold: true },
      { label: "Ending Cash Balance", values: [96500, 113000, 133000, 133800, 133900, 136500, 130300, 104700, 111300, 80000, 95000, 115000, 140000, 170000, 205000], isBold: true },
    ],
  },
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
      segmentPrimaryLabel: "Google Search & YouTube Advertising ($M)",
      segmentSecondaryLabel: "Google Cloud & AI Platform ($M)",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.046,
      taxRate: 0.16,
      debtWeight: 0.08,
      equityWeight: 0.92,
    },
    segment: {
      primaryBaseVolume: 550000000,
      primaryAvgPrice: 420,
      primaryVolumeGrowth: 0.09,
      primaryPriceGrowth: 0.03,
      primaryGrossMargin: 0.58,
      secondaryBaseRevenue: 33000,
      secondaryGrowthRate: 0.26,
      secondaryGrossMargin: 0.28,
    },
    opexPctOfRev: 0.28,
    dso: 42,
    dio: 4,
    dpo: 28,
    capexPctRev: 0.12,
    terminalGrowthRate: 0.03,
    exitEvEbitdaMultiple: 18.5,
    plRows: [
      { label: "Total Revenues", values: [74989, 90272, 110855, 136819, 161857, 182527, 257637, 282836, 307394, 345000, 390000, 440000, 495000, 555000, 620000], isBold: true },
      { label: "Google Services (Search/YouTube)", values: [69000, 84000, 104000, 128000, 151000, 168000, 237000, 253000, 274000, 303000, 338000, 376000, 417000, 461000, 508000], indent: 1 },
      { label: "Google Cloud & AI", values: [5989, 6272, 6855, 8819, 10857, 14527, 20637, 29836, 33394, 42000, 52000, 64000, 78000, 94000, 112000], indent: 1 },
      { label: "Cost of Sales", values: [-28000, -35000, -45000, -59000, -71000, -84000, -110000, -126000, -133000, -148000, -167000, -188000, -211000, -236000, -263000] },
      { label: "Gross Profit", values: [46989, 55272, 65855, 77819, 90857, 98527, 147637, 156836, 174394, 197000, 223000, 252000, 284000, 319000, 357000], isBold: true },
      { label: "Operating Expenses", values: [-27000, -31000, -37000, -51000, -56000, -57000, -69000, -82000, -89000, -100000, -113000, -127000, -143000, -160000, -179000] },
      { label: "Operating Income (EBIT)", values: [19989, 24272, 28855, 26819, 34857, 41527, 78637, 74836, 85394, 97000, 110000, 125000, 141000, 159000, 178000], isBold: true },
      { label: "Net Income", values: [16348, 19478, 12662, 30736, 34343, 40269, 76033, 59972, 73795, 85000, 96000, 109000, 123000, 139000, 156000], isBold: true },
    ],
    bsRows: [
      { label: "Cash & Equivalents", values: [73000, 86000, 102000, 109000, 119000, 136000, 139000, 113000, 110000, 125000, 145000, 170000, 200000, 235000, 275000] },
      { label: "Total Assets", values: [147000, 167000, 197000, 232000, 275000, 319000, 359000, 365000, 402000, 465000, 535000, 615000, 705000, 805000, 915000], isBold: true },
      { label: "Total Liabilities", values: [27000, 28000, 44000, 55000, 74000, 97000, 107000, 109000, 119000, 135000, 153000, 173000, 195000, 220000, 248000] },
      { label: "Total Stockholders' Equity", values: [120000, 139000, 153000, 177000, 201000, 222000, 252000, 256000, 283000, 330000, 382000, 442000, 510000, 585000, 667000], isBold: true },
    ],
    cfRows: [
      { label: "NOPAT", values: [17000, 20000, 24000, 23000, 29000, 35000, 66000, 63000, 71000, 81000, 92000, 105000, 118000, 133000, 149000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [16000, 19000, 23000, 22000, 31000, 39000, 67000, 60000, 69000, 78000, 89000, 101000, 114000, 129000, 145000], isBold: true },
      { label: "Ending Cash Balance", values: [73000, 86000, 102000, 109000, 119000, 136000, 139000, 113000, 110000, 125000, 145000, 170000, 200000, 235000, 275000], isBold: true },
    ],
  },
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
      segmentPrimaryLabel: "Hardware Units (iPhone/Mac/iPad)",
      segmentSecondaryLabel: "Services & App Store ($M)",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.044,
      taxRate: 0.16,
      debtWeight: 0.15,
      equityWeight: 0.85,
    },
    segment: {
      primaryBaseVolume: 235000000,
      primaryAvgPrice: 1050,
      primaryVolumeGrowth: 0.04,
      primaryPriceGrowth: 0.02,
      primaryGrossMargin: 0.38,
      secondaryBaseRevenue: 85000,
      secondaryGrowthRate: 0.14,
      secondaryGrossMargin: 0.74,
    },
    opexPctOfRev: 0.144,
    dso: 28,
    dio: 12,
    dpo: 55,
    capexPctRev: 0.035,
    terminalGrowthRate: 0.03,
    exitEvEbitdaMultiple: 24.5,
    plRows: [
      { label: "Total Revenues", values: [233715, 215639, 229234, 265595, 260174, 274515, 365817, 394328, 383285, 410000, 435000, 462000, 492000, 524000, 558000], isBold: true },
      { label: "Hardware Sales (iPhone, Mac, iPad)", values: [213800, 191300, 196500, 225950, 213900, 220700, 297400, 316200, 298000, 315000, 330000, 346000, 363000, 381000, 400000], indent: 1 },
      { label: "Services & App Store", values: [19915, 24339, 32734, 39645, 46274, 53815, 68417, 78128, 85285, 95000, 105000, 116000, 129000, 143000, 158000], indent: 1 },
      { label: "Cost of Sales", values: [-140089, -131376, -141048, -163756, -161782, -169559, -212981, -223546, -214137, -225500, -239000, -254000, -270000, -288000, -306000] },
      { label: "Gross Profit", values: [93626, 84263, 88186, 101839, 98392, 104956, 152836, 170782, 169148, 184500, 196000, 208000, 222000, 236000, 252000], isBold: true },
      { label: "Operating Expenses (R&D + SGA)", values: [-22364, -24200, -26842, -30941, -34447, -38668, -43887, -51345, -54847, -59000, -62600, -66500, -70800, -75400, -80300] },
      { label: "Operating Income (EBIT)", values: [71262, 60063, 61344, 70898, 63945, 66288, 108949, 119437, 114301, 125500, 133400, 141500, 151200, 160600, 171700], isBold: true },
      { label: "Net Income", values: [53394, 45687, 48351, 59531, 55256, 57411, 94680, 99803, 96995, 105000, 112000, 119000, 127000, 135000, 144000], isBold: true },
    ],
    bsRows: [
      { label: "Cash & Marketable Securities", values: [205666, 237586, 268895, 237100, 205898, 191830, 172600, 156400, 162100, 165000, 175000, 190000, 210000, 235000, 265000] },
      { label: "Total Assets", values: [290479, 321686, 375319, 365725, 338516, 323888, 351002, 352755, 352583, 375000, 400000, 430000, 465000, 505000, 550000], isBold: true },
      { label: "Total Liabilities", values: [171000, 193000, 241000, 258000, 248000, 258000, 287000, 302000, 290000, 305000, 320000, 340000, 365000, 395000, 430000] },
      { label: "Total Stockholders' Equity", values: [119355, 128249, 134047, 107147, 90488, 65339, 63090, 50672, 62146, 70000, 80000, 90000, 100000, 110000, 120000], isBold: true },
    ],
    cfRows: [
      { label: "NOPAT", values: [59000, 50000, 51000, 59000, 53000, 55000, 91000, 100000, 96000, 105000, 112000, 119000, 127000, 135000, 144000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [54000, 53000, 51000, 64000, 58000, 73000, 93000, 111000, 99000, 108000, 115000, 122000, 130000, 138000, 147000], isBold: true },
      { label: "Ending Cash Balance", values: [205666, 237586, 268895, 237100, 205898, 191830, 172600, 156400, 162100, 165000, 175000, 190000, 210000, 235000, 265000], isBold: true },
    ],
  },
  NVDA: {
    meta: {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      sector: "Semiconductors & Artificial Intelligence",
      badgeColor: "#76b900",
      sharePrice: 122.50,
      priceChangePct: 4.80,
      marketCap: 3010.0,
      sharesOutstanding: 24600,
      beta: 1.68,
      creditRating: "A+",
      analystRating: "Strong Buy",
      targetPriceMean: 145.0,
      segmentPrimaryLabel: "Data Center AI GPU Compute ($M)",
      segmentSecondaryLabel: "Gaming GPUs & Enterprise ($M)",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.048,
      taxRate: 0.15,
      debtWeight: 0.05,
      equityWeight: 0.95,
    },
    segment: {
      primaryBaseVolume: 3500000,
      primaryAvgPrice: 28000,
      primaryVolumeGrowth: 0.35,
      primaryPriceGrowth: 0.08,
      primaryGrossMargin: 0.76,
      secondaryBaseRevenue: 14000,
      secondaryGrowthRate: 0.20,
      secondaryGrossMargin: 0.62,
    },
    opexPctOfRev: 0.14,
    dso: 48,
    dio: 75,
    dpo: 42,
    capexPctRev: 0.04,
    terminalGrowthRate: 0.04,
    exitEvEbitdaMultiple: 32.0,
    plRows: [
      { label: "Total Revenues", values: [5010, 6910, 9714, 11716, 10918, 16675, 26914, 26974, 60922, 126000, 165000, 210000, 260000, 315000, 375000], isBold: true },
      { label: "Data Center AI Compute", values: [800, 1300, 1900, 2900, 3000, 6700, 15000, 15000, 47500, 108000, 144000, 186000, 233000, 285000, 342000], indent: 1 },
      { label: "Gaming & Enterprise Software", values: [4210, 5610, 7814, 8816, 7918, 9975, 11914, 11974, 13422, 18000, 21000, 24000, 27000, 30000, 33000], indent: 1 },
      { label: "Cost of Sales", values: [-2200, -2800, -3900, -4500, -4100, -6200, -9400, -11500, -16600, -30000, -39000, -49000, -60000, -72000, -85000] },
      { label: "Gross Profit", values: [2810, 4110, 5814, 7216, 6818, 10475, 17514, 15474, 44322, 96000, 126000, 161000, 200000, 243000, 290000], isBold: true },
      { label: "Operating Expenses (R&D + SGA)", values: [-1900, -2200, -2900, -3400, -3900, -5900, -7400, -10000, -11400, -17000, -23000, -29000, -36000, -44000, -52000] },
      { label: "Operating Income (EBIT)", values: [910, 1910, 2914, 3816, 2918, 4575, 10114, 5474, 32922, 79000, 103000, 132000, 164000, 199000, 238000], isBold: true },
      { label: "Net Income", values: [614, 1666, 3047, 4141, 2796, 4332, 9752, 4368, 29760, 67000, 87000, 112000, 139000, 169000, 202000], isBold: true },
    ],
    bsRows: [
      { label: "Cash & Short-Term Investments", values: [4900, 6800, 7100, 7400, 10900, 11500, 21200, 13300, 26000, 34000, 50000, 72000, 100000, 135000, 180000] },
      { label: "Total Assets", values: [7300, 9800, 11200, 13300, 17300, 28700, 44100, 41100, 65700, 98000, 132000, 175000, 228000, 295000, 378000], isBold: true },
      { label: "Total Liabilities", values: [2800, 4000, 3700, 4000, 5100, 11800, 17500, 19000, 22700, 32000, 41000, 52000, 65000, 80000, 98000] },
      { label: "Total Stockholders' Equity", values: [4500, 5800, 7500, 9300, 12200, 16900, 26600, 22100, 43000, 66000, 91000, 123000, 163000, 215000, 280000], isBold: true },
    ],
    cfRows: [
      { label: "NOPAT", values: [770, 1600, 2500, 3200, 2500, 3900, 8600, 4600, 28000, 67000, 87000, 112000, 139000, 169000, 202000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [1100, 1700, 2900, 3100, 4300, 4700, 8100, 3800, 27000, 62000, 81000, 104000, 130000, 158000, 189000], isBold: true },
      { label: "Ending Cash Balance", values: [4900, 6800, 7100, 7400, 10900, 11500, 21200, 13300, 26000, 34000, 50000, 72000, 100000, 135000, 180000], isBold: true },
    ],
  },
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
      segmentPrimaryLabel: "AWS Cloud & Advertising Revenue ($M)",
      segmentSecondaryLabel: "E-Commerce Retail Sales ($M)",
      riskFreeRate: 0.042,
      marketRiskPremium: 0.05,
      bondYield: 0.047,
      taxRate: 0.18,
      debtWeight: 0.22,
      equityWeight: 0.78,
    },
    segment: {
      primaryBaseVolume: 120000000,
      primaryAvgPrice: 850,
      primaryVolumeGrowth: 0.18,
      primaryPriceGrowth: 0.04,
      primaryGrossMargin: 0.64,
      secondaryBaseRevenue: 430000,
      secondaryGrowthRate: 0.08,
      secondaryGrossMargin: 0.42,
    },
    opexPctOfRev: 0.40,
    dso: 24,
    dio: 44,
    dpo: 78,
    capexPctRev: 0.09,
    terminalGrowthRate: 0.03,
    exitEvEbitdaMultiple: 19.8,
    plRows: [
      { label: "Total Revenues", values: [107006, 135987, 177866, 232887, 280522, 386064, 469822, 513983, 574785, 638000, 710000, 790000, 880000, 980000, 1090000], isBold: true },
      { label: "AWS Cloud & Ads", values: [15000, 22000, 31000, 46000, 62000, 90000, 121000, 140000, 165000, 198000, 235000, 280000, 332000, 392000, 460000], indent: 1 },
      { label: "E-Commerce Retail", values: [92006, 113987, 146866, 186887, 218522, 296064, 348822, 373983, 409785, 440000, 475000, 510000, 548000, 588000, 630000], indent: 1 },
      { label: "Cost of Sales", values: [-71000, -88000, -111000, -139000, -165000, -227000, -272000, -288000, -304000, -338000, -376000, -418000, -466000, -519000, -577000] },
      { label: "Gross Profit", values: [36006, 47987, 66866, 93887, 115522, 159064, 197822, 225983, 270785, 300000, 334000, 372000, 414000, 461000, 513000], isBold: true },
      { label: "Operating Expenses (Fulfillment + Tech)", values: [-33773, -43801, -62760, -81466, -100981, -136165, -172944, -203458, -233932, -252000, -280000, -311000, -345000, -383000, -425000] },
      { label: "Operating Income (EBIT)", values: [2233, 4186, 4106, 12421, 14541, 22899, 24878, 22525, 36853, 48000, 54000, 61000, 69000, 78000, 88000], isBold: true },
      { label: "Net Income", values: [596, 2371, 3033, 10073, 11588, 21331, 33364, -2722, 30425, 41000, 47000, 54000, 62000, 71000, 81000], isBold: true },
    ],
    bsRows: [
      { label: "Cash & Short-Term Investments", values: [19800, 26000, 31000, 41000, 55000, 84000, 96000, 70000, 86000, 95000, 110000, 130000, 155000, 185000, 220000] },
      { label: "Total Assets", values: [65000, 83000, 131000, 163000, 225000, 321000, 420000, 462000, 527000, 595000, 675000, 765000, 865000, 975000, 1100000], isBold: true },
      { label: "Total Liabilities", values: [52000, 64000, 103000, 119000, 163000, 227000, 282000, 316000, 325000, 360000, 400000, 445000, 495000, 550000, 610000] },
      { label: "Total Stockholders' Equity", values: [13000, 19000, 28000, 44000, 62000, 94000, 138000, 146000, 202000, 235000, 275000, 320000, 370000, 425000, 490000], isBold: true },
    ],
    cfRows: [
      { label: "NOPAT", values: [1800, 3400, 3400, 10000, 12000, 18000, 20000, 18000, 30000, 39000, 44000, 50000, 56000, 64000, 72000], isBold: true },
      { label: "Unlevered Free Cash Flow (UFCF)", values: [7500, 9700, 6400, 17200, 21600, 25900, -14700, 11600, 35500, 45000, 52000, 60000, 69000, 79000, 90000], isBold: true },
      { label: "Ending Cash Balance", values: [19800, 26000, 31000, 41000, 55000, 84000, 96000, 70000, 86000, 95000, 110000, 130000, 155000, 185000, 220000], isBold: true },
    ],
  },
};
