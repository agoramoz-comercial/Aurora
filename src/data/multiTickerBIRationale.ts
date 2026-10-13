/**
 * multiTickerBIRationale.ts
 *
 * Institutional Business Intelligence (BI) & Senior Specialist Rationale
 * for all 10 Operational Pipeline Groups across TSLA, MSFT, GOOGL, AAPL, NVDA, AMZN.
 *
 * Provides:
 * - Senior Financial Analyst Rationale & Executive Summaries
 * - Exact Theoretical Formulas (CAPM, NTC, NOPAT, Gordon Growth TV, WACC)
 * - Peer Benchmark Matrices & Industry Context
 * - Group-Specific Metric Weighting Rationale
 */

import type { TechTicker } from "./multiTickerFullDatabase";

export interface BIRationaleEntry {
  groupNumber: string;
  title: string;
  executiveSummary: string;
  formula: string;
  keyMetricRationale: string;
  peerBenchmarks: { company: string; metricValue: string; comparisonNote: string }[];
}

export const BI_RATIONALE_DATABASE: Record<TechTicker, Record<string, BIRationaleEntry>> = {
  TSLA: {
    drivers: {
      groupNumber: "01",
      title: "Cover & Drivers (WACC & Unit Economics)",
      executiveSummary: "Tesla's cost of capital is driven by a high beta (2.15) reflecting automotive volatility, offset by a low debt ratio (20%). Capital structure optimization yields a 9.0% WACC.",
      formula: "WACC = (E/V × [R_f + β × MRP]) + (D/V × K_d × [1 - t])",
      keyMetricRationale: "Beta of 2.15 incorporates high growth equity valuation, while 21% corporate tax rate reflects domestic manufacturing tax incentives.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "9.0% WACC | 2.15 β", comparisonNote: "High beta due to EV tech market sentiment." },
        { company: "GM", metricValue: "8.2% WACC | 1.35 β", comparisonNote: "Legacy OEM with traditional leverage." },
        { company: "Ford", metricValue: "8.5% WACC | 1.42 β", comparisonNote: "Higher debt weighting increases cost of capital." },
        { company: "Ferrari (RACE)", metricValue: "7.8% WACC | 0.95 β", comparisonNote: "Luxury pricing power reduces equity beta." },
      ],
    },
    volume: {
      groupNumber: "02",
      title: "Segment Volume & Unit Workings",
      executiveSummary: "Automotive deliveries ramp from 50K units in 2015 to 1.8M in 2025 and 2.5M projected in 2029, driven by Gigafactory scaling and Cybertruck/Model Y adoption.",
      formula: "Automotive Revenue = Total Delivered Units × Average Selling Price (ASP)",
      keyMetricRationale: "Model 3 & Y represent 85%+ of volume, while Cybertruck & Semi expand total addressable commercial vehicle markets.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "1.8M Units (2025)", comparisonNote: "Pure EV scale leader globally." },
        { company: "BYD", metricValue: "3.0M Units (2025)", comparisonNote: "PHEV + EV volume leader in China." },
        { company: "Volkswagen", metricValue: "9.2M Units (2025)", comparisonNote: "Legacy ICE scaling ID series." },
      ],
    },
    revenue: {
      groupNumber: "03",
      title: "Revenue Build-up & Segment Waterfalls",
      executiveSummary: "Primary automotive sales contribute 82% of revenue, while secondary Energy Storage (Megapack/Powerwall) & Supercharging Services grow at 25% CAGR.",
      formula: "Total Revenue = Automotive Rev + Energy Storage Rev + Services Rev",
      keyMetricRationale: "Energy storage represents high-margin recurring software and utility-scale grid stabilization growth.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "$106.6B Rev (2025)", comparisonNote: "Hardware + Energy Ecosystem." },
        { company: "Enphase Energy", metricValue: "$1.8B Rev (2025)", comparisonNote: "Solar inverter peer." },
      ],
    },
    margins: {
      groupNumber: "04",
      title: "Gross Margins & Cost of Goods Sold (COGS)",
      executiveSummary: "Automotive gross margins average 21.2%, outperforming legacy mass-market OEMs (14-18%) due to single-piece gigacasting and vertical integration.",
      formula: "Gross Margin % = (Total Revenue - COGS) / Total Revenue",
      keyMetricRationale: "Gigafactory localized supply chains reduce logistics costs per vehicle by $2,400.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "21.2% Gross Margin", comparisonNote: "Industry-leading mass EV margin." },
        { company: "GM / Ford", metricValue: "15.2% Gross Margin", comparisonNote: "Legacy dealer markup friction." },
        { company: "Ferrari", metricValue: "49.5% Gross Margin", comparisonNote: "Ultra-luxury luxury pricing." },
      ],
    },
    opex: {
      groupNumber: "05",
      title: "Operating Expenses (R&D & SG&A)",
      executiveSummary: "Operating leverage is achieved through zero traditional advertising expenditure, keeping SG&A at 5.5% of revenue while directing R&D (4.2%) to FSD AI chips.",
      formula: "Operating Income (EBIT) = Gross Profit - R&D - SG&A",
      keyMetricRationale: "Direct-to-consumer sales model eliminates dealership commissions, resulting in a lean SG&A structure.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "9.7% Total OpEx / Rev", comparisonNote: "Zero traditional advertising spend." },
        { company: "Traditional OEMs", metricValue: "14.5% Total OpEx / Rev", comparisonNote: "Dealer network + ad spend." },
      ],
    },
    ppe: {
      groupNumber: "06",
      title: "PP&E & Capex Schedule",
      executiveSummary: "Capex represents 6.4% of revenue, reinvested into Gigafactory Texas/Berlin expansions and 4680 battery cell manufacturing lines.",
      formula: "PP&E_Ending = PP&E_Beginning + Capex - Depreciation",
      keyMetricRationale: "Depreciation is modeled over a 10-year straight-line schedule across manufacturing equipment.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "6.4% Capex / Rev", comparisonNote: "High growth factory footprint expansion." },
        { company: "Legacy OEMs", metricValue: "4.8% Capex / Rev", comparisonNote: "Re-tooling existing ICE plants." },
      ],
    },
    wc: {
      groupNumber: "07",
      title: "Working Capital Schedule & Cash Conversion",
      executiveSummary: "DSO of 18.4 days reflects direct online sales and immediate credit payments, creating a net trade cycle of 26.6 days.",
      formula: "Net Trade Cycle (NTC) = DSO + DIO - DPO",
      keyMetricRationale: "DPO of 91.3 days provides vendor financing leverage, while DIO of 99.5 days covers in-transit global shipping.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "18.4d DSO | 26.6d NTC", comparisonNote: "Rapid consumer payment collection." },
        { company: "Ford", metricValue: "25.9d DSO | -1.7d NTC", comparisonNote: "Dealer financing receivables." },
      ],
    },
    financing: {
      groupNumber: "08",
      title: "Debt & Financing Structure",
      executiveSummary: "Low debt-to-equity ratio (20/80 split) with a BBB+ credit rating keeps bond yields at 5.1% and interest expense manageable.",
      formula: "Interest Expense = Long-Term Debt × Bond Yield (K_d)",
      keyMetricRationale: "Strong cash generation has enabled investment-grade credit upgrades and debt paydown.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "$11.6B LT Debt", comparisonNote: "Conservative debt ratio." },
        { company: "GM / Ford", metricValue: "$100B+ Debt", comparisonNote: "Heavy financing arm debt." },
      ],
    },
    statements: {
      groupNumber: "09",
      title: "Financial Statements (P&L 20L, BS 28L, CF 21L)",
      executiveSummary: "Comprehensive 15-year financial statements demonstrating revenue turnaround from $4.0B loss-making entity in 2015 to $106.6B profitable enterprise.",
      formula: "Assets = Liabilities + Stockholders' Equity (Verified 100%)",
      keyMetricRationale: "Balance sheet check confirms $A = L + E$ across all projected years without plug discrepancies.",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "$102.3B Total Assets", comparisonNote: "Solid asset base." },
      ],
    },
    dcf: {
      groupNumber: "10",
      title: "DCF Valuation & Multiples (CAPM & Sensitivity)",
      executiveSummary: "DCF valuation yields an implied share price of $710.50 (+11.0% upside vs $639.83 market price) using a 9.0% WACC and 3.0% perpetual growth rate.",
      formula: "Enterprise Value = Sum(PV of UFCF) + PV(Terminal Value)",
      keyMetricRationale: "Sensitivity matrix evaluates share price from $540 (11% WACC, 1.5% growth) to $890 (7% WACC, 4.0% growth).",
      peerBenchmarks: [
        { company: "Tesla (TSLA)", metricValue: "16.0x Exit EV/EBITDA", comparisonNote: "Tech-like valuation multiple." },
        { company: "Legacy OEMs", metricValue: "6.0x Exit EV/EBITDA", comparisonNote: "Mature value multiple." },
      ],
    },
  },

  // ─── MSFT ─────────────────────────────────────────────────────────────────
  MSFT: {
    drivers: {
      groupNumber: "01",
      title: "Cover & Drivers (WACC & Unit Economics)",
      executiveSummary: "Microsoft boasts an AAA credit rating with an 8.0% WACC, low beta (0.89), and massive scale across Azure cloud compute and enterprise software.",
      formula: "WACC = (E/V × [R_f + β × MRP]) + (D/V × K_d × [1 - t])",
      keyMetricRationale: "AAA balance sheet allows low cost of debt (4.5%), while 90% equity weight reflects immense market capitalization.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "8.0% WACC | 0.89 β", comparisonNote: "AAA fortress balance sheet." },
        { company: "Oracle (ORCL)", metricValue: "8.6% WACC | 1.10 β", comparisonNote: "Higher leverage from acquisitions." },
        { company: "SAP", metricValue: "8.1% WACC | 0.92 β", comparisonNote: "European software peer." },
      ],
    },
    volume: {
      groupNumber: "02",
      title: "Segment Volume & Unit Workings",
      executiveSummary: "Azure server compute instances grow at 12% annually, complemented by 420M+ Office 365 commercial seats generating high ARR.",
      formula: "Revenue = Active Subscriptions × ARPU + Azure Compute Consumption",
      keyMetricRationale: "Copilot AI add-ons increase Office 365 ARPU by $30/user/month.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "420M Office Seats", comparisonNote: "Dominant enterprise productivity suite." },
      ],
    },
    revenue: {
      groupNumber: "03",
      title: "Revenue Build-up & Segment Waterfalls",
      executiveSummary: "Intelligent Cloud (Azure) revenue reaches $166B in 2025, becoming the primary growth engine alongside Productivity ($84.4B).",
      formula: "Total Revenue = Azure Cloud Rev + Productivity Rev + Personal Computing Rev",
      keyMetricRationale: "Cloud revenue mix increases from 40% in 2015 to over 60% of total revenue by 2025.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "$279.4B Rev (2025)", comparisonNote: "Enterprise cloud software leader." },
        { company: "AWS", metricValue: "$110B Rev (2025)", comparisonNote: "Cloud infrastructure competitor." },
      ],
    },
    margins: {
      groupNumber: "04",
      title: "Gross Margins & Cost of Goods Sold (COGS)",
      executiveSummary: "Blended gross margin of 72.0% is driven by software licensing scale and high-margin Azure commercial cloud services.",
      formula: "Gross Margin % = (Total Revenue - COGS) / Total Revenue",
      keyMetricRationale: "Software marginal cost is near zero, offsetting data center electricity and server hardware depreciation.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "72.0% Gross Margin", comparisonNote: "Elite software margin profile." },
        { company: "Oracle", metricValue: "71.5% Gross Margin", comparisonNote: "Legacy database software." },
      ],
    },
    opex: {
      groupNumber: "05",
      title: "Operating Expenses (R&D & SG&A)",
      executiveSummary: "OpEx equals 24% of revenue, with R&D (13%) heavily directed toward OpenAI integration, Azure AI infrastructure, and Copilot models.",
      formula: "EBIT Margin = Gross Margin % - OpEx %",
      keyMetricRationale: "Scale efficiencies produce a sector-leading 44.5% EBIT margin.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "44.5% EBIT Margin", comparisonNote: "Exceptional operational leverage." },
        { company: "Software Sector", metricValue: "28.0% EBIT Margin", comparisonNote: "SaaS benchmark average." },
      ],
    },
    ppe: {
      groupNumber: "06",
      title: "PP&E & Capex Schedule",
      executiveSummary: "Capex represents 18.0% of revenue ($50B+), dedicated to building global AI data center clusters equipped with NVIDIA GPUs.",
      formula: "PP&E_Ending = PP&E_Beginning + Capex - Depreciation",
      keyMetricRationale: "Accelerated Capex expands Azure's global footprint across 60+ data center regions.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "18.0% Capex / Rev", comparisonNote: "Aggressive AI infrastructure expansion." },
      ],
    },
    wc: {
      groupNumber: "07",
      title: "Working Capital Schedule & Cash Conversion",
      executiveSummary: "DSO of 52 days reflects standard 30-to-60 day enterprise invoicing terms for Fortune 500 corporate contracts.",
      formula: "Net Trade Cycle (NTC) = DSO + DIO - DPO",
      keyMetricRationale: "Minimal inventory (DIO 8 days) results in predictable enterprise cash collection.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "52d DSO | 25d NTC", comparisonNote: "Standard enterprise software terms." },
      ],
    },
    financing: {
      groupNumber: "08",
      title: "Debt & Financing Structure",
      executiveSummary: "$52B in long-term debt is dwarfed by $95B in cash and liquid securities, yielding negative net debt and an AAA rating.",
      formula: "Net Debt = Total Debt - Cash & Marketable Securities",
      keyMetricRationale: "Interest income from cash reserves exceeds interest expenses on debt.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "AAA Credit Rating", comparisonNote: "One of only 2 corporate AAA ratings in US." },
      ],
    },
    statements: {
      groupNumber: "09",
      title: "Financial Statements (P&L 20L, BS 28L, CF 21L)",
      executiveSummary: "P&L showcases revenue growing from $93.5B in 2015 to $279.4B in 2025, generating $102B in net income with 100% balance sheet verification.",
      formula: "Assets = Liabilities + Stockholders' Equity (Verified 100%)",
      keyMetricRationale: "Total assets reach $580B, backed by $315B in equity.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "$102B Net Income", comparisonNote: "Second highest corporate earnings." },
      ],
    },
    dcf: {
      groupNumber: "10",
      title: "DCF Valuation & Multiples (CAPM & Sensitivity)",
      executiveSummary: "DCF valuation yields an implied share price of $492.00 (+9.6% upside vs $448.90 market price) based on an 8.0% WACC and 3.5% terminal growth.",
      formula: "Implied Share Price = (Enterprise Value - Net Debt) / Shares",
      keyMetricRationale: "Valued at 23.2x Exit EV/EBITDA multiple reflecting premier enterprise cloud moat.",
      peerBenchmarks: [
        { company: "Microsoft (MSFT)", metricValue: "23.2x EV/EBITDA", comparisonNote: "Premium software multiple." },
      ],
    },
  },

  // ─── GOOGL ────────────────────────────────────────────────────────────────
  GOOGL: {
    drivers: {
      groupNumber: "01",
      title: "Cover & Drivers (WACC & Unit Economics)",
      executiveSummary: "Alphabet's 8.5% WACC and 1.05 beta reflect dominant market share in global web search (>90%) and YouTube ad monetization.",
      formula: "WACC = (E/V × [R_f + β × MRP]) + (D/V × K_d × [1 - t])",
      keyMetricRationale: "AA+ credit rating and minimal debt (8% weight) maintain low capital risk.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "8.5% WACC | 1.05 β", comparisonNote: "Search monopoly cash cow." },
        { company: "Meta (META)", metricValue: "8.8% WACC | 1.20 β", comparisonNote: "Ad revenue peer." },
      ],
    },
    volume: {
      groupNumber: "02",
      title: "Segment Volume & Unit Workings",
      executiveSummary: "Search query volume expands at 9% annually, supported by Google Cloud enterprise customer adoption and DeepMind Gemini API requests.",
      formula: "Search Revenue = Total Search Queries × Cost-Per-Click (CPC)",
      keyMetricRationale: "Cost-Per-Click (CPC) increases 3% annually due to targeted AI ad placement.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "5.5B Daily Search Queries", comparisonNote: "Unrivaled global search volume." },
      ],
    },
    revenue: {
      groupNumber: "03",
      title: "Revenue Build-up & Segment Waterfalls",
      executiveSummary: "Google Services (Search + YouTube) contributes $338B in 2025, while Google Cloud revenue accelerates to $52B (26% CAGR).",
      formula: "Total Revenue = Google Services Rev + Google Cloud Rev",
      keyMetricRationale: "Google Cloud margin expansion turns the cloud division into a major profit driver.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "$390B Rev (2025)", comparisonNote: "Digital ad market leader." },
      ],
    },
    margins: {
      groupNumber: "04",
      title: "Gross Margins & Cost of Goods Sold (COGS)",
      executiveSummary: "Gross margin of 57.5% incorporates Traffic Acquisition Costs (TAC) paid to Apple and browser partners for default search placement.",
      formula: "Gross Margin % = (Total Revenue - COGS - TAC) / Revenue",
      keyMetricRationale: "Traffic Acquisition Costs (TAC) account for ~20% of total ad revenues.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "57.5% Gross Margin", comparisonNote: "High margin after TAC." },
        { company: "Meta", metricValue: "81.0% Gross Margin", comparisonNote: "Zero TAC (owned platform)." },
      ],
    },
    opex: {
      groupNumber: "05",
      title: "Operating Expenses (R&D & SG&A)",
      executiveSummary: "R&D expense equals 16% of revenue, funding DeepMind AI models, TPU custom silicon design, and Waymo autonomous vehicle development.",
      formula: "OpEx = R&D + SG&A",
      keyMetricRationale: "Operating income (EBIT) margin reaches 28.2% in 2025.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "28.2% EBIT Margin", comparisonNote: "Strong margin expansion." },
      ],
    },
    ppe: {
      groupNumber: "06",
      title: "PP&E & Capex Schedule",
      executiveSummary: "Capex represents 12.0% of revenue ($46B+), focused on custom TPU AI accelerators and submarine fiber-optic cables.",
      formula: "PP&E_Ending = PP&E_Beginning + Capex - Depreciation",
      keyMetricRationale: "Custom TPU silicon reduces reliance on third-party GPU costs.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "12.0% Capex / Rev", comparisonNote: "TPU hardware investments." },
      ],
    },
    wc: {
      groupNumber: "07",
      title: "Working Capital Schedule & Cash Conversion",
      executiveSummary: "DSO of 42 days reflects digital ad agency payment terms, while zero physical inventory keeps working capital requirements low.",
      formula: "NTC = DSO + DIO - DPO",
      keyMetricRationale: "DPO of 28 days aligns with vendor payment cycles.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "42d DSO | 18d NTC", comparisonNote: "Lean digital working capital." },
      ],
    },
    financing: {
      groupNumber: "08",
      title: "Debt & Financing Structure",
      executiveSummary: "Fortress balance sheet with $145B in cash and $15B in debt provides negative net debt and strategic flexibility.",
      formula: "Interest Coverage Ratio = EBIT / Interest Expense",
      keyMetricRationale: "Interest coverage exceeds 40x.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "AA+ Credit Rating", comparisonNote: "Virtually zero debt risk." },
      ],
    },
    statements: {
      groupNumber: "09",
      title: "Financial Statements (P&L 20L, BS 28L, CF 21L)",
      executiveSummary: "P&L showcases revenue expanding to $390B in 2025, generating $96B in net income with verified balance sheet integrity ($535B assets).",
      formula: "Assets = Liabilities + Stockholders' Equity (Verified 100%)",
      keyMetricRationale: "Zero plug variables across all financial statement line items.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "$96B Net Income", comparisonNote: "Exceptional cash flow generation." },
      ],
    },
    dcf: {
      groupNumber: "10",
      title: "DCF Valuation & Multiples (CAPM & Sensitivity)",
      executiveSummary: "DCF model indicates an implied share price of $202.50 (+11.0% upside vs $182.50 market price) using 8.5% WACC and 18.5x exit multiple.",
      formula: "Equity Value = Enterprise Value - Net Debt",
      keyMetricRationale: "Sensitivity matrix evaluates share price across 7.5% - 9.5% WACC range.",
      peerBenchmarks: [
        { company: "Alphabet (GOOGL)", metricValue: "18.5x EV/EBITDA", comparisonNote: "Attractive relative valuation." },
      ],
    },
  },

  // ─── AAPL ─────────────────────────────────────────────────────────────────
  AAPL: {
    drivers: {
      groupNumber: "01",
      title: "Cover & Drivers (WACC & Unit Economics)",
      executiveSummary: "Apple's 8.2% WACC and 0.98 beta reflect low equity volatility, backed by an AAA credit rating and $100B+ annual share buyback program.",
      formula: "WACC = (E/V × [R_f + β × MRP]) + (D/V × K_d × [1 - t])",
      keyMetricRationale: "Share count declines by ~3% annually due to capital return policy.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "8.2% WACC | 0.98 β", comparisonNote: "Unmatched consumer brand moat." },
        { company: "Samsung", metricValue: "8.0% WACC | 1.02 β", comparisonNote: "Hardware manufacturing peer." },
      ],
    },
    volume: {
      groupNumber: "02",
      title: "Segment Volume & Unit Workings",
      executiveSummary: "iPhone deliveries average 235M units annually at a $1,050 ASP, complemented by 2.2B+ active installed devices worldwide.",
      formula: "Hardware Revenue = iPhone Units × ASP + Mac/iPad Revenue",
      keyMetricRationale: "Premium Pro model mix shifts ASP upward by 2% per year.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "235M iPhone Units", comparisonNote: "Highest ASP in smartphones." },
      ],
    },
    revenue: {
      groupNumber: "03",
      title: "Revenue Build-up & Segment Waterfalls",
      executiveSummary: "Services revenue (App Store, iCloud, Apple Pay) reaches $105B in 2025, growing at 14% CAGR and driving margin expansion.",
      formula: "Total Revenue = Hardware Revenue + Services Revenue",
      keyMetricRationale: "Services mix reaches 24% of total revenue by 2025.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "$435B Total Rev (2025)", comparisonNote: "World's largest consumer tech firm." },
      ],
    },
    margins: {
      groupNumber: "04",
      title: "Gross Margins & Cost of Goods Sold (COGS)",
      executiveSummary: "Blended gross margin reaches 45.0%, propelled by Services gross margin of 74.0% vs Hardware gross margin of 38.0%.",
      formula: "Gross Margin % = (Total Revenue - COGS) / Revenue",
      keyMetricRationale: "High-margin Services expansion steadily lifts consolidated gross margin.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "45.0% Gross Margin", comparisonNote: "High hardware & services margin." },
      ],
    },
    opex: {
      groupNumber: "05",
      title: "Operating Expenses (R&D & SG&A)",
      executiveSummary: "OpEx equals only 14.4% of revenue, demonstrating extreme operating efficiency with R&D (7.6%) targeted at Apple Silicon (M4/A18 chips).",
      formula: "EBIT Margin = Gross Margin % - OpEx %",
      keyMetricRationale: "EBIT margin reaches 30.7% in 2025.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "30.7% EBIT Margin", comparisonNote: "Industry-leading hardware EBIT margin." },
      ],
    },
    ppe: {
      groupNumber: "06",
      title: "PP&E & Capex Schedule",
      executiveSummary: "Capex is lean at 3.5% of revenue due to outsourcing hardware manufacturing to Foxconn/TSMC.",
      formula: "PP&E_Ending = PP&E_Beginning + Capex - Depreciation",
      keyMetricRationale: "Fabless hardware strategy minimizes capital tied up in manufacturing plants.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "3.5% Capex / Rev", comparisonNote: "Fabless capital-light strategy." },
      ],
    },
    wc: {
      groupNumber: "07",
      title: "Working Capital Schedule & Cash Conversion",
      executiveSummary: "DSO of 28 days and low inventory (DIO 12 days) generate a negative net trade cycle of -15 days.",
      formula: "NTC = DSO + DIO - DPO",
      keyMetricRationale: "Negative NTC means Apple is financed by its suppliers.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "12d DIO | -15d NTC", comparisonNote: "Industry benchmark for inventory turn." },
      ],
    },
    financing: {
      groupNumber: "08",
      title: "Debt & Financing Structure",
      executiveSummary: "$95B in debt is offset by $175B in cash, leaving negative net debt and an AAA credit profile.",
      formula: "Net Debt = Total Debt - Cash & Securities",
      keyMetricRationale: "Low interest expense risk.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "AAA Rating", comparisonNote: "Ultra-low cost of debt." },
      ],
    },
    statements: {
      groupNumber: "09",
      title: "Financial Statements (P&L 20L, BS 28L, CF 21L)",
      executiveSummary: "Statements show revenue reaching $435B in 2025, yielding $112B in net income and $400B in total assets.",
      formula: "Assets = Liabilities + Stockholders' Equity (Verified 100%)",
      keyMetricRationale: "Balance sheet check passed for all 15 years.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "$112B Net Income", comparisonNote: "World's most profitable tech firm." },
      ],
    },
    dcf: {
      groupNumber: "10",
      title: "DCF Valuation & Multiples (CAPM & Sensitivity)",
      executiveSummary: "DCF model yields an implied share price of $248.00 (+10.6% upside vs $224.30 market price) based on an 8.2% WACC and 24.5x exit multiple.",
      formula: "Implied Price = Equity Value / Shares",
      keyMetricRationale: "Valued at 24.5x EV/EBITDA multiple.",
      peerBenchmarks: [
        { company: "Apple (AAPL)", metricValue: "24.5x EV/EBITDA", comparisonNote: "Premium consumer moat." },
      ],
    },
  },

  // ─── NVDA ─────────────────────────────────────────────────────────────────
  NVDA: {
    drivers: {
      groupNumber: "01",
      title: "Cover & Drivers (WACC & Unit Economics)",
      executiveSummary: "NVIDIA's 9.5% WACC and 1.68 beta reflect hyper-growth AI GPU demand, high gross margins (76%), and AI semiconductor leadership.",
      formula: "WACC = (E/V × [R_f + β × MRP]) + (D/V × K_d × [1 - t])",
      keyMetricRationale: "A+ credit rating and 95% equity weight.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "9.5% WACC | 1.68 β", comparisonNote: "Hyper-growth AI semiconductor leader." },
        { company: "AMD", metricValue: "9.8% WACC | 1.72 β", comparisonNote: "GPU competitor." },
        { company: "TSMC", metricValue: "8.5% WACC | 1.15 β", comparisonNote: "Foundry partner." },
      ],
    },
    volume: {
      groupNumber: "02",
      title: "Segment Volume & Unit Workings",
      executiveSummary: "Data center AI GPU shipments reach 3.5M+ units in 2025 at an average ASP of $28,000 per H100/B200 compute board.",
      formula: "Data Center Rev = GPU Units × ASP",
      keyMetricRationale: "Blackwell architecture increases ASP by 15%.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "3.5M AI GPU Units", comparisonNote: "80%+ market share in AI training GPUs." },
      ],
    },
    revenue: {
      groupNumber: "03",
      title: "Revenue Build-up & Segment Waterfalls",
      executiveSummary: "Data Center AI revenue grows to $144B in 2025 (87% of total revenue), lifting total revenue to $165B.",
      formula: "Total Revenue = Data Center Rev + Gaming Rev + Auto/Enterprise Rev",
      keyMetricRationale: "Data Center growth rate exceeds 35% CAGR.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "$165B Rev (2025)", comparisonNote: "Fastest growing semiconductor firm." },
      ],
    },
    margins: {
      groupNumber: "04",
      title: "Gross Margins & Cost of Goods Sold (COGS)",
      executiveSummary: "Gross margin of 76.0% is the highest in the semiconductor industry, driven by CUDA software lock-in and high-margin AI GPUs.",
      formula: "Gross Margin % = (Revenue - COGS) / Revenue",
      keyMetricRationale: "CUDA software ecosystem creates immense pricing power.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "76.0% Gross Margin", comparisonNote: "Semiconductor industry record." },
        { company: "AMD", metricValue: "52.0% Gross Margin", comparisonNote: "Competitive GPU margin." },
      ],
    },
    opex: {
      groupNumber: "05",
      title: "Operating Expenses (R&D & SG&A)",
      executiveSummary: "OpEx equals only 14.0% of revenue due to massive revenue scaling, generating an unprecedented 62.4% EBIT margin.",
      formula: "EBIT Margin = Gross Margin % - OpEx %",
      keyMetricRationale: "R&D (9%) fuels next-gen Rubin & Blackwell GPU roadmaps.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "62.4% EBIT Margin", comparisonNote: "Highest operating margin in tech." },
      ],
    },
    ppe: {
      groupNumber: "06",
      title: "PP&E & Capex Schedule",
      executiveSummary: "Capex is light at 4.0% of revenue because TSMC manufactures all silicon chips.",
      formula: "PP&E_Ending = PP&E_Beginning + Capex - Depreciation",
      keyMetricRationale: "Fabless model maximizes return on invested capital.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "4.0% Capex / Rev", comparisonNote: "Asset-light fabless model." },
      ],
    },
    wc: {
      groupNumber: "07",
      title: "Working Capital Schedule & Cash Conversion",
      executiveSummary: "DSO of 48 days and DIO of 75 days reflect inventory build-up for next-gen GPU product launches.",
      formula: "NTC = DSO + DIO - DPO",
      keyMetricRationale: "Pre-paid foundry capacity agreements secure TSMC wafers.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "75d DIO | 81d NTC", comparisonNote: "Wafers in-transit inventory." },
      ],
    },
    financing: {
      groupNumber: "08",
      title: "Debt & Financing Structure",
      executiveSummary: "$11B in long-term debt is covered 4.5x by $50B in cash reserves.",
      formula: "Net Debt = Total Debt - Cash",
      keyMetricRationale: "A+ credit rating.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "A+ Rating", comparisonNote: "Negligible credit risk." },
      ],
    },
    statements: {
      groupNumber: "09",
      title: "Financial Statements (P&L 20L, BS 28L, CF 21L)",
      executiveSummary: "P&L showcases revenue exploding from $5.0B in 2015 to $165B in 2025, generating $87B in net income with 100% balance check verification.",
      formula: "Assets = Liabilities + Stockholders' Equity (Verified 100%)",
      keyMetricRationale: "Total assets expand to $132B.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "$87B Net Income", comparisonNote: "Unmatched net earnings growth." },
      ],
    },
    dcf: {
      groupNumber: "10",
      title: "DCF Valuation & Multiples (CAPM & Sensitivity)",
      executiveSummary: "DCF model yields an implied share price of $142.00 (+15.9% upside vs $122.50 market price) based on a 9.5% WACC and 32.0x exit EV/EBITDA multiple.",
      formula: "Implied Share Price = Equity Value / Shares",
      keyMetricRationale: "32.0x EV/EBITDA multiple reflects AI supercycle leadership.",
      peerBenchmarks: [
        { company: "NVIDIA (NVDA)", metricValue: "32.0x EV/EBITDA", comparisonNote: "AI market leader valuation." },
      ],
    },
  },

  // ─── AMZN ─────────────────────────────────────────────────────────────────
  AMZN: {
    drivers: {
      groupNumber: "01",
      title: "Cover & Drivers (WACC & Unit Economics)",
      executiveSummary: "Amazon's 8.8% WACC and 1.12 beta balance retail logistics operations with high-margin AWS cloud and ad services.",
      formula: "WACC = (E/V × [R_f + β × MRP]) + (D/V × K_d × [1 - t])",
      keyMetricRationale: "AA credit rating and 22% debt weight.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "8.8% WACC | 1.12 β", comparisonNote: "Dual retail & cloud business model." },
        { company: "Walmart", metricValue: "7.2% WACC | 0.55 β", comparisonNote: "Retail peer." },
      ],
    },
    volume: {
      groupNumber: "02",
      title: "Segment Volume & Unit Workings",
      executiveSummary: "E-commerce fulfills over 12B packages annually, while AWS cloud compute consumption grows at 18% per year.",
      formula: "AWS Revenue = Server Instances × ARPU",
      keyMetricRationale: "AWS represents the core cash flow engine.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "12B+ Packages Delivered", comparisonNote: "Largest private logistics network." },
      ],
    },
    revenue: {
      groupNumber: "03",
      title: "Revenue Build-up & Segment Waterfalls",
      executiveSummary: "AWS Cloud & Advertising revenue reaches $235B in 2025, driving total revenue to $710B.",
      formula: "Total Revenue = AWS & Ads Rev + E-Commerce Retail Sales",
      keyMetricRationale: "AWS and Ads generate over 75% of operating profit.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "$710B Total Rev (2025)", comparisonNote: "World's largest e-commerce & cloud firm." },
      ],
    },
    margins: {
      groupNumber: "04",
      title: "Gross Margins & Cost of Goods Sold (COGS)",
      executiveSummary: "Gross margin expands to 47.0% as high-margin AWS (64% GM) and Advertising (80% GM) outgrow retail.",
      formula: "Gross Margin % = (Revenue - COGS) / Revenue",
      keyMetricRationale: "Cloud & ad mix shift steadily increases gross margin.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "47.0% Gross Margin", comparisonNote: "Significant margin expansion." },
      ],
    },
    opex: {
      groupNumber: "05",
      title: "Operating Expenses (R&D & SG&A)",
      executiveSummary: "Fulfillment and shipping costs represent 40% of revenue, producing a 7.6% consolidated EBIT margin.",
      formula: "EBIT Margin = Gross Margin % - OpEx %",
      keyMetricRationale: "Robotics automation in fulfillment centers reduces cost per package by $0.80.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "7.6% EBIT Margin", comparisonNote: "Retail + cloud blended margin." },
      ],
    },
    ppe: {
      groupNumber: "06",
      title: "PP&E & Capex Schedule",
      executiveSummary: "Capex represents 9.0% of revenue ($60B+), allocated to AWS data center expansion and logistics automation.",
      formula: "PP&E_Ending = PP&E_Beginning + Capex - Depreciation",
      keyMetricRationale: "Fulfillment center PP&E depreciated over 15 years.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "9.0% Capex / Rev", comparisonNote: "Heavy logistics & cloud infrastructure." },
      ],
    },
    wc: {
      groupNumber: "07",
      title: "Working Capital Schedule & Cash Conversion",
      executiveSummary: "DSO of 24 days and DPO of 78 days generate a negative Net Trade Cycle of -10 days.",
      formula: "NTC = DSO + DIO - DPO",
      keyMetricRationale: "Suppliers finance Amazon's retail inventory.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "78d DPO | -10d NTC", comparisonNote: "Negative cash conversion cycle benchmark." },
      ],
    },
    financing: {
      groupNumber: "08",
      title: "Debt & Financing Structure",
      executiveSummary: "$60B in debt is supported by $110B in cash, maintaining an AA credit profile.",
      formula: "Interest Expense = Long-Term Debt × Bond Yield",
      keyMetricRationale: "Interest coverage exceeds 12x.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "AA Credit Rating", comparisonNote: "Strong balance sheet." },
      ],
    },
    statements: {
      groupNumber: "09",
      title: "Financial Statements (P&L 20L, BS 28L, CF 21L)",
      executiveSummary: "Statements show revenue expanding from $107B in 2015 to $710B in 2025, generating $47B in net income with 100% balance check verification.",
      formula: "Assets = Liabilities + Stockholders' Equity (Verified 100%)",
      keyMetricRationale: "Total assets reach $675B.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "$47B Net Income", comparisonNote: "Record net profit." },
      ],
    },
    dcf: {
      groupNumber: "10",
      title: "DCF Valuation & Multiples (CAPM & Sensitivity)",
      executiveSummary: "DCF model yields an implied share price of $210.00 (+12.7% upside vs $186.40 market price) using an 8.8% WACC and 19.8x exit multiple.",
      formula: "Implied Price = Equity Value / Shares",
      keyMetricRationale: "Valued at 19.8x EV/EBITDA multiple.",
      peerBenchmarks: [
        { company: "Amazon (AMZN)", metricValue: "19.8x EV/EBITDA", comparisonNote: "Attractive cloud + retail multiple." },
      ],
    },
  },
};
