/**
 * Finanças Pessoais store — reducer + localStorage. All derived numbers come
 * from src/lib/finance/personal.ts so the UI never computes money on its own.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import {
  applyRules,
  iso,
  monthKey,
  type Account,
  type Category,
  type Debt,
  type Goal,
  type Rule,
  type Transaction,
} from "@/lib/finance/personal";
import {
  ACCOUNTS,
  CATEGORIES,
  DEBTS,
  OPENING_CASH,
  RULES,
  seedGoals,
  seedTransactions,
} from "./seed";

const KEY = "ollympius.financas.v1";

export interface FinanceState {
  version: 1;
  month: string; // YYYY-MM
  categories: Category[];
  assigned: Record<string, Record<string, number>>; // month → category → MZN
  transactions: Transaction[];
  rules: Rule[];
  debts: Debt[];
  goals: Goal[];
  cancelList: string[]; // recurring payees marked to cancel
  openingCash: Record<string, number>;
}

type Action =
  | { type: "assign"; categoryId: string; amount: number }
  | { type: "assignTargets" }
  | { type: "move"; from: string; to: string; amount: number }
  | { type: "addTx"; tx: Omit<Transaction, "id"> }
  | { type: "recategorize"; id: string; categoryId: string | null }
  | { type: "deleteTx"; id: string }
  | { type: "addRule"; match: string; categoryId: string }
  | { type: "removeRule"; id: string }
  | { type: "contribute"; goalId: string; amount: number }
  | { type: "addGoal"; goal: Omit<Goal, "id"> }
  | { type: "toggleCancel"; payee: string }
  | { type: "reset" };

function initial(): FinanceState {
  const month = monthKey(iso(new Date()));
  const assigned: Record<string, number> = {};
  for (const c of CATEGORIES) if (c.group !== "objetivos") assigned[c.id] = c.target;
  return {
    version: 1,
    month,
    categories: CATEGORIES,
    assigned: { [month]: assigned },
    transactions: applyRules(seedTransactions(), RULES),
    rules: RULES,
    debts: DEBTS,
    goals: seedGoals(),
    cancelList: [],
    openingCash: OPENING_CASH,
  };
}

function reducer(s: FinanceState, a: Action): FinanceState {
  const cur = s.assigned[s.month] ?? {};
  const setCur = (next: Record<string, number>) => ({
    ...s,
    assigned: { ...s.assigned, [s.month]: next },
  });
  switch (a.type) {
    case "assign":
      return setCur({ ...cur, [a.categoryId]: Math.max(0, Math.round(a.amount)) });
    case "assignTargets": {
      const next = { ...cur };
      for (const c of s.categories) next[c.id] = Math.max(next[c.id] ?? 0, c.target);
      return setCur(next);
    }
    case "move": {
      const amt = Math.max(0, Math.min(Math.round(a.amount), cur[a.from] ?? 0));
      return setCur({ ...cur, [a.from]: (cur[a.from] ?? 0) - amt, [a.to]: (cur[a.to] ?? 0) + amt });
    }
    case "addTx": {
      const id = `tx-u${Date.now()}`;
      const [tx] = applyRules([{ ...a.tx, id }], a.tx.categoryId ? [] : s.rules);
      return {
        ...s,
        transactions: [tx!, ...s.transactions].sort((x, y) => y.date.localeCompare(x.date)),
      };
    }
    case "recategorize":
      return {
        ...s,
        transactions: s.transactions.map((t) =>
          t.id === a.id ? { ...t, categoryId: a.categoryId } : t,
        ),
      };
    case "deleteTx":
      return { ...s, transactions: s.transactions.filter((t) => t.id !== a.id) };
    case "addRule": {
      const rule = { id: `r${Date.now()}`, match: a.match.trim(), categoryId: a.categoryId };
      const rules = [
        ...s.rules.filter((r) => r.match.toLowerCase() !== rule.match.toLowerCase()),
        rule,
      ];
      return { ...s, rules, transactions: applyRules(s.transactions, [rule]) };
    }
    case "removeRule":
      return { ...s, rules: s.rules.filter((r) => r.id !== a.id) };
    case "contribute":
      return {
        ...s,
        goals: s.goals.map((g) =>
          g.id === a.goalId
            ? { ...g, saved: Math.min(g.target, g.saved + Math.max(0, a.amount)) }
            : g,
        ),
      };
    case "addGoal":
      return { ...s, goals: [...s.goals, { ...a.goal, id: `g${Date.now()}` }] };
    case "toggleCancel":
      return {
        ...s,
        cancelList: s.cancelList.includes(a.payee)
          ? s.cancelList.filter((p) => p !== a.payee)
          : [...s.cancelList, a.payee],
      };
    case "reset":
      return initial();
  }
}

function load(): FinanceState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as FinanceState;
      if (p.version === 1 && p.month === monthKey(iso(new Date()))) return p;
    }
  } catch {
    /* storage blocked or corrupt — fall back to demo data in memory */
  }
  return initial();
}

interface Api {
  state: FinanceState;
  dispatch: (a: Action) => void;
  accounts: Account[];
  assigned: Record<string, number>;
  storageOk: boolean;
}

const Ctx = createContext<Api | null>(null);

export function FinanceStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const storageOk = useMemo(() => {
    try {
      window.localStorage.setItem(KEY + ".probe", "1");
      window.localStorage.removeItem(KEY + ".probe");
      return true;
    } catch {
      return false;
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  // Cash balances are derived: opening balance + every transaction on that account.
  const accounts = useMemo(
    () =>
      ACCOUNTS.map((a) =>
        a.kind === "caixa"
          ? {
              ...a,
              balance:
                (state.openingCash[a.id] ?? 0) +
                state.transactions
                  .filter((t) => t.accountId === a.id && monthKey(t.date) === state.month)
                  .reduce((s, t) => s + t.amount, 0),
            }
          : a.kind === "credito"
            ? { ...a, balance: -(state.debts.find((d) => d.id === "d-cc")?.balance ?? 0) }
            : a,
      ),
    [state.transactions, state.openingCash, state.debts, state.month],
  );
  const api = useMemo<Api>(
    () => ({ state, dispatch, accounts, assigned: state.assigned[state.month] ?? {}, storageOk }),
    [state, accounts, storageOk],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useFinance() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFinance must be used inside FinanceStoreProvider");
  return v;
}
