/**
 * Price agent — compares what was paid with prices published by shops and
 * marketplaces. Sources plug in through PriceProvider; the default provider is
 * a dated reference sample, and a live provider is used when VITE_PRICES_API
 * points to a price service (GET ?q=<product> → PriceQuote[]).
 */
import { median, norm } from "./text";

export interface PriceQuote {
  productId: string;
  product: string;
  unit: string;
  store: string;
  location: string;
  kind: "supermercado" | "mercado" | "marketplace" | "grossista";
  price: number; // MZN per unit
  seenAt: string; // YYYY-MM-DD
  url?: string;
}

export interface PriceProvider {
  id: string;
  label: string;
  live: boolean;
  quotes(productId?: string): Promise<PriceQuote[]>;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  keys: string[];
}

export const PRODUCTS: Product[] = [
  { id: "arroz5", name: "Arroz 5 kg", unit: "5 kg", keys: ["arroz"] },
  { id: "oleo2", name: "Óleo alimentar 2 L", unit: "2 L", keys: ["oleo"] },
  { id: "acucar2", name: "Açúcar 2 kg", unit: "2 kg", keys: ["acucar"] },
  {
    id: "farinha5",
    name: "Farinha de milho 5 kg",
    unit: "5 kg",
    keys: ["farinha", "milho", "xima"],
  },
  { id: "leite1", name: "Leite UHT 1 L", unit: "1 L", keys: ["leite"] },
  { id: "ovos30", name: "Ovos (30)", unit: "30 un", keys: ["ovos", "ovo"] },
  { id: "frango1", name: "Frango congelado 1 kg", unit: "1 kg", keys: ["frango"] },
  { id: "pao", name: "Pão (unidade)", unit: "un", keys: ["pao"] },
  { id: "gas11", name: "Gás de cozinha 11 kg", unit: "11 kg", keys: ["gas", "botija"] },
  { id: "sabao", name: "Sabão em barra", unit: "un", keys: ["sabao"] },
  {
    id: "refri2",
    name: "Refrigerante 2 L",
    unit: "2 L",
    keys: ["coca", "refrigerante", "fanta", "sprite"],
  },
  { id: "tomate1", name: "Tomate 1 kg", unit: "1 kg", keys: ["tomate"] },
  { id: "cebola1", name: "Cebola 1 kg", unit: "1 kg", keys: ["cebola"] },
  { id: "batata1", name: "Batata 1 kg", unit: "1 kg", keys: ["batata"] },
  { id: "detergente", name: "Detergente em pó 1 kg", unit: "1 kg", keys: ["detergente", "omo"] },
];

const STORES: { store: string; location: string; kind: PriceQuote["kind"]; f: number }[] = [
  { store: "Shoprite", location: "Maputo · Av. Acordos de Lusaka", kind: "supermercado", f: 1.0 },
  { store: "Spar", location: "Maputo · Sommerschield", kind: "supermercado", f: 1.12 },
  { store: "Game", location: "Maputo · Maputo Shopping", kind: "supermercado", f: 1.05 },
  {
    store: "Mercado Grossista do Zimpeto",
    location: "Maputo · Zimpeto",
    kind: "grossista",
    f: 0.84,
  },
  { store: "Mercado Central", location: "Maputo · Baixa", kind: "mercado", f: 0.9 },
  { store: "Marketplace online", location: "Entrega em Maputo", kind: "marketplace", f: 0.97 },
];
const BASE: Record<string, number> = {
  arroz5: 420,
  oleo2: 330,
  acucar2: 150,
  farinha5: 260,
  leite1: 95,
  ovos30: 420,
  frango1: 310,
  pao: 10,
  gas11: 1250,
  sabao: 45,
  refri2: 120,
  tomate1: 90,
  cebola1: 80,
  batata1: 70,
  detergente: 210,
};
// Deterministic per-store jitter so the sample is stable between visits.
const jitter = (a: string, b: string) => {
  let h = 0;
  for (const c of a + b) h = (h * 31 + c.charCodeAt(0)) | 0;
  return 0.94 + (Math.abs(h) % 120) / 1000;
};

export const REFERENCE_DATE = "2026-11-15";

export const referenceProvider: PriceProvider = {
  id: "reference",
  label: "Amostra de referência",
  live: false,
  async quotes(productId) {
    return PRODUCTS.filter((p) => !productId || p.id === productId).flatMap((p) =>
      STORES.map((s) => ({
        productId: p.id,
        product: p.name,
        unit: p.unit,
        store: s.store,
        location: s.location,
        kind: s.kind,
        price: Math.round(BASE[p.id]! * s.f * jitter(p.id, s.store)),
        seenAt: REFERENCE_DATE,
      })),
    );
  },
};

function liveProvider(endpoint: string): PriceProvider {
  return {
    id: "live",
    label: "Preços em linha",
    live: true,
    async quotes(productId) {
      const r = await fetch(`${endpoint}?q=${encodeURIComponent(productId ?? "")}`);
      if (!r.ok) throw new Error(`Fonte de preços: ${r.status}`);
      return (await r.json()) as PriceQuote[];
    },
  };
}

/** Live source first (when configured), reference sample as fallback. */
export async function loadQuotes(): Promise<{ quotes: PriceQuote[]; source: PriceProvider }> {
  const ep = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_PRICES_API;
  if (ep) {
    const live = liveProvider(ep);
    try {
      const q = await live.quotes();
      if (q.length) return { quotes: q, source: live };
    } catch {
      /* fall back to the reference sample */
    }
  }
  return { quotes: await referenceProvider.quotes(), source: referenceProvider };
}

export function matchProduct(name: string): Product | null {
  const n = norm(name);
  let best: Product | null = null;
  let score = 0;
  for (const p of PRODUCTS) {
    const s = p.keys.reduce((acc, k) => acc + (n.includes(k) ? k.length : 0), 0);
    if (s > score) {
      score = s;
      best = p;
    }
  }
  return best;
}

export interface ProductBoard {
  productId: string;
  product: string;
  unit: string;
  median: number;
  min: PriceQuote;
  max: PriceQuote;
  ranked: PriceQuote[]; // highest → lowest
  spread: number; // (max-min)/median
}

export function boards(quotes: PriceQuote[]): ProductBoard[] {
  const by = new Map<string, PriceQuote[]>();
  for (const q of quotes) by.set(q.productId, [...(by.get(q.productId) ?? []), q]);
  return [...by.values()].map((qs) => {
    const ranked = [...qs].sort((a, b) => b.price - a.price);
    const med = median(qs.map((q) => q.price));
    return {
      productId: qs[0]!.productId,
      product: qs[0]!.product,
      unit: qs[0]!.unit,
      median: med,
      min: ranked[ranked.length - 1]!,
      max: ranked[0]!,
      ranked,
      spread: med ? (ranked[0]!.price - ranked[ranked.length - 1]!.price) / med : 0,
    };
  });
}

export interface PriceCheck {
  item: string;
  store: string;
  paid: number;
  board: ProductBoard;
  vsMedian: number; // +0.15 = paid 15% above median
  saving: number; // MZN vs cheapest
  verdict: "caro" | "justo" | "bom";
}

export function checkPaid(
  items: { name: string; unitPrice: number; qty: number; store: string }[],
  bs: ProductBoard[],
): PriceCheck[] {
  const map = new Map(bs.map((b) => [b.productId, b]));
  return items.flatMap((it) => {
    const p = matchProduct(it.name);
    const b = p ? map.get(p.id) : undefined;
    if (!b) return [];
    const vs = b.median ? it.unitPrice / b.median - 1 : 0;
    return [
      {
        item: it.name,
        store: it.store,
        paid: it.unitPrice,
        board: b,
        vsMedian: vs,
        saving: Math.max(0, (it.unitPrice - b.min.price) * it.qty),
        verdict: vs > 0.08 ? "caro" : vs < -0.05 ? "bom" : "justo",
      },
    ];
  });
}
