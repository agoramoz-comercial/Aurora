/**
 * Portfolio Management store: holdings, cash, targets, orders. Market paths are
 * derived (deterministic) so the UI and tests always see the same prices.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import {
  applyOrder,
  positions,
  preTradeChecks,
  type AssetClass,
  type ComplianceRules,
  type Holding,
  type Order,
  type Position,
  type Security,
} from "@/lib/portfolio/pm";
import { SEED_CASH, SEED_HOLDINGS, SEED_RULES, SEED_TARGETS } from "./seed";
import { FUNDS, PATHS, SECS, lastPrice } from "./market";
export { BENCHMARK, BENCH_PATHS, PATHS, lastPrice } from "./market";

const KEY = "ollympius.pm.v1";

export interface PmState {
  version: 1;
  holdings: Holding[];
  cash: number;
  targets: Record<AssetClass, number>;
  band: number;
  orders: Order[];
  rules: ComplianceRules;
}

type Action =
  | {
      type: "order";
      symbol: string;
      side: "compra" | "venda";
      qty: number;
      source?: Order["source"];
    }
  | {
      type: "orders";
      list: { symbol: string; side: "compra" | "venda"; qty: number }[];
      source: Order["source"];
    }
  | { type: "setTarget"; assetClass: AssetClass; weight: number }
  | { type: "setBand"; band: number }
  | { type: "reset" };

function initial(): PmState {
  return {
    version: 1,
    holdings: SEED_HOLDINGS,
    cash: SEED_CASH,
    targets: SEED_TARGETS,
    band: 0.03,
    orders: [],
    rules: SEED_RULES,
  };
}

function execute(
  s: PmState,
  o: { symbol: string; side: "compra" | "venda"; qty: number },
  source: Order["source"],
): PmState {
  const pos = positions(s.holdings, SECS, PATHS, s.cash);
  const price = lastPrice(o.symbol);
  const checks = preTradeChecks({ ...o, price }, pos, s.cash, s.rules, FUNDS);
  const failed = checks.filter((c) => !c.ok);
  const base: Order = {
    id: `ORD-${String(s.orders.length + 1).padStart(4, "0")}`,
    at: new Date().toISOString(),
    symbol: o.symbol,
    side: o.side,
    qty: o.qty,
    price,
    source,
    status: "executada",
  };
  if (failed.length)
    return {
      ...s,
      orders: [
        { ...base, status: "bloqueada", reason: failed.map((f) => f.label).join("; ") },
        ...s.orders,
      ],
    };
  const next = applyOrder(s.holdings, s.cash, { ...o, price });
  return { ...s, ...next, orders: [base, ...s.orders] };
}

function reducer(s: PmState, a: Action): PmState {
  switch (a.type) {
    case "order":
      return execute(s, a, a.source ?? "manual");
    case "orders":
      return a.list.reduce((acc, o) => execute(acc, o, a.source), s);
    case "setTarget":
      return {
        ...s,
        targets: { ...s.targets, [a.assetClass]: Math.max(0, Math.min(1, a.weight)) },
      };
    case "setBand":
      return { ...s, band: a.band };
    case "reset":
      return initial();
  }
}

function load(): PmState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as PmState;
      if (p.version === 1) return p;
    }
  } catch {
    /* blocked or corrupt — demo data in memory */
  }
  return initial();
}

interface Api {
  state: PmState;
  dispatch: (a: Action) => void;
  secs: Record<string, Security>;
  pos: Position[];
  total: number;
}
const Ctx = createContext<Api | null>(null);

export function PmStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  const api = useMemo<Api>(() => {
    const pos = positions(state.holdings, SECS, PATHS, state.cash);
    return {
      state,
      dispatch,
      secs: SECS,
      pos,
      total: pos.reduce((s, p) => s + p.value, 0) + state.cash,
    };
  }, [state]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePm() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePm must be used inside PmStoreProvider");
  return v;
}
