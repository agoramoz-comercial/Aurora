/**
 * Património store — trades, payments and receipts (localStorage). Every cash
 * movement it creates is also written to the Finanças ledger, so budget,
 * balances and forecast stay in one truth.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { useFinance } from "./store";
import type { Trade } from "@/lib/finance/wealth/portfolio";
import type { Payment } from "@/lib/finance/wealth/payments";
import type { Receipt } from "@/lib/finance/wealth/receipts";
import { addMonths } from "@/lib/finance/personal";

const KEY = "aurora.patrimonio.v1";

export interface WealthState {
  version: 1;
  trades: Trade[];
  payments: Payment[];
  receipts: Receipt[];
}

const SEED: WealthState = {
  version: 1,
  trades: [
    {
      id: "t1",
      date: "2026-06-02",
      symbol: "BT-364",
      side: "compra",
      qty: 1500,
      price: 100,
      fee: 350,
      accountId: "acc-bci",
    },
    {
      id: "t2",
      date: "2026-07-14",
      symbol: "CDM",
      side: "compra",
      qty: 200,
      price: 228,
      fee: 278,
      accountId: "acc-bci",
    },
    {
      id: "t3",
      date: "2026-09-03",
      symbol: "AAPL",
      side: "compra",
      qty: 2,
      price: 21_900,
      fee: 678,
      accountId: "acc-bci",
    },
  ],
  payments: [
    {
      id: "p1",
      payee: "EDM · Credelec",
      amount: 1_500,
      due: "2026-11-25",
      method: "mpesa",
      accountId: "acc-mpesa",
      categoryId: "energia",
      repeat: "mensal",
    },
    {
      id: "p2",
      payee: "TVCabo · Internet",
      amount: 2_150,
      due: "2026-11-28",
      method: "referencia",
      accountId: "acc-bci",
      categoryId: "internet",
      repeat: "mensal",
    },
    {
      id: "p3",
      payee: "Colégio · Propinas",
      amount: 9_500,
      due: "2026-12-05",
      method: "transferencia",
      accountId: "acc-bci",
      categoryId: "escola",
      repeat: "mensal",
    },
  ],
  receipts: [],
};

type Action =
  | { type: "trade"; trade: Trade }
  | { type: "schedule"; payment: Payment }
  | { type: "paid"; id: string; on: string; fee: number }
  | { type: "removePayment"; id: string }
  | { type: "receipt"; receipt: Receipt }
  | { type: "removeReceipt"; id: string }
  | { type: "reset" };

function reducer(s: WealthState, a: Action): WealthState {
  switch (a.type) {
    case "trade":
      return { ...s, trades: [...s.trades, a.trade] };
    case "schedule":
      return { ...s, payments: [...s.payments, a.payment] };
    case "paid": {
      const p = s.payments.find((x) => x.id === a.id);
      if (!p) return s;
      const done = { ...p, paidOn: a.on, fee: a.fee };
      const next =
        p.repeat === "mensal"
          ? [
              {
                ...p,
                id: `${p.id}-${a.on}`,
                due: addMonths(p.due, 1),
                paidOn: undefined,
                fee: undefined,
              },
            ]
          : [];
      return { ...s, payments: [...s.payments.filter((x) => x.id !== a.id), done, ...next] };
    }
    case "removePayment":
      return { ...s, payments: s.payments.filter((x) => x.id !== a.id) };
    case "receipt":
      return { ...s, receipts: [a.receipt, ...s.receipts] };
    case "removeReceipt":
      return { ...s, receipts: s.receipts.filter((r) => r.id !== a.id) };
    case "reset":
      return SEED;
  }
}

function load(): WealthState {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as WealthState) : null;
    return v?.version === 1 ? v : SEED;
  } catch {
    return SEED;
  }
}

type Api = { w: WealthState; wd: (a: Action) => void };
const Ctx = createContext<Api | null>(null);

export function WealthStoreProvider({ children }: { children: ReactNode }) {
  const [w, wd] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(w));
    } catch {
      /* storage blocked: session only */
    }
  }, [w]);
  const api = useMemo(() => ({ w, wd }), [w]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWealth() {
  const v = useContext(Ctx);
  const f = useFinance();
  if (!v) throw new Error("useWealth must be used inside WealthStoreProvider");
  return { ...v, f };
}
