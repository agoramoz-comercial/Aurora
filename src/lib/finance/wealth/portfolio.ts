/** Trading agent — buy/sell ledger with average cost, realised P&L and fees. */
export interface Asset {
  symbol: string;
  name: string;
  market: "BVM" | "EUA" | "Tesouro" | "Fundo";
  price: number; // MZN, reference
}
export interface Trade {
  id: string;
  date: string;
  symbol: string;
  side: "compra" | "venda";
  qty: number;
  price: number;
  fee: number;
  accountId: string;
}
export interface Position {
  asset: Asset;
  qty: number;
  avgCost: number;
  cost: number;
  value: number;
  unrealized: number;
  realized: number;
  fees: number;
  weight: number;
}

export const ASSETS: Asset[] = [
  {
    symbol: "CMH",
    name: "CMH · Companhia Moçambicana de Hidrocarbonetos",
    market: "BVM",
    price: 1_540,
  },
  { symbol: "HCB", name: "HCB · Hidroeléctrica de Cahora Bassa", market: "BVM", price: 3.1 },
  { symbol: "CDM", name: "CDM · Cervejas de Moçambique", market: "BVM", price: 240 },
  { symbol: "BT-364", name: "Bilhete do Tesouro 364 dias", market: "Tesouro", price: 100 },
  { symbol: "OT-2029", name: "Obrigação do Tesouro 2029", market: "Tesouro", price: 98.5 },
  { symbol: "FIM-MZN", name: "Fundo de mercado monetário (MZN)", market: "Fundo", price: 12.4 },
  { symbol: "AAPL", name: "Apple Inc.", market: "EUA", price: 23_450 },
  { symbol: "MSFT", name: "Microsoft Corp.", market: "EUA", price: 33_100 },
];

/** Broker commission + exchange/registration fee, as charged by MZ brokers. */
export const feeFor = (gross: number, market: Asset["market"]) =>
  Math.round(
    gross * (market === "EUA" ? 0.0075 : market === "Tesouro" ? 0.002 : 0.005) +
      (market === "EUA" ? 350 : 50),
  );

export function positions(trades: Trade[], prices: Record<string, number> = {}): Position[] {
  const map = new Map<string, { qty: number; cost: number; realized: number; fees: number }>();
  for (const t of [...trades].sort((a, b) => a.date.localeCompare(b.date))) {
    const p = map.get(t.symbol) ?? { qty: 0, cost: 0, realized: 0, fees: 0 };
    p.fees += t.fee;
    if (t.side === "compra") {
      p.cost += t.qty * t.price + t.fee;
      p.qty += t.qty;
    } else if (p.qty > 0) {
      const avg = p.cost / p.qty;
      const q = Math.min(t.qty, p.qty);
      p.realized += q * (t.price - avg) - t.fee;
      p.cost -= q * avg;
      p.qty -= q;
    }
    map.set(t.symbol, p);
  }
  const rows = [...map.entries()]
    .filter(([, p]) => p.qty > 0 || p.realized)
    .map(([sym, p]) => {
      const asset = ASSETS.find((a) => a.symbol === sym) ?? {
        symbol: sym,
        name: sym,
        market: "BVM" as const,
        price: 0,
      };
      const price = prices[sym] ?? asset.price;
      const value = p.qty * price;
      return {
        asset,
        qty: p.qty,
        avgCost: p.qty ? p.cost / p.qty : 0,
        cost: p.cost,
        value,
        unrealized: value - p.cost,
        realized: p.realized,
        fees: p.fees,
        weight: 0,
      };
    });
  const tot = rows.reduce((s, r) => s + r.value, 0) || 1;
  return rows.map((r) => ({ ...r, weight: r.value / tot }));
}

export function heldQty(trades: Trade[], symbol: string) {
  return positions(trades).find((p) => p.asset.symbol === symbol)?.qty ?? 0;
}
