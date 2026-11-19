/** Statement agent — reads bank exports (CSV from BCI/BIM/Standard/Absa, OFX/QFX). */
import { norm, parseAmount, parseDate } from "./text";

export interface Draft {
  date: string;
  payee: string;
  amount: number; // negative = outflow
  source: string;
}

function splitCsv(line: string, sep: string): string[] {
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

const COLS = {
  date: ["data mov", "data valor", "data", "date", "dt"],
  payee: ["descricao", "descritivo", "description", "movimento", "detalhe", "memo", "beneficiario"],
  amount: ["montante", "valor", "amount", "importancia"],
  debit: ["debito", "debit", "saida"],
  credit: ["credito", "credit", "entrada"],
};
const find = (h: string[], keys: string[]) =>
  h.findIndex((c) => keys.some((k) => c.startsWith(k) || c === k));

export function parseCsv(text: string, source: string): Draft[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const sep = [";", ",", "\t"].sort(
    (a, b) => (lines[0]?.split(b).length ?? 0) - (lines[0]?.split(a).length ?? 0),
  )[0]!;
  // Header may sit below a bank banner: take the first line that names a date column.
  const hi = lines.findIndex((l) => find(splitCsv(l, sep).map(norm), COLS.date) >= 0);
  if (hi < 0) return [];
  const h = splitCsv(lines[hi]!, sep).map(norm);
  const iD = find(h, COLS.date);
  const iP = find(h, COLS.payee);
  const iA = find(h, COLS.amount);
  const iDr = find(h, COLS.debit);
  const iCr = find(h, COLS.credit);
  return lines.slice(hi + 1).flatMap((l) => {
    const c = splitCsv(l, sep);
    const date = parseDate(c[iD] ?? "");
    let amount: number | null = null;
    if (iA >= 0) amount = parseAmount(c[iA] ?? "");
    else {
      const dr = parseAmount(c[iDr] ?? "") ?? 0;
      const cr = parseAmount(c[iCr] ?? "") ?? 0;
      amount = cr - Math.abs(dr);
    }
    if (!date || amount === null || amount === 0) return [];
    return [
      { date, payee: (c[iP] ?? "Movimento").replace(/\s+/g, " ").slice(0, 80), amount, source },
    ];
  });
}

export function parseOfx(text: string, source: string): Draft[] {
  return [...text.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>))/gi)].flatMap((m) => {
    const tag = (t: string) =>
      new RegExp(`<${t}>([^<\\r\\n]+)`, "i").exec(m[1]!)?.[1]?.trim() ?? "";
    const date = parseDate(tag("DTPOSTED"));
    const amount = parseAmount(tag("TRNAMT"));
    if (!date || amount === null) return [];
    return [{ date, payee: tag("NAME") || tag("MEMO") || "Movimento", amount, source }];
  });
}

export function parseStatement(name: string, text: string): Draft[] {
  return /\.(ofx|qfx)$/i.test(name) || /<OFX>/i.test(text)
    ? parseOfx(text, name)
    : parseCsv(text, name);
}
