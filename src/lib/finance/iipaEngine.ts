/**
 * iipaEngine.ts — projection, portfolio and control engine of the IIPA.
 *
 * Pure functions: every input arrives by parameter (types only are imported),
 * results are deterministic for a given seed. The UI shows the outputs as
 * plain-language results; nothing here is rendered as a formula.
 */
import type {
  AssetClass,
  AssetClassId,
  DataDomain,
  ForecastRecord,
  Mandate,
  Scenario,
  StressTest,
} from "./iipaData";

export type Weights = Record<AssetClassId, number>;
type Vec = number[];
type Mat = number[][];

/* ── Numerics ──────────────────────────────────────────────────────────── */

/** Small, fast, seedable PRNG (mulberry32). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard-normal generator (Box–Muller with spare). */
function normalGen(rand: () => number) {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    while (u === 0) u = rand();
    const v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
}

export function normCdf(x: number) {
  // Abramowitz & Stegun 7.1.26
  const t = 1 / (1 + (0.3275911 * Math.abs(x)) / Math.SQRT2);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export function cholesky(m: Mat): Mat | null {
  const n = m.length;
  const L: Mat = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = m[i]![j]!;
      for (let k = 0; k < j; k++) sum -= L[i]![k]! * L[j]![k]!;
      if (i === j) {
        if (sum <= 0) return null;
        L[i]![j] = Math.sqrt(sum);
      } else {
        L[i]![j] = sum / L[j]![j]!;
      }
    }
  }
  return L;
}

const dot = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + x * b[i]!, 0);
const matVec = (m: Mat, v: Vec) => m.map((row) => dot(row, v));

function percentileSorted(sorted: Float64Array | number[], p: number) {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[idx]!;
}

const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return percentileSorted(s, 0.5);
};

/* ── Universe helpers ──────────────────────────────────────────────────── */

export interface Universe {
  classes: AssetClass[];
  ids: AssetClassId[];
  mu: Vec;
  sigma: Vec;
  corr: Mat;
  cov: Mat;
}

export function buildUniverse(classes: AssetClass[], corr: Mat): Universe {
  const sigma = classes.map((c) => c.volatility);
  return {
    classes,
    ids: classes.map((c) => c.id),
    mu: classes.map((c) => c.expectedReturn),
    sigma,
    corr,
    cov: corr.map((row, i) => row.map((r, j) => r * sigma[i]! * sigma[j]!)),
  };
}

export const toVec = (u: Universe, w: Weights) => u.ids.map((id) => w[id] ?? 0);
export const toWeights = (u: Universe, v: Vec) =>
  Object.fromEntries(u.ids.map((id, i) => [id, v[i]!])) as Weights;

/** Universe under a scenario: shifted returns, scaled vols, crisis correlation. */
export function scenarioUniverse(u: Universe, s: Scenario): Universe {
  const risky = u.ids.map((id) => id !== "cash" && id !== "gov");
  const corr = u.corr.map((row, i) =>
    row.map((r, j) =>
      i === j
        ? 1
        : risky[i] && risky[j]
          ? r + s.crisisCorrelation * (1 - r)
          : r * (1 - s.crisisCorrelation),
    ),
  );
  const classes = u.classes.map((c) => ({
    ...c,
    expectedReturn: c.expectedReturn + s.shock[c.id],
    volatility: c.volatility * s.volMultiplier,
  }));
  return buildUniverse(classes, corr);
}

/* ── Portfolio statistics ──────────────────────────────────────────────── */

export interface PortfolioStats {
  ret: number;
  vol: number;
  sharpe: number;
  /** Share of total risk contributed by each class (sums to 1). */
  riskShare: Vec;
}

export function portfolioStats(u: Universe, w: Vec, riskFree: number): PortfolioStats {
  const sw = matVec(u.cov, w);
  const variance = Math.max(1e-12, dot(w, sw));
  const vol = Math.sqrt(variance);
  const ret = dot(w, u.mu);
  return {
    ret,
    vol,
    sharpe: (ret - riskFree) / vol,
    riskShare: w.map((wi, i) => (wi * sw[i]!) / variance),
  };
}

/** Tracking error and information ratio versus a reference allocation. */
export function relativeStats(u: Universe, wp: Vec, wb: Vec) {
  const d = wp.map((x, i) => x - wb[i]!);
  const te = Math.sqrt(Math.max(0, dot(d, matVec(u.cov, d))));
  const active = dot(d, u.mu);
  return { trackingError: te, activeReturn: active, informationRatio: te > 0 ? active / te : 0 };
}

/* Lognormal approximations used where a closed form is enough. */
const logDrift = (mu: number, sigma: number) => Math.log(1 + mu) - (sigma * sigma) / 2;

/** Probability that wealth compounds at least at `target` p.a. over `years`. */
export function probReach(mu: number, sigma: number, years: number, target: number) {
  const z =
    (years * Math.log(1 + target) - years * logDrift(mu, sigma)) / (sigma * Math.sqrt(years));
  return 1 - normCdf(z);
}

/** 1-year return at a given standard-normal quantile (e.g. -1.645 → 5th pct). */
export const yearReturnAt = (mu: number, sigma: number, z: number) =>
  Math.exp(logDrift(mu, sigma) + z * sigma) - 1;

/** Mean 1-year return in the worst 5% of outcomes. */
export function expectedShortfall1y(mu: number, sigma: number) {
  const m = logDrift(mu, sigma);
  const a = m - 1.6449 * sigma;
  const tail = normCdf((a - m - sigma * sigma) / sigma) / normCdf((a - m) / sigma);
  return Math.exp(m + (sigma * sigma) / 2) * tail - 1;
}

/** Annual real return reachable with the given confidence over `years`. */
export function attainableReturn(mu: number, sigma: number, years: number, confidence: number) {
  // z such that P(Z > z) = confidence
  let lo = -5;
  let hi = 5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (1 - normCdf(mid) > confidence) lo = mid;
    else hi = mid;
  }
  const z = (lo + hi) / 2;
  return Math.exp(logDrift(mu, sigma) + (z * sigma) / Math.sqrt(years)) - 1;
}

/* ── Monte Carlo ───────────────────────────────────────────────────────── */

export interface FanPoint {
  t: number; // years
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  target: number;
}

export interface MonteCarloResult {
  years: number;
  paths: number;
  fan: FanPoint[];
  terminal: { p5: number; p25: number; p50: number; p75: number; p95: number };
  probTarget: number;
  probLoss: number;
  /** Probability that the first 12 months lose more than the mandate tolerance. */
  prob12mBreach: number;
  /** Mean annualised return of the worst 5% of paths. */
  shortfallReturn: number;
  medianReturn: number;
  medianMaxDrawdown: number;
  badMaxDrawdown: number; // 90th percentile
  medianRecoveryMonths: number;
  /** Distribution of first-year returns (for the loss histogram). */
  firstYear: number[];
}

export function monteCarlo(p: {
  mu: number;
  sigma: number;
  years: number;
  paths: number;
  seed: number;
  capital: number;
  target: number;
  maxLoss12m: number;
}): MonteCarloResult {
  const { mu, sigma, years, paths, capital, target } = p;
  const steps = Math.max(1, Math.round(years * 12));
  const every = years <= 2 ? 1 : 12;
  const points = Math.floor(steps / every) + 1;
  const drift = logDrift(mu, sigma) / 12;
  const vol = sigma / Math.sqrt(12);
  const gauss = normalGen(mulberry32(p.seed));

  const grid = new Float64Array(paths * points);
  const terminal = new Float64Array(paths);
  const firstYear: number[] = [];
  const maxDDs: number[] = [];
  const recoveries: number[] = [];

  for (let k = 0; k < paths; k++) {
    let v = capital;
    let peak = capital;
    let maxDD = 0;
    let ddPeak = 0;
    let trough = 0;
    let recoveredAt = -1;
    grid[k * points] = v;
    for (let s = 1; s <= steps; s++) {
      v *= Math.exp(drift + vol * gauss());
      if (v > peak) peak = v;
      const dd = 1 - v / peak;
      if (dd > maxDD) {
        maxDD = dd;
        ddPeak = peak;
        trough = s;
        recoveredAt = -1;
      } else if (recoveredAt < 0 && ddPeak > 0 && v >= ddPeak) {
        recoveredAt = s;
      }
      if (s === 12) firstYear.push(v / capital - 1);
      if (s % every === 0) grid[k * points + s / every] = v;
    }
    terminal[k] = v;
    maxDDs.push(maxDD);
    if (maxDD > 0.1) recoveries.push((recoveredAt > 0 ? recoveredAt : steps) - trough);
  }

  const fan: FanPoint[] = [];
  const col = new Float64Array(paths);
  for (let j = 0; j < points; j++) {
    for (let k = 0; k < paths; k++) col[k] = grid[k * points + j]!;
    col.sort();
    const t = (j * every) / 12;
    fan.push({
      t,
      p5: percentileSorted(col, 0.05),
      p25: percentileSorted(col, 0.25),
      p50: percentileSorted(col, 0.5),
      p75: percentileSorted(col, 0.75),
      p95: percentileSorted(col, 0.95),
      target: capital * Math.pow(1 + target, t),
    });
  }

  const sortedT = Float64Array.from(terminal).sort();
  const goal = capital * Math.pow(1 + target, years);
  let hit = 0;
  let loss = 0;
  for (const v of sortedT) {
    if (v >= goal) hit++;
    if (v < capital) loss++;
  }
  const annualise = (v: number) => Math.pow(v / capital, 1 / years) - 1;
  const tailN = Math.max(1, Math.floor(paths * 0.05));
  let tailSum = 0;
  for (let i = 0; i < tailN; i++) tailSum += annualise(sortedT[i]!);
  const sortedDD = [...maxDDs].sort((a, b) => a - b);

  return {
    years,
    paths,
    fan,
    terminal: {
      p5: percentileSorted(sortedT, 0.05),
      p25: percentileSorted(sortedT, 0.25),
      p50: percentileSorted(sortedT, 0.5),
      p75: percentileSorted(sortedT, 0.75),
      p95: percentileSorted(sortedT, 0.95),
    },
    probTarget: hit / paths,
    probLoss: loss / paths,
    prob12mBreach: firstYear.length
      ? firstYear.filter((r) => r < -p.maxLoss12m).length / firstYear.length
      : 0,
    shortfallReturn: tailSum / tailN,
    medianReturn: annualise(percentileSorted(sortedT, 0.5)),
    medianMaxDrawdown: percentileSorted(sortedDD, 0.5),
    badMaxDrawdown: percentileSorted(sortedDD, 0.9),
    medianRecoveryMonths: median(recoveries),
    firstYear,
  };
}

/* ── Scenarios & stress ────────────────────────────────────────────────── */

export interface ScenarioResult {
  id: Scenario["id"];
  label: string;
  narrative: string;
  color: string;
  ret: number;
  vol: number;
  probTarget: number;
  badYear: number;
  maxDrawdown: number;
  medianTerminal: number;
}

export function runScenarios(
  u: Universe,
  w: Vec,
  scenarios: Scenario[],
  mandate: Mandate,
  target: number,
): ScenarioResult[] {
  return scenarios.map((s, i) => {
    const su = scenarioUniverse(u, s);
    const st = portfolioStats(su, w, mandate.riskFree);
    const mc = monteCarlo({
      mu: st.ret,
      sigma: st.vol,
      years: mandate.horizonYears,
      paths: 600,
      seed: 7_001 + i * 97,
      capital: mandate.capitalUsd,
      target,
      maxLoss12m: mandate.maxLoss12m,
    });
    return {
      id: s.id,
      label: s.label,
      narrative: s.narrative,
      color: s.color,
      ret: st.ret,
      vol: st.vol,
      probTarget: mc.probTarget,
      badYear: yearReturnAt(st.ret, st.vol, -1.6449),
      maxDrawdown: mc.medianMaxDrawdown,
      medianTerminal: mc.terminal.p50,
    };
  });
}

export interface StressResult {
  id: string;
  label: string;
  period: string;
  loss: number;
  lossUsd: number;
  byClass: { id: AssetClassId; impact: number }[];
  breach: boolean;
}

export function stressTests(
  u: Universe,
  w: Vec,
  tests: StressTest[],
  mandate: Mandate,
): StressResult[] {
  return tests.map((t) => {
    const byClass = u.ids.map((id, i) => ({ id, impact: w[i]! * t.shock[id] }));
    const loss = byClass.reduce((s, c) => s + c.impact, 0);
    return {
      id: t.id,
      label: t.label,
      period: t.period,
      loss,
      lossUsd: loss * mandate.capitalUsd,
      byClass,
      breach: loss < -mandate.maxLoss12m,
    };
  });
}

/* ── Portfolio construction ────────────────────────────────────────────── */

export interface ConstructionLimits {
  maxPerClass: number;
  maxCommodities: number;
  maxIlliquid: number;
}

export function fxExposure(u: Universe, w: Vec) {
  return u.classes.reduce((s, c, i) => s + w[i]! * c.fxExposure, 0);
}

export function liquidShare(u: Universe, w: Vec) {
  return u.ids.reduce((s, id, i) => s + (id === "cash" || id === "gov" ? w[i]! : 0), 0);
}

function isCompliant(u: Universe, w: Vec, m: Mandate, lim: ConstructionLimits) {
  const idx = (id: AssetClassId) => u.ids.indexOf(id);
  if (w.some((x) => x < -1e-9 || x > lim.maxPerClass + 1e-9)) return false;
  if (w[idx("cmd")]! > lim.maxCommodities + 1e-9) return false;
  if (w[idx("re")]! + w[idx("pe")]! > lim.maxIlliquid + 1e-9) return false;
  if (liquidShare(u, w) < m.minLiquidity - 1e-9) return false;
  if (fxExposure(u, w) > m.maxFxUnhedged + 1e-9) return false;
  return true;
}

export type MethodId =
  | "goals"
  | "maxSharpe"
  | "minVar"
  | "riskParity"
  | "policy"
  | "current"
  | "equal"
  | "sixtyForty";

export interface MethodResult {
  id: MethodId;
  label: string;
  purpose: string;
  weights: Weights;
  ret: number;
  vol: number;
  sharpe: number;
  probTarget: number;
  badYear: number;
  compliant: boolean;
}

export interface OptimizationResult {
  cloud: { vol: number; ret: number }[];
  frontier: { vol: number; ret: number }[];
  methods: MethodResult[];
  recommended: MethodResult;
}

export function optimize(
  u: Universe,
  current: Vec,
  policy: Vec,
  mandate: Mandate,
  lim: ConstructionLimits,
  target: number,
  seed = 20_261,
): OptimizationResult {
  const rand = mulberry32(seed);
  const n = u.ids.length;
  const H = mandate.horizonYears;
  const stat = (w: Vec) => portfolioStats(u, w, mandate.riskFree);
  const withinLoss = (s: PortfolioStats) =>
    yearReturnAt(s.ret, s.vol, -1.6449) >= -mandate.maxLoss12m;

  // 1. Feasible cloud (Dirichlet(1) with rejection).
  const samples: Vec[] = [];
  for (let tries = 0; samples.length < 1000 && tries < 25_000; tries++) {
    const g = Array.from({ length: n }, () => -Math.log(1 - rand()));
    const sum = g.reduce((a, b) => a + b, 0);
    const w = g.map((x) => x / sum);
    if (isCompliant(u, w, mandate, lim)) samples.push(w);
  }
  const stats = samples.map(stat);

  // 2. Local search that keeps every step inside the mandate.
  const climb = (start: Vec, score: (w: Vec) => number) => {
    let best = [...start];
    let bestScore = score(best);
    for (let it = 0; it < 500; it++) {
      const i = Math.floor(rand() * n);
      const j = Math.floor(rand() * n);
      if (i === j) continue;
      const step = Math.min(best[i]!, 0.005 + rand() * 0.025);
      if (step <= 0) continue;
      const cand = [...best];
      cand[i] = cand[i]! - step;
      cand[j] = cand[j]! + step;
      if (!isCompliant(u, cand, mandate, lim)) continue;
      const s = score(cand);
      if (s > bestScore) {
        best = cand;
        bestScore = s;
      }
    }
    return best;
  };
  const argBest = (score: (w: Vec, s: PortfolioStats) => number) => {
    let bi = 0;
    let bv = -Infinity;
    samples.forEach((w, i) => {
      const v = score(w, stats[i]!);
      if (v > bv) {
        bv = v;
        bi = i;
      }
    });
    return samples[bi] ?? policy;
  };

  const goalsScore = (w: Vec) => {
    const s = stat(w);
    return probReach(s.ret, s.vol, H, target) - (withinLoss(s) ? 0 : 1);
  };
  const sharpeScore = (w: Vec) => stat(w).sharpe;
  const minVarScore = (w: Vec) => -stat(w).vol;

  const goals = climb(
    argBest((w) => goalsScore(w)),
    goalsScore,
  );
  const maxSharpe = climb(
    argBest((_, s) => s.sharpe),
    sharpeScore,
  );
  const minVar = climb(
    argBest((_, s) => -s.vol),
    minVarScore,
  );

  // Risk parity (iterative), then clipped to the per-class cap.
  let rp = u.sigma.map((s) => 1 / s);
  for (let it = 0; it < 300; it++) {
    const total = rp.reduce((a, b) => a + b, 0);
    rp = rp.map((x) => x / total);
    const sw = matVec(u.cov, rp);
    const rc = rp.map((x, i) => x * sw[i]!);
    const avg = rc.reduce((a, b) => a + b, 0) / n;
    rp = rp.map((x, i) => x * Math.sqrt(avg / Math.max(1e-12, rc[i]!)));
  }
  for (let it = 0; it < 20; it++) {
    const total = rp.reduce((a, b) => a + b, 0);
    rp = rp.map((x) => Math.min(lim.maxPerClass, x / total));
  }
  const rpTotal = rp.reduce((a, b) => a + b, 0);
  rp = rp.map((x) => x / rpTotal);

  const equal = new Array<number>(n).fill(1 / n);
  const sixtyForty = u.ids.map((id) => (id === "gEq" ? 0.6 : id === "gov" ? 0.4 : 0));

  const make = (id: MethodId, label: string, purpose: string, w: Vec): MethodResult => {
    const s = stat(w);
    return {
      id,
      label,
      purpose,
      weights: toWeights(u, w),
      ret: s.ret,
      vol: s.vol,
      sharpe: s.sharpe,
      probTarget: probReach(s.ret, s.vol, H, target),
      badYear: yearReturnAt(s.ret, s.vol, -1.6449),
      compliant: isCompliant(u, w, mandate, lim) && withinLoss(s),
    };
  };

  const methods: MethodResult[] = [
    make(
      "goals",
      "Orientada ao objetivo",
      "Maximiza a probabilidade de cumprir a meta dentro do mandato",
      goals,
    ),
    make(
      "maxSharpe",
      "Máximo retorno por risco",
      "Melhor compensação por unidade de risco",
      maxSharpe,
    ),
    make("minVar", "Mínima volatilidade", "A trajetória mais estável possível", minVar),
    make("riskParity", "Paridade de risco", "Cada classe contribui igualmente para o risco", rp),
    make("policy", "Alocação estratégica", "Carteira de política aprovada pelo Comité", policy),
    make("current", "Carteira atual", "Posições em vigor hoje", current),
    make("equal", "Pesos iguais", "Referência ingénua", equal),
    make("sixtyForty", "Carteira 60/40", "Referência clássica", sixtyForty),
  ];

  // Efficient frontier: upper envelope of the cloud by volatility bucket.
  const buckets = new Map<number, { vol: number; ret: number }>();
  stats.forEach((s) => {
    const b = Math.round(s.vol * 400);
    const cur = buckets.get(b);
    if (!cur || s.ret > cur.ret) buckets.set(b, { vol: s.vol, ret: s.ret });
  });
  const envelope = [...buckets.values()].sort((a, b) => a.vol - b.vol);
  const frontier: { vol: number; ret: number }[] = [];
  let bestRet = -Infinity;
  for (const p of envelope) {
    if (p.ret > bestRet) {
      frontier.push(p);
      bestRet = p.ret;
    }
  }

  const cloud = stats.filter((_, i) => i % 2 === 0).map((s) => ({ vol: s.vol, ret: s.ret }));
  return { cloud, frontier, methods, recommended: methods[0]! };
}

/* ── Performance & attribution ─────────────────────────────────────────── */

export interface AttributionResult {
  series: { label: string; portfolio: number; policy: number; objective: number }[];
  effects: {
    allocation: number;
    selection: number;
    interaction: number;
    currency: number;
    costs: number;
  };
  byClass: { id: AssetClassId; allocation: number; selection: number }[];
  metrics: {
    portfolioReturn: number;
    policyReturn: number;
    activeReturn: number;
    trackingError: number;
    informationRatio: number;
    sharpe: number;
    alpha: number;
    beta: number;
    volatility: number;
    maxDrawdown: number;
  };
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function attribution(p: {
  u: Universe;
  wp: Vec;
  wb: Vec;
  alpha: Vec;
  costs: number;
  target: number;
  riskFree: number;
  months?: number;
  endYear?: number;
  endMonth?: number; // 0-based
  seed?: number;
}): AttributionResult {
  const { u, wp, wb, alpha, costs, target, riskFree } = p;
  const months = p.months ?? 36;
  const n = u.ids.length;
  const L = cholesky(u.corr)!;
  const gauss = normalGen(mulberry32(p.seed ?? 3_141));
  const mMean = u.mu.map((m) => Math.pow(1 + m, 1 / 12) - 1);
  const mSd = u.sigma.map((s) => s / Math.sqrt(12));
  const objMonthly = Math.pow(1 + target, 1 / 12) - 1;
  const d = wp.map((x, i) => x - wb[i]!);

  let cumP = 1;
  let cumB = 1;
  let cumO = 1;
  let peak = 1;
  let maxDD = 0;
  const rpS: number[] = [];
  const rbS: number[] = [];
  const effects = { allocation: 0, selection: 0, interaction: 0, currency: 0, costs: 0 };
  const byClass = u.ids.map((id) => ({ id, allocation: 0, selection: 0 }));
  const series: AttributionResult["series"] = [];

  const endYear = p.endYear ?? 2026;
  const endMonth = p.endMonth ?? 8;

  for (let t = 0; t < months; t++) {
    const z = Array.from({ length: n }, () => gauss());
    const corrZ = matVec(L, z);
    const rb = mMean.map((m, i) => m + mSd[i]! * corrZ[i]!);
    const rpc = rb.map((r, i) => r + alpha[i]! / 12 + 0.004 * gauss());
    const fxMove = 0.02 * gauss();

    const Rb = dot(wb, rb);
    let alloc = 0;
    let sel = 0;
    let inter = 0;
    for (let i = 0; i < n; i++) {
      const a = d[i]! * (rb[i]! - Rb);
      const s = wb[i]! * (rpc[i]! - rb[i]!);
      alloc += a;
      sel += s;
      inter += d[i]! * (rpc[i]! - rb[i]!);
      byClass[i]!.allocation += a;
      byClass[i]!.selection += s;
    }
    const currency = u.classes.reduce((s, c, i) => s + d[i]! * c.fxExposure, 0) * fxMove;
    const cost = -costs / 12;
    const Rp = dot(wp, rpc) + currency + cost;

    effects.allocation += alloc;
    effects.selection += sel;
    effects.interaction += inter;
    effects.currency += currency;
    effects.costs += cost;

    cumP *= 1 + Rp;
    cumB *= 1 + Rb;
    cumO *= 1 + objMonthly;
    peak = Math.max(peak, cumP);
    maxDD = Math.max(maxDD, 1 - cumP / peak);
    rpS.push(Rp);
    rbS.push(Rb);

    const monthIndex = (((endMonth - (months - 1 - t)) % 12) + 12) % 12;
    const yearOffset = Math.floor((endMonth - (months - 1 - t)) / 12);
    series.push({
      label: `${MONTHS[monthIndex]} ${String(endYear + yearOffset).slice(2)}`,
      portfolio: cumP - 1,
      policy: cumB - 1,
      objective: cumO - 1,
    });
  }

  const years = months / 12;
  const annual = (cum: number) => Math.pow(cum, 1 / years) - 1;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const std = (xs: number[]) => {
    const m = mean(xs);
    return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
  };
  const active = rpS.map((r, i) => r - rbS[i]!);
  const te = std(active) * Math.sqrt(12);
  const vol = std(rpS) * Math.sqrt(12);
  const mp = mean(rpS);
  const mb = mean(rbS);
  const cov = rpS.reduce((s, r, i) => s + (r - mp) * (rbS[i]! - mb), 0) / (rpS.length - 1);
  const beta = cov / std(rbS) ** 2;
  const portfolioReturn = annual(cumP);
  const policyReturn = annual(cumB);
  const scale = 1 / years;

  return {
    series,
    effects: {
      allocation: effects.allocation * scale,
      selection: effects.selection * scale,
      interaction: effects.interaction * scale,
      currency: effects.currency * scale,
      costs: effects.costs * scale,
    },
    byClass: byClass.map((c) => ({
      ...c,
      allocation: c.allocation * scale,
      selection: c.selection * scale,
    })),
    metrics: {
      portfolioReturn,
      policyReturn,
      activeReturn: portfolioReturn - policyReturn,
      trackingError: te,
      informationRatio: te > 0 ? (portfolioReturn - policyReturn) / te : 0,
      sharpe: (portfolioReturn - riskFree) / vol,
      alpha: portfolioReturn - (riskFree + beta * (policyReturn - riskFree)),
      beta,
      volatility: vol,
      maxDrawdown: maxDD,
    },
  };
}

/* ── Forecast validation ───────────────────────────────────────────────── */

export interface ForecastScore {
  id: string;
  label: string;
  isModel: boolean;
  mae: number;
  hitRate: number;
  coverage: number | null;
}

export function forecastValidation(
  registry: ForecastRecord[],
  naive: { id: string; label: string; forecasts: number[] }[],
  riskFree: number,
): { ranking: ForecastScore[]; modelRank: number; beatenBy: string[] } {
  const realized = registry.map((r) => r.realized);
  const score = (
    id: string,
    label: string,
    f: number[],
    isModel: boolean,
    coverage: number | null,
  ) => ({
    id,
    label,
    isModel,
    mae: f.reduce((s, x, i) => s + Math.abs(x - realized[i]!), 0) / f.length,
    hitRate:
      f.filter((x, i) => x - riskFree >= 0 === realized[i]! - riskFree >= 0).length / f.length,
    coverage,
  });
  const inside = registry.filter((r) => r.realized >= r.low && r.realized <= r.high).length;
  const ranking = [
    score(
      "model",
      "Modelo IIPA",
      registry.map((r) => r.central),
      true,
      inside / registry.length,
    ),
    ...naive.map((nv) => score(nv.id, nv.label, nv.forecasts, false, null)),
  ].sort((a, b) => a.mae - b.mae);
  const modelRank = ranking.findIndex((r) => r.isModel) + 1;
  return { ranking, modelRank, beatenBy: ranking.slice(0, modelRank - 1).map((r) => r.label) };
}

/* ── Data quality ──────────────────────────────────────────────────────── */

export function dataQuality(domains: DataDomain[], minimum: number) {
  const wsum = domains.reduce((s, d) => s + d.weight, 0);
  const score = domains.reduce((s, d) => s + d.score * d.weight, 0) / wsum;
  const weakest = [...domains].sort((a, b) => a.score - b.score)[0]!;
  return { score, publishable: score >= minimum, weakest };
}

/* ── Alerts & escalation ───────────────────────────────────────────────── */

export type AlertLevel = "green" | "amber" | "red" | "black";

export interface Alert {
  id: string;
  title: string;
  value: string;
  limit: string;
  /** Position vs limit, 0 = comfortable, 1 = at the limit. */
  usage: number;
  level: AlertLevel;
  owner: string;
  action: string;
}

export const LEVEL_RANK: Record<AlertLevel, number> = { green: 0, amber: 1, red: 2, black: 3 };

/** Usage of a limit → traffic light. `usage` = value / limit (or inverse for floors). */
export function levelFor(usage: number): AlertLevel {
  if (usage < 0.8) return "green";
  if (usage <= 1) return "amber";
  if (usage <= 2) return "red";
  return "black";
}

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

export function evaluateAlerts(a: {
  mandate: Mandate;
  maxDrift: number;
  driftClass: string;
  trackingError: number;
  badYear: number;
  dataScore: number;
  modelBeatenBy: string[];
  liquidity: number;
  fx: number;
  issuerMax: number;
  issuerName: string;
  worstStress: StressResult;
}): Alert[] {
  const m = a.mandate;
  const rules: Omit<Alert, "level">[] = [
    {
      id: "drift",
      title: "Desvio face à alocação estratégica",
      value: `${pct(a.maxDrift)} em ${a.driftClass}`,
      limit: `máx. ${pct(m.maxDrift, 0)}`,
      usage: a.maxDrift / m.maxDrift,
      owner: "Portfolio Managers",
      action: a.maxDrift > m.maxDrift ? "Analisar rebalanceamento" : "Dentro da banda aprovada",
    },
    {
      id: "te",
      title: "Distância ao benchmark estratégico",
      value: pct(a.trackingError, 2),
      limit: `máx. ${pct(m.maxTrackingError, 0)}`,
      usage: a.trackingError / m.maxTrackingError,
      owner: "Risk Committee",
      action:
        a.trackingError > m.maxTrackingError
          ? "Escalar ao Risk Committee"
          : "Dentro do orçamento de risco",
    },
    {
      id: "loss",
      title: "Perda provável num ano mau",
      value: pct(-a.badYear),
      limit: `tolerância ${pct(m.maxLoss12m, 0)}`,
      usage: -a.badYear / m.maxLoss12m,
      owner: "CIO",
      action:
        -a.badYear > m.maxLoss12m
          ? "Suspender aumento de risco e correr stress extraordinário"
          : "Risco dentro da tolerância do mandato",
    },
    {
      id: "stress",
      title: `Pior cenário extremo · ${a.worstStress.label}`,
      value: pct(-a.worstStress.loss),
      limit: `tolerância ${pct(m.maxLoss12m, 0)}`,
      usage: -a.worstStress.loss / m.maxLoss12m,
      owner: "Comité de Investimentos",
      action: a.worstStress.breach
        ? "Definir coberturas para este cenário"
        : "Carteira resiliente ao choque",
    },
    {
      id: "liquidity",
      title: "Liquidez imediata",
      value: pct(a.liquidity, 0),
      limit: `mín. ${pct(m.minLiquidity, 0)}`,
      usage: m.minLiquidity / Math.max(0.001, a.liquidity),
      owner: "Tesouraria",
      action:
        a.liquidity < m.minLiquidity ? "Repor liquidez mínima" : "Cobertura de liquidez assegurada",
    },
    {
      id: "fx",
      title: "Exposição cambial não coberta",
      value: pct(a.fx),
      limit: `máx. ${pct(m.maxFxUnhedged, 0)}`,
      usage: a.fx / m.maxFxUnhedged,
      owner: "Risk Management",
      action: a.fx > m.maxFxUnhedged ? "Reforçar cobertura cambial" : "Dentro do limite",
    },
    {
      id: "issuer",
      title: "Concentração por emitente",
      value: `${pct(a.issuerMax)} · ${a.issuerName}`,
      limit: `máx. ${pct(m.maxIssuer, 0)}`,
      usage: a.issuerMax / m.maxIssuer,
      owner: "Compliance",
      action: a.issuerMax > m.maxIssuer ? "Reduzir posição" : "Diversificação adequada",
    },
    {
      id: "model",
      title: "Modelo vs alternativas simples",
      value: a.modelBeatenBy.length ? `superado por ${a.modelBeatenBy.length}` : "1.º lugar",
      limit: "deve liderar",
      usage: a.modelBeatenBy.length ? 0.9 + a.modelBeatenBy.length * 0.15 : 0.3,
      owner: "Model Validation",
      action: a.modelBeatenBy.length ? "Colocar modelo sob revisão" : "Modelo validado",
    },
  ];

  const alerts: Alert[] = rules.map((r) => ({ ...r, level: levelFor(r.usage) }));
  alerts.push({
    id: "data",
    title: "Qualidade dos dados",
    value: `${a.dataScore.toFixed(0)}/100`,
    limit: `mín. ${m.minDataQuality}`,
    usage: m.minDataQuality / Math.max(1, a.dataScore),
    level:
      a.dataScore < m.minDataQuality
        ? "black"
        : a.dataScore < m.minDataQuality + 5
          ? "amber"
          : "green",
    owner: "Data Office",
    action:
      a.dataScore < m.minDataQuality
        ? "Publicação de projeções bloqueada"
        : "Projeções publicáveis",
  });
  return alerts.sort((x, y) => LEVEL_RANK[y.level] - LEVEL_RANK[x.level] || y.usage - x.usage);
}
