/**
 * Trade import + normalisation: CSV/TSV/semicolon exports (MetaTrader 5
 * history, broker/exchange CSVs) → one schema. Unknown columns are ignored.
 */
import { norm, parseAmount, parseDate } from "../finance/wealth/text";

export interface Trade {
  open: string; // ISO date
  close: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  entry: number;
  exit: number;
  fees: number;
  pnl: number;
  stop?: number;
}
export type Seal = "Declarado" | "Verificado";

const COL: Record<string, string[]> = {
  open: ["open", "open time", "abertura", "data abertura", "time", "date", "data"],
  close: ["close", "close time", "fecho", "data fecho"],
  symbol: ["symbol", "simbolo", "ativo", "instrument", "pair", "par"],
  side: ["type", "side", "tipo", "lado", "direction"],
  qty: ["volume", "qty", "quantity", "quantidade", "size", "lots", "amount"],
  entry: ["open price", "entry", "preco entrada", "price"],
  exit: ["close price", "exit", "preco saida"],
  fees: ["commission", "comissao", "fee", "fees", "taxa"],
  swap: ["swap"],
  pnl: ["profit", "pnl", "lucro", "resultado", "realized pnl"],
  stop: ["s / l", "s/l", "sl", "stop", "stop loss"],
};

function split(line: string, sep: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === sep && !q) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseTrades(text: string): { trades: Trade[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const sep = [";", "\t", ","].sort(
    (a, b) => (lines[0]?.split(b).length ?? 0) - (lines[0]?.split(a).length ?? 0),
  )[0]!;
  const hi = lines.findIndex((l) =>
    split(l, sep)
      .map(norm)
      .some((c) => COL.symbol!.includes(c)),
  );
  if (hi < 0) return { trades: [], skipped: lines.length };
  const head = split(lines[hi]!, sep).map(norm);
  // MT5 repeats "time"/"price": first = open, second = close.
  const idx = (k: string, nth = 0) => {
    const hits = head.flatMap((h, i) => (COL[k]!.includes(h) ? [i] : []));
    return hits[nth] ?? -1;
  };
  const iOpen = idx("open");
  const iClose = idx("close") >= 0 ? idx("close") : idx("open", 1);
  const iEntry = idx("entry");
  const iExit = idx("exit") >= 0 ? idx("exit") : idx("entry", 1);
  let skipped = 0;
  const trades = lines.slice(hi + 1).flatMap((l) => {
    const c = split(l, sep);
    const g = (i: number) => (i >= 0 ? (c[i] ?? "") : "");
    const open = parseDate(g(iOpen));
    const symbol = g(idx("symbol")).toUpperCase();
    const qty = Math.abs(parseAmount(g(idx("qty"))) ?? 0);
    const entry = parseAmount(g(iEntry)) ?? NaN;
    const exit = parseAmount(g(iExit)) ?? NaN;
    const side: Trade["side"] = /sell|short|venda|vender/i.test(g(idx("side"))) ? "sell" : "buy";
    const fees =
      Math.abs(parseAmount(g(idx("fees"))) ?? 0) + Math.abs(parseAmount(g(idx("swap"))) ?? 0) * 0;
    const given = parseAmount(g(idx("pnl")));
    const pnl =
      given ??
      (Number.isFinite(entry) && Number.isFinite(exit)
        ? (exit - entry) * qty * (side === "buy" ? 1 : -1) - fees
        : NaN);
    if (!open || !symbol || !Number.isFinite(pnl)) {
      skipped++;
      return [];
    }
    const stop = parseAmount(g(idx("stop")));
    return [
      {
        open,
        close: parseDate(g(iClose)) ?? open,
        symbol,
        side,
        qty,
        entry,
        exit,
        fees,
        pnl,
        stop: stop && stop > 0 ? stop : undefined,
      },
    ];
  });
  trades.sort((a, b) => a.close.localeCompare(b.close));
  return { trades, skipped };
}

export function toCsv(trades: Trade[]): string {
  const h = "open;close;symbol;side;qty;entry;exit;fees;pnl;sl";
  return [
    h,
    ...trades.map((t) =>
      [
        t.open,
        t.close,
        t.symbol,
        t.side,
        t.qty,
        t.entry.toFixed(5),
        t.exit.toFixed(5),
        t.fees.toFixed(2),
        t.pnl.toFixed(2),
        t.stop ?? "",
      ].join(";"),
    ),
  ].join("\n");
}
