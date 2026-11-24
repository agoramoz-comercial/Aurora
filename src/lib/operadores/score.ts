/**
 * Trader score (plan OPS-01 §spec.A): five weighted components, each built
 * from measured metrics mapped to 0–100. Pure and deterministic (loop L3).
 */
import type { Seal, Trade } from "./trades";

export const WEIGHTS = {
  rentab: 0.3,
  consistencia: 0.25,
  risco: 0.25,
  disciplina: 0.1,
  verificacao: 0.1,
} as const;
export type Component = keyof typeof WEIGHTS;
export const LABEL: Record<Component, string> = {
  rentab: "Rentabilidade ajustada ao risco",
  consistencia: "Consistência",
  risco: "Controlo de risco",
  disciplina: "Disciplina",
  verificacao: "Verificação e histórico",
};

export interface Metrics {
  trades: number;
  meses: number;
  retornoTotal: number; // fraction
  retornoAnual: number;
  sharpe: number;
  sortino: number;
  pctMesesPos: number;
  estabilidade: number; // R² of equity vs straight line
  maxDD: number; // fraction (positive)
  var95: number; // daily, fraction (positive = loss)
  usoStop: number; // fraction of trades with a stop
  overtrading: number; // trades per active day
  tilt: number; // fraction of trades that follow a loss on the same day
  winRate: number;
}
export interface Score {
  total: number;
  parts: Record<Component, number>;
  metrics: Metrics;
  equity: { t: string; v: number }[];
  forcas: string[];
  fraquezas: string[];
  sugestao: string;
  seal: Seal;
}

const clamp = (x: number) => Math.max(0, Math.min(100, x));
const lin = (x: number, bad: number, good: number) => clamp(((x - bad) / (good - bad)) * 100);
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const sd = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};

export function metrics(
  trades: Trade[],
  capital = 10_000,
): { m: Metrics; equity: { t: string; v: number }[] } {
  const byDay = new Map<string, number>();
  for (const t of trades) byDay.set(t.close, (byDay.get(t.close) ?? 0) + t.pnl);
  const days = [...byDay.keys()].sort();
  const equity: { t: string; v: number }[] = [];
  let v = capital;
  const rets: number[] = [];
  for (const d of days) {
    const r = byDay.get(d)! / v;
    rets.push(r);
    v += byDay.get(d)!;
    equity.push({ t: d, v });
  }
  let peak = capital;
  let maxDD = 0;
  for (const e of equity) {
    peak = Math.max(peak, e.v);
    maxDD = Math.max(maxDD, (peak - e.v) / peak);
  }
  const months = new Map<string, number>();
  for (const t of trades)
    months.set(t.close.slice(0, 7), (months.get(t.close.slice(0, 7)) ?? 0) + t.pnl);
  const span = days.length
    ? (Date.parse(days[days.length - 1]!) - Date.parse(days[0]!)) / 864e5 + 1
    : 1;
  const total = (v - capital) / capital;
  const down = rets.filter((x) => x < 0);
  const xs = equity.map((_, i) => i);
  const ys = equity.map((e) => e.v);
  const mx = mean(xs);
  const my = mean(ys);
  const cov = mean(xs.map((x, i) => (x - mx) * (ys[i]! - my)));
  const r2 = sd(xs) && sd(ys) ? (cov / (sd(xs) * sd(ys))) ** 2 : 0;
  const sorted = [...rets].sort((a, b) => a - b);
  let tilt = 0;
  for (let i = 1; i < trades.length; i++)
    if (
      trades[i - 1]!.pnl < 0 &&
      trades[i]!.open === trades[i - 1]!.close &&
      trades[i]!.qty > trades[i - 1]!.qty
    )
      tilt++;
  const m: Metrics = {
    trades: trades.length,
    meses: months.size,
    retornoTotal: total,
    retornoAnual: Math.pow(1 + total, 365 / Math.max(span, 30)) - 1,
    sharpe: sd(rets) ? (mean(rets) / sd(rets)) * Math.sqrt(252) : 0,
    sortino:
      down.length && sd(down) ? (mean(rets) / sd(down)) * Math.sqrt(252) : mean(rets) > 0 ? 3 : 0,
    pctMesesPos: months.size ? [...months.values()].filter((x) => x > 0).length / months.size : 0,
    estabilidade: r2,
    maxDD,
    var95: sorted.length ? -sorted[Math.floor(sorted.length * 0.05)]! : 0,
    usoStop: trades.length ? trades.filter((t) => t.stop).length / trades.length : 0,
    overtrading: days.length ? trades.length / days.length : 0,
    tilt: trades.length ? tilt / trades.length : 0,
    winRate: trades.length ? trades.filter((t) => t.pnl > 0).length / trades.length : 0,
  };
  return { m, equity };
}

const NOTES: [keyof Metrics, (m: Metrics) => number, string, string][] = [
  [
    "sharpe",
    (m) => lin(m.sharpe, 0, 2),
    "Retorno elevado face ao risco (Sharpe)",
    "Retorno baixo face ao risco (Sharpe)",
  ],
  [
    "pctMesesPos",
    (m) => lin(m.pctMesesPos, 0.3, 0.8),
    "Maioria dos meses positivos",
    "Muitos meses negativos",
  ],
  [
    "estabilidade",
    (m) => lin(m.estabilidade, 0.3, 0.95),
    "Curva de capital estável",
    "Curva de capital irregular",
  ],
  ["maxDD", (m) => lin(m.maxDD, 0.4, 0.05), "Quedas máximas contidas", "Quedas máximas profundas"],
  [
    "usoStop",
    (m) => lin(m.usoStop, 0, 0.9),
    "Usa stop-loss com disciplina",
    "Opera sem stop-loss na maioria das vezes",
  ],
  [
    "tilt",
    (m) => lin(m.tilt, 0.15, 0),
    "Não aumenta risco depois de perdas",
    "Aumenta o risco logo após perdas",
  ],
];

export function score(trades: Trade[], seal: Seal = "Declarado", capital = 10_000): Score {
  const { m, equity } = metrics(trades, capital);
  const parts: Record<Component, number> = {
    rentab: (lin(m.sharpe, 0, 2) + lin(m.sortino, 0, 3) + lin(m.retornoAnual, -0.1, 0.4)) / 3,
    consistencia:
      (lin(m.pctMesesPos, 0.3, 0.8) + lin(m.estabilidade, 0.3, 0.95) + lin(m.trades, 10, 150)) / 3,
    risco: (lin(m.maxDD, 0.4, 0.05) + lin(m.var95, 0.06, 0.005) + lin(m.usoStop, 0, 0.9)) / 3,
    disciplina: (lin(m.overtrading, 12, 2) + lin(m.tilt, 0.15, 0)) / 2,
    verificacao: ((seal === "Verificado" ? 100 : 50) + lin(m.meses, 0, 12)) / 2,
  };
  const total = Math.round(
    (Object.keys(WEIGHTS) as Component[]).reduce((s, k) => s + parts[k] * WEIGHTS[k], 0),
  );
  const ranked = NOTES.map(([k, f, good, bad]) => ({ k, v: f(m), good, bad })).sort(
    (a, b) => b.v - a.v,
  );
  const weakest = ranked[ranked.length - 1]!;
  return {
    total: m.trades < 10 ? Math.min(total, 40) : total,
    parts,
    metrics: m,
    equity,
    forcas: ranked.slice(0, 2).map((x) => x.good),
    fraquezas: ranked
      .slice(-2)
      .reverse()
      .map((x) => x.bad),
    sugestao:
      m.meses < 6
        ? "Acumule pelo menos 6 meses de histórico para uma nota completa."
        : weakest.k === "usoStop"
          ? "Defina um stop-loss em todas as operações."
          : weakest.k === "maxDD"
            ? "Reduza o tamanho das posições para limitar as quedas."
            : weakest.k === "tilt"
              ? "Faça uma pausa depois de uma perda antes de voltar a operar."
              : "Mantenha o processo atual e aumente o histórico verificado.",
    seal,
  };
}
