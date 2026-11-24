/** Demo traders with distinct profiles (deterministic) for ranking and tests. */
import { rng, seedOf } from "./rng";
import type { Trade } from "./trades";

export interface DemoTrader {
  id: string;
  nome: string;
  categoria: "Forex" | "Cripto" | "Ações" | "Metais";
  seal: "Declarado" | "Verificado";
  trades: Trade[];
}
const PROFILES: [string, DemoTrader["categoria"], DemoTrader["seal"], number, number, number][] = [
  // nome, categoria, selo, edge, volatility, stop usage
  ["Ana Macuácua", "Forex", "Verificado", 0.18, 1, 0.95],
  ["Bruno Tembe", "Cripto", "Verificado", 0.12, 1.8, 0.7],
  ["Carla Nhantumbo", "Ações", "Declarado", 0.15, 0.8, 0.9],
  ["Dércio Sitoe", "Metais", "Verificado", 0.06, 1.2, 0.6],
  ["Elisa Mondlane", "Forex", "Declarado", 0.1, 0.9, 0.85],
  ["Fábio Cossa", "Cripto", "Declarado", -0.02, 2.2, 0.2],
  ["Graça Matsinhe", "Ações", "Verificado", 0.09, 0.7, 0.8],
  ["Hélio Muianga", "Forex", "Declarado", 0.03, 1.5, 0.4],
];
const SYM: Record<DemoTrader["categoria"], string> = {
  Forex: "EURUSD",
  Cripto: "BTCUSD",
  Ações: "AAPL",
  Metais: "XAUUSD",
};

export function demoTraders(): DemoTrader[] {
  return PROFILES.map(([nome, categoria, seal, edge, vol, stopUse]) => {
    const r = rng(seedOf(nome));
    const trades: Trade[] = [];
    const d0 = Date.UTC(2025, 6, 1);
    for (let i = 0; i < 160; i++) {
      const day = new Date(d0 + Math.floor(i * 2.2) * 864e5).toISOString().slice(0, 10);
      const side = r() > 0.5 ? "buy" : "sell";
      const qty = Math.round((1 + r() * 2) * 10) / 10;
      const pnl = Math.round((r() - 0.5 + edge / 2) * 160 * vol * 100) / 100;
      const entry = 100 + r() * 10;
      trades.push({
        open: day,
        close: day,
        symbol: SYM[categoria],
        side,
        qty,
        entry,
        exit: entry + pnl / (qty * 100),
        fees: 2,
        pnl,
        stop: r() < stopUse ? entry * 0.98 : undefined,
      });
    }
    return { id: nome.toLowerCase().replace(/[^a-z]+/g, "-"), nome, categoria, seal, trades };
  });
}
