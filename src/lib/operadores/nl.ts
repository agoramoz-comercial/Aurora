/**
 * Prompt → formula (contract P1 of plan OPS-01). Deterministic rules for PT/EN
 * so results are reproducible and testable (loop L1); unknown phrasing is
 * reported as an ambiguity instead of guessed.
 */
import { parse } from "./dsl";

export interface Param {
  nome: string;
  valor: number;
  min: number;
  max: number;
}
export interface P1Out {
  formula: string;
  parametros: Param[];
  explicacao: string;
  ambiguidades: string[];
}

/** Lowercase, strip accents; keep < > . , % which carry meaning here. */
const clean = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9<>.,% ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const n = (s: string) => Number(s.replace(",", "."));

type Rule = { re: RegExp; f: (m: RegExpMatchArray, ps: Param[]) => [string, string] };
const MA = String.raw`(?:media movel|mm|moving average|ma)?\s*(exponencial|exponential|ema|simples|simple|sma)?\s*(?:de|of|com|period[oa]?)?\s*`;
const kind = (k?: string) => (k && /expon|ema/.test(k) ? "EMA" : "SMA");
const add = (ps: Param[], nome: string, valor: number, min: number, max: number) =>
  ps.push({ nome, valor, min, max });

const RULES: Rule[] = [
  {
    // MA cross MA
    re: new RegExp(
      String.raw`${MA}${NUM}\s*(?:periodos)?\s*(?:cruza|cruzar|cross(?:es)?)\s*(?:para\s*)?(acima|cima|above|up|abaixo|baixo|below|down)\s*(?:da|de|do|the|of)?\s*${MA}${NUM}`,
    ),
    f: (m, ps) => {
      const a = kind(m[1]);
      const b = kind(m[4] ?? m[1]);
      add(ps, `${a} rápida`, n(m[2]!), 2, 200);
      add(ps, `${b} lenta`, n(m[5]!), 2, 400);
      const up = /acima|cima|above|up/.test(m[3]!);
      return [
        `${a}(close,${n(m[2]!)}) ${up ? "cross_above" : "cross_below"} ${b}(close,${n(m[5]!)})`,
        `${a} ${m[2]} cruza ${up ? "acima" : "abaixo"} da ${b} ${m[5]}`,
      ];
    },
  },
  {
    // price crosses MA
    re: new RegExp(
      String.raw`(?:preco|price|fecho|close)\s*(?:cruza|cross(?:es)?)\s*(?:para\s*)?(acima|cima|above|abaixo|baixo|below)\s*(?:da|de|do|the)?\s*${MA}${NUM}`,
    ),
    f: (m, ps) => {
      const k = kind(m[2]);
      add(ps, k, n(m[3]!), 2, 400);
      const up = /acima|cima|above/.test(m[1]!);
      return [
        `close ${up ? "cross_above" : "cross_below"} ${k}(close,${n(m[3]!)})`,
        `preço cruza ${up ? "acima" : "abaixo"} da ${k} ${m[3]}`,
      ];
    },
  },
  {
    // RSI threshold
    re: new RegExp(
      String.raw`(?:rsi|ifr)\s*(?:de|of|\()?\s*${NUM}?\)?\s*(?:esta|is|fica)?\s*(abaixo|menor|below|under|<|acima|maior|above|over|>)\s*(?:de|que|of|than)?\s*${NUM}`,
    ),
    f: (m, ps) => {
      const p = m[1] ? n(m[1]) : 14;
      add(ps, "RSI período", p, 2, 50);
      add(ps, "RSI limiar", n(m[3]!), 1, 99);
      const lt = /abaixo|menor|below|under|</.test(m[2]!);
      return [
        `RSI(${p}) ${lt ? "<" : ">"} ${n(m[3]!)}`,
        `RSI ${p} ${lt ? "abaixo" : "acima"} de ${m[3]}`,
      ];
    },
  },
  {
    // MACD signal cross
    re: /macd\s*(?:cruza|cross(?:es)?)\s*(?:para\s*)?(acima|cima|above|abaixo|baixo|below)/,
    f: (m, ps) => {
      add(ps, "MACD rápida", 12, 2, 50);
      add(ps, "MACD lenta", 26, 5, 100);
      add(ps, "MACD sinal", 9, 2, 30);
      const up = /acima|cima|above/.test(m[1]!);
      return [
        `MACD(12,26,9) ${up ? "cross_above" : "cross_below"} MACD_SIGNAL(12,26,9)`,
        `MACD cruza ${up ? "acima" : "abaixo"} da linha de sinal`,
      ];
    },
  },
  {
    // Bollinger
    re: /(?:bollinger|bandas?)[^]*?(inferior|baixo|lower|superior|cima|upper)|(inferior|superior|lower|upper)\s*(?:band|banda)/,
    f: (m, ps) => {
      add(ps, "Bollinger período", 20, 5, 100);
      add(ps, "Bollinger desvios", 2, 1, 4);
      const low = /inferior|baixo|lower/.test((m[1] ?? m[2])!);
      return [
        low ? "close < BB_LOWER(20,2)" : "close > BB_UPPER(20,2)",
        `preço ${low ? "abaixo da banda inferior" : "acima da banda superior"} de Bollinger`,
      ];
    },
  },
  {
    // Stochastic
    re: new RegExp(
      String.raw`(?:estocastico|stochastic|stoch)\s*(?:de|of)?\s*${NUM}?\s*(abaixo|below|<|acima|above|>)\s*(?:de|of)?\s*${NUM}`,
    ),
    f: (m, ps) => {
      const p = m[1] ? n(m[1]) : 14;
      add(ps, "Estocástico período", p, 3, 50);
      const lt = /abaixo|below|</.test(m[2]!);
      return [
        `STOCH(${p}) ${lt ? "<" : ">"} ${n(m[3]!)}`,
        `estocástico ${lt ? "abaixo" : "acima"} de ${m[3]}`,
      ];
    },
  },
  {
    // Fibonacci retracement
    re: new RegExp(String.raw`(?:fibonacci|fibo|fib)\s*(?:de|of|nivel|level)?\s*${NUM}\s*%?`),
    f: (m, ps) => {
      const lvl = n(m[1]!) > 1 ? n(m[1]!) / 100 : n(m[1]!);
      add(ps, "Fibonacci nível", lvl, 0.236, 0.786);
      add(ps, "Fibonacci janela", 100, 20, 400);
      return [
        `close < FIB(${lvl},100)`,
        `preço abaixo da retração de Fibonacci de ${(lvl * 100).toFixed(1)}%`,
      ];
    },
  },
  {
    // price above/below MA
    re: new RegExp(
      String.raw`(?:preco|price|fecho|close)\s*(?:esta|is)?\s*(acima|above|abaixo|below)\s*(?:da|de|do|the)?\s*${MA}${NUM}`,
    ),
    f: (m, ps) => {
      const k = kind(m[2]);
      add(ps, k, n(m[3]!), 2, 400);
      const up = /acima|above/.test(m[1]!);
      return [
        `close ${up ? ">" : "<"} ${k}(close,${n(m[3]!)})`,
        `preço ${up ? "acima" : "abaixo"} da ${k} ${m[3]}`,
      ];
    },
  },
  {
    // plain MA line (overlay)
    re: new RegExp(
      String.raw`^\s*(?:mostra|mostrar|desenha|plot|show)?\s*(?:uma?\s*)?${MA}${NUM}\s*$`,
    ),
    f: (m, ps) => {
      const k = kind(m[1]);
      add(ps, k, n(m[2]!), 2, 400);
      return [`${k}(close,${n(m[2]!)})`, `${k} de ${m[2]} períodos`];
    },
  },
];

export function promptToFormula(prompt: string): P1Out {
  // Formula written directly in the DSL is accepted as-is when it parses.
  if (/[A-Z_]{3,}\(/.test(prompt)) {
    try {
      parse(prompt);
      return {
        formula: prompt.trim().replace(/\s+/g, " "),
        parametros: [],
        explicacao: "Fórmula escrita diretamente na linguagem de indicadores.",
        ambiguidades: [],
      };
    } catch {
      /* not valid DSL: try natural language */
    }
  }
  const text = clean(prompt)
    .replace(
      /\s+(e|and)\s+(?=(?:o |a |os |as |the )?(?:rsi|ifr|macd|preco|price|fecho|close|estocastico|stoch|bollinger|banda|fib|media|mm|ema|sma))/g,
      " && ",
    )
    .replace(/\s+(ou|or)\s+/g, " || ");
  const parts: string[] = [];
  const ops: string[] = [];
  for (const chunk of text.split(/(&&|\|\|)/)) {
    if (chunk === "&&" || chunk === "||") ops.push(chunk === "&&" ? "AND" : "OR");
    else parts.push(chunk.trim());
  }
  const ps: Param[] = [];
  const formulas: string[] = [];
  const expl: string[] = [];
  const amb: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    const rule = RULES.find((r) => r.re.test(p));
    if (!rule) {
      amb.push(
        `Não percebi «${p}». Exemplos: «EMA 21 cruza acima da EMA 50», «RSI abaixo de 30», «MACD cruza acima».`,
      );
      continue;
    }
    const [f, e] = rule.f(p.match(rule.re)!, ps);
    formulas.push(f);
    expl.push(e);
  }
  const formula = formulas.reduce(
    (acc, f, i) => (i === 0 ? f : `${acc} ${ops[i - 1] ?? "AND"} ${f}`),
    "",
  );
  if (formula) parse(formula); // guarantees the output is valid DSL
  return { formula, parametros: ps, explicacao: expl.join(", e "), ambiguidades: amb };
}
