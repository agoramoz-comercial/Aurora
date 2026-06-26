import type { TickerSnapshot } from "./alphaVantage.types";
import { buildBaselineSnapshot } from "./finance/baseline";

const ALLOWED = new Set(["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "AMD"]);

/**
 * Returns a full TickerSnapshot for a given symbol using deterministic baseline
 * data. In a production setup, this could be replaced with a real API call to
 * Alpha Vantage (requires an API key and a backend proxy to keep the key safe).
 */
export async function getTickerSnapshot(opts: {
  data: { symbol: string };
}): Promise<TickerSnapshot> {
  const sym = String(opts.data.symbol ?? "").toUpperCase();
  if (!ALLOWED.has(sym)) throw new Error(`Symbol not allowed: ${sym}`);
  // Simulate a tiny async delay for realistic loading states
  await new Promise((resolve) => setTimeout(resolve, 80));
  return buildBaselineSnapshot(sym);
}

/**
 * Returns compact watchlist rows for the given symbols.
 */
export async function getWatchlist(opts: { data: { symbols: string[] } }): Promise<
  {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePct: number;
    sparkline: number[];
    source: string;
  }[]
> {
  const syms = (opts.data.symbols ?? [])
    .map((s) => String(s).toUpperCase())
    .filter((s) => ALLOWED.has(s));
  const symbols = syms.length ? syms : ["AAPL"];

  // Simulate a tiny async delay
  await new Promise((resolve) => setTimeout(resolve, 60));

  return symbols.map((sym) => {
    const s = buildBaselineSnapshot(sym);
    return {
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      change: s.change,
      changePct: s.changePct,
      sparkline: s.series.slice(-30).map((p) => p.close),
      source: s.source,
    };
  });
}
