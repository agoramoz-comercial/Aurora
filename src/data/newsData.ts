// ─────────────────────────────────────────────────────────────────────────────
// Dual-Layer News Platform — mock data
// Primary  : direct impact on held assets
// Secondary: regime / macro / sector signals outside the portfolio
// ─────────────────────────────────────────────────────────────────────────────

export type ConfidenceBand = "high" | "medium" | "low" | "early";
export type AttentionLevel = "critical" | "high" | "moderate" | "low";
export type EventType =
  | "earnings"
  | "guidance"
  | "macro"
  | "ma"
  | "regulatory"
  | "supply"
  | "geopolitical"
  | "technical"
  | "fundamental"
  | "social";
export type Horizon =
  | "intraday"
  | "1-5d"
  | "1-4w"
  | "structural";
export type EventStatus =
  | "new"
  | "confirmed"
  | "developing"
  | "denied"
  | "closed";

export interface EvidenceLayer {
  market?: string;     // price/vol/spread signal
  technical?: string;  // technical signal
  fundamental?: string;
  statistical?: string;
  documentary?: string;
  social?: string;
}

export interface PrimaryNewsItem {
  id: string;
  ticker: string;
  assetName: string;
  assetClass: "equity" | "bond" | "fx" | "commodity" | "crypto" | "etf";
  sector: string;
  geography: string;
  eventType: EventType;
  status: EventStatus;
  headline: string;
  summary: string;
  timestamp: string;          // ISO
  minutesAgo: number;
  impactScore: number;        // 0–100
  confidenceBand: ConfidenceBand;
  attentionLevel: AttentionLevel;
  horizon: Horizon;
  priceChange: number;        // %
  volumeChange: number;       // % vs avg
  volChange: number;          // implied vol change in pp
  evidenceLayers: EvidenceLayer;
  evidenceCount: number;
  sourceCount: number;
  tags: string[];
}

export interface SecondaryNewsItem {
  id: string;
  ticker?: string;
  assetName: string;
  theme: string;
  eventType: EventType;
  status: EventStatus;
  headline: string;
  summary: string;
  timestamp: string;
  minutesAgo: number;
  confidenceBand: ConfidenceBand;
  attentionLevel: AttentionLevel;
  horizon: Horizon;
  transmissionVector: string;  // how it affects portfolio context
  regimeFlag: string;
  tags: string[];
}

export interface ImpactPanelAsset {
  ticker: string;
  name: string;
  change: number;
  vol: number;
  impactScore: number;
  attentionLevel: AttentionLevel;
  relatedNewsId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY NEWS
// ─────────────────────────────────────────────────────────────────────────────
export const primaryNews: PrimaryNewsItem[] = [
  {
    id: "p1",
    ticker: "AAPL",
    assetName: "Apple Inc.",
    assetClass: "equity",
    sector: "Technology",
    geography: "US",
    eventType: "earnings",
    status: "confirmed",
    headline: "Apple Q2 EPS beats by $0.18 — Services revenue accelerates to +14% YoY",
    summary:
      "Apple reported Q2 EPS of $1.53 vs $1.35 est. Services reached $24.2B (+14% YoY), iPhone softened slightly. Management raised full-year guidance on margin expansion. Free cash flow generation at all-time high of $29B.",
    timestamp: "2026-07-12T16:45:00Z",
    minutesAgo: 7,
    impactScore: 91,
    confidenceBand: "high",
    attentionLevel: "critical",
    horizon: "1-5d",
    priceChange: 3.8,
    volumeChange: 340,
    volChange: -2.1,
    evidenceLayers: {
      market: "Price +3.8% on 3.4× avg volume. Options IV collapsing post-print (IV crush pattern).",
      technical: "Broke above 52-week resistance at $198. RSI entering overbought territory (72).",
      fundamental: "EPS surprise +13.3%. Operating margin expanded 180bps. FCF yield holding at 4.1%.",
      statistical: "In 12 comparable post-beat quarters, AAPL averaged +4.2% over 5 days with 75% persistence.",
      documentary: "10-Q filed 17:12 ET. Tim Cook transcript emphasises AI integration roadmap.",
      social: "Narrative acceleration on X (+480% mentions in 2h). Sentiment 78% positive.",
    },
    evidenceCount: 6,
    sourceCount: 8,
    tags: ["Earnings Beat", "Guidance Raise", "Services Growth", "IV Crush"],
  },
  {
    id: "p2",
    ticker: "NVDA",
    assetName: "NVIDIA Corp.",
    assetClass: "equity",
    sector: "Semiconductors",
    geography: "US",
    eventType: "fundamental",
    status: "developing",
    headline: "NVDA H100 supply constraint easing — Foxconn ramps CoWoS capacity 60% in Q3",
    summary:
      "Supply chain sources confirm Foxconn advanced packaging capacity expanding materially. Analyst community revising up 2026 data-centre revenue estimates. Blackwell ramp not yet reflected in consensus.",
    timestamp: "2026-07-12T15:20:00Z",
    minutesAgo: 92,
    impactScore: 78,
    confidenceBand: "medium",
    attentionLevel: "high",
    horizon: "1-4w",
    priceChange: 1.4,
    volumeChange: 180,
    volChange: 0.8,
    evidenceLayers: {
      market: "NVDA +1.4%. SMH ETF outperforming SOX by 90bps intraday.",
      technical: "Consolidating above 50-day MA. MACD bullish crossover forming.",
      fundamental: "Sell-side revisions: 3 upgrades, 2 PT increases in last 48h.",
      statistical: "Supply-expansion news historically correlates with +3–7% over 4 weeks (n=8, 62% hit rate).",
      documentary: "Foxconn FY2026 capex filing confirms CoWoS line expansion.",
    },
    evidenceCount: 5,
    sourceCount: 6,
    tags: ["Supply Chain", "AI Infrastructure", "Capacity Expansion", "Estimate Revision"],
  },
  {
    id: "p3",
    ticker: "MSFT",
    assetName: "Microsoft Corp.",
    assetClass: "equity",
    sector: "Technology",
    geography: "US",
    eventType: "regulatory",
    status: "new",
    headline: "EU DMA investigation expanded to Azure AI — Potential remedies by Q1 2027",
    summary:
      "European Commission formally expanded Digital Markets Act probe to include Azure OpenAI bundling. No immediate financial impact expected, but headline risk elevated. Legal proceedings could extend 18–24 months.",
    timestamp: "2026-07-12T14:10:00Z",
    minutesAgo: 190,
    impactScore: 62,
    confidenceBand: "medium",
    attentionLevel: "moderate",
    horizon: "structural",
    priceChange: -0.9,
    volumeChange: 145,
    volChange: 1.4,
    evidenceLayers: {
      market: "MSFT -0.9%. European tech peers down 0.3–0.6% in sympathy.",
      fundamental: "Azure represents ~28% of MSFT revenue. Structural remedies unlikely before 2027.",
      documentary: "EC press release published 14:05 CET. Bloomberg Law article with full probe scope.",
      social: "Tech policy accounts flagging significance. 40% below earnings-season noise level.",
    },
    evidenceCount: 4,
    sourceCount: 5,
    tags: ["Regulatory Risk", "EU DMA", "Azure", "AI Bundling"],
  },
  {
    id: "p4",
    ticker: "BTC",
    assetName: "Bitcoin",
    assetClass: "crypto",
    sector: "Digital Assets",
    geography: "Global",
    eventType: "macro",
    status: "confirmed",
    headline: "BTC breaks $75K on spot ETF inflow record — BlackRock IBIT logs $1.4B single-day",
    summary:
      "Bitcoin crossed $75,000 for first time since January. BlackRock IBIT recorded largest single-day inflow since inception. CME futures open interest at all-time high. On-chain metrics confirm institutional accumulation.",
    timestamp: "2026-07-12T16:30:00Z",
    minutesAgo: 22,
    impactScore: 87,
    confidenceBand: "high",
    attentionLevel: "critical",
    horizon: "intraday",
    priceChange: 6.2,
    volumeChange: 520,
    volChange: 4.8,
    evidenceLayers: {
      market: "BTC +6.2%, ETH +4.1%, SOL +5.8%. Altcoin market cap +3.9%. Fear & Greed: 82 (Extreme Greed).",
      technical: "Clean break above $73K resistance zone. Next key level: $80K psychological.",
      fundamental: "ETF AUM now $112B. Spot ETFs collectively >200K BTC under management.",
      statistical: "Post-ATH breakouts historically sustained >10% over 2 weeks in 68% of cases.",
      documentary: "SEC approved two additional spot ETF products today.",
      social: "Google Trends BTC searches +340% week-over-week.",
    },
    evidenceCount: 6,
    sourceCount: 9,
    tags: ["ATH Breakout", "ETF Inflows", "Institutional", "Risk-On"],
  },
  {
    id: "p5",
    ticker: "JPM",
    assetName: "JPMorgan Chase",
    assetClass: "equity",
    sector: "Financials",
    geography: "US",
    eventType: "earnings",
    status: "confirmed",
    headline: "JPM Net Interest Income guidance cut — Dimon signals rate sensitivity headwind into 2027",
    summary:
      "JPMorgan revised NII guidance to $89.5B from $91.5B for FY2026, citing Fed rate path uncertainty. Investment banking fees were a bright spot. CET1 ratio held at 15.3%, well above regulatory minimums.",
    timestamp: "2026-07-12T13:45:00Z",
    minutesAgo: 217,
    impactScore: 74,
    confidenceBand: "high",
    attentionLevel: "high",
    horizon: "1-4w",
    priceChange: -2.1,
    volumeChange: 260,
    volChange: 2.3,
    evidenceLayers: {
      market: "JPM -2.1%. KBW Bank Index -1.4%. Financials sector -1.1% vs SPX -0.2%.",
      technical: "Testing 50-day support at $218. Key level to watch.",
      fundamental: "NII miss of $2B annualised. IB revenue +22% YoY offsetting partially.",
      statistical: "Post-NII guidance cut, bank stocks average -2.8% over 5 days (n=14, 71% hit rate).",
      documentary: "Earnings call transcript: Dimon comments on rate sensitivity and commercial RE.",
    },
    evidenceCount: 5,
    sourceCount: 7,
    tags: ["NII Guidance Cut", "Rate Sensitivity", "Financials", "Earnings Miss"],
  },
  {
    id: "p6",
    ticker: "GOLD",
    assetName: "SPDR Gold Trust",
    assetClass: "etf",
    sector: "Commodities",
    geography: "Global",
    eventType: "macro",
    status: "developing",
    headline: "Gold ETF GLD surges as dollar weakens — CPI print misses expectations by 0.2pp",
    summary:
      "Weaker-than-expected June CPI (3.1% vs 3.3% est.) triggered USD selloff and gold rally. GLD +1.9% on above-average volume. Market pricing 2.2 cuts in 2026 vs 1.8 cuts yesterday.",
    timestamp: "2026-07-12T14:35:00Z",
    minutesAgo: 167,
    impactScore: 68,
    confidenceBand: "high",
    attentionLevel: "high",
    horizon: "1-5d",
    priceChange: 1.9,
    volumeChange: 190,
    volChange: -0.6,
    evidenceLayers: {
      market: "GLD +1.9%, DXY -0.8%, 2Y UST -14bps, 10Y UST -9bps. Rate cut pricing surging.",
      technical: "Gold tested and held $2,400 support. Momentum indicators turning bullish.",
      fundamental: "CPI miss signals disinflation trend intact. Fed's preferred measure (PCE) divergence watch.",
      statistical: "Post-CPI miss, gold averaged +1.3% over 5 days in 8 of last 10 instances.",
      documentary: "BLS CPI release, Fed commentary from Williams and Waller.",
    },
    evidenceCount: 5,
    sourceCount: 6,
    tags: ["CPI Miss", "Disinflation", "Gold Rally", "Rate Cut Expectations"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECONDARY NEWS
// ─────────────────────────────────────────────────────────────────────────────
export const secondaryNews: SecondaryNewsItem[] = [
  {
    id: "s1",
    ticker: "TSM",
    assetName: "TSMC",
    theme: "Semiconductor Supply Chain",
    eventType: "earnings",
    status: "confirmed",
    headline: "TSMC Q2 revenue +40% YoY — N2 node orders exceed 2025 full-year capacity",
    summary: "TSMC's Q2 revenue surge confirms AI chip demand resilience. N2 node pre-orders already exhausted for 2027. Implication for NVDA, AMD, AAPL customers: supply priority reshuffling.",
    timestamp: "2026-07-12T12:00:00Z",
    minutesAgo: 340,
    confidenceBand: "high",
    attentionLevel: "high",
    horizon: "structural",
    transmissionVector: "Directly impacts NVDA & AAPL chip supply timelines in portfolio",
    regimeFlag: "AI Infrastructure Supercycle",
    tags: ["TSMC", "N2 Node", "AI Chips", "Supply Priority"],
  },
  {
    id: "s2",
    assetName: "US 10Y Treasury",
    theme: "Rates & Macro Regime",
    eventType: "macro",
    status: "confirmed",
    headline: "10Y UST yield drops to 4.08% post-CPI — Real rates regime shifting",
    summary: "The CPI miss pushed 10Y yields to lowest since March. A sustained sub-4.1% environment changes the discount rate narrative for growth equities. Watch for rotation from value to growth.",
    timestamp: "2026-07-12T14:40:00Z",
    minutesAgo: 162,
    confidenceBand: "high",
    attentionLevel: "critical",
    horizon: "1-4w",
    transmissionVector: "Lower discount rates benefit growth positions (AAPL, NVDA, MSFT)",
    regimeFlag: "Rates Regime Shift",
    tags: ["10Y Yield", "Real Rates", "Growth vs Value", "Duration"],
  },
  {
    id: "s3",
    ticker: "META",
    assetName: "Meta Platforms",
    theme: "Ad Tech & Social Media",
    eventType: "fundamental",
    status: "new",
    headline: "Meta raises 2026 capex to $72B — AI infrastructure war escalates",
    summary: "Meta's capex raise signals continued AI arms race. Positive for NVDA/AMD data centre business. Broader market implication: AI infrastructure spending is not decelerating.",
    timestamp: "2026-07-12T11:30:00Z",
    minutesAgo: 370,
    confidenceBand: "high",
    attentionLevel: "high",
    horizon: "structural",
    transmissionVector: "AI infrastructure capex regime bullish for semiconductor holdings",
    regimeFlag: "AI Capex Acceleration",
    tags: ["Meta", "AI Capex", "Data Centre", "Infra War"],
  },
  {
    id: "s4",
    assetName: "EUR/USD",
    theme: "FX & Currency Risk",
    eventType: "macro",
    status: "developing",
    headline: "EUR/USD breaks above 1.09 — ECB Lagarde signals July hold, dollar weakness persists",
    summary: "EUR/USD at 4-month high following CPI miss and Lagarde's cautious tone. Affects multinational revenue translation for US companies with European exposure.",
    timestamp: "2026-07-12T15:00:00Z",
    minutesAgo: 112,
    confidenceBand: "medium",
    attentionLevel: "moderate",
    horizon: "1-4w",
    transmissionVector: "USD weakness supports non-US earnings translation. Monitor AAPL, MSFT EU revenues.",
    regimeFlag: "Dollar Weakness Regime",
    tags: ["EUR/USD", "FX", "Dollar Weakness", "Revenue Translation"],
  },
  {
    id: "s5",
    ticker: "XOM",
    assetName: "ExxonMobil",
    theme: "Energy & Commodities",
    eventType: "supply",
    status: "new",
    headline: "OPEC+ signals further production cut extension through Q4 — Oil +3.2%",
    summary: "OPEC+ meeting outcome: production cuts extended to December 2026. Brent crude +3.2%, WTI +3.1%. Energy sector outperforming. Inflationary tail risk re-emerges if sustained.",
    timestamp: "2026-07-12T10:15:00Z",
    minutesAgo: 487,
    confidenceBand: "high",
    attentionLevel: "high",
    horizon: "1-4w",
    transmissionVector: "Oil spike re-ignites CPI upside risk, complicating Fed rate cut narrative",
    regimeFlag: "Energy Supply Shock",
    tags: ["OPEC+", "Oil", "Brent", "Inflation Risk"],
  },
  {
    id: "s6",
    assetName: "Chinese A-Shares",
    theme: "China & EM Risk",
    eventType: "geopolitical",
    status: "developing",
    headline: "China stimulus package $500B announced — EM sentiment reversal underway",
    summary: "Beijing announced a RMB 3.6T fiscal stimulus package targeting infrastructure and consumption. EM equities rallying broadly. Risk-on signal with potential correlation shift.",
    timestamp: "2026-07-12T09:00:00Z",
    minutesAgo: 582,
    confidenceBand: "medium",
    attentionLevel: "high",
    horizon: "structural",
    transmissionVector: "EM rally reduces flight-to-quality flows. Monitor beta vs correlation shifts in portfolio.",
    regimeFlag: "EM Risk-On Rotation",
    tags: ["China Stimulus", "EM", "Risk-On", "Fiscal Policy"],
  },
  {
    id: "s7",
    assetName: "Vix Index",
    theme: "Volatility & Regime",
    eventType: "technical",
    status: "confirmed",
    headline: "VIX drops below 13 — Multi-year low signals complacency or genuine regime calm",
    summary: "VIX at 12.8, lowest since pre-2020. Either markets correctly pricing low-risk environment, or tail risk building. Skew elevated: protection is being bought despite low VIX.",
    timestamp: "2026-07-12T16:00:00Z",
    minutesAgo: 52,
    confidenceBand: "medium",
    attentionLevel: "moderate",
    horizon: "1-4w",
    transmissionVector: "Low VIX compresses risk premia. Review portfolio hedge adequacy.",
    regimeFlag: "Low Volatility Regime",
    tags: ["VIX", "Volatility", "Skew", "Complacency"],
  },
  {
    id: "s8",
    ticker: "AMZN",
    assetName: "Amazon",
    theme: "Cloud & AI",
    eventType: "fundamental",
    status: "new",
    headline: "AWS gains 3pp market share in H1 2026 — AI workloads driving $28B quarterly run rate",
    summary: "AWS H1 data: cloud market share expanded from 31% to 34%. AI workloads now represent 22% of AWS revenue. Synergy Intelligence: competitive dynamics shifting away from Azure and GCP.",
    timestamp: "2026-07-12T13:00:00Z",
    minutesAgo: 252,
    confidenceBand: "medium",
    attentionLevel: "moderate",
    horizon: "structural",
    transmissionVector: "Cloud market share shift may pressure MSFT Azure growth narrative",
    regimeFlag: "Cloud AI Competition",
    tags: ["AWS", "Cloud Share", "AI Workloads", "Azure Risk"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// IMPACT PANEL
// ─────────────────────────────────────────────────────────────────────────────
export const impactPanelAssets: ImpactPanelAsset[] = [
  { ticker: "AAPL", name: "Apple", change: 3.8, vol: -2.1, impactScore: 91, attentionLevel: "critical", relatedNewsId: "p1" },
  { ticker: "BTC", name: "Bitcoin", change: 6.2, vol: 4.8, impactScore: 87, attentionLevel: "critical", relatedNewsId: "p4" },
  { ticker: "NVDA", name: "NVIDIA", change: 1.4, vol: 0.8, impactScore: 78, attentionLevel: "high", relatedNewsId: "p2" },
  { ticker: "JPM", name: "JPMorgan", change: -2.1, vol: 2.3, impactScore: 74, attentionLevel: "high", relatedNewsId: "p5" },
  { ticker: "GOLD", name: "Gold ETF", change: 1.9, vol: -0.6, impactScore: 68, attentionLevel: "high", relatedNewsId: "p6" },
  { ticker: "MSFT", name: "Microsoft", change: -0.9, vol: 1.4, impactScore: 62, attentionLevel: "moderate", relatedNewsId: "p3" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MARKET PULSE
// ─────────────────────────────────────────────────────────────────────────────
export const marketPulse = {
  spx: { value: "5,842", change: 0.4, label: "S&P 500" },
  ndx: { value: "21,204", change: 0.9, label: "Nasdaq 100" },
  vix: { value: "12.8", change: -8.2, label: "VIX" },
  dxy: { value: "101.4", change: -0.8, label: "DXY" },
  gold: { value: "2,418", change: 1.9, label: "Gold $/oz" },
  btc: { value: "75,240", change: 6.2, label: "BTC/USD" },
};
