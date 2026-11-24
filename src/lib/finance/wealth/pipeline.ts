/**
 * Orchestrator — runs the wealth agents as one deterministic graph so the UI
 * never wires them by hand:
 *   ingest → normalise → dedupe → classify → (prices ∥ costs) → advise
 * Each stage is a pure function; the result carries a trace for debugging.
 */
import type { Rule, Transaction } from "../personal";
import { norm } from "./text";
import { parseStatement, type Draft } from "./statements";

const KEYWORDS: [RegExp, string][] = [
  [/(shoprite|spar|game|mercado|supermercado|pick n pay|premier)/, "mercado"],
  [/(edm|credelec|fipag|aguas)/, "energia"],
  [/(vodacom|movitel|tmcel|tvcabo|zap|internet|dstv)/, "internet"],
  [/(propina|escola|colegio|universidade)/, "escola"],
  [/(chapa|uber|yango|galp|petromoc|combustivel|total energies)/, "transporte"],
  [/(restaurante|cafe|pizza|kfc|nandos|mundos)/, "restaurantes"],
  [/(netflix|spotify|showmax|apple|google)/, "subscricoes"],
  [/(farmacia|clinica|hospital)/, "saude"],
  [/(renda|arrendamento)/, "renda"],
];

export interface ImportResult {
  rows: (Omit<Transaction, "id"> & { duplicate: boolean })[];
  fresh: number;
  duplicates: number;
  classified: number;
  trace: string[];
}

export function importStatement(
  file: { name: string; text: string },
  ctx: { accountId: string; existing: Transaction[]; rules: Rule[] },
): ImportResult {
  const trace: string[] = [];
  const drafts: Draft[] = parseStatement(file.name, file.text);
  trace.push(`ingest: ${drafts.length} linhas`);
  const seen = new Set(
    ctx.existing.map((t) => `${t.date}|${Math.round(t.amount)}|${norm(t.payee)}`),
  );
  let classified = 0;
  const rows = drafts.map((d) => {
    const key = `${d.date}|${Math.round(d.amount)}|${norm(d.payee)}`;
    const duplicate = seen.has(key);
    seen.add(key);
    const n = norm(d.payee);
    const rule = ctx.rules.find((r) => n.includes(norm(r.match)));
    const kw = KEYWORDS.find(([re]) => re.test(n));
    const categoryId = d.amount > 0 ? null : (rule?.categoryId ?? kw?.[1] ?? null);
    if (categoryId) classified++;
    return {
      date: d.date,
      payee: d.payee,
      amount: Math.round(d.amount),
      categoryId,
      accountId: ctx.accountId,
      note: `Extrato · ${d.source}`,
      duplicate,
    };
  });
  const duplicates = rows.filter((r) => r.duplicate).length;
  trace.push(`dedupe: ${duplicates} repetidos`, `classify: ${classified} categorizados`);
  return { rows, fresh: rows.length - duplicates, duplicates, classified, trace };
}

export const DEMO_STATEMENT = `Banco BCI - Extrato de conta à ordem
Data Mov.;Descrição;Débito;Crédito
03/11/2026;TRF SALARIO NOVEMBRO;;92.500,00
04/11/2026;SHOPRITE MATOLA;3.420,50;
05/11/2026;COMISSAO MANUTENCAO DE CONTA;350,00;
05/11/2026;IMPOSTO DE SELO S/ COMISSAO;14,00;
07/11/2026;CREDELEC EDM;1.500,00;
09/11/2026;LEVANTAMENTO ATM OUTRO BANCO;2.000,00;
09/11/2026;TAXA LEVANTAMENTO ATM;75,00;
12/11/2026;PAG SERV TVCABO;2.150,00;
14/11/2026;JUROS DEVEDORES DESCOBERTO;412,30;
15/11/2026;GALP AV JULIUS NYERERE;2.800,00;`;
