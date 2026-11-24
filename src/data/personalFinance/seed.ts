/**
 * Demo household in Maputo (MZN). Dates are generated around the current month
 * so the page always looks "live". No real people or accounts.
 */
import type { Account, Category, Debt, Goal, Rule, Transaction } from "@/lib/finance/personal";
import { iso } from "@/lib/finance/personal";

export const ACCOUNTS: Account[] = [
  { id: "acc-bci", name: "Conta à ordem · BCI", kind: "caixa", balance: 0 }, // computed below
  { id: "acc-mpesa", name: "Carteira M-Pesa", kind: "caixa", balance: 0 },
  { id: "acc-poup", name: "Poupança · Millennium bim", kind: "poupanca", balance: 186_000 },
  { id: "acc-inv", name: "Bilhetes do Tesouro", kind: "investimento", balance: 240_000 },
  { id: "acc-cc", name: "Cartão de crédito", kind: "credito", balance: -38_500 },
];

export const CATEGORIES: Category[] = [
  { id: "renda", name: "Renda", group: "fixas", target: 28_000, emoji: "🏠" },
  { id: "energia", name: "Energia e água", group: "fixas", target: 3_800, emoji: "💡" },
  { id: "internet", name: "Internet e telemóvel", group: "fixas", target: 2_900, emoji: "📶" },
  { id: "escola", name: "Propinas", group: "fixas", target: 9_500, emoji: "🎓" },
  { id: "transporte", name: "Transporte", group: "fixas", target: 4_500, emoji: "🚌" },
  { id: "mercado", name: "Supermercado", group: "flexiveis", target: 15_000, emoji: "🛒" },
  { id: "restaurantes", name: "Restaurantes", group: "flexiveis", target: 4_000, emoji: "🍽️" },
  { id: "lazer", name: "Lazer", group: "flexiveis", target: 3_000, emoji: "🎬" },
  { id: "subscricoes", name: "Subscrições", group: "flexiveis", target: 1_600, emoji: "📺" },
  { id: "saude", name: "Saúde", group: "naoMensais", target: 2_500, emoji: "🩺" },
  { id: "carro", name: "Manutenção do carro", group: "naoMensais", target: 2_000, emoji: "🔧" },
  { id: "presentes", name: "Presentes e festas", group: "naoMensais", target: 1_500, emoji: "🎁" },
  { id: "reserva", name: "Reserva de emergência", group: "objetivos", target: 8_000, emoji: "🛟" },
  { id: "viagem", name: "Viagem a Inhambane", group: "objetivos", target: 3_000, emoji: "🏖️" },
];

export const RULES: Rule[] = [
  { id: "r1", match: "Shoprite", categoryId: "mercado" },
  { id: "r2", match: "EDM", categoryId: "energia" },
];

export const DEBTS: Debt[] = [
  { id: "d-cc", name: "Cartão de crédito", balance: 38_500, apr: 36, minimum: 2_500 },
  { id: "d-carro", name: "Crédito automóvel", balance: 214_000, apr: 19, minimum: 7_800 },
  { id: "d-pessoal", name: "Crédito pessoal", balance: 96_000, apr: 29, minimum: 3_900 },
  { id: "d-familia", name: "Empréstimo da família", balance: 15_000, apr: 4, minimum: 1_000 },
];

const day = (monthOffset: number, d: number) => {
  const now = new Date();
  return iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, d)));
};

export function seedGoals(): Goal[] {
  return [
    {
      id: "g-reserva",
      name: "Reserva de emergência",
      target: 300_000,
      saved: 186_000,
      due: day(10, 28),
      emoji: "🛟",
    },
    {
      id: "g-viagem",
      name: "Viagem a Inhambane",
      target: 45_000,
      saved: 12_500,
      due: day(6, 15),
      emoji: "🏖️",
    },
    {
      id: "g-portatil",
      name: "Portátil novo",
      target: 60_000,
      saved: 9_000,
      due: day(4, 1),
      emoji: "💻",
    },
  ];
}

/** Three months of history + current month up to today. */
export function seedTransactions(): Transaction[] {
  const today = new Date().getUTCDate();
  const t: Transaction[] = [];
  let n = 0;
  const add = (
    m: number,
    d: number,
    payee: string,
    amount: number,
    categoryId: string | null,
    accountId = "acc-bci",
  ) => {
    if (m === 0 && d > today) return;
    t.push({ id: `tx-${++n}`, date: day(m, d), payee, amount, categoryId, accountId });
  };
  for (const m of [-3, -2, -1, 0]) {
    add(m, 1, "Salário · Empresa Lda", 92_000, null);
    add(m, 3, "Senhorio · Renda", -28_000, "renda");
    add(m, 5, "EDM Credelec", -2_150 - (m + 3) * 90, "energia", "acc-mpesa");
    add(m, 5, "Águas da Região", -1_350, "energia", "acc-mpesa");
    add(m, 6, "Vodacom Pacote", -1_499, "internet", "acc-mpesa");
    add(m, 6, "TVCabo Fibra", -1_390, "internet");
    add(m, 7, "Escola Internacional", -9_500, "escola");
    add(m, 8, "Netflix", -650, "subscricoes");
    add(m, 9, "Spotify", -340, "subscricoes");
    add(m, 10, "Shoprite Julius Nyerere", -4_870 - (m + 3) * 120, "mercado");
    add(m, 12, "Chapa e My Love", -1_200, "transporte", "acc-mpesa");
    add(m, 14, "Galp Combustível", -2_900, "transporte");
    add(m, 15, "Freelance design", 14_000 + (m + 3) * 1_500, null);
    add(m, 16, "Restaurante Costa do Sol", -2_350, "restaurantes");
    add(m, 18, "Shoprite Julius Nyerere", -3_960, "mercado");
    add(m, 20, "Cinema Baía Mall", -900, "lazer");
    add(m, 22, "Farmácia 24", -1_180, "saude", "acc-mpesa");
    add(m, 24, "Mercado do Peixe", -2_600, "mercado", "acc-mpesa");
    add(m, 26, "Pagamento cartão", -2_500, null);
    add(m, 27, "Padaria Princesa", -640, null, "acc-mpesa"); // uncategorized on purpose
  }
  add(-1, 11, "Oficina Auto Sommerschield", -6_800, "carro");
  add(-2, 19, "Prenda de aniversário", -2_400, "presentes");
  add(0, Math.min(today, 2), "Shoprite Julius Nyerere", -1_450, null, "acc-mpesa"); // rule will catch it
  return t.sort((a, b) => b.date.localeCompare(a.date));
}

/** Cash at the start of the current month. */
export const OPENING_CASH: Record<string, number> = { "acc-bci": 41_000, "acc-mpesa": 15_000 };
