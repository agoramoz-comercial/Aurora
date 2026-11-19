/**
 * Personal finance rules — pure functions, no React. Every number the
 * Finanças Pessoais page shows comes from here (spec: docs/prompts/FINANCAS-PESSOAIS.md §5).
 */

export type Group = "fixas" | "flexiveis" | "naoMensais" | "objetivos";
export type AccountKind = "caixa" | "poupanca" | "investimento" | "credito" | "emprestimo";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  /** Signed balance in MZN. Debts are negative. */
  balance: number;
}
export interface Category {
  id: string;
  name: string;
  group: Group;
  /** Monthly target used by "Atribuir alvos". */
  target: number;
  emoji: string;
}
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  payee: string;
  /** Negative = outflow, positive = inflow. */
  amount: number;
  categoryId: string | null; // null = income / to be assigned
  accountId: string;
  note?: string;
}
export interface Rule {
  id: string;
  match: string; // case-insensitive substring of payee
  categoryId: string;
}
export interface Debt {
  id: string;
  name: string;
  balance: number; // positive amount owed
  apr: number; // annual %, e.g. 24
  minimum: number; // monthly minimum payment
}
export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  due: string; // YYYY-MM-DD
  emoji: string;
}

export const GROUP_LABEL: Record<Group, string> = {
  fixas: "Fixas",
  flexiveis: "Flexíveis",
  naoMensais: "Não mensais",
  objetivos: "Objetivos",
};

/* ── Formatting ──────────────────────────────────────────────────────── */

const nf0 = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });
export function mzn(n: number, opts: { sign?: boolean; compact?: boolean } = {}): string {
  const r = Math.round(n);
  const abs = Math.abs(r);
  const body =
    opts.compact && abs >= 1_000_000
      ? `${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`
      : opts.compact && abs >= 10_000
        ? `${nf0.format(Math.round(abs / 1000))} mil`
        : nf0.format(abs);
  const s = r < 0 ? "−" : opts.sign && r > 0 ? "+" : "";
  return `${s}${body} MT`;
}
export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits).replace(".", ",")}%`;

/* ── Dates ───────────────────────────────────────────────────────────── */

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const monthKey = (dateIso: string) => dateIso.slice(0, 7);
export function daysLeftInMonth(today: string): number {
  const d = new Date(today + "T00:00:00Z");
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return last - d.getUTCDate() + 1;
}
export function monthsBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z");
  const b = new Date(toIso + "T00:00:00Z");
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}
export function addMonths(isoDate: string, n: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return iso(d);
}

/* ── Budget (zero-based) ─────────────────────────────────────────────── */

export interface CategoryRow {
  category: Category;
  assigned: number;
  spent: number; // positive number
  available: number;
  overspent: boolean;
  progress: number; // 0..1 of assigned used
}

export function spentByCategory(txs: Transaction[], month: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of txs) {
    if (!t.categoryId || monthKey(t.date) !== month) continue;
    m.set(t.categoryId, (m.get(t.categoryId) ?? 0) - t.amount);
  }
  return m;
}

export function budgetRows(
  cats: Category[],
  assigned: Record<string, number>,
  txs: Transaction[],
  month: string,
): CategoryRow[] {
  const spent = spentByCategory(txs, month);
  return cats.map((c) => {
    const a = assigned[c.id] ?? 0;
    const s = Math.max(0, spent.get(c.id) ?? 0);
    const available = a - s;
    return {
      category: c,
      assigned: a,
      spent: s,
      available,
      overspent: available < 0,
      progress: a > 0 ? Math.min(1, s / a) : s > 0 ? 1 : 0,
    };
  });
}

export const cashOnHand = (accounts: Account[]) =>
  accounts.filter((a) => a.kind === "caixa").reduce((s, a) => s + a.balance, 0);

/** Money not yet given a job. May be negative (over-assigned) — never hidden. */
export function readyToAssign(
  accounts: Account[],
  assigned: Record<string, number>,
  rows: CategoryRow[],
): number {
  const totalAssigned = Object.values(assigned).reduce((s, n) => s + n, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  // Cash today already reflects this month's spending, so add it back before subtracting assignments.
  return cashOnHand(accounts) + totalSpent - totalAssigned;
}

export function safeToSpendToday(rows: CategoryRow[], today: string): number {
  const flex = rows
    .filter((r) => r.category.group === "flexiveis")
    .reduce((s, r) => s + Math.max(0, r.available), 0);
  return Math.max(0, flex / daysLeftInMonth(today));
}

/* ── Cash flow, savings, runway, net worth ───────────────────────────── */

export function monthFlow(txs: Transaction[], month: string) {
  let income = 0;
  let spend = 0;
  for (const t of txs) {
    if (monthKey(t.date) !== month) continue;
    if (t.amount > 0) income += t.amount;
    else spend -= t.amount;
  }
  return { income, spend, net: income - spend };
}

export const savingsRate = (income: number, spend: number) =>
  income > 0 ? (income - spend) / income : 0;

export function netWorth(accounts: Account[], debts: Debt[]) {
  // Liabilities come from the debt register only; credit accounts mirror a debt there.
  const assets = accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const liabilities = debts.reduce((s, d) => s + d.balance, 0);
  return { assets, liabilities, net: assets - liabilities };
}

/** Months of essential (Fixas) spending covered by savings accounts. */
export function runwayMonths(accounts: Account[], cats: Category[]): number {
  const reserve = accounts.filter((a) => a.kind === "poupanca").reduce((s, a) => s + a.balance, 0);
  const essential = cats.filter((c) => c.group === "fixas").reduce((s, c) => s + c.target, 0);
  return essential > 0 ? reserve / essential : 0;
}

/* ── Rules (auto-categorize) ─────────────────────────────────────────── */

export function applyRules(txs: Transaction[], rules: Rule[]): Transaction[] {
  if (!rules.length) return txs;
  return txs.map((t) => {
    if (t.amount > 0) return t;
    const r = rules.find((x) => t.payee.toLowerCase().includes(x.match.toLowerCase()));
    return r ? { ...t, categoryId: r.categoryId } : t;
  });
}

/* ── Recurring detection ─────────────────────────────────────────────── */

export interface Recurring {
  payee: string;
  cadence: "mensal" | "anual";
  amount: number; // positive, latest charge
  annualCost: number;
  next: string;
  count: number;
  categoryId: string | null;
}

export function detectRecurring(txs: Transaction[]): Recurring[] {
  const by = new Map<string, Transaction[]>();
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const k = t.payee.trim().toLowerCase();
    by.set(k, [...(by.get(k) ?? []), t]);
  }
  const out: Recurring[] = [];
  for (const list of by.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((Date.parse(sorted[i]!.date) - Date.parse(sorted[i - 1]!.date)) / 86_400_000);
    }
    const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const cadence = avg >= 25 && avg <= 35 ? "mensal" : avg >= 350 && avg <= 380 ? "anual" : null;
    if (!cadence) continue;
    const last = sorted[sorted.length - 1]!;
    const amount = -last.amount;
    out.push({
      payee: last.payee.trim(),
      cadence,
      amount,
      annualCost: cadence === "mensal" ? amount * 12 : amount,
      next: cadence === "mensal" ? addMonths(last.date, 1) : addMonths(last.date, 12),
      count: sorted.length,
      categoryId: last.categoryId,
    });
  }
  return out.sort((a, b) => b.annualCost - a.annualCost);
}

/* ── Debt payoff (avalanche vs snowball) ─────────────────────────────── */

export type Strategy = "avalanche" | "snowball";
export interface PayoffPlan {
  strategy: Strategy;
  months: number; // months until all debts are 0 (capped at 600)
  totalInterest: number;
  order: { id: string; name: string; paidOffMonth: number }[];
  series: { month: number; balance: number }[];
  feasible: boolean; // false when minimums don't cover interest
}

export function payoffPlan(debts: Debt[], extra: number, strategy: Strategy): PayoffPlan {
  const ds = debts.map((d) => ({ ...d }));
  const ordered = () =>
    ds
      .filter((d) => d.balance > 0.5)
      .sort((a, b) =>
        strategy === "avalanche"
          ? b.apr - a.apr || a.balance - b.balance
          : a.balance - b.balance || b.apr - a.apr,
      );
  const budget = debts.reduce((s, d) => s + d.minimum, 0) + Math.max(0, extra);
  let month = 0;
  let totalInterest = 0;
  const order: PayoffPlan["order"] = [];
  const series = [{ month: 0, balance: ds.reduce((s, d) => s + d.balance, 0) }];
  let feasible = true;
  while (ds.some((d) => d.balance > 0.5) && month < 600) {
    month++;
    for (const d of ds) {
      if (d.balance <= 0.5) continue;
      const i = (d.balance * d.apr) / 100 / 12;
      d.balance += i;
      totalInterest += i;
    }
    let pool = budget;
    for (const d of ds) {
      if (d.balance <= 0.5) continue;
      const pay = Math.min(d.minimum, d.balance, pool);
      d.balance -= pay;
      pool -= pay;
    }
    for (const d of ordered()) {
      if (pool <= 0) break;
      const pay = Math.min(pool, d.balance);
      d.balance -= pay;
      pool -= pay;
    }
    for (const d of ds) {
      if (d.balance <= 0.5 && !order.some((o) => o.id === d.id)) {
        d.balance = 0;
        order.push({ id: d.id, name: d.name, paidOffMonth: month });
      }
    }
    series.push({ month, balance: ds.reduce((s, d) => s + Math.max(0, d.balance), 0) });
    if (month === 600) feasible = false;
  }
  return { strategy, months: month, totalInterest, order, series, feasible };
}

/* ── Goals ───────────────────────────────────────────────────────────── */

export function goalPlan(g: Goal, today: string) {
  const months = monthsBetween(today, g.due);
  const remaining = Math.max(0, g.target - g.saved);
  return {
    remaining,
    months,
    monthly: months > 0 ? remaining / months : remaining,
    progress: g.target > 0 ? Math.min(1, g.saved / g.target) : 0,
    overdue: months <= 0 && remaining > 0,
    done: remaining === 0,
  };
}

/** Recommended income-loss fund: 3–6 months of essential spending. */
export function emergencyTarget(cats: Category[]) {
  const essential = cats.filter((c) => c.group === "fixas").reduce((s, c) => s + c.target, 0);
  return { min: essential * 3, max: essential * 6, essential };
}

/* ── Forecast ────────────────────────────────────────────────────────── */

export function forecast(opts: {
  startNetWorth: number;
  monthlyIncome: number;
  monthlySpend: number;
  incomeChange: number; // e.g. -0.2 for −20%
  extraSaving: number; // MZN / month cut from spending
  months?: number;
  annualReturn?: number; // on positive balance, e.g. 0.06
}) {
  const n = opts.months ?? 12;
  const r = (opts.annualReturn ?? 0.06) / 12;
  const income = opts.monthlyIncome * (1 + opts.incomeChange);
  const spend = Math.max(0, opts.monthlySpend - opts.extraSaving);
  const pts: { month: number; base: number; scenario: number }[] = [];
  let base = opts.startNetWorth;
  let scen = opts.startNetWorth;
  for (let m = 0; m <= n; m++) {
    pts.push({ month: m, base: Math.round(base), scenario: Math.round(scen) });
    base = base + (opts.monthlyIncome - opts.monthlySpend) + Math.max(0, base) * r;
    scen = scen + (income - spend) + Math.max(0, scen) * r;
  }
  return pts;
}
