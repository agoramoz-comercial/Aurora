/**
 * businessPlanEngine.ts
 *
 * Institutional Business Plan & Strategic Intelligence Engine based on McKinsey 7S,
 * KPMG Audit Risk Framework, WPP Brand & GTM Analytics, and 5-Year Financial Modeling.
 */

import { runSystemicFinancialModel, type ModelDrivers, type FinancialYearReport, type ValuationOutput } from "./excelModelEngine";

export interface UnitEconomics {
  cac: number; // Customer Acquisition Cost ($)
  ltv: number; // Lifetime Value ($)
  ltvCacRatio: number; // LTV / CAC
  paybackMonths: number; // Months to recover CAC
  arpu: number; // Average Revenue Per User / Customer ($)
  annualChurnPct: number; // Annual Customer Churn %
}

export interface BreakEvenAnalysis {
  fixedCosts: number;
  variableCostRatio: number; // Variable cost as % of revenue
  contributionMarginRatio: number; // 1 - variableCostRatio
  breakEvenRevenue: number;
  breakEvenUnits: number;
  marginOfSafetyPct: number;
}

export interface FundingRound {
  roundName: string; // e.g. "Series Seed", "Series A"
  targetYear: number;
  capitalAmount: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  investorEquityPct: number;
  useOfFunds: { category: string; percentage: number }[];
}

export interface Mckinsey7SFramework {
  strategy: string;
  structure: string;
  systems: string;
  sharedValues: string;
  style: string;
  staff: string;
  skills: string;
  alignmentScore: number; // 0 - 100
}

export interface KpmgRiskAssessment {
  riskCategory: "Financial" | "Operational" | "Regulatory" | "Strategic";
  riskDescription: string;
  impactLevel: "High" | "Medium" | "Low";
  likelihood: "High" | "Medium" | "Low";
  mitigationStrategy: string;
  auditStatus: "Compliant" | "Monitoring" | "Action Required";
}

export interface BusinessPlanPackage {
  companyName: string;
  ticker: string;
  sector: string;
  executiveSummary: string;
  unitEconomics: UnitEconomics;
  breakEven: BreakEvenAnalysis;
  fundingRoadmap: FundingRound[];
  runwayMonths: number;
  mckinsey7s: Mckinsey7SFramework;
  kpmgRisks: KpmgRiskAssessment[];
  reports: FinancialYearReport[];
  valuation: ValuationOutput;
}

export function generateBusinessPlanPackage(
  drivers: ModelDrivers,
  customUnitEconomics?: Partial<UnitEconomics>
): BusinessPlanPackage {
  const model = runSystemicFinancialModel(drivers);
  const reports = model.reports;
  const valuation = model.valuation;
  const firstYear = reports[0]!;
  const lastYear = reports[reports.length - 1]!;

  // 1. Unit Economics Calculations
  const defaultCac = customUnitEconomics?.cac ?? Math.round(drivers.averageUnitPrice * 0.12);
  const defaultArpu = customUnitEconomics?.arpu ?? Math.round(drivers.averageUnitPrice * 0.35);
  const defaultChurn = customUnitEconomics?.annualChurnPct ?? 0.08;
  const grossMargin = drivers.grossMarginPct;

  const defaultLtv = customUnitEconomics?.ltv ?? Math.round((defaultArpu * grossMargin) / Math.max(0.01, defaultChurn));
  const ltvCacRatio = Math.round((defaultLtv / Math.max(1, defaultCac)) * 10) / 10;
  const paybackMonths = Math.round(((defaultCac / Math.max(1, defaultArpu * grossMargin)) * 12) * 10) / 10;

  const unitEconomics: UnitEconomics = {
    cac: defaultCac,
    ltv: defaultLtv,
    ltvCacRatio,
    paybackMonths,
    arpu: defaultArpu,
    annualChurnPct: defaultChurn,
  };

  // 2. Break-Even Calculations
  const fixedCosts = firstYear.sgaOpex + firstYear.rdOpex + firstYear.depreciation;
  const variableCostRatio = firstYear.totalRevenue > 0 ? firstYear.totalCogs / firstYear.totalRevenue : 0.7;
  const contributionMarginRatio = 1 - variableCostRatio;
  const breakEvenRevenue = contributionMarginRatio > 0 ? Math.round(fixedCosts / contributionMarginRatio) : firstYear.totalRevenue;
  const breakEvenUnits = Math.round(breakEvenRevenue / Math.max(1, drivers.averageUnitPrice));
  const marginOfSafetyPct = firstYear.totalRevenue > 0
    ? Math.round(((firstYear.totalRevenue - breakEvenRevenue) / firstYear.totalRevenue) * 1000) / 10
    : 0;

  const breakEven: BreakEvenAnalysis = {
    fixedCosts: Math.round(fixedCosts),
    variableCostRatio: Math.round(variableCostRatio * 1000) / 1000,
    contributionMarginRatio: Math.round(contributionMarginRatio * 1000) / 1000,
    breakEvenRevenue,
    breakEvenUnits,
    marginOfSafetyPct,
  };

  // 3. Capital & Funding Roadmap
  const fundingRoadmap: FundingRound[] = [
    {
      roundName: "Series Seed / Strategic Anchor",
      targetYear: 2025,
      capitalAmount: Math.round(drivers.initialEquity * 0.25),
      preMoneyValuation: Math.round(valuation.impliedEquityValueGordon * 0.65),
      postMoneyValuation: Math.round(valuation.impliedEquityValueGordon * 0.65 + drivers.initialEquity * 0.25),
      investorEquityPct: 15.0,
      useOfFunds: [
        { category: "Product R&D & AI Engineering", percentage: 40 },
        { category: "Go-to-Market & Sales Expansion", percentage: 35 },
        { category: "Working Capital Reserve", percentage: 25 },
      ],
    },
    {
      roundName: "Series A Institutional Growth",
      targetYear: 2027,
      capitalAmount: Math.round(drivers.initialEquity * 0.60),
      preMoneyValuation: Math.round(valuation.impliedEquityValueGordon * 0.85),
      postMoneyValuation: Math.round(valuation.impliedEquityValueGordon * 0.85 + drivers.initialEquity * 0.60),
      investorEquityPct: 18.5,
      useOfFunds: [
        { category: "Global Channel Expansion", percentage: 45 },
        { category: "Infrastructure & PP&E Scale", percentage: 35 },
        { category: "Strategic M&A & IP Acquisition", percentage: 20 },
      ],
    },
  ];

  // Cash Runway in months (Monthly Burn = Total Opex / 12)
  const monthlyOpex = firstYear.totalOpex / 12;
  const runwayMonths = Math.min(60, Math.round(drivers.initialCash / Math.max(1, monthlyOpex)));

  // 4. McKinsey 7S Framework
  const mckinsey7s: Mckinsey7SFramework = {
    strategy: `Market dominance in ${drivers.sector} through premium pricing, product innovation, and expanding recurring service revenue.`,
    structure: "Agile product-led organizational matrix with decentralized regional business units.",
    systems: "Automated real-time ERP, systemic financial statement validation, and continuous AI risk analytics.",
    sharedValues: "Uncompromising engineering quality, customer obsession, and sustainable long-term value creation.",
    style: "Data-driven, collaborative leadership with fast decision-making cycles.",
    staff: "High-density technical engineering talent and enterprise sales executives.",
    skills: "Deep domain financial engineering, multi-sector operational modeling, and AI analytical intelligence.",
    alignmentScore: 94.5,
  };

  // 5. KPMG Audit Risk Assessment
  const kpmgRisks: KpmgRiskAssessment[] = [
    {
      riskCategory: "Financial",
      riskDescription: "Interest rate volatility impacting cost of debt and WACC discount rate assumptions.",
      impactLevel: "Medium",
      likelihood: "Medium",
      mitigationStrategy: "Maintain fixed-rate long-term debt structure and minimum cash buffer of 15% of annual revenue.",
      auditStatus: "Compliant",
    },
    {
      riskCategory: "Operational",
      riskDescription: "Supply chain bottlenecks for primary component sourcing and manufacturing capacity limits.",
      impactLevel: "High",
      likelihood: "Low",
      mitigationStrategy: "Dual-sourcing supplier contracts and buffer inventory targets aligned with DIO metrics.",
      auditStatus: "Compliant",
    },
    {
      riskCategory: "Regulatory",
      riskDescription: "Evolving cross-border ESG disclosure requirements and SEC XBRL filing standards.",
      impactLevel: "Medium",
      likelihood: "Medium",
      mitigationStrategy: "Automated compliance checks integrated into systemic reporting engine.",
      auditStatus: "Monitoring",
    },
    {
      riskCategory: "Strategic",
      riskDescription: "Aggressive pricing pressure from legacy competitors in key expansion markets.",
      impactLevel: "High",
      likelihood: "Medium",
      mitigationStrategy: "Defend margins via proprietary software/service bundles with high customer switching costs.",
      auditStatus: "Compliant",
    },
  ];

  const executiveSummary = `Comprehensive Business Plan for ${drivers.companyName} (${drivers.ticker}). Demonstrates a highly scalable business model in ${drivers.sector} with $${(lastYear.totalRevenue / 1e9).toFixed(2)}B projected 5-year revenue, an LTV/CAC ratio of ${ltvCacRatio}x, and $${(valuation.dcfEnterpriseValueGordon / 1e9).toFixed(2)}B implied enterprise value.`;

  return {
    companyName: drivers.companyName,
    ticker: drivers.ticker,
    sector: drivers.sector,
    executiveSummary,
    unitEconomics,
    breakEven,
    fundingRoadmap,
    runwayMonths,
    mckinsey7s,
    kpmgRisks,
    reports,
    valuation,
  };
}
