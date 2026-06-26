export interface Holding {
  symbol: string;
  name: string;
  price: number;
  dailyChangePct: number;
  dailyChangeAmt: number;
  purchasePrice: number;
  purchaseDate: string;
  shares: number;
  positionSize: number;
  profitSinceInception: number;
  profitToday: number;
  exposurePct: number;
  beta: number;
  betaExposureAmt: number;
  betaExposurePct: number;
  potNegativeCross: boolean;
  stopLossPrice: number;
  pctFromStopLoss: number;
  sector: string;
  sectorExposurePct: number;
  sectorBetaExposurePct: number;
  sectorDriver: string;
  catalysts?: string | null;
  comments?: string | null;
}

export interface PortfolioMetrics {
  aum: number;
  dailyPerf: number;
  mtdPerf: number;
  ytdPerf: number;
  perfSinceInception: number;
  ytdAlpha: number;
  mtdAlpha: number;
  netExposure: number;
  betaNetExposure: number;
  grossCapitalDeployed: number;
  largestSectorExposurePct: number;
  largestBetaSectorExposurePct: number;
}

export interface MacroDriver {
  label: string;
  value: number;
  formatType: "pct" | "currency" | "number" | "rate";
}

export interface RedFlag {
  id: string;
  question: string;
  answer: string;
  status: "pass" | "warn" | "fail";
}

export const portfolioMetrics: PortfolioMetrics = {
  aum: 100612,
  dailyPerf: 0.00643,
  mtdPerf: 0.00643,
  ytdPerf: 0.19643,
  perfSinceInception: 0.35073,
  ytdAlpha: 0.07643,
  mtdAlpha: -0.01357,
  netExposure: 1.0,
  betaNetExposure: 0.98686,
  grossCapitalDeployed: 1.0,
  largestSectorExposurePct: 0.52939,
  largestBetaSectorExposurePct: 0.53315,
};

export const holdingsData: Holding[] = [
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 73.05,
    dailyChangePct: 0.0178,
    dailyChangeAmt: 1.28,
    purchasePrice: 59.2,
    purchaseDate: "2016-12-01",
    shares: 100,
    positionSize: 7305,
    profitSinceInception: 1385.0,
    profitToday: 128,
    exposurePct: 0.07261,
    beta: 1.39,
    betaExposureAmt: 10153.95,
    betaExposurePct: 0.10092,
    potNegativeCross: false,
    stopLossPrice: 62.0925,
    pctFromStopLoss: 0.23395,
    sector: "Information Technology",
    sectorExposurePct: 0.53315,
    sectorBetaExposurePct: 0.52939,
    sectorDriver: "Product Cycle",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 149.09,
    dailyChangePct: 0.0089,
    dailyChangeAmt: 1.32,
    purchasePrice: 98.78,
    purchaseDate: "2016-07-15",
    shares: 100,
    positionSize: 14909,
    profitSinceInception: 5031,
    profitToday: 132,
    exposurePct: 0.14818,
    beta: 1.43,
    betaExposureAmt: 21319.87,
    betaExposurePct: 0.2119,
    potNegativeCross: false,
    stopLossPrice: 126.7265,
    pctFromStopLoss: 0.50931,
    sector: "Information Technology",
    sectorExposurePct: 0.53315,
    sectorBetaExposurePct: 0.52939,
    sectorDriver: "Product Cycle",
  },
  {
    symbol: "GE",
    name: "General Electric Company",
    price: 26.86,
    dailyChangePct: 0.0026,
    dailyChangeAmt: 0.07,
    purchasePrice: 53.0,
    purchaseDate: "2000-04-01",
    shares: 100,
    positionSize: 2686,
    profitSinceInception: -2614,
    profitToday: 7.0,
    exposurePct: 0.0267,
    beta: 1.1,
    betaExposureAmt: 2954.6,
    betaExposurePct: 0.02937,
    potNegativeCross: true,
    stopLossPrice: 22.831,
    pctFromStopLoss: -0.49321,
    sector: "Industrials",
    sectorExposurePct: 0.25979,
    sectorBetaExposurePct: 0.30182,
    sectorDriver: "Healthy GDP Growth",
  },
  {
    symbol: "CAT",
    name: "Caterpillar, Inc.",
    price: 109.08,
    dailyChangePct: 0.0056,
    dailyChangeAmt: 0.61,
    purchasePrice: 99.0,
    purchaseDate: "2014-12-01",
    shares: 100,
    positionSize: 10908,
    profitSinceInception: 1008.0,
    profitToday: 61,
    exposurePct: 0.10842,
    beta: 1.66,
    betaExposureAmt: 18107.28,
    betaExposurePct: 0.17997,
    potNegativeCross: false,
    stopLossPrice: 92.718,
    pctFromStopLoss: 0.10182,
    sector: "Industrials",
    sectorExposurePct: 0.25979,
    sectorBetaExposurePct: 0.30182,
    sectorDriver: "Healthy GDP Growth",
  },
  {
    symbol: "DE",
    name: "Deere & Company",
    price: 125.44,
    dailyChangePct: 0.0082,
    dailyChangeAmt: 1.02,
    purchasePrice: 104.05,
    purchaseDate: "2017-01-03",
    shares: 100,
    positionSize: 12544,
    profitSinceInception: 2139,
    profitToday: 102,
    exposurePct: 0.12468,
    beta: 0.71,
    betaExposureAmt: 8906.24,
    betaExposurePct: 0.08852,
    potNegativeCross: false,
    stopLossPrice: 106.624,
    pctFromStopLoss: 0.20557,
    sector: "Industrials",
    sectorExposurePct: 0.25979,
    sectorBetaExposurePct: 0.30182,
    sectorDriver: "Healthy GDP Growth",
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil Corporation",
    price: 81.11,
    dailyChangePct: 0.0017,
    dailyChangeAmt: 0.14,
    purchasePrice: 101.2,
    purchaseDate: "2013-10-01",
    shares: 100,
    positionSize: 8111,
    profitSinceInception: -2009.0,
    profitToday: 14.0,
    exposurePct: 0.08062,
    beta: 0.65,
    betaExposureAmt: 5272.15,
    betaExposurePct: 0.0524,
    potNegativeCross: true,
    stopLossPrice: 68.9435,
    pctFromStopLoss: -0.19852,
    sector: "Energy",
    sectorExposurePct: 0.08062,
    sectorBetaExposurePct: 0.0531,
    sectorDriver: "Rising Oil Prices",
  },
  {
    symbol: "GILD",
    name: "Gilead Sciences, Inc.",
    price: 70.885,
    dailyChangePct: 0.00432,
    dailyChangeAmt: 0.305,
    purchasePrice: 37.27,
    purchaseDate: "2012-12-05",
    shares: 100,
    positionSize: 7088.5,
    profitSinceInception: 3361.5,
    profitToday: 30.5,
    exposurePct: 0.07045,
    beta: 0.97,
    betaExposureAmt: 6875.845,
    betaExposurePct: 0.06834,
    potNegativeCross: true,
    stopLossPrice: 60.25225,
    pctFromStopLoss: 0.90193,
    sector: "Health Care",
    sectorExposurePct: 0.07045,
    sectorBetaExposurePct: 0.06925,
    sectorDriver: "Favorable Government Policy",
  },
  {
    symbol: "FB",
    name: "Facebook, Inc.",
    price: 160.015,
    dailyChangePct: 0.00474,
    dailyChangeAmt: 0.755,
    purchasePrice: 77.43,
    purchaseDate: "2014-09-10",
    shares: 100,
    positionSize: 16001.5,
    profitSinceInception: 8258.5,
    profitToday: 75.5,
    exposurePct: 0.15904,
    beta: 0.46,
    betaExposureAmt: 7360.69,
    betaExposurePct: 0.07316,
    potNegativeCross: false,
    stopLossPrice: 136.01275,
    pctFromStopLoss: 1.06658,
    sector: "Information Technology",
    sectorExposurePct: 0.53315,
    sectorBetaExposurePct: 0.52939,
    sectorDriver: "Product Cycle",
  },
  {
    symbol: "KO",
    name: "Coca-Cola Company (The)",
    price: 44.685,
    dailyChangePct: 0.00574,
    dailyChangeAmt: 0.255,
    purchasePrice: 42.68,
    purchaseDate: "2017-04-04",
    shares: 100,
    positionSize: 4468.5,
    profitSinceInception: 200.5,
    profitToday: 25.5,
    exposurePct: 0.04441,
    beta: 0.68,
    betaExposureAmt: 3038.58,
    betaExposurePct: 0.0302,
    potNegativeCross: false,
    stopLossPrice: 37.98225,
    pctFromStopLoss: 0.04698,
    sector: "Consumer Staples",
    sectorExposurePct: 0.04441,
    sectorBetaExposurePct: 0.0306,
    sectorDriver: "N/A (Defensive Sector)",
  },
  {
    symbol: "IBM",
    name: "International Business Machines",
    price: 154.26,
    dailyChangePct: 0.0041,
    dailyChangeAmt: 0.63,
    purchasePrice: 144.41,
    purchaseDate: "2010-12-01",
    shares: 100,
    positionSize: 15426,
    profitSinceInception: 985.0,
    profitToday: 63,
    exposurePct: 0.15332,
    beta: 0.89,
    betaExposureAmt: 13729.14,
    betaExposurePct: 0.13646,
    potNegativeCross: true,
    stopLossPrice: 131.121,
    pctFromStopLoss: 0.06821,
    sector: "Information Technology",
    sectorExposurePct: 0.53315,
    sectorBetaExposurePct: 0.52939,
    sectorDriver: "Product Cycle",
  },
  {
    symbol: "F",
    name: "Ford Motor Company",
    price: 11.645,
    dailyChangePct: 0.00388,
    dailyChangeAmt: 0.045,
    purchasePrice: 11.45,
    purchaseDate: "2002-12-02",
    shares: 100,
    positionSize: 1164.5,
    profitSinceInception: 19.5,
    profitToday: 4.5,
    exposurePct: 0.01157,
    beta: 1.35,
    betaExposureAmt: 1572.075,
    betaExposurePct: 0.01563,
    potNegativeCross: true,
    stopLossPrice: 9.89825,
    pctFromStopLoss: 0.01703,
    sector: "Consumer Discretionary",
    sectorExposurePct: 0.01157,
    sectorBetaExposurePct: 0.01583,
    sectorDriver: "Healthy GDP Growth",
  },
];

export const macroSnapshot: MacroDriver[] = [
  { label: "GDP Q Growth YoY", value: 0.02, formatType: "pct" },
  { label: "Unemployment Rate", value: 0.06, formatType: "pct" },
  { label: "Inflation Rate", value: 0.022, formatType: "pct" },
  { label: "Interest Rate", value: 0.01, formatType: "pct" },
  { label: "CNY/USD FX Rate", value: 0.15, formatType: "rate" },
  { label: "EUR/USD FX Rate", value: 1.12, formatType: "rate" },
  { label: "Gold (per oz)", value: 1225, formatType: "currency" },
  { label: "Crude Oil (WTI)", value: 50, formatType: "currency" },
];

export const redFlags: RedFlag[] = [
  {
    id: "rf1",
    question: "Do we have leverage (gross capital > 100%)?",
    answer: "No leverage (100% deployed)",
    status: "pass",
  },
  {
    id: "rf2",
    question: "Have any of our long positions hit a stop loss?",
    answer: "Yes, active warnings",
    status: "warn",
  },
  { id: "rf3", question: "Is unemployment > 8%?", answer: "No (6.0%)", status: "pass" },
  { id: "rf4", question: "Is the government pro business?", answer: "Yes", status: "pass" },
  {
    id: "rf5",
    question: "Are any stocks down 20%+ since purchase?",
    answer: "Yes (GE -49.3%, XOM -19.9%)",
    status: "fail",
  },
  { id: "rf6", question: "Is GDP growth negative?", answer: "No (+2.0% YoY)", status: "pass" },
  { id: "rf7", question: "Are interest rates > 5%?", answer: "No (1.0%)", status: "pass" },
  {
    id: "rf8",
    question: "Do we have > 30% of capital in 1+ sector(s)?",
    answer: "Yes (InfoTech 53.3%, Industrials 26.0%)",
    status: "fail",
  },
  { id: "rf9", question: "Is gold over $2,000?", answer: "No ($1,225)", status: "pass" },
  { id: "rf10", question: "Is inflation above 2%?", answer: "Yes (2.2%)", status: "warn" },
  {
    id: "rf11",
    question: "Do we have >30% beta exposure to 1+ sector(s)?",
    answer: "Yes (InfoTech beta exposure 52.9%)",
    status: "fail",
  },
  {
    id: "rf12",
    question: "Are there any negative golden crosses?",
    answer: "Yes (GE, XOM, GILD, IBM, F)",
    status: "warn",
  },
];

export const monthlyPerformance = [
  { date: "Jan 17", return: 0.03, cumulative: 0.03, spyReturn: 0.018, spyCumulative: 0.018 },
  { date: "Feb 17", return: 0.05, cumulative: 0.0815, spyReturn: 0.037, spyCumulative: 0.0557 },
  { date: "Mar 17", return: 0.02, cumulative: 0.1031, spyReturn: -0.001, spyCumulative: 0.0546 },
  { date: "Apr 17", return: -0.02, cumulative: 0.081, spyReturn: 0.009, spyCumulative: 0.0641 },
  { date: "May 17", return: 0.03, cumulative: 0.1135, spyReturn: 0.012, spyCumulative: 0.0769 },
  { date: "Jun 17", return: 0.04, cumulative: 0.158, spyReturn: 0.005, spyCumulative: 0.0823 },
  { date: "Jul 17", return: -0.03, cumulative: 0.1233, spyReturn: 0.019, spyCumulative: 0.1029 },
  { date: "Aug 17", return: 0.04, cumulative: 0.1682, spyReturn: 0.001, spyCumulative: 0.104 },
  { date: "Sep 17", return: 0.01, cumulative: 0.1799, spyReturn: 0.019, spyCumulative: 0.125 },
  { date: "Oct 17", return: -0.02, cumulative: 0.1563, spyReturn: 0.022, spyCumulative: 0.1498 },
  { date: "Nov 17", return: 0.04, cumulative: 0.2026, spyReturn: 0.028, spyCumulative: 0.182 },
  { date: "Dec 17*", return: 0.00643, cumulative: 0.2103, spyReturn: 0.011, spyCumulative: 0.195 },
];
