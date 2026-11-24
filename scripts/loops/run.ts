/**
 * Loop runner (plan OPS-01 §loops). Each loop prints PASS/FAIL against its
 * exit criterion and the process exits non-zero if any loop fails.
 *   npm run loops
 */
import { writeFileSync } from "node:fs";
import { promptToFormula } from "../../src/lib/operadores/nl";
import { parse, sma, rsi, evaluate } from "../../src/lib/operadores/dsl";
import { backtest } from "../../src/lib/operadores/backtest";
import { series, SYMBOLS } from "../../src/lib/operadores/market";
import { demoTraders } from "../../src/lib/operadores/demo";
import { score } from "../../src/lib/operadores/score";
import { parseTrades, toCsv } from "../../src/lib/operadores/trades";
import { publish, type Indicator } from "../../src/lib/operadores/marketplace";
import { CASES, INVALID } from "./cases";
import { respond, setParam } from "../../src/lib/operadores/studioChat";

const report: Record<string, unknown> = { data: new Date().toISOString() };
let failed = 0;
const gate = (id: string, ok: boolean, detail: string) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${id} · ${detail}`);
  report[id] = { ok, detail };
  if (!ok) failed++;
};
const canon = (s: string) => s.replace(/\s+/g, " ").trim();

// L1 · prompt → formula quality (exit: ≥95% correct, 100% invalid rejected)
const misses: string[] = [];
for (const [p, want] of CASES) {
  let got = "";
  try {
    got = promptToFormula(p).formula;
  } catch (e) {
    got = `ERRO ${(e as Error).message}`;
  }
  if (canon(got) !== canon(want)) misses.push(`«${p}» → ${got || "(vazio)"} ≠ ${want}`);
}
const acc = 1 - misses.length / CASES.length;
gate(
  "L1.prompt",
  acc >= 0.95,
  `${CASES.length - misses.length}/${CASES.length} corretos (${(acc * 100).toFixed(1)}%)`,
);
misses.forEach((m) => console.log("   ✗", m));
const accepted = INVALID.filter((s) => {
  try {
    parse(s);
    return true;
  } catch {
    return false;
  }
});
gate(
  "L1.invalidas",
  accepted.length === 0,
  `${INVALID.length - accepted.length}/${INVALID.length} fórmulas inválidas rejeitadas`,
);

// Library sanity (known values)
const s = sma([1, 2, 3, 4, 5], 3);
const r = rsi(
  series("AAPL").map((b) => b.c),
  14,
).filter((x) => !Number.isNaN(x));
gate(
  "LIB.valores",
  s[2] === 2 && s[4] === 4 && r.every((x) => x >= 0 && x <= 100),
  "SMA exata; RSI dentro de 0–100",
);

// L2 · backtest gate (exit: every strategy backtests; publish without backtest refused)
let bt = 0;
for (const sym of SYMBOLS)
  for (const [, f] of CASES.filter(([, f]) => / (cross_|<|>)/.test(f)).slice(0, 12)) {
    const b = backtest(f, series(sym));
    if (Number.isFinite(b.retorno) && Number.isFinite(b.maxDD)) bt++;
  }
let refused = false;
try {
  publish({ titulo: "x", formula: "RSI(14) < 30" } as Indicator);
} catch {
  refused = true;
}
gate(
  "L2.backtest",
  bt === SYMBOLS.length * 12 && refused,
  `${bt} backtests válidos; publicação sem backtest ${refused ? "recusada" : "ACEITE"}`,
);

// L3 · score reproducibility (exit: identical twice; CSV round-trip within 1 cent)
const traders = demoTraders();
let same = 0;
let roundTrip = 0;
for (const t of traders) {
  const a = score(t.trades, t.seal);
  const b = score(t.trades, t.seal);
  if (JSON.stringify(a) === JSON.stringify(b)) same++;
  const back = parseTrades(toCsv(t.trades)).trades;
  if (Math.abs(score(back, t.seal).metrics.retornoTotal - a.metrics.retornoTotal) * 10_000 < 0.01)
    roundTrip++; // capital 10 000 → diferença < 1 cêntimo
}
gate(
  "L3.score",
  same === traders.length && roundTrip === traders.length,
  `${same}/${traders.length} idênticos; ${roundTrip}/${traders.length} iguais após exportar/importar CSV`,
);

// Speed: score in ≤10 s (plan F1 gate) — measured on all demo traders
const t0 = performance.now();
for (const t of traders) score(t.trades, t.seal);
const ms = performance.now() - t0;
gate("F1.tempo", ms < 10_000, `${traders.length} notas em ${ms.toFixed(1)} ms`);

// Ranking sanity: the disciplined profile must outrank the reckless one
const rank = traders
  .map((t) => ({ n: t.nome, s: score(t.trades, t.seal).total }))
  .sort((a, b) => b.s - a.s);
gate(
  "L3.coerencia",
  rank[0]!.n !== "Fábio Cossa" && rank[rank.length - 1]!.s < rank[0]!.s,
  rank.map((x) => `${x.n.split(" ")[0]} ${x.s}`).join(" · "),
);
void evaluate;

// L4 · conversation (chat studio): each scripted turn must land in the expected state
const convo: [string, (d: ReturnType<typeof respond>) => boolean][] = [
  ["quero comprar quando a EMA 21 cruza acima da EMA 50", (r) => r.draft?.formula === "EMA(close,21) cross_above EMA(close,50)" && r.step === 3],
  ["adiciona RSI abaixo de 40", (r) => r.draft?.formula === "EMA(close,21) cross_above EMA(close,50) AND RSI(14) < 40"],
  ["muda o RSI para 30", (r) => r.draft?.formula.endsWith("RSI(14) < 30") === true],
  ["muda o período do RSI para 21", (r) => r.draft?.formula.includes("RSI(21) < 30") === true],
  ["testa em BTC", (r) => r.draft?.simbolo === "BTCUSD"],
  ["registar", (r) => r.panel === "registo" && r.step === 4],
  ["publicar", (r) => r.panel === "publicar" && r.step === 5],
  ["blá blá", (r) => r.step === 1 && r.panel === null],
];
let d4: ReturnType<typeof respond>["draft"] = null;
let ok4 = 0;
const bad4: string[] = [];
for (const [msg, check] of convo) {
  const r = respond(d4, msg);
  if (check(r)) ok4++;
  else bad4.push(`«${msg}» → ${r.draft?.formula ?? "(sem rascunho)"} [passo ${r.step}]`);
  if (r.draft) d4 = r.draft;
}
const macd = respond(null, "MACD cruza acima").draft!;
const macd2 = setParam(macd, "MACD rápida", 8);
const bb = respond(null, "preço abaixo da banda inferior e RSI abaixo de 30").draft!;
const bb2 = setParam(bb, "Bollinger período", 30);
const p4 = macd2.formula === "MACD(8,26,9) cross_above MACD_SIGNAL(8,26,9)" && bb2.formula.startsWith("close < BB_LOWER(30,2)");
gate("L4.conversa", ok4 === convo.length && p4, `${ok4}/${convo.length} turnos corretos; barras de parâmetros ${p4 ? "coerentes" : "INCOERENTES"}`);
bad4.forEach((m) => console.log("   ✗", m));

writeFileSync("docs/planos/loops-report.json", JSON.stringify(report, null, 1));
process.exit(failed ? 1 : 0);
