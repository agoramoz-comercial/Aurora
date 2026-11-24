/** Backtest (loop L2): long-only, signal at close t, position from t+1, no leverage. */
import type { Bar } from "./market";
import { evaluate, isSignal, mirror } from "./dsl";

export interface Backtest {
  periodo: string;
  sinais: number;
  operacoes: number;
  acerto: number;
  retorno: number;
  maxDD: number;
  buyHold: number;
  equity: { t: string; estrategia: number; buyHold: number }[];
  entradas: number[];
  saidas: number[];
}

export function backtest(buy: string, bars: Bar[], sell?: string): Backtest {
  const b = evaluate(buy, bars);
  if (!isSignal(b))
    throw new Error("A regra de compra tem de ser uma condição (verdadeiro/falso).");
  const s = evaluate(sell?.trim() || mirror(buy), bars);
  if (!isSignal(s)) throw new Error("A regra de venda tem de ser uma condição.");
  let pos = false;
  let eq = 1;
  let peak = 1;
  let dd = 0;
  let entryEq = 1;
  const trades: number[] = [];
  const entradas: number[] = [];
  const saidas: number[] = [];
  const equity: Backtest["equity"] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i > 0 && pos) eq *= bars[i]!.c / bars[i - 1]!.c;
    peak = Math.max(peak, eq);
    dd = Math.max(dd, (peak - eq) / peak);
    equity.push({ t: bars[i]!.t, estrategia: eq, buyHold: bars[i]!.c / bars[0]!.c });
    if (!pos && b[i]) {
      pos = true;
      entryEq = eq;
      entradas.push(i);
    } else if (pos && s[i]) {
      pos = false;
      trades.push(eq / entryEq - 1);
      saidas.push(i);
    }
  }
  if (pos) trades.push(eq / entryEq - 1);
  return {
    periodo: `${bars[0]!.t} → ${bars[bars.length - 1]!.t}`,
    sinais: b.filter(Boolean).length,
    operacoes: trades.length,
    acerto: trades.length ? trades.filter((x) => x > 0).length / trades.length : 0,
    retorno: eq - 1,
    maxDD: dd,
    buyHold: bars[bars.length - 1]!.c / bars[0]!.c - 1,
    equity,
    entradas,
    saidas,
  };
}
