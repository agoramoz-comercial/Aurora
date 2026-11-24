/** Simulated market for Portfolio Management — deterministic, no React. */
import { marketShocks, pricePath, type AssetClass, type Security } from "@/lib/portfolio/pm";
import { BENCHMARK_PROXY, BENCHMARK_WEIGHTS, SECURITIES } from "./seed";

export const SECS: Record<string, Security> = Object.fromEntries(
  SECURITIES.map((s) => [s.symbol, s]),
);
export const FUNDS = new Set(SECURITIES.filter((x) => x.fund).map((x) => x.symbol));
const SHOCKS = marketShocks();
export const PATHS: Record<string, number[]> = Object.fromEntries(
  SECURITIES.map((s) => [s.symbol, pricePath(s, SHOCKS)]),
);
export const BENCH_PATHS: Partial<Record<AssetClass, number[]>> = Object.fromEntries(
  Object.entries(BENCHMARK_PROXY).map(([k, s]) => [k, pricePath(s!, SHOCKS)]),
);
/** Blended benchmark index (rebased to 100). */
export const BENCHMARK: number[] = (() => {
  const n = SHOCKS.length + 1;
  const out: number[] = [];
  for (let t = 0; t < n; t++) {
    let v = BENCHMARK_WEIGHTS.liquidez * 100 * (1 + (0.04 * t) / 252);
    for (const [k, path] of Object.entries(BENCH_PATHS))
      v += BENCHMARK_WEIGHTS[k as AssetClass] * path![t]!;
    out.push(v);
  }
  return out;
})();
export const lastPrice = (symbol: string) => {
  const p = PATHS[symbol];
  return p ? p[p.length - 1]! : 0;
};
