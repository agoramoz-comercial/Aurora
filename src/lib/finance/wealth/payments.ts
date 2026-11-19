/** Payment agent — methods, estimated fees and the schedule of bills to pay. */
export type Method = "mpesa" | "emola" | "transferencia" | "cartao" | "referencia";
export interface Payment {
  id: string;
  payee: string;
  amount: number;
  due: string;
  method: Method;
  accountId: string;
  categoryId: string | null;
  repeat: "nunca" | "mensal";
  paidOn?: string;
  fee?: number;
}
export const METHOD_LABEL: Record<Method, string> = {
  mpesa: "M-Pesa",
  emola: "e-Mola",
  transferencia: "Transferência bancária",
  cartao: "Cartão de débito",
  referencia: "Pagamento por referência",
};
/** Estimated sender fees (MZN) — tiered for mobile money, flat for banks. */
export function methodFee(m: Method, amount: number): number {
  if (m === "mpesa" || m === "emola") {
    const k = m === "emola" ? 0.9 : 1;
    const t =
      amount <= 1_000
        ? 10
        : amount <= 5_000
          ? 30
          : amount <= 25_000
            ? 85
            : amount <= 75_000
              ? 200
              : 350;
    return Math.round(t * k);
  }
  if (m === "transferencia") return amount >= 50_000 ? 150 : 75;
  if (m === "cartao") return 0;
  return 15;
}
export function cheapestMethod(amount: number): { method: Method; fee: number } {
  const all = (Object.keys(METHOD_LABEL) as Method[]).map((method) => ({
    method,
    fee: methodFee(method, amount),
  }));
  return all.sort((a, b) => a.fee - b.fee)[0]!;
}
