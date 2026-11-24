/** Marketplace rules (plan OPS-01 §spec.B, loop L2): nothing is published without a backtest. */
import type { Backtest } from "./backtest";

export interface Indicator {
  id: string;
  titulo: string;
  descricao: string;
  tags: string[];
  formula: string;
  venda?: string;
  parametros: { nome: string; valor: number; min: number; max: number }[];
  autor: string;
  preco: number; // MZN
  backtest?: Pick<Backtest, "periodo" | "operacoes" | "acerto" | "retorno" | "maxDD" | "buyHold">;
  publicado: boolean;
  vendas: number;
  avaliacoes: { autor: string; nota: number; texto: string }[];
  criado: string;
}
export const COMISSAO = 0.25; // platform share, within the 20–30% band of the plan

export function publish(ind: Indicator): Indicator {
  if (!ind.backtest) throw new Error("Publicação recusada: o indicador ainda não tem backtest.");
  if (!ind.titulo.trim() || !ind.formula.trim())
    throw new Error("Publicação recusada: falta título ou fórmula.");
  if (/garant|sem risco|lucro certo|guarantee/i.test(`${ind.titulo} ${ind.descricao}`))
    throw new Error("Publicação recusada: promessas de lucro garantido não são permitidas.");
  return { ...ind, publicado: true };
}

export const rating = (i: Indicator) =>
  i.avaliacoes.length ? i.avaliacoes.reduce((s, a) => s + a.nota, 0) / i.avaliacoes.length : 0;

/** Creator ranking: sales, ratings and backtest quality; levels for gamification. */
export function creators(list: Indicator[]) {
  const by = new Map<string, Indicator[]>();
  for (const i of list.filter((x) => x.publicado)) by.set(i.autor, [...(by.get(i.autor) ?? []), i]);
  return [...by.entries()]
    .map(([autor, xs]) => {
      const vendas = xs.reduce((s, x) => s + x.vendas, 0);
      const nota = xs.reduce((s, x) => s + rating(x), 0) / xs.length;
      const qualidade =
        xs.reduce(
          (s, x) => s + Math.max(0, (x.backtest?.retorno ?? 0) - (x.backtest?.buyHold ?? 0)),
          0,
        ) / xs.length;
      const pontos = Math.round(vendas * 10 + nota * 20 + qualidade * 100 + xs.length * 15);
      const nivel =
        pontos >= 400
          ? "Mestre"
          : pontos >= 200
            ? "Especialista"
            : pontos >= 80
              ? "Criador"
              : "Iniciante";
      return {
        autor,
        indicadores: xs.length,
        vendas,
        nota,
        pontos,
        nivel,
        receita: xs.reduce((s, x) => s + x.vendas * x.preco * (1 - COMISSAO), 0),
      };
    })
    .sort((a, b) => b.pontos - a.pontos);
}
