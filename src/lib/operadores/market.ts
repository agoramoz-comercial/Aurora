/** Market data: deterministic demo OHLCV series (replace with a live feed later). */
import { rng, seedOf } from "./rng";

export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
export const SYMBOLS = ["EURUSD", "BTCUSD", "AAPL", "XAUUSD", "NVDA"] as const;

export function series(symbol: string, n = 400, start = 100): Bar[] {
  const r = rng(seedOf(symbol));
  const out: Bar[] = [];
  let c = start;
  let drift = 0.0004;
  const d0 = Date.UTC(2025, 0, 1);
  for (let i = 0; i < n; i++) {
    if (i % 60 === 0) drift = (r() - 0.45) * 0.003; // regime changes
    const o = c;
    c = Math.max(1, o * (1 + drift + (r() - 0.5) * 0.03));
    const h = Math.max(o, c) * (1 + r() * 0.01);
    const l = Math.min(o, c) * (1 - r() * 0.01);
    out.push({
      t: new Date(d0 + i * 864e5).toISOString().slice(0, 10),
      o,
      h,
      l,
      c,
      v: Math.round(1e5 * (0.5 + r())),
    });
  }
  return out;
}
