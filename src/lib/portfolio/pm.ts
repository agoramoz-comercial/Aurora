/**
 * Portfolio Management engine — pure functions (spec: docs/prompts/PORTFOLIO-MANAGEMENT.md §4).
 * Prices are a deterministic simulation; nothing here is live market data.
 */

export type AssetClass =
  | "acoesEUA"
  | "acoesIntl"
  | "obrigacoes"
  | "imobiliario"
  | "ouro"
  | "liquidez";
export type Factor = "acoes" | "juros" | "usd" | "tecnologia" | "commodities";

export const CLASS_LABEL: Record<AssetClass, string> = {
  acoesEUA: "Ações EUA",
  acoesIntl: "Ações internacionais",
  obrigacoes: "Obrigações",
  imobiliario: "Imobiliário (REIT)",
  ouro: "Ouro",
  liquidez: "Liquidez",
};

export interface Security {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  /** Diversified fund/ETF (higher concentration limit) vs single company. */
  fund?: boolean;
  start: number; // price 252 trading days ago
  drift: number; // annual expected return
  vol: number; // annual volatility
  beta: number; // to the equity benchmark
  yield: number; // annual income yield
  payMonths: number[]; // 0-11, months that pay income
  exposures: Partial<Record<Factor, number>>; // stress sensitivities
}

export interface Holding {
  symbol: string;
  qty: number;
  avgCost: number;
}

export interface Order {
  id: string;
  at: string; // ISO datetime
  symbol: string;
  side: "compra" | "venda";
  qty: number;
  price: number;
  status: "executada" | "bloqueada";
  reason?: string;
  source: "manual" | "rebalanceamento";
}

/* ── Seeded prices ───────────────────────────────────────────────────── */

export const DAYS = 252;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Common market shocks so securities co-move (gives realistic beta and diversification). */
export function marketShocks(days = DAYS, seed = 20261118): number[] {
  const rnd = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const u = Math.max(1e-9, rnd());
    const v = rnd();
    out.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
  }
  return out;
}

/** Daily price path: drift + beta × market shock + idiosyncratic noise. */
export function pricePath(sec: Security, shocks: number[]): number[] {
  const rnd = mulberry32(hashStr(sec.symbol));
  const dt = 1 / DAYS;
  const mktVol = 0.16;
  const sysVol = Math.min(sec.vol, Math.abs(sec.beta) * mktVol);
  const idioVol = Math.sqrt(Math.max(0, sec.vol ** 2 - sysVol ** 2));
  const p = [sec.start];
  for (let i = 0; i < shocks.length; i++) {
    const u = Math.max(1e-9, rnd());
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
    const ret =
      (sec.drift - 0.5 * sec.vol ** 2) * dt +
      Math.sign(sec.beta || 1) * sysVol * Math.sqrt(dt) * shocks[i]! +
      idioVol * Math.sqrt(dt) * z;
    p.push(p[p.length - 1]! * Math.exp(ret));
  }
  return p;
}

/* ── Stats ───────────────────────────────────────────────────────────── */

export const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
export function cov(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i]! - ma) * (b[i]! - mb);
  return s / (n - 1);
}
export const variance = (a: number[]) => cov(a, a);
export const stdev = (a: number[]) => Math.sqrt(variance(a));
export function returns(series: number[]) {
  const r: number[] = [];
  for (let i = 1; i < series.length; i++) r.push(series[i]! / series[i - 1]! - 1);
  return r;
}
export function percentile(xs: number[], p: number) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo]! + (s[hi]! - s[lo]!) * (idx - lo);
}
export const twr = (r: number[]) => r.reduce((acc, x) => acc * (1 + x), 1) - 1;

export function drawdowns(series: number[]) {
  let peak = -Infinity;
  return series.map((v) => {
    peak = Math.max(peak, v);
    return peak > 0 ? v / peak - 1 : 0;
  });
}

/* ── Portfolio valuation ─────────────────────────────────────────────── */

export interface Position {
  holding: Holding;
  sec: Security;
  price: number;
  prevClose: number;
  value: number;
  weight: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  dayPct: number;
  path: number[];
}

export function positions(
  holdings: Holding[],
  secs: Record<string, Security>,
  paths: Record<string, number[]>,
  cash: number,
): Position[] {
  const raw = holdings
    .filter((h) => h.qty > 0 && secs[h.symbol])
    .map((h) => {
      const path = paths[h.symbol]!;
      const price = path[path.length - 1]!;
      const prevClose = path[path.length - 2] ?? price;
      const value = h.qty * price;
      const cost = h.qty * h.avgCost;
      return {
        holding: h,
        sec: secs[h.symbol]!,
        price,
        prevClose,
        value,
        cost,
        pnl: value - cost,
        pnlPct: cost ? value / cost - 1 : 0,
        dayPct: price / prevClose - 1,
        path,
        weight: 0,
      };
    });
  const total = raw.reduce((s, p) => s + p.value, 0) + cash;
  return raw
    .map((p) => ({ ...p, weight: total ? p.value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

/** Value series of today's holdings over the window (constant-quantity back-cast) + cash. */
export function portfolioSeries(pos: Position[], cash: number): number[] {
  const n = pos[0]?.path.length ?? 0;
  const out: number[] = [];
  for (let t = 0; t < n; t++)
    out.push(pos.reduce((s, p) => s + p.holding.qty * p.path[t]!, 0) + cash);
  return out;
}

export function weightsByClass(pos: Position[], cash: number): Record<AssetClass, number> {
  const total = pos.reduce((s, p) => s + p.value, 0) + cash;
  const w: Record<AssetClass, number> = {
    acoesEUA: 0,
    acoesIntl: 0,
    obrigacoes: 0,
    imobiliario: 0,
    ouro: 0,
    liquidez: total ? cash / total : 0,
  };
  for (const p of pos) w[p.sec.assetClass] += total ? p.value / total : 0;
  return w;
}

/* ── Risk ────────────────────────────────────────────────────────────── */

export interface RiskReport {
  vol: number;
  beta: number;
  sharpe: number;
  maxDrawdown: number;
  var95: number; // money
  var95Pct: number;
  top5: number;
  hhi: number;
  effectiveN: number;
  contributions: { symbol: string; weight: number; contribution: number }[];
}

export const RISK_FREE = 0.04;

export function riskReport(pos: Position[], cash: number, bench: number[]): RiskReport {
  const series = portfolioSeries(pos, cash);
  const rp = returns(series);
  const rb = returns(bench);
  const vp = variance(rp);
  const vol = Math.sqrt(vp) * Math.sqrt(DAYS);
  const ann = mean(rp) * DAYS;
  const total = series[series.length - 1] ?? 0;
  const w = pos.map((p) => p.weight).sort((a, b) => b - a);
  const hhi = pos.reduce((s, p) => s + p.weight ** 2, 0);
  const contributions = pos.map((p) => {
    const ri = returns(p.path);
    return {
      symbol: p.sec.symbol,
      weight: p.weight,
      contribution: vp ? (p.weight * cov(ri, rp)) / vp : 0,
    };
  });
  // Normalise numerical drift so the contributions sum exactly to 1.
  const sum = contributions.reduce((s, c) => s + c.contribution, 0) || 1;
  const v95 = -percentile(rp, 0.05);
  return {
    vol,
    beta: variance(rb) ? cov(rp, rb) / variance(rb) : 0,
    sharpe: vol ? (ann - RISK_FREE) / vol : 0,
    maxDrawdown: Math.min(0, ...drawdowns(series)),
    var95: v95 * total,
    var95Pct: v95,
    top5: w.slice(0, 5).reduce((s, x) => s + x, 0),
    hhi,
    effectiveN: hhi ? 1 / hhi : 0,
    contributions: contributions
      .map((c) => ({ ...c, contribution: c.contribution / sum }))
      .sort((a, b) => b.contribution - a.contribution),
  };
}

/* ── Rebalancing ─────────────────────────────────────────────────────── */

export interface DriftRow {
  assetClass: AssetClass;
  current: number;
  target: number;
  drift: number;
  outOfBand: boolean;
}

export function driftRows(
  current: Record<AssetClass, number>,
  target: Record<AssetClass, number>,
  band: number,
): DriftRow[] {
  return (Object.keys(CLASS_LABEL) as AssetClass[]).map((k) => {
    const drift = (current[k] ?? 0) - (target[k] ?? 0);
    return {
      assetClass: k,
      current: current[k] ?? 0,
      target: target[k] ?? 0,
      drift,
      outOfBand: Math.abs(drift) > band + 1e-9,
    };
  });
}

export interface PlannedTrade {
  symbol: string;
  side: "compra" | "venda";
  qty: number;
  price: number;
  amount: number;
}

/**
 * Bring every asset class back to target. Inside a class, money is split pro-rata to the
 * current holdings of that class. Sells first so buys are cash-funded. Whole units only.
 */
export function rebalancePlan(
  pos: Position[],
  cash: number,
  target: Record<AssetClass, number>,
): PlannedTrade[] {
  const total = pos.reduce((s, p) => s + p.value, 0) + cash;
  const trades: PlannedTrade[] = [];
  const classes = (Object.keys(CLASS_LABEL) as AssetClass[]).filter((c) => c !== "liquidez");
  for (const c of classes) {
    const inClass = pos.filter((p) => p.sec.assetClass === c);
    const classValue = inClass.reduce((s, p) => s + p.value, 0);
    const delta = (target[c] ?? 0) * total - classValue;
    if (!inClass.length || Math.abs(delta) < 1) continue;
    for (const p of inClass) {
      const share = classValue ? p.value / classValue : 1 / inClass.length;
      const amt = delta * share;
      let qty = Math.floor(Math.abs(amt) / p.price);
      if (amt < 0) qty = Math.min(qty, p.holding.qty);
      if (qty > 0)
        trades.push({
          symbol: p.sec.symbol,
          side: amt > 0 ? "compra" : "venda",
          qty,
          price: p.price,
          amount: qty * p.price,
        });
    }
  }
  return trades.sort((a, b) =>
    a.side === b.side ? b.amount - a.amount : a.side === "venda" ? -1 : 1,
  );
}

/* ── Pre-trade compliance ────────────────────────────────────────────── */

export interface ComplianceRules {
  maxWeight: number; // single company, e.g. 0.15
  maxWeightFund: number; // diversified fund/ETF, e.g. 0.35
  restricted: string[];
  minCash: number; // money that must stay as cash
}

export interface Check {
  id: "qty" | "cash" | "holding" | "restricted" | "concentration" | "minCash";
  ok: boolean;
  label: string;
}

export function preTradeChecks(
  o: { symbol: string; side: "compra" | "venda"; qty: number; price: number },
  pos: Position[],
  cash: number,
  rules: ComplianceRules,
  fundSymbols: Set<string> = new Set(),
): Check[] {
  const total = pos.reduce((s, p) => s + p.value, 0) + cash;
  const amount = o.qty * o.price;
  const held = pos.find((p) => p.sec.symbol === o.symbol);
  const checks: Check[] = [
    {
      id: "qty",
      ok: Number.isInteger(o.qty) && o.qty > 0,
      label: "Quantidade inteira maior que zero",
    },
  ];
  if (o.side === "compra") {
    const after = ((held?.value ?? 0) + amount) / total;
    const isFund = held?.sec.fund ?? fundSymbols.has(o.symbol);
    const limit = isFund ? rules.maxWeightFund : rules.maxWeight;
    checks.push(
      {
        id: "restricted",
        ok: !rules.restricted.includes(o.symbol),
        label: "Fora da lista restrita",
      },
      { id: "cash", ok: amount <= cash, label: "Liquidez suficiente" },
      { id: "minCash", ok: cash - amount >= rules.minCash, label: `Mantém a liquidez mínima` },
      {
        id: "concentration",
        ok: after <= limit + 1e-9,
        label: `Peso após ordem ≤ ${Math.round(limit * 100)}% ${isFund ? "por fundo" : "por empresa"} (fica ${(after * 100).toFixed(1).replace(".", ",")}%)`,
      },
    );
  } else {
    checks.push({
      id: "holding",
      ok: !!held && o.qty <= held.holding.qty,
      label: "Quantidade ≤ posição detida",
    });
  }
  return checks;
}

/** Apply an executed order to holdings and cash (average-cost basis). */
export function applyOrder(
  holdings: Holding[],
  cash: number,
  o: { symbol: string; side: "compra" | "venda"; qty: number; price: number },
) {
  const amount = o.qty * o.price;
  const h = holdings.find((x) => x.symbol === o.symbol);
  if (o.side === "compra") {
    const next = h
      ? holdings.map((x) =>
          x.symbol === o.symbol
            ? { ...x, qty: x.qty + o.qty, avgCost: (x.qty * x.avgCost + amount) / (x.qty + o.qty) }
            : x,
        )
      : [...holdings, { symbol: o.symbol, qty: o.qty, avgCost: o.price }];
    return { holdings: next, cash: cash - amount };
  }
  const next = holdings
    .map((x) => (x.symbol === o.symbol ? { ...x, qty: x.qty - o.qty } : x))
    .filter((x) => x.qty > 0);
  return { holdings: next, cash: cash + amount };
}

/* ── Stress ──────────────────────────────────────────────────────────── */

export interface Scenario {
  id: string;
  name: string;
  shocks: Partial<Record<Factor, number>>;
  note: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "equity20",
    name: "Ações −20%",
    shocks: { acoes: -0.2 },
    note: "Correção de mercado acionista global.",
  },
  {
    id: "rates200",
    name: "Juros +200 pb",
    shocks: { juros: 0.02 },
    note: "Subida brusca de taxas: obrigações e imobiliário caem.",
  },
  {
    id: "tech30",
    name: "Tecnologia −30%",
    shocks: { acoes: -0.08, tecnologia: -0.3 },
    note: "Rotação para fora das tecnológicas.",
  },
  {
    id: "usd10",
    name: "Dólar −10%",
    shocks: { usd: -0.1 },
    note: "Ativos internacionais e ouro sobem em USD.",
  },
  {
    id: "gfc",
    name: "Crise tipo 2008",
    shocks: { acoes: -0.38, juros: -0.015, commodities: -0.25 },
    note: "Ações e matérias-primas caem; juros descem.",
  },
];

export function stressTest(pos: Position[], cash: number, shocks: Partial<Record<Factor, number>>) {
  const total = pos.reduce((s, p) => s + p.value, 0) + cash;
  const rows = pos.map((p) => {
    const pct = (Object.keys(shocks) as Factor[]).reduce(
      (s, f) => s + (shocks[f] ?? 0) * (p.sec.exposures[f] ?? 0),
      0,
    );
    return { symbol: p.sec.symbol, name: p.sec.name, value: p.value, pct, impact: p.value * pct };
  });
  const impact = rows.reduce((s, r) => s + r.impact, 0);
  return {
    rows: rows.sort((a, b) => a.impact - b.impact),
    impact,
    impactPct: total ? impact / total : 0,
  };
}

/* ── Brinson-Fachler attribution ─────────────────────────────────────── */

export interface AttributionRow {
  assetClass: AssetClass;
  wp: number;
  wb: number;
  rp: number;
  rb: number;
  allocation: number;
  selection: number;
  interaction: number;
  total: number;
}

export function brinson(
  portfolio: Partial<Record<AssetClass, { w: number; r: number }>>,
  benchmark: Partial<Record<AssetClass, { w: number; r: number }>>,
) {
  const classes = Array.from(
    new Set([...Object.keys(portfolio), ...Object.keys(benchmark)]),
  ) as AssetClass[];
  const Rb = classes.reduce((s, c) => s + (benchmark[c]?.w ?? 0) * (benchmark[c]?.r ?? 0), 0);
  const Rp = classes.reduce((s, c) => s + (portfolio[c]?.w ?? 0) * (portfolio[c]?.r ?? 0), 0);
  const rows: AttributionRow[] = classes.map((c) => {
    const wp = portfolio[c]?.w ?? 0;
    const wb = benchmark[c]?.w ?? 0;
    const rb = benchmark[c]?.r ?? 0;
    const rp = portfolio[c]?.r ?? rb;
    const allocation = (wp - wb) * (rb - Rb);
    const selection = wb * (rp - rb);
    const interaction = (wp - wb) * (rp - rb);
    return {
      assetClass: c,
      wp,
      wb,
      rp,
      rb,
      allocation,
      selection,
      interaction,
      total: allocation + selection + interaction,
    };
  });
  return { rows, Rp, Rb, excess: Rp - Rb };
}

/* ── Income ──────────────────────────────────────────────────────────── */

export function incomeSchedule(pos: Position[], fromMonth: number) {
  const months = Array.from({ length: 12 }, (_, i) => (fromMonth + i) % 12);
  return months.map((m, i) => {
    const items = pos
      .filter((p) => p.sec.yield > 0 && p.sec.payMonths.includes(m))
      .map((p) => ({
        symbol: p.sec.symbol,
        amount: (p.value * p.sec.yield) / p.sec.payMonths.length,
      }));
    return { offset: i, month: m, items, total: items.reduce((s, x) => s + x.amount, 0) };
  });
}

/* ── Format ──────────────────────────────────────────────────────────── */

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const usd = (n: number, cents = false) =>
  (n < 0 ? "−" : "") + (cents ? usd2 : usd0).format(Math.abs(n));
export const signedPct = (x: number, d = 1) =>
  `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x * 100)
    .toFixed(d)
    .replace(".", ",")}%`;
export const pct1 = (x: number, d = 1) => `${(x * 100).toFixed(d).replace(".", ",")}%`;

/** Post-trade compliance: holdings already above their concentration limit. */
export function postTradeBreaches(pos: Position[], rules: ComplianceRules) {
  return pos
    .map((p) => ({
      symbol: p.sec.symbol,
      weight: p.weight,
      limit: p.sec.fund ? rules.maxWeightFund : rules.maxWeight,
    }))
    .filter((b) => b.weight > b.limit + 1e-9)
    .map((b) => ({ ...b, excess: b.weight - b.limit }));
}
