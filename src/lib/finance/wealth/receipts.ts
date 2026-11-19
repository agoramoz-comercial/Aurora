/** Receipt agent — turns OCR text of a till slip into store, date and line items. */
import { parseAmount, parseDate } from "./text";

export interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}
export interface Receipt {
  id: string;
  store: string;
  date: string;
  items: ReceiptItem[];
  total: number;
  fees: number; // service charges, bag fees, delivery
}

const KNOWN = [
  "shoprite",
  "spar",
  "game",
  "pick n pay",
  "premier",
  "woolworths",
  "mercado",
  "farmacia",
  "galp",
  "petromoc",
  "total",
];
const SKIP =
  /(total|subtotal|iva|troco|nuit|nif|numerario|cartao|pagamento|recibo|factura|fatura|obrigado|caixa|operador|tel|www|vat|change|cash)/i;
const FEE = /(taxa|servico|saco|entrega|delivery|embalagem|comissao)/i;
const money = String.raw`(\d{1,3}(?:[ .]\d{3})*[.,]\d{2}|\d+[.,]\d{2})`;

export function parseReceipt(text: string, today: string): Omit<Receipt, "id"> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const storeLine =
    lines.find((l) => KNOWN.some((k) => l.toLowerCase().includes(k))) ?? lines[0] ?? "Loja";
  const store =
    storeLine
      .replace(/[^\p{L}\p{N} &'.-]/gu, "")
      .trim()
      .slice(0, 40) || "Loja";
  const dateLine = lines
    .map((l) => /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}-\d{2}-\d{2})/.exec(l)?.[1])
    .find(Boolean);
  const date = (dateLine && parseDate(dateLine)) || today;
  const items: ReceiptItem[] = [];
  let fees = 0;
  let total = 0;
  const reQty = new RegExp(String.raw`^(.+?)\s+(\d+(?:[.,]\d+)?)\s*[xX*]\s*${money}\s+${money}$`);
  const reOne = new RegExp(String.raw`^(.+?)\s+${money}\s*[A-Z]?$`);
  for (const l of lines) {
    if (/^total\b/i.test(l) || /\btotal a pagar\b/i.test(l)) {
      const v = parseAmount(new RegExp(money).exec(l)?.[1] ?? "");
      if (v) total = v;
      continue;
    }
    let m = reQty.exec(l);
    if (m && !SKIP.test(m[1]!)) {
      const qty = parseAmount(m[2]!) ?? 1;
      const unit = parseAmount(m[3]!) ?? 0;
      items.push({
        name: m[1]!.trim(),
        qty,
        unitPrice: unit,
        total: parseAmount(m[4]!) ?? unit * qty,
      });
      continue;
    }
    m = reOne.exec(l);
    if (m && !SKIP.test(m[1]!) && /\p{L}{3}/u.test(m[1]!)) {
      const v = parseAmount(m[2]!) ?? 0;
      if (FEE.test(m[1]!)) fees += v;
      else items.push({ name: m[1]!.trim(), qty: 1, unitPrice: v, total: v });
    }
  }
  const sum = items.reduce((s, i) => s + i.total, 0) + fees;
  return { store, date, items, total: total || sum, fees };
}

export const DEMO_RECEIPT = `SPAR SOMMERSCHIELD
Av. Kim Il Sung, Maputo  NUIT 400123456
18/11/2026 17:42
ARROZ AGULHA 5KG       1 x 489,00   489,00
OLEO ALIMENTAR 2L      2 x 389,00   778,00
ACUCAR CASTANHO 2KG    1 x 172,00   172,00
LEITE UHT 1L           6 x 109,00   654,00
OVOS 30UN                          468,00
FRANGO CONGELADO 1KG   2 x 349,00   698,00
SACO PLASTICO                        10,00
TAXA DE SERVICO                      25,00
TOTAL                             3294,00
CARTAO VISA                        3294,00
OBRIGADO PELA PREFERENCIA`;
