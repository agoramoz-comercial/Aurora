/**
 * Indicator DSL (plan OPS-01 §spec.B): a closed language — only whitelisted
 * functions, numbers, price series and operators. No user code is executed.
 *
 *   EMA(close,21) cross_above EMA(close,50) AND RSI(14) < 40
 */
import type { Bar } from "./market";

type Num = number[];
type Bool = boolean[];
export type Value = Num | Bool;
type Node =
  | { k: "num"; v: number }
  | { k: "ser"; v: "open" | "high" | "low" | "close" | "volume" }
  | { k: "call"; fn: string; args: Node[] }
  | { k: "bin"; op: string; a: Node; b: Node }
  | { k: "not"; a: Node };

export class DslError extends Error {
  constructor(
    msg: string,
    public pos: number,
  ) {
    super(msg);
  }
}

/** name: [arity of numeric params after the optional series, defaults] */
export const FUNCS: Record<string, { series: boolean; params: number[]; desc: string }> = {
  SMA: { series: true, params: [20], desc: "Média móvel simples" },
  EMA: { series: true, params: [20], desc: "Média móvel exponencial" },
  RSI: { series: false, params: [14], desc: "Índice de força relativa" },
  MACD: { series: false, params: [12, 26, 9], desc: "Linha MACD" },
  MACD_SIGNAL: { series: false, params: [12, 26, 9], desc: "Linha de sinal do MACD" },
  MACD_HIST: { series: false, params: [12, 26, 9], desc: "Histograma do MACD" },
  BB_UPPER: { series: false, params: [20, 2], desc: "Banda de Bollinger superior" },
  BB_LOWER: { series: false, params: [20, 2], desc: "Banda de Bollinger inferior" },
  STOCH: { series: false, params: [14], desc: "Estocástico %K" },
  ATR: { series: false, params: [14], desc: "Amplitude média verdadeira" },
  VWAP: { series: false, params: [20], desc: "Preço médio ponderado por volume (janela)" },
  FIB: {
    series: false,
    params: [0.618, 100],
    desc: "Nível de retração de Fibonacci (nível, janela)",
  },
};
const SERIES = ["open", "high", "low", "close", "volume"] as const;
const CMP = ["<=", ">=", "<", ">", "cross_above", "cross_below"];

function tokenize(src: string) {
  const re =
    /\s*(cross_above|cross_below|AND|OR|NOT|<=|>=|[A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|[()<>,+\-*/])/gy;
  const toks: { t: string; p: number }[] = [];
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while (re.lastIndex < src.length) {
    const p = re.lastIndex;
    if (!(m = re.exec(src))) {
      if (!src.slice(p).trim()) break;
      throw new DslError(`Símbolo não reconhecido perto de «${src.slice(p, p + 8).trim()}»`, p);
    }
    toks.push({ t: m[1]!, p: p + m[0].indexOf(m[1]!) });
  }
  return toks;
}

export function parse(src: string): Node {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i]?.t;
  const eat = (t?: string) => {
    const tok = toks[i];
    if (!tok || (t && tok.t !== t))
      throw new DslError(`Esperado «${t ?? "expressão"}»`, tok?.p ?? src.length);
    i++;
    return tok;
  };
  const or = (): Node => {
    let a = and();
    while (peek() === "OR") {
      eat();
      a = { k: "bin", op: "OR", a, b: and() };
    }
    return a;
  };
  const and = (): Node => {
    let a = not();
    while (peek() === "AND") {
      eat();
      a = { k: "bin", op: "AND", a, b: not() };
    }
    return a;
  };
  const not = (): Node => (peek() === "NOT" ? (eat(), { k: "not", a: not() }) : cmp());
  const cmp = (): Node => {
    const a = sum();
    if (CMP.includes(peek() ?? "")) {
      const op = eat().t;
      return { k: "bin", op, a, b: sum() };
    }
    return a;
  };
  const sum = (): Node => {
    let a = term();
    while (peek() === "+" || peek() === "-") {
      const op = eat().t;
      a = { k: "bin", op, a, b: term() };
    }
    return a;
  };
  const term = (): Node => {
    let a = factor();
    while (peek() === "*" || peek() === "/") {
      const op = eat().t;
      a = { k: "bin", op, a, b: factor() };
    }
    return a;
  };
  const factor = (): Node => {
    const tok = toks[i];
    if (!tok) throw new DslError("Expressão incompleta", src.length);
    if (tok.t === "(") {
      eat("(");
      const e = or();
      eat(")");
      return e;
    }
    if (/^\d/.test(tok.t)) return (eat(), { k: "num", v: Number(tok.t) });
    const low = tok.t.toLowerCase();
    if ((SERIES as readonly string[]).includes(low))
      return (eat(), { k: "ser", v: low as (typeof SERIES)[number] });
    const fn = tok.t.toUpperCase();
    if (!FUNCS[fn])
      throw new DslError(
        `Função desconhecida «${tok.t}». Disponíveis: ${Object.keys(FUNCS).join(", ")}`,
        tok.p,
      );
    eat();
    eat("(");
    const args: Node[] = [];
    if (peek() !== ")") {
      args.push(or());
      while (peek() === ",") {
        eat();
        args.push(or());
      }
    }
    eat(")");
    const spec = FUNCS[fn]!;
    const max = spec.params.length + (spec.series ? 1 : 0);
    if (args.length > max) throw new DslError(`${fn} aceita no máximo ${max} argumentos`, tok.p);
    return { k: "call", fn, args };
  };
  const ast = or();
  if (i < toks.length) throw new DslError(`Texto a mais: «${toks[i]!.t}»`, toks[i]!.p);
  return ast;
}

/* ── Indicator library ─────────────────────────────────────────────── */
const nan = (n: number) => new Array<number>(n).fill(NaN);
export function sma(x: Num, p: number): Num {
  const o = nan(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    s += x[i]!;
    if (i >= p) s -= x[i - p]!;
    if (i >= p - 1) o[i] = s / p;
  }
  return o;
}
export function ema(x: Num, p: number): Num {
  const o = nan(x.length);
  const k = 2 / (p + 1);
  let e = NaN;
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i]!)) continue;
    e = Number.isNaN(e) ? x[i]! : x[i]! * k + e * (1 - k);
    if (i >= p - 1) o[i] = e;
  }
  return o;
}
export function rsi(c: Num, p: number): Num {
  const o = nan(c.length);
  let g = 0;
  let l = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i]! - c[i - 1]!;
    const up = Math.max(d, 0);
    const dn = Math.max(-d, 0);
    if (i <= p) {
      g += up / p;
      l += dn / p;
    } else {
      g = (g * (p - 1) + up) / p;
      l = (l * (p - 1) + dn) / p;
    }
    if (i >= p) o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return o;
}
const std = (x: Num, p: number) => {
  const m = sma(x, p);
  return x.map((_, i) =>
    i < p - 1
      ? NaN
      : Math.sqrt(x.slice(i - p + 1, i + 1).reduce((s, v) => s + (v - m[i]!) ** 2, 0) / p),
  );
};
const window = (x: Num, p: number, f: (w: Num) => number) =>
  x.map((_, i) => (i < p - 1 ? NaN : f(x.slice(i - p + 1, i + 1))));

function call(fn: string, args: Value[], bars: Bar[]): Num {
  const c = bars.map((b) => b.c);
  const spec = FUNCS[fn]!;
  const nums = args.map((a) => a as Num);
  const ser =
    spec.series &&
    nums[0] &&
    nums[0].length === bars.length &&
    args.length > spec.params.length &&
    !isScalar(nums[0])
      ? nums.shift()!
      : c;
  const P = spec.params.map((d, i) => (nums[i] ? nums[i]![0]! : d));
  const p = (i: number) => Math.max(1, Math.round(P[i]!));
  switch (fn) {
    case "SMA":
      return sma(ser, p(0));
    case "EMA":
      return ema(ser, p(0));
    case "RSI":
      return rsi(c, p(0));
    case "MACD":
    case "MACD_SIGNAL":
    case "MACD_HIST": {
      const f = ema(c, p(0));
      const s = ema(c, p(1));
      const line = f.map((v, i) => v - s[i]!);
      const sig = ema(line, p(2));
      return fn === "MACD" ? line : fn === "MACD_SIGNAL" ? sig : line.map((v, i) => v - sig[i]!);
    }
    case "BB_UPPER":
    case "BB_LOWER": {
      const m = sma(c, p(0));
      const d = std(c, p(0));
      return m.map((v, i) => v + (fn === "BB_UPPER" ? 1 : -1) * P[1]! * d[i]!);
    }
    case "STOCH": {
      const hi = window(
        bars.map((b) => b.h),
        p(0),
        (w) => Math.max(...w),
      );
      const lo = window(
        bars.map((b) => b.l),
        p(0),
        (w) => Math.min(...w),
      );
      return c.map((v, i) => ((v - lo[i]!) / (hi[i]! - lo[i]! || 1)) * 100);
    }
    case "ATR": {
      const tr = bars.map((b, i) =>
        i
          ? Math.max(b.h - b.l, Math.abs(b.h - bars[i - 1]!.c), Math.abs(b.l - bars[i - 1]!.c))
          : b.h - b.l,
      );
      return sma(tr, p(0));
    }
    case "VWAP": {
      const pv = bars.map((b) => ((b.h + b.l + b.c) / 3) * b.v);
      const sp = sma(pv, p(0));
      const sv = sma(
        bars.map((b) => b.v),
        p(0),
      );
      return sp.map((v, i) => v / sv[i]!);
    }
    case "FIB": {
      const lvl = P[0]!;
      const hi = window(
        bars.map((b) => b.h),
        p(1),
        (w) => Math.max(...w),
      );
      const lo = window(
        bars.map((b) => b.l),
        p(1),
        (w) => Math.min(...w),
      );
      return hi.map((h, i) => h - (h - lo[i]!) * lvl);
    }
  }
  return nan(bars.length);
}
// Numeric literals are broadcast arrays filled with one value.
const isScalar = (x: Num) => x.length > 1 && x.every((v) => v === x[0]);

export function evaluate(src: string, bars: Bar[]): Value {
  const n = bars.length;
  const go = (node: Node): Value => {
    switch (node.k) {
      case "num":
        return new Array<number>(n).fill(node.v);
      case "ser": {
        const key = { open: "o", high: "h", low: "l", close: "c", volume: "v" }[
          node.v
        ] as keyof Bar;
        return bars.map((b) => b[key] as number);
      }
      case "not":
        return (go(node.a) as Bool).map((x) => !x);
      case "call":
        return call(node.fn, node.args.map(go), bars);
      case "bin": {
        const a = go(node.a);
        const b = go(node.b);
        const A = a as Num;
        const B = b as Num;
        switch (node.op) {
          case "AND":
            return (a as Bool).map((x, i) => x && (b as Bool)[i]!);
          case "OR":
            return (a as Bool).map((x, i) => x || (b as Bool)[i]!);
          case "<":
            return A.map((x, i) => x < B[i]!);
          case ">":
            return A.map((x, i) => x > B[i]!);
          case "<=":
            return A.map((x, i) => x <= B[i]!);
          case ">=":
            return A.map((x, i) => x >= B[i]!);
          case "cross_above":
            return A.map((x, i) => i > 0 && x > B[i]! && A[i - 1]! <= B[i - 1]!);
          case "cross_below":
            return A.map((x, i) => i > 0 && x < B[i]! && A[i - 1]! >= B[i - 1]!);
          case "+":
            return A.map((x, i) => x + B[i]!);
          case "-":
            return A.map((x, i) => x - B[i]!);
          case "*":
            return A.map((x, i) => x * B[i]!);
          case "/":
            return A.map((x, i) => x / B[i]!);
        }
      }
    }
    return [];
  };
  return go(parse(src));
}

export const isSignal = (v: Value): v is Bool => typeof v[0] === "boolean";

/** Exit rule when none is given: mirror crosses, otherwise "condition no longer true". */
export function mirror(src: string): string {
  if (/cross_(above|below)/.test(src))
    return src
      .replace(/cross_above|cross_below/g, (m) =>
        m === "cross_above" ? "cross_below" : "cross_above",
      )
      .replace(/\bAND\b[^]*$/, "")
      .trim();
  return `NOT (${src})`;
}
