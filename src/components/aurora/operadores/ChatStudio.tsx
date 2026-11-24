/**
 * ChatStudio — create indicators by conversation (steps 1–5 of the brief).
 * The formula is internal; the user only talks, sees the chart and backtest,
 * adjusts parameters with sliders, registers and publishes.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { Check, SendHorizontal, Sparkles } from "lucide-react";
import { Button, Panel } from "../primitives";
import { Field, fieldCls } from "../personalFinance/atoms";
import { Avatar } from "./TraderMedia";
import { axisProps, CHART } from "../chartTheme";
import { cn } from "@/lib/utils";
import { evaluate, isSignal } from "@/lib/operadores/dsl";
import { backtest, type Backtest } from "@/lib/operadores/backtest";
import { series } from "@/lib/operadores/market";
import { COMISSAO, publish, type Indicator } from "@/lib/operadores/marketplace";
import {
  EMPTY,
  STEPS,
  respond,
  setParam,
  type Draft,
  type Panel as PanelKind,
  type Step,
} from "@/lib/operadores/studioChat";

interface Msg {
  role: "user" | "ai";
  text: string;
  panel?: PanelKind;
  snap?: Draft; // chart snapshot for this turn
  chips?: string[];
}
const pct = (x: number, d = 1) =>
  `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x * 100)
    .toFixed(d)
    .replace(".", ",")}%`;
const WELCOME: Msg = {
  role: "ai",
  text: "Olá! Descreva o indicador como falaria com um colega — por exemplo «quero comprar quando a média de 21 dias cruza acima da de 50 e o RSI está abaixo de 40». Eu crio o gráfico, testo no passado e ajudo a registar e vender.",
  chips: [
    "EMA 21 cruza acima da EMA 50 e RSI abaixo de 40",
    "RSI abaixo de 30",
    "MACD cruza acima e preço acima da média móvel de 200",
    "preço abaixo da banda inferior",
  ],
};

function run(d: Draft): { bt: Backtest | null; line: number[] | null } {
  const bars = series(d.simbolo);
  const v = evaluate(d.formula, bars);
  return isSignal(v)
    ? { bt: backtest(d.formula, bars), line: null }
    : { bt: null, line: v as number[] };
}

function MiniChart({ d }: { d: Draft }) {
  const bars = useMemo(() => series(d.simbolo), [d.simbolo]);
  const r = useMemo(() => run(d), [d]);
  const data = bars.map((b, i) => ({
    t: b.t,
    preco: +b.c.toFixed(4),
    ind: r.line && Number.isFinite(r.line[i]!) ? +r.line[i]!.toFixed(4) : null,
    compra: r.bt?.entradas.includes(i) ? b.c : null,
    venda: r.bt?.saidas.includes(i) ? b.c : null,
  }));
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div
        className="h-[200px] rounded-xl border border-white/10 bg-black/25 p-2"
        aria-hidden
        inert
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="t" {...axisProps} minTickGap={60} />
            <YAxis {...axisProps} width={50} domain={["auto", "auto"]} />
            <Line
              dataKey="preco"
              stroke="rgba(255,255,255,0.75)"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            {r.line ? (
              <Line
                dataKey="ind"
                stroke="var(--ambient)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ) : null}
            <Scatter
              dataKey="compra"
              fill={CHART.positive}
              shape="triangle"
              isAnimationActive={false}
            />
            <Scatter
              dataKey="venda"
              fill={CHART.negative}
              shape="triangle"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        Gráfico de {d.simbolo} com{" "}
        {r.bt
          ? `${r.bt.entradas.length} sinais de compra e ${r.bt.saidas.length} de venda`
          : "a linha do indicador"}
        .
      </p>
      {r.bt ? (
        <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {[
            ["Sinais", String(r.bt.entradas.length)],
            ["Acerto", pct(r.bt.acerto, 0).replace("+", "")],
            ["Retorno", pct(r.bt.retorno)],
            ["Comprar e manter", pct(r.bt.buyHold)],
            ["Queda máx.", pct(-r.bt.maxDD)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/[0.05] px-2 py-1.5">
              <dt className="text-micro text-white/60">{k}</dt>
              <dd className="text-caption font-bold tabular-nums text-white">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {r.bt && r.bt.entradas.length === 0 ? (
        <p role="status" className="text-micro font-semibold text-[#fcd34d]">
          Nenhum sinal neste período: as condições raramente acontecem ao mesmo tempo. Experimente
          aliviar um limite (por exemplo «muda o RSI para 50») ou testar noutro ativo.
        </p>
      ) : null}
      <p className="text-micro text-white/60">
        {d.simbolo} · dados de demonstração · Desempenho passado não garante resultados futuros.
      </p>
      <details className="text-micro text-white/60">
        <summary className="min-h-6 cursor-pointer">Detalhe técnico</summary>
        <code className="mt-1 block break-all rounded bg-black/30 px-2 py-1 text-white/80">
          {d.formula}
        </code>
      </details>
    </div>
  );
}

export function ChatStudio({
  initial,
  onSave,
  mine,
}: {
  initial: string | null;
  onSave: (ind: Indicator) => void;
  mine: number;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [text, setText] = useState("");
  const [note, setNote] = useState<{ t: string; ok: boolean } | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const send = (message: string) => {
    if (!message.trim()) return;
    let turn;
    try {
      turn = respond(draft, message);
    } catch {
      turn = {
        draft,
        reply: "Não consegui aplicar isso sem quebrar o indicador. Tente dizer de outra forma.",
        panel: null,
        step,
        chips: [],
      };
    }
    setDraft(turn.draft);
    setStep(turn.step);
    setNote(null);
    setMsgs((m) => [
      ...m,
      { role: "user", text: message },
      {
        role: "ai",
        text: turn.reply,
        panel: turn.panel,
        snap: turn.draft ?? undefined,
        chips: turn.chips,
      },
    ]);
    setText("");
  };
  useEffect(() => {
    if (initial) send(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [msgs]);

  const finish = (pub: boolean) => {
    if (!draft) return;
    const bars = series(draft.simbolo);
    const r = run(draft);
    const ind: Indicator = {
      id: `u${Date.now()}`,
      titulo: draft.titulo,
      descricao: draft.descricao,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      formula: draft.formula,
      parametros: draft.parametros,
      autor: "Você",
      preco: draft.preco,
      publicado: false,
      vendas: 0,
      avaliacoes: [],
      criado: new Date().toISOString().slice(0, 10),
      backtest: r.bt
        ? {
            periodo: `${bars[0]!.t} → ${bars[bars.length - 1]!.t}`,
            operacoes: r.bt.operacoes,
            acerto: r.bt.acerto,
            retorno: r.bt.retorno,
            maxDD: r.bt.maxDD,
            buyHold: r.bt.buyHold,
          }
        : undefined,
    };
    try {
      onSave(pub ? publish(ind) : ind);
      setNote({
        t: pub
          ? `Publicado no Marketplace (${draft.modelo === "assinatura" ? "assinatura mensal" : "venda avulsa"}).`
          : "Registado como rascunho.",
        ok: true,
      });
      if (pub) setStep(5);
    } catch (e) {
      setNote({ t: (e as Error).message, ok: false });
    }
  };
  const last = msgs.length - 1;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <Panel
        title="Criador de indicadores"
        subtitle="Converse em português ou inglês · o sistema traduz a ideia em cálculo, desenha e testa"
      >
        <ol aria-label="Passos" className="mb-3 flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <li
              key={s.n}
              aria-current={s.n === step ? "step" : undefined}
              className={cn(
                "flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-micro font-semibold",
                s.n < step
                  ? "border-[rgba(62,224,143,.4)] text-[#86efac]"
                  : s.n === step
                    ? "border-white/40 bg-white/12 text-white"
                    : "border-white/10 text-white/60",
              )}
            >
              {s.n < step ? (
                <Check size={12} aria-hidden />
              ) : (
                <span className="tabular-nums">{s.n}</span>
              )}{" "}
              {s.label}
            </li>
          ))}
        </ol>
        <div
          role="log"
          aria-label="Conversa do criador"
          aria-live="polite"
          tabIndex={0}
          className="thin-scrollbar flex max-h-[62vh] min-h-[320px] flex-col gap-3 overflow-y-auto pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
              {m.role === "ai" ? <Avatar nome="Inteligência Artificial" size={36} /> : null}
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-caption leading-relaxed",
                  m.role === "user"
                    ? "bg-[var(--ambient)] text-[var(--ambient-ink)]"
                    : "border border-white/10 bg-white/[0.05] text-white/90",
                )}
              >
                <p>{m.text}</p>
                {m.snap?.formula && (m.panel === "grafico" || (i === last && m.panel)) ? (
                  <MiniChart d={i === last && draft ? draft : m.snap} />
                ) : null}
                {i === last && m.panel === "registo" && draft ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <Field label="Título">
                      {(id) => (
                        <input
                          id={id}
                          value={draft.titulo}
                          onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
                          className={fieldCls}
                        />
                      )}
                    </Field>
                    <Field label="Descrição">
                      {(id) => (
                        <input
                          id={id}
                          value={draft.descricao}
                          onChange={(e) => setDraft({ ...draft, descricao: e.target.value })}
                          className={fieldCls}
                        />
                      )}
                    </Field>
                    <Field label="Etiquetas (separadas por vírgulas)">
                      {(id) => (
                        <input
                          id={id}
                          value={draft.tags}
                          onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                          className={fieldCls}
                        />
                      )}
                    </Field>
                    {draft.parametros.map((p) => (
                      <label key={p.nome} className="flex flex-col gap-1 text-micro text-white/80">
                        <span className="flex justify-between">
                          <span>{p.nome}</span>
                          <b className="tabular-nums text-white">{p.valor}</b>
                        </span>
                        <input
                          type="range"
                          min={p.min}
                          max={p.max}
                          step={p.max <= 1 ? 0.001 : 1}
                          value={p.valor}
                          onChange={(e) => {
                            try {
                              setDraft(setParam(draft, p.nome, Number(e.target.value)));
                            } catch {
                              /* keep last valid */
                            }
                          }}
                          className="h-6 accent-[var(--ambient)]"
                        />
                      </label>
                    ))}
                    <Button onClick={() => finish(false)}>Registar rascunho</Button>
                  </div>
                ) : null}
                {i === last && m.panel === "publicar" && draft ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    {!draft.titulo ? (
                      <Field label="Título">
                        {(id) => (
                          <input
                            id={id}
                            value={draft.titulo}
                            onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
                            className={fieldCls}
                          />
                        )}
                      </Field>
                    ) : null}
                    <div
                      role="radiogroup"
                      aria-label="Modelo de venda"
                      className="flex flex-wrap gap-2"
                    >
                      {(["avulso", "assinatura"] as const).map((mo) => (
                        <button
                          key={mo}
                          type="button"
                          role="radio"
                          aria-checked={draft.modelo === mo}
                          onClick={() => setDraft({ ...draft, modelo: mo })}
                          className={cn(
                            "min-h-10 rounded-xl border px-3 text-caption font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                            draft.modelo === mo
                              ? "border-white/40 bg-white/14 text-white"
                              : "border-white/12 text-white/75",
                          )}
                        >
                          {mo === "avulso" ? "Venda avulsa" : "Assinatura mensal"}
                        </button>
                      ))}
                    </div>
                    <Field
                      label="Preço (MT)"
                      hint={`Recebe ${Math.round(draft.preco * (1 - COMISSAO)).toLocaleString("pt-PT")} MT por venda (comissão ${Math.round(COMISSAO * 100)}%)`}
                    >
                      {(id, h) => (
                        <input
                          id={id}
                          aria-describedby={h}
                          inputMode="numeric"
                          value={draft.preco}
                          onChange={(e) =>
                            setDraft({ ...draft, preco: Math.max(0, Number(e.target.value) || 0) })
                          }
                          className={fieldCls}
                        />
                      )}
                    </Field>
                    <Button variant="primary" onClick={() => finish(true)}>
                      Publicar
                    </Button>
                  </div>
                ) : null}
                {i === last && note ? (
                  <p
                    role="status"
                    className={cn(
                      "mt-2 text-micro font-semibold",
                      note.ok ? "text-[#86efac]" : "text-[#fca5a5]",
                    )}
                  >
                    {note.t}
                  </p>
                ) : null}
                {i === last && m.chips?.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.chips.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => send(c)}
                        className="min-h-6 rounded-full border border-white/14 bg-white/[0.04] px-2.5 py-1 text-micro text-white/85 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <label htmlFor="studio-msg" className="sr-only">
            Mensagem para o criador
          </label>
          <input
            id="studio-msg"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Descreva a ideia, peça um ajuste ou diga «registar»…"
            className={cn(fieldCls, "flex-1")}
          />
          <Button type="submit" variant="primary" icon={SendHorizontal} aria-label="Enviar">
            Enviar
          </Button>
        </form>
      </Panel>
      <Panel title="Como funciona" subtitle="Os 7 passos do criador">
        <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-caption text-white/80">
          <li>Descreve a ideia em linguagem natural.</li>
          <li>O sistema traduz em cálculo e desenha o gráfico.</li>
          <li>Testa automaticamente no passado (backtest).</li>
          <li>Regista com título, descrição, etiquetas e parâmetros ajustáveis.</li>
          <li>Publica no Marketplace para outros comprarem e aplicarem.</li>
          <li>A comunidade avalia; ganha pontos, nível e posição no ranking.</li>
          <li>
            Recebe por venda ou assinatura (comissão da plataforma: {Math.round(COMISSAO * 100)}%).
          </li>
        </ol>
        <p className="mt-3 flex items-center gap-1.5 text-micro text-white/60">
          <Sparkles size={12} aria-hidden /> Os meus indicadores: {mine}
        </p>
      </Panel>
    </div>
  );
}
