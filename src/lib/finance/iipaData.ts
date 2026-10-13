/**
 * iipaData.ts — Investment Intelligence & Projection Architecture (IIPA).
 *
 * Institutional inputs for the Benchmark & Projeções workspace: mandate,
 * capital market assumptions, correlations, policy and current allocation,
 * benchmark hierarchy, scenarios, stress tests, forecast registry, data
 * quality and governance calendar.
 *
 * Pure data, no runtime imports — the engine receives everything by parameter
 * so it can be verified in isolation. Returns are nominal, in USD, annualised.
 */

/* ── Mandate (Investment Policy Statement) ─────────────────────────────── */

export interface Mandate {
  capitalUsd: number;
  /** Assumed long-run inflation. */
  inflation: number;
  /** Real return required above inflation. */
  realTarget: number;
  horizonYears: number;
  /** Maximum tolerable loss over any 12 months. */
  maxLoss12m: number;
  /** Minimum share in immediately liquid assets (cash + sovereign bonds). */
  minLiquidity: number;
  /** Maximum unhedged currency exposure. */
  maxFxUnhedged: number;
  /** Maximum weight in a single issuer. */
  maxIssuer: number;
  /** Maximum tracking error versus the policy benchmark. */
  maxTrackingError: number;
  /** Maximum drift of any asset class versus its strategic weight. */
  maxDrift: number;
  riskFree: number;
  /** Minimum data-quality score to publish a projection. */
  minDataQuality: number;
}

export const DEFAULT_MANDATE: Mandate = {
  capitalUsd: 100_000_000,
  inflation: 0.03,
  realTarget: 0.06,
  horizonYears: 10,
  maxLoss12m: 0.15,
  minLiquidity: 0.2,
  maxFxUnhedged: 0.3,
  maxIssuer: 0.1,
  maxTrackingError: 0.04,
  maxDrift: 0.05,
  riskFree: 0.04,
  minDataQuality: 80,
};

/* ── Asset classes & capital market assumptions ────────────────────────── */

export type AssetClassId = "gEq" | "emEq" | "gov" | "credit" | "cash" | "re" | "pe" | "cmd";

export interface ReturnSources {
  /** Dividends, coupons, rents. */
  income: number;
  /** Earnings, rent or cash-flow growth. */
  growth: number;
  /** Valuation change, roll-down, illiquidity premium. */
  valuation: number;
  /** Currency, default losses and fees (usually negative). */
  drag: number;
}

export interface AssetClass {
  id: AssetClassId;
  label: string;
  short: string;
  color: string;
  benchmark: string;
  /** Expected annual return — always equal to the sum of its sources. */
  expectedReturn: number;
  volatility: number;
  /** Share of the position that carries unhedged currency risk. */
  fxExposure: number;
  liquidity: "Imediata" | "Dias" | "Semanas" | "Anos";
  sources: ReturnSources;
}

const cls = (c: Omit<AssetClass, "expectedReturn">): AssetClass => ({
  ...c,
  expectedReturn: c.sources.income + c.sources.growth + c.sources.valuation + c.sources.drag,
});

export const ASSET_CLASSES: AssetClass[] = [
  cls({
    id: "gEq",
    label: "Ações globais",
    short: "Ações glob.",
    color: "#4a9eff",
    benchmark: "Índice global de ações (mercados desenvolvidos)",
    volatility: 0.16,
    fxExposure: 0.4,
    liquidity: "Imediata",
    sources: { income: 0.019, growth: 0.046, valuation: -0.004, drag: 0.006 },
  }),
  cls({
    id: "emEq",
    label: "Ações emergentes",
    short: "Ações emerg.",
    color: "#c084fc",
    benchmark: "Índice de ações de mercados emergentes",
    volatility: 0.22,
    fxExposure: 0.9,
    liquidity: "Dias",
    sources: { income: 0.029, growth: 0.052, valuation: 0.009, drag: -0.004 },
  }),
  cls({
    id: "gov",
    label: "Obrigações soberanas",
    short: "Soberanas",
    color: "#2dd4bf",
    benchmark: "Índice de obrigações soberanas grau de investimento",
    volatility: 0.06,
    fxExposure: 0.2,
    liquidity: "Imediata",
    sources: { income: 0.041, growth: 0, valuation: 0.003, drag: 0 },
  }),
  cls({
    id: "credit",
    label: "Crédito empresarial",
    short: "Crédito",
    color: "#38bdf8",
    benchmark: "Índice de crédito empresarial global",
    volatility: 0.08,
    fxExposure: 0.2,
    liquidity: "Dias",
    sources: { income: 0.062, growth: 0, valuation: 0.001, drag: -0.007 },
  }),
  cls({
    id: "cash",
    label: "Mercado monetário",
    short: "Monetário",
    color: "#94a3b8",
    benchmark: "Taxa monetária de referência a 3 meses",
    volatility: 0.01,
    fxExposure: 0,
    liquidity: "Imediata",
    sources: { income: 0.038, growth: 0, valuation: 0, drag: 0 },
  }),
  cls({
    id: "re",
    label: "Imobiliário",
    short: "Imobiliário",
    color: "#4ade80",
    benchmark: "Índice imobiliário com avaliação independente",
    volatility: 0.14,
    fxExposure: 0.3,
    liquidity: "Semanas",
    sources: { income: 0.045, growth: 0.025, valuation: -0.002, drag: 0 },
  }),
  cls({
    id: "pe",
    label: "Private equity",
    short: "Private eq.",
    color: "#fbbf24",
    benchmark: "Equivalente de mercado público + prémio de iliquidez",
    volatility: 0.24,
    fxExposure: 0.3,
    liquidity: "Anos",
    sources: { income: 0, growth: 0.075, valuation: 0.035, drag: -0.008 },
  }),
  cls({
    id: "cmd",
    label: "Commodities",
    short: "Commodities",
    color: "#fb923c",
    benchmark: "Índice diversificado de commodities",
    volatility: 0.18,
    fxExposure: 0.1,
    liquidity: "Dias",
    sources: { income: 0.03, growth: 0.02, valuation: 0, drag: -0.002 },
  }),
];

export const CLASS_IDS = ASSET_CLASSES.map((c) => c.id);

export const SOURCE_LABELS: Record<keyof ReturnSources, string> = {
  income: "Rendimento",
  growth: "Crescimento",
  valuation: "Avaliação & prémios",
  drag: "Câmbio, perdas & custos",
};

/** Correlations, same order as ASSET_CLASSES. */
export const CORRELATIONS: number[][] = [
  /*         gEq   emEq   gov  credit cash   re    pe    cmd */
  /* gEq */ [1.0, 0.78, -0.1, 0.55, 0.0, 0.55, 0.75, 0.3],
  /* emEq */ [0.78, 1.0, -0.05, 0.55, 0.0, 0.5, 0.65, 0.4],
  /* gov */ [-0.1, -0.05, 1.0, 0.45, 0.15, 0.1, -0.05, -0.1],
  /* credit */ [0.55, 0.55, 0.45, 1.0, 0.05, 0.45, 0.45, 0.2],
  /* cash */ [0.0, 0.0, 0.15, 0.05, 1.0, 0.0, 0.0, 0.0],
  /* re */ [0.55, 0.5, 0.1, 0.45, 0.0, 1.0, 0.55, 0.2],
  /* pe */ [0.75, 0.65, -0.05, 0.45, 0.0, 0.55, 1.0, 0.25],
  /* cmd */ [0.3, 0.4, -0.1, 0.2, 0.0, 0.2, 0.25, 1.0],
];

/* ── Allocation ────────────────────────────────────────────────────────── */

/** Strategic (policy) benchmark — 35 / 30 / 15 / 10 / 10 of the IPS. */
export const POLICY_WEIGHTS: Record<AssetClassId, number> = {
  gEq: 0.28,
  emEq: 0.07,
  gov: 0.2,
  credit: 0.1,
  cash: 0.15,
  re: 0.1,
  pe: 0.1,
  cmd: 0,
};

/** Current portfolio, with tactical tilts. */
export const CURRENT_WEIGHTS: Record<AssetClassId, number> = {
  gEq: 0.31,
  emEq: 0.09,
  gov: 0.16,
  credit: 0.11,
  cash: 0.12,
  re: 0.09,
  pe: 0.1,
  cmd: 0.02,
};

/** Selection skill per class (annual alpha of the managers). */
export const MANAGER_ALPHA: Record<AssetClassId, number> = {
  gEq: 0.009,
  emEq: -0.006,
  gov: 0.002,
  credit: 0.006,
  cash: 0.001,
  re: 0.004,
  pe: 0.012,
  cmd: -0.004,
};

export const ANNUAL_COSTS = 0.0035;

/** Portfolio construction limits used by the optimiser. */
export const CONSTRAINTS = {
  maxPerClass: 0.4,
  maxCommodities: 0.1,
  maxIlliquid: 0.25,
};

/* ── Benchmark hierarchy + SAMURAI quality test ───────────────────────── */

export const SAMURAI = [
  { key: "S", label: "Específico" },
  { key: "A", label: "Apropriado" },
  { key: "M", label: "Mensurável" },
  { key: "U", label: "Inequívoco" },
  { key: "R", label: "Reflete o universo" },
  { key: "A2", label: "Responsabilizável" },
  { key: "I", label: "Investível" },
] as const;

export type BenchmarkLayerId =
  | "objective"
  | "policy"
  | "class"
  | "peers"
  | "risk"
  | "implementation"
  | "sustainability";

export interface BenchmarkLayer {
  id: BenchmarkLayerId;
  label: string;
  question: string;
  reference: string;
  /** SAMURAI result, same order as SAMURAI. */
  samurai: boolean[];
}

export const BENCHMARK_LAYERS: BenchmarkLayer[] = [
  {
    id: "objective",
    label: "Objetivo",
    question: "O capital está a cumprir a sua finalidade?",
    reference: "Inflação + prémio real do mandato",
    samurai: [true, true, true, true, true, true, false],
  },
  {
    id: "policy",
    label: "Estratégico",
    question: "As decisões ativas acrescentam valor à alocação aprovada?",
    reference: "Carteira de política composta por índices",
    samurai: [true, true, true, true, true, true, true],
  },
  {
    id: "class",
    label: "Por classe de ativos",
    question: "Cada gestor bate a sua referência?",
    reference: "Índice próprio por mandato de classe",
    samurai: [true, true, true, true, false, true, true],
  },
  {
    id: "peers",
    label: "Pares",
    question: "Como comparamos com instituições semelhantes?",
    reference: "Mediana de fundos com mandato comparável",
    samurai: [true, false, true, false, true, false, false],
  },
  {
    id: "risk",
    label: "Risco",
    question: "O risco assumido está dentro do orçamento?",
    reference: "Volatilidade e perdas da carteira de política",
    samurai: [true, true, true, true, true, true, true],
  },
  {
    id: "implementation",
    label: "Implementação",
    question: "Executamos as decisões ao melhor preço?",
    reference: "Preço de chegada e VWAP",
    samurai: [true, true, true, true, true, true, true],
  },
  {
    id: "sustainability",
    label: "Sustentabilidade",
    question: "A carteira respeita os compromissos de impacto?",
    reference: "Intensidade carbónica do índice global",
    samurai: [true, true, false, false, true, true, true],
  },
];

/** Observed values for layers that are not derived from the model. */
export const LAYER_OBSERVATIONS = {
  peersPercentile: 38, // 1 = best
  slippageBps: 6.4,
  slippageBudgetBps: 10,
  carbonIntensity: 118, // tCO2e / $M invested
  carbonIndex: 142,
};

/* ── Scenarios ─────────────────────────────────────────────────────────── */

export type ScenarioId = "base" | "optimistic" | "adverse" | "stress" | "structural";

export interface Scenario {
  id: ScenarioId;
  label: string;
  narrative: string;
  color: string;
  /** Additive change to each class's expected annual return. */
  shock: Record<AssetClassId, number>;
  volMultiplier: number;
  /** 0–1: how far risky assets move towards perfect correlation. */
  crisisCorrelation: number;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "base",
    label: "Base",
    narrative: "Economia próxima das premissas centrais",
    color: "#4a9eff",
    shock: { gEq: 0, emEq: 0, gov: 0, credit: 0, cash: 0, re: 0, pe: 0, cmd: 0 },
    volMultiplier: 1,
    crisisCorrelation: 0,
  },
  {
    id: "optimistic",
    label: "Otimista",
    narrative: "Produtividade e crescimento acima do esperado",
    color: "#4ade80",
    shock: {
      gEq: 0.025,
      emEq: 0.03,
      gov: -0.003,
      credit: 0.008,
      cash: 0,
      re: 0.015,
      pe: 0.03,
      cmd: 0.01,
    },
    volMultiplier: 0.9,
    crisisCorrelation: 0,
  },
  {
    id: "adverse",
    label: "Adverso",
    narrative: "Recessão, inflação persistente ou subida do prémio de risco",
    color: "#fbbf24",
    shock: {
      gEq: -0.035,
      emEq: -0.045,
      gov: 0.008,
      credit: -0.015,
      cash: -0.005,
      re: -0.025,
      pe: -0.04,
      cmd: -0.01,
    },
    volMultiplier: 1.25,
    crisisCorrelation: 0.3,
  },
  {
    id: "stress",
    label: "Stress",
    narrative: "Choque severo de mercado e de liquidez",
    color: "#f87171",
    shock: {
      gEq: -0.06,
      emEq: -0.08,
      gov: 0.012,
      credit: -0.035,
      cash: -0.01,
      re: -0.045,
      pe: -0.07,
      cmd: -0.02,
    },
    volMultiplier: 1.6,
    crisisCorrelation: 0.6,
  },
  {
    id: "structural",
    label: "Estrutural",
    narrative: "Mudança tecnológica, climática ou geopolítica duradoura",
    color: "#c084fc",
    shock: {
      gEq: -0.015,
      emEq: 0.005,
      gov: -0.015,
      credit: -0.01,
      cash: 0.005,
      re: -0.01,
      pe: 0,
      cmd: 0.03,
    },
    volMultiplier: 1.15,
    crisisCorrelation: 0.2,
  },
];

/* ── Stress tests (instant shocks) ─────────────────────────────────────── */

export interface StressTest {
  id: string;
  label: string;
  period: string;
  shock: Record<AssetClassId, number>;
}

export const STRESS_TESTS: StressTest[] = [
  {
    id: "gfc",
    label: "Crise financeira",
    period: "2008",
    shock: {
      gEq: -0.45,
      emEq: -0.55,
      gov: 0.08,
      credit: -0.15,
      cash: 0.005,
      re: -0.35,
      pe: -0.3,
      cmd: -0.4,
    },
  },
  {
    id: "covid",
    label: "Pandemia",
    period: "2020",
    shock: {
      gEq: -0.2,
      emEq: -0.24,
      gov: 0.04,
      credit: -0.08,
      cash: 0.003,
      re: -0.18,
      pe: -0.12,
      cmd: -0.22,
    },
  },
  {
    id: "inflation",
    label: "Choque inflacionista",
    period: "2022",
    shock: {
      gEq: -0.18,
      emEq: -0.2,
      gov: -0.12,
      credit: -0.14,
      cash: 0.015,
      re: -0.1,
      pe: -0.08,
      cmd: 0.18,
    },
  },
  {
    id: "em-fx",
    label: "Crise cambial emergente",
    period: "Hipotético",
    shock: {
      gEq: -0.06,
      emEq: -0.32,
      gov: -0.02,
      credit: -0.09,
      cash: 0,
      re: -0.05,
      pe: -0.06,
      cmd: -0.08,
    },
  },
  {
    id: "liquidity",
    label: "Choque de liquidez",
    period: "Hipotético",
    shock: {
      gEq: -0.12,
      emEq: -0.18,
      gov: 0.02,
      credit: -0.1,
      cash: 0,
      re: -0.22,
      pe: -0.25,
      cmd: -0.1,
    },
  },
];

/* ── Forecast registry (12-month return forecasts, made quarterly) ─────── */

export interface ForecastRecord {
  quarter: string;
  central: number;
  low: number;
  high: number;
  realized: number;
}

export const FORECAST_REGISTRY: ForecastRecord[] = [
  { quarter: "3T24", central: 0.068, low: -0.02, high: 0.15, realized: 0.091 },
  { quarter: "4T24", central: 0.064, low: -0.025, high: 0.145, realized: 0.052 },
  { quarter: "1T25", central: 0.059, low: -0.03, high: 0.14, realized: -0.018 },
  { quarter: "2T25", central: 0.052, low: -0.04, high: 0.13, realized: 0.071 },
  { quarter: "3T25", central: 0.066, low: -0.02, high: 0.15, realized: 0.108 },
  { quarter: "4T25", central: 0.071, low: -0.015, high: 0.155, realized: 0.083 },
  { quarter: "1T26", central: 0.069, low: -0.02, high: 0.15, realized: 0.047 },
  { quarter: "2T26", central: 0.064, low: -0.025, high: 0.145, realized: 0.066 },
];

/** Simple alternatives every model must beat. */
export const NAIVE_FORECASTS: { id: string; label: string; forecasts: number[] }[] = [
  {
    id: "hist",
    label: "Média histórica",
    forecasts: [0.075, 0.075, 0.075, 0.075, 0.075, 0.075, 0.075, 0.075],
  },
  {
    id: "6040",
    label: "Carteira 60/40",
    forecasts: [0.082, 0.071, 0.064, 0.043, 0.058, 0.079, 0.084, 0.061],
  },
  {
    id: "equal",
    label: "Pesos iguais",
    forecasts: [0.061, 0.088, 0.069, 0.012, 0.04, 0.092, 0.081, 0.052],
  },
  {
    id: "rf",
    label: "Taxa sem risco",
    forecasts: [0.052, 0.049, 0.045, 0.043, 0.042, 0.04, 0.04, 0.04],
  },
];

/* ── Data quality ──────────────────────────────────────────────────────── */

export interface DataDomain {
  id: string;
  label: string;
  score: number; // 0–100
  updated: string;
  owner: string;
  weight: number;
}

export const DATA_DOMAINS: DataDomain[] = [
  {
    id: "market",
    label: "Mercado",
    score: 97,
    updated: "há 2 min",
    owner: "Market Data",
    weight: 0.3,
  },
  {
    id: "macro",
    label: "Macroeconómicos",
    score: 88,
    updated: "há 3 dias",
    owner: "Research",
    weight: 0.2,
  },
  {
    id: "fundamentals",
    label: "Fundamentais",
    score: 91,
    updated: "há 1 dia",
    owner: "Research",
    weight: 0.2,
  },
  {
    id: "internal",
    label: "Internos",
    score: 99,
    updated: "há 5 min",
    owner: "Operações",
    weight: 0.2,
  },
  {
    id: "alternative",
    label: "Alternativos",
    score: 72,
    updated: "há 9 dias",
    owner: "Data Science",
    weight: 0.1,
  },
];

/* ── Governance ────────────────────────────────────────────────────────── */

export const CADENCE: { rhythm: string; next: string; focus: string }[] = [
  { rhythm: "Diária", next: "28 set 2026", focus: "Posições, liquidez, limites e exceções" },
  { rhythm: "Semanal", next: "2 out 2026", focus: "Exposições, desempenho tático e cenários" },
  { rhythm: "Mensal", next: "31 out 2026", focus: "Atribuição, custos e revisão das previsões" },
  {
    rhythm: "Trimestral",
    next: "31 dez 2026",
    focus: "Premissas de mercado, stress tests e rebalanceamento",
  },
  {
    rhythm: "Anual",
    next: "31 mar 2027",
    focus: "Mandato, benchmark estratégico e política de risco",
  },
];

export const INDEPENDENCE: { a: string; b: string }[] = [
  { a: "Quem cria o modelo", b: "quem o valida" },
  { a: "Quem decide", b: "quem mede o resultado" },
  { a: "Quem executa", b: "quem confirma o cumprimento" },
];

export const GOVERNANCE_ROLES: { role: string; duty: string }[] = [
  { role: "Conselho", duty: "Aprova o mandato e a tolerância ao risco" },
  { role: "Comité de Investimentos", duty: "Aprova benchmarks, premissas e alocação" },
  { role: "CIO", duty: "Responsável pela decisão de investimento" },
  { role: "Risk Management", duty: "Desafia modelos e controla limites" },
  { role: "Model Validation", duty: "Valida metodologias de forma independente" },
  { role: "Performance Team", duty: "Calcula resultados e atribuição" },
];
