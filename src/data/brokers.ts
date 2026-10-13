/**
 * brokers.ts
 *
 * Broker catalogue and demo instrument universe for the Corretoras workspace.
 *
 * Demo mode only: no credentials are collected and no network call is made.
 * Positions are generated deterministically per connection so the
 * consolidation, allocation and P&L views can be exercised end to end.
 * Prices here are illustrative reference levels, not quotes.
 */

import { buildBaselineSnapshot } from "@/lib/finance/baseline";

export type BrokerAssetClass = "equity" | "etf" | "crypto" | "forex" | "options";
export type ConnectMethod = "api" | "oauth" | "csv";

export interface BrokerDef {
  id: string;
  name: string;
  /** Two/three-letter monogram used instead of a logo. */
  mark: string;
  color: string;
  region: string;
  classes: BrokerAssetClass[];
  methods: ConnectMethod[];
  /** Instruments a demo account at this broker draws its holdings from. */
  universe: string[];
}

export const CLASS_LABEL: Record<BrokerAssetClass, string> = {
  equity: "Ações",
  etf: "ETF",
  crypto: "Cripto",
  forex: "FX",
  options: "Opções",
};

export const METHOD_META: Record<ConnectMethod, { label: string; hint: string }> = {
  api: {
    label: "API só de leitura",
    hint: "Ligação programática com permissões apenas de consulta de saldos e posições.",
  },
  oauth: {
    label: "Autorização OAuth",
    hint: "Autoriza a Aurora na página da corretora, sem partilhar a password.",
  },
  csv: {
    label: "Extrato CSV",
    hint: "Importa o extrato de posições exportado pela corretora.",
  },
};

const EQ = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "AMD"];
const ETF = ["SPY", "QQQ", "VWCE", "IWDA"];
const CRYPTO = ["BTC", "ETH", "SOL"];
const FX = ["EURUSD", "GBPUSD", "XAUUSD"];

export const BROKERS: BrokerDef[] = [
  {
    id: "ibkr",
    name: "Interactive Brokers",
    mark: "IB",
    color: "#d81e2c",
    region: "Global",
    classes: ["equity", "etf", "options", "forex"],
    methods: ["api", "csv"],
    universe: [...EQ, ...ETF, "EURUSD"],
  },
  {
    id: "saxo",
    name: "Saxo",
    mark: "SX",
    color: "#2563eb",
    region: "Europa",
    classes: ["equity", "etf", "forex", "options"],
    methods: ["oauth", "csv"],
    universe: [...EQ.slice(0, 5), ...ETF, ...FX],
  },
  {
    id: "xtb",
    name: "XTB",
    mark: "XTB",
    color: "#e11d48",
    region: "Europa",
    classes: ["equity", "etf", "forex"],
    methods: ["api", "csv"],
    universe: [...EQ.slice(0, 6), "VWCE", "IWDA", ...FX],
  },
  {
    id: "t212",
    name: "Trading 212",
    mark: "212",
    color: "#0ea5e9",
    region: "Europa",
    classes: ["equity", "etf"],
    methods: ["api", "csv"],
    universe: [...EQ, "VWCE", "IWDA"],
  },
  {
    id: "etoro",
    name: "eToro",
    mark: "eT",
    color: "#16a34a",
    region: "Global",
    classes: ["equity", "etf", "crypto"],
    methods: ["csv"],
    universe: [...EQ.slice(0, 6), "SPY", ...CRYPTO],
  },
  {
    id: "degiro",
    name: "DEGIRO",
    mark: "DG",
    color: "#0891b2",
    region: "Europa",
    classes: ["equity", "etf"],
    methods: ["csv"],
    universe: [...EQ.slice(0, 5), "VWCE", "IWDA"],
  },
  {
    id: "schwab",
    name: "Charles Schwab",
    mark: "CS",
    color: "#0284c7",
    region: "EUA",
    classes: ["equity", "etf", "options"],
    methods: ["oauth", "csv"],
    universe: [...EQ, "SPY", "QQQ"],
  },
  {
    id: "fidelity",
    name: "Fidelity",
    mark: "FI",
    color: "#15803d",
    region: "EUA",
    classes: ["equity", "etf"],
    methods: ["csv"],
    universe: [...EQ.slice(2), "SPY", "QQQ"],
  },
  {
    id: "alpaca",
    name: "Alpaca",
    mark: "AL",
    color: "#eab308",
    region: "EUA",
    classes: ["equity", "etf", "crypto"],
    methods: ["api"],
    universe: [...EQ, "SPY", "QQQ", "BTC", "ETH"],
  },
  {
    id: "binance",
    name: "Binance",
    mark: "BN",
    color: "#f0b90b",
    region: "Global",
    classes: ["crypto"],
    methods: ["api", "csv"],
    universe: CRYPTO,
  },
  {
    id: "coinbase",
    name: "Coinbase",
    mark: "CB",
    color: "#3b82f6",
    region: "Global",
    classes: ["crypto"],
    methods: ["oauth", "csv"],
    universe: CRYPTO,
  },
  {
    id: "kraken",
    name: "Kraken",
    mark: "KR",
    color: "#7c3aed",
    region: "Global",
    classes: ["crypto", "forex"],
    methods: ["api", "csv"],
    universe: [...CRYPTO, "EURUSD"],
  },
];

export const BROKER_BY_ID: Record<string, BrokerDef> = Object.fromEntries(
  BROKERS.map((b) => [b.id, b]),
);

/* --------------------------------------------------------------------------
 * Demo instrument universe
 * ------------------------------------------------------------------------ */

export interface DemoInstrument {
  symbol: string;
  name: string;
  cls: BrokerAssetClass;
  price: number;
  /** Daily volatility used to shape simulated day moves and equity curves. */
  vol: number;
}

const REFERENCE: Record<string, Omit<DemoInstrument, "symbol" | "price"> & { price?: number }> = {
  AAPL: { name: "Apple", cls: "equity", vol: 0.015 },
  MSFT: { name: "Microsoft", cls: "equity", vol: 0.014 },
  NVDA: { name: "NVIDIA", cls: "equity", vol: 0.028 },
  TSLA: { name: "Tesla", cls: "equity", vol: 0.032 },
  AMZN: { name: "Amazon", cls: "equity", vol: 0.018 },
  GOOGL: { name: "Alphabet", cls: "equity", vol: 0.017 },
  META: { name: "Meta Platforms", cls: "equity", vol: 0.022 },
  AMD: { name: "AMD", cls: "equity", vol: 0.027 },
  SPY: { name: "SPDR S&P 500", cls: "etf", vol: 0.009, price: 560 },
  QQQ: { name: "Invesco QQQ", cls: "etf", vol: 0.012, price: 480 },
  VWCE: { name: "Vanguard FTSE All-World", cls: "etf", vol: 0.008, price: 125 },
  IWDA: { name: "iShares Core MSCI World", cls: "etf", vol: 0.008, price: 98 },
  BTC: { name: "Bitcoin", cls: "crypto", vol: 0.032, price: 64000 },
  ETH: { name: "Ethereum", cls: "crypto", vol: 0.04, price: 3100 },
  SOL: { name: "Solana", cls: "crypto", vol: 0.055, price: 150 },
  EURUSD: { name: "EUR / USD", cls: "forex", vol: 0.004, price: 1.09 },
  GBPUSD: { name: "GBP / USD", cls: "forex", vol: 0.005, price: 1.27 },
  XAUUSD: { name: "Ouro / USD", cls: "forex", vol: 0.009, price: 2350 },
};

const instrumentCache = new Map<string, DemoInstrument>();

/** Equities reuse the Analytics baseline so a price reads the same everywhere. */
export function getInstrument(symbol: string): DemoInstrument {
  const hit = instrumentCache.get(symbol);
  if (hit) return hit;
  const ref = REFERENCE[symbol] ?? { name: symbol, cls: "equity" as const, vol: 0.02 };
  const price = ref.price ?? buildBaselineSnapshot(symbol).price;
  const inst: DemoInstrument = { symbol, name: ref.name, cls: ref.cls, vol: ref.vol, price };
  instrumentCache.set(symbol, inst);
  return inst;
}
