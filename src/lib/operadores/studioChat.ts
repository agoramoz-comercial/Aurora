/**
 * Indicator studio as a conversation (plan OPS-01 §B, steps 1–7 of the
 * original brief). Pure reducer: (draft, message) → (draft, reply, step).
 * The user never has to write a formula; the formula stays internal.
 */
import { parse } from "./dsl";
import { promptToFormula, type Param } from "./nl";
import { SYMBOLS } from "./market";

export type Step = 1 | 2 | 3 | 4 | 5;
export const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Descrever" },
  { n: 2, label: "Gráfico" },
  { n: 3, label: "Validar (backtest)" },
  { n: 4, label: "Registar" },
  { n: 5, label: "Publicar e monetizar" },
];

export interface Draft {
  formula: string;
  parametros: Param[];
  explicacao: string;
  simbolo: string;
  titulo: string;
  descricao: string;
  tags: string;
  preco: number;
  modelo: "avulso" | "assinatura";
}
export type Panel = "grafico" | "registo" | "publicar" | null;
export interface Turn {
  draft: Draft | null;
  reply: string;
  panel: Panel;
  step: Step;
  chips: string[];
}

export const EMPTY: Draft = {
  formula: "",
  parametros: [],
  explicacao: "",
  simbolo: "EURUSD",
  titulo: "",
  descricao: "",
  tags: "",
  preco: 300,
  modelo: "avulso",
};

const clean = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/** Replace a parameter value inside the formula (all occurrences for MACD, first otherwise). */
export function setParam(d: Draft, nome: string, valor: number): Draft {
  const p = d.parametros.find((x) => x.nome === nome);
  if (!p) return d;
  const v = Math.min(p.max, Math.max(p.min, valor));
  const re = new RegExp(
    String.raw`(?<![\d.])${String(p.valor).replace(".", "\\.")}(?![\d.])`,
    nome.startsWith("MACD") ? "g" : "",
  );
  // Several params can share a value (e.g. SMA 20 and BB 20): replace the n-th occurrence by order of appearance.
  const same = d.parametros.filter((x) => x.valor === p.valor);
  const nth = same.indexOf(p);
  let k = -1;
  const formula = nome.startsWith("MACD")
    ? d.formula.replace(re, String(v))
    : d.formula.replace(new RegExp(re.source, "g"), (m) => (++k === nth ? String(v) : m));
  parse(formula); // never leave the draft invalid
  return { ...d, formula, parametros: d.parametros.map((x) => (x === p ? { ...x, valor: v } : x)) };
}

const CHIPS_AFTER_CHART = ["Testar em BTCUSD", "Adiciona RSI abaixo de 40", "Registar indicador"];

export function respond(prev: Draft | null, message: string): Turn {
  const t = clean(message);
  const d = prev ?? { ...EMPTY };
  const has = !!prev?.formula;

  // Step 4 · register (title, description, tags, adjustable parameters)
  if (has && /\b(registar|registrar|guardar|salvar|save)\b/.test(t))
    return {
      draft: d,
      panel: "registo",
      step: 4,
      chips: ["Publicar no marketplace"],
      reply:
        "Vamos registar. Dê um título, uma descrição e etiquetas; ajuste os parâmetros nas barras — o gráfico e o backtest atualizam ao vivo.",
    };

  // Step 5 · publish and monetise
  if (has && /\b(publicar|vender|monetizar|publish|sell)\b/.test(t))
    return {
      draft: d,
      panel: "publicar",
      step: 5,
      chips: [],
      reply:
        "Escolha o preço e o modelo (venda avulsa ou assinatura mensal). A plataforma retém 25% de comissão; só publico depois do backtest e sem promessas de lucro.",
    };

  // Change asset
  const sym = SYMBOLS.find(
    (s) =>
      t.includes(s.toLowerCase()) ||
      (s === "BTCUSD" && /\bbtc|bitcoin\b/.test(t)) ||
      (s === "XAUUSD" && /\bouro|gold\b/.test(t)),
  );
  if (has && sym && /(testa|testar|test|em|no|na|muda|troca)/.test(t))
    return {
      draft: { ...d, simbolo: sym },
      panel: "grafico",
      step: 3,
      chips: CHIPS_AFTER_CHART,
      reply: `Testei o mesmo indicador em ${sym}.`,
    };

  // Adjust one parameter ("muda o RSI para 30", "período da EMA 34")
  const num = t.match(/(\d+(?:[.,]\d+)?)/);
  if (
    has &&
    num &&
    /(muda|altera|ajusta|troca|para|change|set)/.test(t) &&
    !/(cruza|cross|abaixo|acima|below|above)/.test(t)
  ) {
    const key = ["rsi", "ema", "sma", "macd", "bollinger", "estocastico", "fibonacci"].find((k) =>
      t.includes(k),
    );
    const wantPeriod = /(periodo|period|janela|dias)/.test(t);
    const cands = d.parametros.filter((x) => (key ? clean(x.nome).includes(key === "estocastico" ? "estoc" : key) : true));
    const p =
      cands.find((x) => (wantPeriod ? /per[ií]odo|janela|r[aá]pida|lenta/i.test(x.nome) : /limiar|n[ií]vel/i.test(x.nome))) ?? cands[0];
    if (p) {
      try {
        const nd = setParam(d, p.nome, Number(num[1]!.replace(",", ".")));
        return {
          draft: nd,
          panel: "grafico",
          step: 3,
          chips: CHIPS_AFTER_CHART,
          reply: `Ajustei ${p.nome} para ${nd.parametros.find((x) => x.nome === p.nome)!.valor}.`,
        };
      } catch {
        /* fall through */
      }
    }
  }

  // Add a condition to the current indicator
  const addMatch = t.match(/^(adiciona|acrescenta|junta|e tambem|com|add|also)\s+(.*)$/);
  if (has && addMatch) {
    const extra = promptToFormula(addMatch[2]!);
    if (extra.formula) {
      const formula = `${d.formula} AND ${extra.formula}`;
      parse(formula);
      return {
        draft: {
          ...d,
          formula,
          parametros: [...d.parametros, ...extra.parametros],
          explicacao: `${d.explicacao}, e ${extra.explicacao}`,
        },
        panel: "grafico",
        step: 3,
        chips: CHIPS_AFTER_CHART,
        reply: `Acrescentei: ${extra.explicacao}.`,
      };
    }
  }

  // Step 1–3 · new description → indicator, chart, backtest
  const out = promptToFormula(message);
  if (!out.formula)
    return {
      draft: prev,
      panel: null,
      step: 1,
      chips: [
        "EMA 21 cruza acima da EMA 50",
        "RSI abaixo de 30",
        "MACD cruza acima",
        "preço abaixo da banda inferior",
      ],
      reply: `Ainda não percebi. ${out.ambiguidades[0]?.replace(/^Não percebi «[^»]*»\. /, "") ?? "Descreva a regra de compra com um indicador e um valor."}`,
    };
  return {
    draft: { ...d, formula: out.formula, parametros: out.parametros, explicacao: out.explicacao },
    panel: "grafico",
    step: 3,
    chips: CHIPS_AFTER_CHART,
    reply: `Criei o indicador: ${out.explicacao}.`,
  };
}
