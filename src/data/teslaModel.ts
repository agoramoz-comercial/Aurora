/**
 * teslaModel.ts
 *
 * Complete Tesla Financial Model data extracted from '20.+Complete+the+BS_before.xlsx'.
 * All 38 sheets' worth of data, fully typed, covering:
 * - Drivers & Assumptions
 * - Deliveries (6 models × 15 years)
 * - Average Prices per model
 * - P&L Input (Actuals 2015-2019)
 * - Balance Sheet Input (Actuals 2015-2019)
 * - Revenue Automotive (per model × 15 years × 3 cases)
 * - Gross Profit % per model (comparables + historical)
 * - Gross Profit Automotive
 * - Cost of Sales Automotive
 * - Revenue & GP Energy & Other
 * - Opex (comparables + forecast)
 * - PP&E (capex, D&A, useful life)
 * - Working Capital (DSO, DIO, DPO)
 * - Financing (debt, equity, interest)
 * - P&L Output
 * - Balance Sheet Output
 * - Cash Flow Output
 * - Comparables (deliveries, GP%, opex, PP&E, WC)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CaseType = "best" | "base" | "worst";

export interface TeslaDrivers {
  selectedCase: number;
  company: string;
  currency: string;
  country: string;
  treasuryYield10Y: number;
  marketRiskPremium: number;
  companyBeta: number;
  sharePrice: number;
  bondYield: number;
  corporateTaxRate: number;
  expectedInflation: number;
}

export interface YearData {
  year: number;
  label: string; // e.g. "2015 Act" or "2020 Fcst"
  isActual: boolean;
}

export interface DeliveryRow {
  model: string;
  values: number[]; // 15 years (2015-2029)
  growthRates: (number | null)[]; // y-o-y growth %
}

export interface AveragePrice {
  model: string;
  basePrice: number;
  maxPrice: number;
  averagePrice: number;
}

export interface PLInputRow {
  label: string;
  values: number[]; // 5 years (2015-2019)
}

export interface BSInputRow {
  label: string;
  values: number[]; // 5 years (2015-2019)
}

export interface RevenueRow {
  model: string;
  values: number[]; // 15 years
  averagePrice: number;
}

export interface CaseMultipliers {
  best: number[];
  base: number[];
  worst: number[];
}

export interface GPPercentRow {
  model: string;
  comparableCompanies: string;
  compGP1: number;
  compGP2: number;
  compGP3: number;
  average: number;
  source: string; // "Historic" or "Comparables"
}

export interface GPRow {
  model: string;
  values: number[];
}

export interface OpexComparable {
  company: string;
  average: number;
  adjAverage: number | null;
}

export interface PPEComparable {
  company: string;
  capexPctPPE: number;
  capexPctRev: number;
}

export interface WCComparable {
  company: string;
  dso: number;
  dio: number;
  dpo: number;
  netTradeCycle: number;
}

export interface DeliveryComparable {
  company: string;
  averageSales: number;
}

export interface FinancialStatement {
  label: string;
  values: number[];
  isHeader?: boolean;
  isBold?: boolean;
  isCheck?: boolean;
  indent?: number;
  format?: "currency" | "pct" | "number" | "days";
  assumption?: string;
}

// ─── Year Labels ────────────────────────────────────────────────────────────

export const YEARS: YearData[] = [
  { year: 2015, label: "2015 Act", isActual: true },
  { year: 2016, label: "2016 Act", isActual: true },
  { year: 2017, label: "2017 Act", isActual: true },
  { year: 2018, label: "2018 Act", isActual: true },
  { year: 2019, label: "2019 Act", isActual: true },
  { year: 2020, label: "2020 Fcst", isActual: false },
  { year: 2021, label: "2021 Fcst", isActual: false },
  { year: 2022, label: "2022 Fcst", isActual: false },
  { year: 2023, label: "2023 Fcst", isActual: false },
  { year: 2024, label: "2024 Fcst", isActual: false },
  { year: 2025, label: "2025 Fcst", isActual: false },
  { year: 2026, label: "2026 Fcst", isActual: false },
  { year: 2027, label: "2027 Fcst", isActual: false },
  { year: 2028, label: "2028 Fcst", isActual: false },
  { year: 2029, label: "2029 Fcst", isActual: false },
];

export const YEAR_LABELS_SHORT = YEARS.map((y) => `${y.year}`);
export const ACTUAL_YEARS = YEARS.filter((y) => y.isActual);
export const FORECAST_YEARS = YEARS.filter((y) => !y.isActual);

// ─── Drivers ────────────────────────────────────────────────────────────────

export const teslaDrivers: TeslaDrivers = {
  selectedCase: 2,
  company: "Tesla",
  currency: "USD",
  country: "United States",
  treasuryYield10Y: 0.00697,
  marketRiskPremium: 0.05,
  companyBeta: 2.15,
  sharePrice: 639.83,
  bondYield: 0.04324,
  corporateTaxRate: 0.21,
  expectedInflation: 0.02,
};

// ─── Deliveries (6 models × 15 years) ──────────────────────────────────────

export const TESLA_MODELS = [
  "Model 3",
  "Model S & X",
  "Model Y",
  "Roadster 2",
  "Cybertruck",
  "Semi",
] as const;

export type TeslaModel = (typeof TESLA_MODELS)[number];

export const deliveriesData: DeliveryRow[] = [
  {
    model: "Model 3",
    values: [0, 0, 1764, 146055, 300815, 481304, 529434, 582378, 628968, 679286, 706457, 734715, 764104, 794668, 826455],
    growthRates: [null, null, null, null, 1.06, 0.6, 0.1, 0.1, 0.08, 0.08, 0.04, 0.04, 0.04, 0.04, 0.04],
  },
  {
    model: "Model S & X",
    values: [50580, 76230, 101312, 98865, 66385, 69040, 71802, 74674, 77661, 80768, 83998, 87358, 90852, 94487, 98266],
    growthRates: [null, 0.507, 0.329, -0.024, -0.329, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04],
  },
  {
    model: "Model Y",
    values: [0, 0, 0, 0, 0, 1764, 146055, 300815, 481304, 529434, 582378, 628968, 679286, 706457, 734715],
    growthRates: [null, null, null, null, null, null, null, 1.06, 0.6, 0.1, 0.1, 0.08, 0.08, 0.04, 0.04],
  },
  {
    model: "Roadster 2",
    values: [0, 0, 0, 0, 0, 0, 0, 500, 1000, 1500, 1650, 1815, 1960, 2117, 2202],
    growthRates: [null, null, null, null, null, null, null, null, 1.0, 0.5, 0.1, 0.1, 0.08, 0.08, 0.04],
  },
  {
    model: "Cybertruck",
    values: [0, 0, 0, 0, 0, 0, 250, 20699, 42633, 68212, 75033, 82537, 89139, 96271, 100121],
    growthRates: [null, null, null, null, null, null, null, null, 1.06, 0.6, 0.1, 0.1, 0.08, 0.08, 0.04],
  },
  {
    model: "Semi",
    values: [0, 0, 0, 0, 0, 0, 250, 20699, 42633, 68212, 75033, 82537, 89139, 96271, 100121],
    growthRates: [null, null, null, null, null, null, null, null, 1.06, 0.6, 0.1, 0.1, 0.08, 0.08, 0.04],
  },
];

export const totalDeliveries = deliveriesData[0]!.values.map((_, i) =>
  deliveriesData.reduce((sum, row) => sum + row.values[i]!, 0),
);

// ─── Average Prices ─────────────────────────────────────────────────────────

export const averagePrices: AveragePrice[] = [
  { model: "Model 3", basePrice: 39990, maxPrice: 66990, averagePrice: 54157 },
  { model: "Model S & X", basePrice: 79990, maxPrice: 128490, averagePrice: 102053 },
  { model: "Model Y", basePrice: 48000, maxPrice: 74000, averagePrice: 61000 },
  { model: "Roadster 2", basePrice: 200000, maxPrice: 250000, averagePrice: 225000 },
  { model: "Cybertruck", basePrice: 39900, maxPrice: 76900, averagePrice: 58400 },
  { model: "Semi", basePrice: 150000, maxPrice: 200000, averagePrice: 175000 },
];

// ─── P&L Input (Actuals 2015–2019, in millions $) ──────────────────────────

export const plInputData: PLInputRow[] = [
  { label: "Automotive revenues", values: [3741, 6351, 9641, 18515, 20821] },
  { label: "Energy generation & storage", values: [14, 181, 1116, 1555, 1531] },
  { label: "Services & other", values: [291, 468, 1001, 1391, 2226] },
  { label: "Total revenues", values: [4046, 7000, 11759, 21461, 24578] },
  { label: "Automotive COGS", values: [-2823, -4750, -7433, -14174, -16398] },
  { label: "Energy COGS", values: [-12, -178, -875, -1365, -1341] },
  { label: "Services COGS", values: [-287, -472, -1229, -1880, -2770] },
  { label: "Gross profit", values: [924, 1599, 2222, 4042, 4069] },
  { label: "R&D", values: [-718, -834, -1378, -1460, -1343] },
  { label: "SG&A", values: [-922, -1432, -2477, -2834, -2646] },
  { label: "Restructuring & other", values: [0, 0, 0, -135, -149] },
  { label: "EBIT", values: [-717, -667, -1632, -388, -69] },
  { label: "Interest income", values: [2, 9, 20, 25, 44] },
  { label: "Interest expense", values: [-119, -199, -471, -663, -685] },
  { label: "Other income/expense", values: [-42, 111, -125, 22, 45] },
  { label: "EBT", values: [-876, -746, -2209, -1005, -665] },
  { label: "Taxes", values: [-13, -27, -32, -58, -110] },
  { label: "Net loss incl. minorities", values: [-889, -773, -2241, -1063, -775] },
  { label: "Minority interests", values: [0, 98, 279, 86, -87] },
  { label: "Net loss", values: [-889, -675, -1961, -976, -862] },
];

// ─── P&L KPIs ───────────────────────────────────────────────────────────────

export const plKPIs = {
  revGrowthAuto: [null, 0.698, 0.518, 0.920, 0.125],
  revGrowthEnergy: [null, 11.530, 5.154, 0.393, -0.016],
  revGrowthServices: [null, 0.611, 1.139, 0.389, 0.600],
  gpPctAuto: [0.245, 0.252, 0.229, 0.234, 0.212],
  gpPctEnergy: [0.151, 0.017, 0.217, 0.122, 0.124],
  gpPctServices: [0.013, -0.010, -0.228, -0.352, -0.244],
  overallGP: [0.228, 0.228, 0.189, 0.188, 0.166],
  ebitPct: [-0.177, -0.095, -0.139, -0.018, -0.003],
  netLossPct: [-0.220, -0.096, -0.167, -0.045, -0.035],
  roa: [-0.110, -0.030, -0.068, -0.033, -0.025],
  roe: [-0.820, -0.142, -0.463, -0.198, -0.130],
};

// ─── Balance Sheet Input (Actuals, in millions) ─────────────────────────────

export const bsInputData: BSInputRow[] = [
  { label: "Cash & equivalents", values: [1197, 3393, 3368, 3686, 6268] },
  { label: "Restricted cash & securities", values: [23, 106, 155, 193, 246] },
  { label: "Accounts receivable", values: [169, 499, 515, 949, 1324] },
  { label: "Inventory", values: [1278, 2067, 2264, 3113, 3552] },
  { label: "Prepaid expenses", values: [116, 194, 268, 366, 713] },
  { label: "Total current assets", values: [2782, 6260, 6571, 8306, 12103] },
  { label: "Operating lease vehicles", values: [1791, 3134, 4117, 2090, 2447] },
  { label: "Solar energy systems", values: [0, 5920, 6347, 6271, 6138] },
  { label: "PP&E", values: [3403, 5983, 10028, 11330, 10396] },
  { label: "Operating lease ROU", values: [0, 0, 0, 0, 1218] },
  { label: "Intangible assets", values: [13, 376, 362, 282, 339] },
  { label: "Goodwill", values: [0, 506, 517, 490, 591] },
  { label: "Restricted cash (non-current)", values: [32, 268, 442, 398, 269] },
  { label: "Other assets", values: [47, 217, 273, 572, 808] },
  { label: "Total assets", values: [8068, 22664, 28655, 29740, 34309] },
  { label: "Accounts payable", values: [916, 1860, 2390, 3404, 3771] },
  { label: "Accrued liabilities", values: [423, 1210, 1731, 2094, 2905] },
  { label: "Deferred revenue", values: [424, 763, 1015, 630, 1163] },
  { label: "Resale value guarantees", values: [137, 180, 787, 503, 317] },
  { label: "Customer deposits", values: [283, 664, 854, 793, 726] },
  { label: "Current portion of LT debt", values: [628, 984, 797, 2568, 1785] },
  { label: "Total current liabilities", values: [2811, 5827, 7675, 9992, 10667] },
  { label: "LT debt & capital leases", values: [2021, 5860, 9416, 9404, 11634] },
  { label: "Other liabilities", values: [2152, 5439, 6330, 4586, 4541] },
  { label: "Total liabilities", values: [6984, 17126, 23421, 23982, 26842] },
  { label: "Stockholders' equity", values: [1084, 4753, 4237, 4923, 6618] },
  { label: "Noncontrolling interests", values: [0, 785, 997, 834, 849] },
  { label: "Total liabilities & equity", values: [8068, 22664, 28655, 29740, 34309] },
];

// ─── BS KPIs ────────────────────────────────────────────────────────────────

export const bsKPIs = {
  quickRatio: [0.434, 0.600, 0.459, 0.388, 0.611],
  currentRatio: [0.990, 1.074, 0.856, 0.831, 1.135],
  dso: [15.0, 25.7, 15.8, 15.9, 19.4],
  dio: [147.3, 137.8, 85.4, 64.3, 62.3],
  dpo: [105.6, 124.0, 90.2, 70.4, 66.2],
  netTradeCycle: [56.7, 39.5, 11.0, 9.9, 15.5],
  debtRatio: [0.866, 0.756, 0.817, 0.806, 0.782],
};

// ─── Revenue Automotive per model (in millions) ────────────────────────────

export const revenueAutomotiveData: RevenueRow[] = [
  {
    model: "Model 3",
    averagePrice: 54157,
    values: [0, 0, 88, 8136, 14706, 26066, 28672, 31540, 34063, 36788, 38259, 39790, 41381, 43037, 44758],
  },
  {
    model: "Model S & X",
    averagePrice: 102053,
    values: [3741, 6351, 9553, 10378, 6115, 7046, 7328, 7621, 7926, 8243, 8572, 8915, 9272, 9643, 10028],
  },
  {
    model: "Model Y",
    averagePrice: 61000,
    values: [0, 0, 0, 0, 0, 108, 8909, 18350, 29360, 32295, 35525, 38367, 41436, 43094, 44818],
  },
  {
    model: "Roadster 2",
    averagePrice: 225000,
    values: [0, 0, 0, 0, 0, 0, 0, 113, 225, 338, 371, 408, 441, 476, 495],
  },
  {
    model: "Cybertruck",
    averagePrice: 58400,
    values: [0, 0, 0, 0, 0, 0, 15, 1209, 2490, 3984, 4382, 4820, 5206, 5622, 5847],
  },
  {
    model: "Semi",
    averagePrice: 175000,
    values: [0, 0, 0, 0, 0, 0, 44, 3622, 7461, 11937, 13131, 14444, 15599, 16847, 17521],
  },
];

export const totalRevenueAutomotive = revenueAutomotiveData[0]!.values.map((_, i) =>
  revenueAutomotiveData.reduce((sum, row) => sum + row.values[i]!, 0),
);

// ─── Revenue Case Multipliers ───────────────────────────────────────────────

export const revenueCaseMultipliers: CaseMultipliers = {
  best: Array(10).fill(1.02) as number[],
  base: Array(10).fill(1.0) as number[],
  worst: Array(10).fill(0.98) as number[],
};

// ─── GP% per model (Comparables Analysis) ──────────────────────────────────

export const gpPercentData: GPPercentRow[] = [
  { model: "Model 3", comparableCompanies: "GM, Ford, Fiat Chrysler", compGP1: 0.187, compGP2: 0.143, compGP3: 0.139, average: 0.2234, source: "Historic" },
  { model: "Model S & X", comparableCompanies: "BMW, Mercedes, VW", compGP1: 0.155, compGP2: 0.183, compGP3: 0.172, average: 0.2234, source: "Historic" },
  { model: "Model Y", comparableCompanies: "GM, Ford, Fiat Chrysler", compGP1: 0.187, compGP2: 0.143, compGP3: 0.139, average: 0.1564, source: "Comparables" },
  { model: "Roadster 2", comparableCompanies: "Jaguar, Porsche, Ferrari", compGP1: 0.360, compGP2: 0.440, compGP3: 0.523, average: 0.4410, source: "Comparables" },
  { model: "Cybertruck", comparableCompanies: "GM, Ford, Fiat Chrysler", compGP1: 0.187, compGP2: 0.143, compGP3: 0.139, average: 0.1564, source: "Comparables" },
  { model: "Semi", comparableCompanies: "Scania, MAN, Paccar", compGP1: 0.230, compGP2: 0.230, compGP3: 0.146, average: 0.2022, source: "Comparables" },
];

export const gpCaseMargins: Record<CaseType, Record<string, number>> = {
  best: {
    "Model 3": 0.2384,
    "Model S & X": 0.2384,
    "Model Y": 0.1714,
    "Roadster 2": 0.4560,
    "Cybertruck": 0.1714,
    "Semi": 0.2172,
  },
  base: {
    "Model 3": 0.2234,
    "Model S & X": 0.2234,
    "Model Y": 0.1564,
    "Roadster 2": 0.4410,
    "Cybertruck": 0.1564,
    "Semi": 0.2022,
  },
  worst: {
    "Model 3": 0.2084,
    "Model S & X": 0.2084,
    "Model Y": 0.1414,
    "Roadster 2": 0.4260,
    "Cybertruck": 0.1414,
    "Semi": 0.1872,
  },
};

// ─── Gross Profit Automotive (Base case, in millions) ───────────────────────

export const gpAutomotiveData: GPRow[] = [
  { model: "Model 3", values: [0, 0, 0, 0, 0, 5824, 6407, 7047, 7611, 8220, 8549, 8891, 9246, 9616, 10001] },
  { model: "Model S & X", values: [0, 0, 0, 0, 0, 1574, 1637, 1703, 1771, 1842, 1915, 1992, 2072, 2155, 2241] },
  { model: "Model Y", values: [0, 0, 0, 0, 0, 17, 1394, 2870, 4592, 5052, 5557, 6001, 6481, 6741, 7010] },
  { model: "Roadster 2", values: [0, 0, 0, 0, 0, 0, 0, 50, 99, 149, 164, 180, 194, 210, 218] },
  { model: "Cybertruck", values: [0, 0, 0, 0, 0, 0, 2, 189, 389, 623, 685, 754, 814, 879, 915] },
  { model: "Semi", values: [0, 0, 0, 0, 0, 0, 9, 732, 1508, 2413, 2654, 2920, 3154, 3406, 3542] },
];

export const totalGPAutomotive = [918, 1601, 2209, 4341, 4423, 7415, 9449, 12591, 15971, 18298, 19524, 20738, 21962, 23007, 23927];

// ─── Revenue & GP Energy & Other (in millions) ─────────────────────────────

export const energyOtherRevenue = [305, 649, 2117, 2946, 3757, 4433, 4965, 5362, 5684, 6025, 6387, 6770, 7176, 7607, 8063];

export const energyOtherGP = [6, -1, 14, -299, -354, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const energyOtherGrowthCases: Record<CaseType, number[]> = {
  best: [0.20, 0.14, 0.10, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08],
  base: [0.18, 0.12, 0.08, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06],
  worst: [0.16, 0.10, 0.06, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04],
};

export const energyOtherGPCases: Record<CaseType, number> = {
  best: 0.02,
  base: 0.00,
  worst: -0.02,
};

// ─── Opex Comparables ───────────────────────────────────────────────────────

export const opexComparables: OpexComparable[] = [
  { company: "GM", average: 0.152, adjAverage: 0.152 },
  { company: "Ford", average: 0.132, adjAverage: 0.132 },
  { company: "Fiat Chrysler", average: 0.093, adjAverage: 0.093 },
  { company: "BMW", average: 0.099, adjAverage: 0.099 },
  { company: "Volkswagen", average: 0.110, adjAverage: 0.110 },
  { company: "Jaguar", average: 0.371, adjAverage: null },
  { company: "Porsche", average: 0.307, adjAverage: 0.307 },
  { company: "Ferrari", average: 0.277, adjAverage: null },
  { company: "Scania", average: 0.150, adjAverage: 0.150 },
  { company: "MAN", average: 0.150, adjAverage: 0.150 },
  { company: "Paccar", average: 0.037, adjAverage: 0.037 },
];

export const opexPctCases: Record<CaseType, number> = {
  best: -0.1167,
  base: -0.1367,
  worst: -0.1567,
};

// ─── PP&E Data ──────────────────────────────────────────────────────────────

export const ppeData = {
  usefulLifeCapex: 10,
  usefulLifeHistorical: 10,
  beginningPPE: [3403, 5983, 10028, 11330, 10396, 11621, 12861, 14090, 15275, 16378, 17351, 18140, 18680, 18900],
  capex: [3527, 5681, 3204, 1220, 2516, 2813, 3113, 3410, 3697, 3964, 4199, 4390, 4521, 4574],
  depreciation: [-947, -1636, -1901, -2154, -1291, -1572, -1884, -2225, -2594, -2991, -3411, -3850, -4302, -4759],
  endingPPE: [5983, 10028, 11330, 10396, 11621, 12861, 14090, 15275, 16378, 17351, 18140, 18680, 18900, 18714],
};

export const ppeComparables: PPEComparable[] = [
  { company: "GM", capexPctPPE: -0.196, capexPctRev: -0.055 },
  { company: "Ford", capexPctPPE: -0.211, capexPctRev: -0.049 },
  { company: "Fiat Chrysler", capexPctPPE: -0.293, capexPctRev: -0.078 },
  { company: "BMW", capexPctPPE: -0.296, capexPctRev: -0.073 },
  { company: "Mercedes", capexPctPPE: -0.194, capexPctRev: -0.042 },
  { company: "Volkswagen", capexPctPPE: -0.215, capexPctRev: -0.056 },
  { company: "Jaguar", capexPctPPE: -0.245, capexPctRev: -0.066 },
  { company: "Ferrari", capexPctPPE: -0.329, capexPctRev: -0.093 },
  { company: "Paccar", capexPctPPE: -0.199, capexPctRev: -0.024 },
];

export const capexPctCases: Record<CaseType, { pctPPE: number; pctRev: number }> = {
  best: { pctPPE: 0.192, pctRev: 0.034 },
  base: { pctPPE: 0.242, pctRev: 0.064 },
  worst: { pctPPE: 0.292, pctRev: 0.094 },
};

// ─── Working Capital ────────────────────────────────────────────────────────

export const wcComparables: WCComparable[] = [
  { company: "GM", dso: 19.9, dio: 33.8, dpo: 68.4, netTradeCycle: -14.6 },
  { company: "Ford", dso: 25.9, dio: 30.0, dpo: 57.5, netTradeCycle: -1.7 },
  { company: "Fiat Chrysler", dso: 22.1, dio: 37.6, dpo: 83.5, netTradeCycle: -23.9 },
  { company: "BMW", dso: 8.7, dio: 66.4, dpo: 40.6, netTradeCycle: 34.5 },
  { company: "Volkswagen", dso: 25.6, dio: 82.7, dpo: 40.2, netTradeCycle: 68.0 },
  { company: "Ferrari", dso: 22.1, dio: 83.8, dpo: 142.0, netTradeCycle: -36.2 },
  { company: "Paccar", dso: 19.5, dio: 20.2, dpo: 55.9, netTradeCycle: -16.3 },
];

export const wcDays: Record<CaseType, { dso: number; dio: number; dpo: number }> = {
  best: { dso: 18.4, dio: 99.5, dpo: 91.3 },
  base: { dso: 18.4, dio: 99.5, dpo: 91.3 },
  worst: { dso: 18.4, dio: 99.5, dpo: 91.3 },
};

// ─── Financing ──────────────────────────────────────────────────────────────

export const financingData = {
  debtEquitySplit: { debt: 0.5, equity: 0.5 },
  bondYield: 0.04324,
  ltDebt: [2021, 5860, 9416, 9404, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634, 11634],
  interestExpense: [-119, -199, -471, -663, -685, -503, -503, -503, -503, -503, -503, -503, -503, -503, -503],
};

// ─── Delivery Comparables ───────────────────────────────────────────────────

export const deliveryComparables: DeliveryComparable[] = [
  { company: "GM", averageSales: 9600340 },
  { company: "Ford", averageSales: 6607000 },
  { company: "Fiat Chrysler", averageSales: 4740000 },
  { company: "BMW", averageSales: 2460000 },
  { company: "Volkswagen", averageSales: 10700000 },
];

// ─── P&L Output (in millions, 15 years) ────────────────────────────────────

export const plOutput: FinancialStatement[] = [
  { label: "Revenues", values: [4046, 7000, 11759, 21461, 24578, 37652, 49933, 67816, 87208, 99609, 106627, 113514, 120512, 126326, 131531], isBold: true, format: "currency" },
  { label: "Cost of sales", values: [-3123, -5401, -9536, -17419, -20509, -30237, -40484, -55225, -71236, -81311, -87103, -92776, -98550, -103319, -107604], format: "currency" },
  { label: "Gross profit", values: [924, 1599, 2222, 4042, 4069, 7415, 9449, 12591, 15971, 18298, 19524, 20738, 21962, 23007, 23927], isBold: true, format: "currency" },
  { label: "Operating expenses", values: [-1640, -2267, -3855, -4430, -4138, -5147, -6826, -9271, -11922, -13617, -14576, -15518, -16475, -17269, -17981], format: "currency" },
  { label: "EBIT", values: [-717, -667, -1632, -388, -69, 2268, 2623, 3320, 4050, 4681, 4948, 5220, 5487, 5737, 5946], isBold: true, format: "currency" },
  { label: "Interest expenses/income", values: [-159, -79, -577, -617, -596, -503, -503, -503, -503, -503, -503, -503, -503, -503, -503], format: "currency" },
  { label: "EBT", values: [-876, -746, -2209, -1005, -665, 1765, 2120, 2817, 3546, 4178, 4445, 4717, 4984, 5234, 5443], format: "currency" },
  { label: "Taxes", values: [-13, -27, -32, -58, -110, -371, -445, -592, -745, -877, -933, -991, -1047, -1099, -1143], format: "currency" },
  { label: "Minority interest", values: [0, 98, 279, 86, -87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], format: "currency" },
  { label: "Net Income", values: [-889, -675, -1961, -976, -862, 1394, 1674, 2226, 2802, 3301, 3512, 3726, 3937, 4135, 4300], isBold: true, format: "currency" },
];

// ─── Balance Sheet Output (in millions, 15 years) ──────────────────────────

export const bsOutput: FinancialStatement[] = [
  { label: "Cash", values: [1197, 3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161, 53875], format: "currency", assumption: "Cash flow sheet" },
  { label: "Restricted cash & securities", values: [23, 106, 155, 193, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246], format: "currency", assumption: "Stays flat" },
  { label: "Trade receivables", values: [169, 499, 515, 949, 1324, 1920, 2546, 3458, 4447, 5080, 5438, 5789, 6146, 6442, 6708], format: "currency", assumption: "WC sheet" },
  { label: "Inventory", values: [1278, 2067, 2264, 3113, 3552, 8353, 11184, 15257, 19680, 22463, 24063, 25631, 27226, 28543, 29727], format: "currency", assumption: "WC sheet" },
  { label: "Prepaid expenses", values: [116, 194, 268, 366, 713, 867, 1150, 1561, 2008, 2293, 2455, 2614, 2775, 2909, 3028], format: "currency", assumption: "% of revenues" },
  { label: "Operating lease vehicles", values: [1791, 3134, 4117, 2090, 3665, 3665, 3665, 3665, 3665, 3665, 3665, 3665, 3665, 3665, 3665], format: "currency", assumption: "Stays flat" },
  { label: "Solar energy systems", values: [0, 5920, 6347, 6271, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138, 6138], format: "currency", assumption: "Stays flat" },
  { label: "PP&E", values: [3403, 5983, 10028, 11330, 10396, 11621, 12861, 14090, 15275, 16378, 17351, 18140, 18680, 18900, 18714], format: "currency", assumption: "PP&E sheet" },
  { label: "Intangible assets", values: [13, 376, 362, 282, 339, 339, 339, 339, 339, 339, 339, 339, 339, 339, 339], format: "currency", assumption: "Stays flat" },
  { label: "Other assets", values: [78, 991, 1232, 1460, 1668, 2558, 3392, 4607, 5925, 6767, 7244, 7712, 8187, 8582, 8936], format: "currency", assumption: "% of revenues" },
  { label: "Total assets", values: [8068, 22664, 28655, 29740, 34309, 35707, 41522, 49362, 57723, 63370, 66939, 70273, 73402, 75764, 77501], isBold: true, format: "currency" },
  { label: "Accounts payable", values: [916, 1860, 2390, 3404, 3771, 7667, 10265, 14003, 18063, 20617, 22086, 23525, 24989, 26198, 27284], format: "currency", assumption: "WC sheet" },
  { label: "Accrued liabilities", values: [423, 1210, 1731, 2094, 2905, 4062, 5387, 7317, 9409, 10747, 11504, 12247, 13002, 13629, 14191], format: "currency", assumption: "% of revenues" },
  { label: "Deferred revenue", values: [424, 763, 1015, 630, 1163, 1444, 1915, 2600, 3344, 3819, 4088, 4353, 4621, 4844, 5043], format: "currency", assumption: "% of revenues" },
  { label: "Resale value guarantees", values: [137, 180, 787, 503, 317, 684, 907, 1232, 1584, 1809, 1937, 2062, 2189, 2295, 2389], format: "currency", assumption: "% of revenues" },
  { label: "Customer deposits", values: [283, 664, 854, 793, 726, 1251, 1660, 2254, 2898, 3311, 3544, 3773, 4005, 4198, 4371], format: "currency", assumption: "% of revenues" },
  { label: "Long-term debt", values: [2649, 6844, 10212, 11971, 13419, 13419, 13419, 13419, 13419, 13419, 13419, 13419, 13419, 13419, 13419], format: "currency", assumption: "Financing sheet" },
  { label: "Other liabilities", values: [2152, 5605, 6430, 4586, 4541, 7501, 9948, 13511, 17374, 19845, 21243, 22615, 24009, 25167, 26204], format: "currency", assumption: "% of revenues" },
  { label: "Total liabilities", values: [6984, 17126, 23421, 23982, 26842, 36029, 43501, 54335, 66091, 73567, 77821, 81993, 86234, 89750, 92903], isBold: true, format: "currency" },
  { label: "Equity", values: [1084, 5538, 5235, 5758, 7467, 8861, 10536, 12762, 15563, 18864, 22376, 26102, 30039, 34174, 38474], isBold: true, format: "currency" },
  { label: "Total liabilities & equity", values: [8068, 22664, 28655, 29740, 34309, 44890, 54036, 67097, 81654, 92431, 100197, 108095, 116273, 123925, 131377], isBold: true, format: "currency" },
];

// ─── Cash Flow Output (in millions, 15 years starting from 2016) ────────────

export const cfOutput: FinancialStatement[] = [
  { label: "EBIT", values: [-667, -1632, -388, -69, 2268, 2623, 3320, 4050, 4681, 4948, 5220, 5487, 5737, 5946], isBold: true, format: "currency" },
  { label: "Operating taxes (21%)", values: [-27, -32, -58, -110, -476, -551, -697, -850, -983, -1039, -1096, -1152, -1205, -1249], format: "currency" },
  { label: "NOPAT", values: [-694, -1664, -446, -179, 1792, 2072, 2623, 3199, 3698, 3909, 4124, 4335, 4532, 4697], isBold: true, format: "currency" },
  { label: "Add-back D&A", values: [947, 1636, 1901, 2154, 1291, 1572, 1884, 2225, 2594, 2991, 3411, 3850, 4302, 4759], format: "currency" },
  { label: "Gross Cash Flow", values: [253, -28, 1455, 1975, 3083, 3644, 4507, 5424, 6293, 6900, 7535, 8185, 8834, 9457], isBold: true, format: "currency" },
  { label: "∆ Trade receivables", values: [-330, -16, -434, -375, -596, -626, -912, -989, -632, -358, -351, -357, -296, -265], format: "currency", indent: 1 },
  { label: "∆ Inventory", values: [-790, -196, -850, -439, -4801, -2831, -4072, -4423, -2783, -1600, -1567, -1595, -1317, -1184], format: "currency", indent: 1 },
  { label: "∆ Accounts payable", values: [944, 530, 1014, 367, 3896, 2598, 3738, 4060, 2555, 1469, 1439, 1464, 1209, 1086], format: "currency", indent: 1 },
  { label: "Investments in WC", values: [-176, 318, -269, -447, -1502, -859, -1247, -1352, -861, -489, -480, -488, -405, -363], isBold: true, format: "currency" },
  { label: "Capex", values: [-3527, -5681, -3204, -1220, -2516, -2813, -3113, -3410, -3697, -3964, -4199, -4390, -4521, -4574], format: "currency" },
  { label: "∆ Other assets", values: [-8700, -1760, 1820, -2108, -1044, -1117, -1627, -1764, -1128, -638, -626, -637, -529, -473], format: "currency" },
  { label: "∆ Other liabilities", values: [5002, 2397, -2212, 1046, 5291, 4874, 7097, 7696, 4922, 2785, 2733, 2777, 2307, 2066], format: "currency" },
  { label: "Unlevered Free Cash Flow", values: [-7147, -4753, -2410, -754, 3312, 3729, 5618, 6593, 5528, 4593, 4962, 5447, 5687, 6112], isBold: true, format: "currency" },
  { label: "Interest expenses", values: [-79, -577, -617, -596, -503, -503, -503, -503, -503, -503, -503, -503, -503, -503], format: "currency" },
  { label: "∆ Financial liabilities", values: [4195, 3368, 1759, 1448, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], format: "currency" },
  { label: "∆ Equity movements", values: [5129, 1658, 1499, 2571, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], format: "currency" },
  { label: "Tax adjustment", values: [0, 0, 0, 0, 106, 106, 106, 106, 106, 106, 106, 106, 106, 106], format: "currency" },
  { label: "Minority interest", values: [98, 279, 86, -87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], format: "currency" },
  { label: "Net Cash Flow", values: [2196, -25, 318, 2582, 2915, 3332, 5221, 6196, 5131, 4196, 4564, 5050, 5290, 5715], isBold: true, format: "currency" },
  { label: "Opening cash", values: [1197, 3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161], format: "currency" },
  { label: "Closing cash", values: [3393, 3368, 3686, 6268, 9183, 12515, 17735, 23931, 29062, 33257, 37822, 42871, 48161, 53875], isBold: true, format: "currency" },
];

// ─── UFCF for DCF (2020-2029 forecast period, in millions) ─────────────────

export const ufcfForDCF = [3312, 3729, 5618, 6593, 5528, 4593, 4962, 5447, 5687, 6112];
