/** Cost and advice agents — find what money leaked and say what to do next. */
import type { Account, Debt, Transaction } from "../personal";
import { norm } from "./text";
import type { PriceCheck } from "./prices";
import type { Position } from "./portfolio";
import type { Payment } from "./payments";
import type { Receipt } from "./receipts";

export interface ExtraCost {
  kind:
    | "Comissões bancárias"
    | "Juros e multas"
    | "Impostos e selo"
    | "Taxas de pagamento"
    | "Corretagem"
    | "Taxas no recibo"
    | "Sobrepreço vs mediana";
  label: string;
  amount: number;
  date?: string;
}

const FEE_RULES: { re: RegExp; kind: ExtraCost["kind"] }[] = [
  {
    re: /(comissao|manutencao de conta|anuidade|tarifa|taxa)/,
    kind: "Comissões bancárias",
  },
  { re: /(juro|mora|multa|penaliz|descoberto)/, kind: "Juros e multas" },
  { re: /(imposto|selo|iva)/, kind: "Impostos e selo" },
];

export function extraCosts(input: {
  transactions: Transaction[];
  payments: Payment[];
  positions: Position[];
  receipts: Receipt[];
  checks: PriceCheck[];
}): ExtraCost[] {
  const out: ExtraCost[] = [];
  for (const t of input.transactions) {
    if (t.amount >= 0) continue;
    const n = norm(t.payee + " " + (t.note ?? ""));
    const r = FEE_RULES.find((f) => f.re.test(n));
    if (r) out.push({ kind: r.kind, label: t.payee, amount: -t.amount, date: t.date });
  }
  for (const p of input.payments)
    if (p.paidOn && p.fee)
      out.push({
        kind: "Taxas de pagamento",
        label: `${p.payee} · envio`,
        amount: p.fee,
        date: p.paidOn,
      });
  for (const p of input.positions)
    if (p.fees) out.push({ kind: "Corretagem", label: p.asset.symbol, amount: p.fees });
  for (const r of input.receipts)
    if (r.fees) out.push({ kind: "Taxas no recibo", label: r.store, amount: r.fees, date: r.date });
  for (const c of input.checks)
    if (c.verdict === "caro" && c.saving > 0)
      out.push({
        kind: "Sobrepreço vs mediana",
        label: `${c.item} · ${c.store}`,
        amount: c.saving,
      });
  return out;
}

export interface Advice {
  id: string;
  tone: "bad" | "warn" | "good";
  title: string;
  body: string;
  impact: number; // MZN per year
}

export function advise(x: {
  accounts: Account[];
  debts: Debt[];
  monthlySpend: number;
  income: number;
  positions: Position[];
  costs: ExtraCost[];
  checks: PriceCheck[];
}): Advice[] {
  const out: Advice[] = [];
  const cash = x.accounts
    .filter((a) => a.kind === "caixa" || a.kind === "poupanca")
    .reduce((s, a) => s + Math.max(0, a.balance), 0);
  const months = x.monthlySpend ? cash / x.monthlySpend : 0;
  const tYield = 0.135; // Bilhetes do Tesouro, reference
  const worst = [...x.debts].sort((a, b) => b.apr - a.apr)[0];
  if (months < 3)
    out.push({
      id: "reserva",
      tone: "bad",
      title: "Reforce a reserva de emergência",
      body: `Tem ${months.toFixed(1).replace(".", ",")} meses de despesas em liquidez. A meta é 3 a 6 meses antes de investir em ativos de risco.`,
      impact: 0,
    });
  if (worst && worst.apr / 100 > tYield)
    out.push({
      id: "divida",
      tone: "bad",
      title: `Amortize primeiro: ${worst.name}`,
      body: `Esta dívida custa ${worst.apr}% ao ano, mais do que rende um Bilhete do Tesouro (~13,5%). Cada metical amortizado é um retorno garantido de ${worst.apr}%.`,
      impact: Math.round(Math.min(worst.balance, 20_000) * (worst.apr / 100 - tYield)),
    });
  if (months > 6 && x.monthlySpend)
    out.push({
      id: "parado",
      tone: "warn",
      title: "Dinheiro parado a perder valor",
      body: `Tem ${months.toFixed(0)} meses de despesas em liquidez. O excedente acima de 6 meses pode ir para Bilhetes do Tesouro ou um fundo monetário.`,
      impact: Math.round((cash - 6 * x.monthlySpend) * tYield),
    });
  const top = [...x.positions].sort((a, b) => b.weight - a.weight)[0];
  if (top && top.weight > 0.35 && x.positions.length)
    out.push({
      id: "concentracao",
      tone: "warn",
      title: `Carteira concentrada em ${top.asset.symbol}`,
      body: `${Math.round(top.weight * 100)}% da carteira está num só ativo. Limite cada posição a 20–25% para reduzir o risco.`,
      impact: 0,
    });
  const yearFees = x.costs.reduce((s, c) => s + c.amount, 0) * (12 / 3);
  if (yearFees > 0)
    out.push({
      id: "custos",
      tone: "warn",
      title: "Custos adicionais a cortar",
      body: `Ao ritmo atual, comissões, juros, taxas e sobrepreços somam cerca de ${Math.round(yearFees).toLocaleString("pt-PT")} MT por ano. Os maiores estão em «Custos adicionais».`,
      impact: Math.round(yearFees * 0.6),
    });
  const save = x.checks.reduce((s, c) => s + c.saving, 0);
  if (save > 0) {
    const best = [...x.checks].sort((a, b) => b.saving - a.saving)[0]!;
    out.push({
      id: "precos",
      tone: "good",
      title: `Compre ${best.board.product} em ${best.board.min.store}`,
      body: `Pagou ${Math.round(best.vsMedian * 100)}% acima da mediana. Comprar nos locais mais baratos pouparia ${Math.round(save).toLocaleString("pt-PT")} MT por compra igual.`,
      impact: Math.round(save * 24),
    });
  }
  const rate = x.income ? 1 - x.monthlySpend / x.income : 0;
  if (x.income && rate < 0.2)
    out.push({
      id: "taxa",
      tone: "warn",
      title: "Suba a taxa de poupança para 20%",
      body: `Poupa ${Math.round(rate * 100)}% do que recebe. Automatize uma transferência no dia do salário.`,
      impact: Math.round((0.2 - rate) * x.income * 12),
    });
  if (!out.length)
    out.push({
      id: "ok",
      tone: "good",
      title: "Património em ordem",
      body: "Reserva, dívidas e custos dentro das metas. Mantenha as contribuições automáticas.",
      impact: 0,
    });
  return out.sort((a, b) => b.impact - a.impact);
}
