/**
 * Operadores — plan OPS-01 (A score, B studio + marketplace, D ranking and
 * contracts in simulation). Numbers come only from the deterministic engines
 * in lib/operadores; spec: docs/planos/plano-operadores.mia.yaml.
 */
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  FileUp,
  Link2,
  Lock,
  Medal,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import { Button, Drawer, Panel, SegmentedTabs, WorkspaceHeader, AccentBadge } from "../primitives";
import { Gauge } from "../cockpit/Gauge";
import { ChatStudio } from "./ChatStudio";
import { Avatar, FollowPanel, TraderProfile, readPhoto } from "./TraderMedia";
import { Chip } from "../cockpit/Rail";
import { Meter, Field, fieldCls } from "../personalFinance/atoms";
import { axisProps, tooltipProps, CHART } from "../chartTheme";
import { cn } from "@/lib/utils";
import { demoTraders, type DemoTrader } from "@/lib/operadores/demo";
import { LABEL, WEIGHTS, score, type Component, type Score } from "@/lib/operadores/score";
import { parseTrades, toCsv, type Trade } from "@/lib/operadores/trades";
import { promptToFormula, type P1Out } from "@/lib/operadores/nl";
import { evaluate, isSignal, FUNCS } from "@/lib/operadores/dsl";
import { backtest, type Backtest } from "@/lib/operadores/backtest";
import { series, SYMBOLS } from "@/lib/operadores/market";
import { COMISSAO, creators, publish, rating, type Indicator } from "@/lib/operadores/marketplace";

type Tab = "score" | "estudio" | "marketplace" | "ranking";
interface Contrato {
  id: string;
  trader: string;
  valor: number;
  pct: number;
  meses: number;
  carteira: string;
  estado: "Em verificação" | "Ativo" | "Encerrado";
  criado: string;
}
interface State {
  indicadores: Indicator[];
  compras: string[];
  contratos: Contrato[];
  fotos: Record<string, string>;
  seguindo: string[];
}

const KEY = "aurora.operadores.v1";
const ME = "Você";
const pct = (x: number, d = 1) =>
  `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x * 100)
    .toFixed(d)
    .replace(".", ",")}%`;
const mt = (n: number) => `${Math.round(n).toLocaleString("pt-PT")} MT`;
const DISCLAIMER = "Desempenho passado não garante resultados futuros.";

function seed(): State {
  const bars = series("EURUSD");
  const mk = (
    id: string,
    titulo: string,
    autor: string,
    formula: string,
    tags: string[],
    preco: number,
    vendas: number,
    notas: number[],
  ): Indicator => {
    const b = backtest(formula, bars);
    return {
      id,
      titulo,
      descricao: `Estratégia «${titulo}» validada por backtest em EURUSD.`,
      tags,
      formula,
      parametros: [],
      autor,
      preco,
      publicado: true,
      vendas,
      avaliacoes: notas.map((nota, i) => ({
        autor: `Comprador ${i + 1}`,
        nota,
        texto: nota >= 4 ? "Sinais claros e úteis." : "Precisa de filtro extra.",
      })),
      backtest: {
        periodo: b.periodo,
        operacoes: b.operacoes,
        acerto: b.acerto,
        retorno: b.retorno,
        maxDD: b.maxDD,
        buyHold: b.buyHold,
      },
      criado: "2026-11-01",
    };
  };
  return {
    indicadores: [
      mk(
        "i1",
        "Cruzamento EMA 21/50 com filtro RSI",
        "Ana Macuácua",
        "EMA(close,21) cross_above EMA(close,50) AND RSI(14) < 60",
        ["tendência", "EMA", "RSI"],
        450,
        38,
        [5, 4, 5, 4],
      ),
      mk(
        "i2",
        "Reversão na banda inferior",
        "Carla Nhantumbo",
        "close < BB_LOWER(20,2) AND RSI(14) < 35",
        ["reversão", "Bollinger"],
        300,
        21,
        [4, 4, 3],
      ),
      mk(
        "i3",
        "MACD com tendência de longo prazo",
        "Ana Macuácua",
        "MACD(12,26,9) cross_above MACD_SIGNAL(12,26,9) AND close > SMA(close,200)",
        ["MACD", "tendência"],
        600,
        12,
        [5, 5],
      ),
      mk(
        "i4",
        "Estocástico sobrevendido",
        "Bruno Tembe",
        "STOCH(14) < 20",
        ["osciladores"],
        200,
        9,
        [3, 4],
      ),
    ],
    compras: [],
    fotos: {},
    seguindo: ["ana-macu-cua"],
    contratos: [],
  };
}
function useOps(): [State, (f: (s: State) => State) => void] {
  const [s, set] = useState<State>(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw
        ? ({ ...seed(), fotos: {}, seguindo: [], ...(JSON.parse(raw) as Partial<State>) } as State)
        : seed();
    } catch {
      return seed();
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* session only */
    }
  }, [s]);
  return [s, (f) => set((x) => f(x))];
}

export function OperadoresWorkspace() {
  const [tab, setTab] = useState<Tab>("score");
  const [ops, setOps] = useOps();
  const [studioFormula, setStudioFormula] = useState<string | null>(null);
  const [focusTrader, setFocusTrader] = useState<DemoTrader | null>(null);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <WorkspaceHeader
        title="Operadores"
        badge={<AccentBadge>OPS-01</AccentBadge>}
        subtitle="Nota de traders · estúdio e marketplace de indicadores · ranking e contratos (simulação)"
      />
      <SegmentedTabs
        tabs={[
          { id: "score" as const, label: "Nota do trader" },
          { id: "estudio" as const, label: "Estúdio de indicadores" },
          { id: "marketplace" as const, label: "Marketplace de indicadores" },
          { id: "ranking" as const, label: "Ranking e contratos" },
        ]}
        active={tab}
        onSelect={setTab}
      />
      <div
        tabIndex={0}
        role="region"
        aria-label="Conteúdo de Operadores"
        className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-4 lg:overflow-y-auto lg:pr-1"
      >
        {tab === "score" ? <ScoreView initial={focusTrader} /> : null}
        {tab === "estudio" ? (
          <ChatStudio
            initial={studioFormula}
            mine={ops.indicadores.filter((i) => i.autor === "Você").length}
            onSave={(ind) => setOps((x) => ({ ...x, indicadores: [ind, ...x.indicadores] }))}
          />
        ) : null}
        {tab === "marketplace" ? (
          <MarketView
            ops={ops}
            setOps={setOps}
            onApply={(f) => (setStudioFormula(f), setTab("estudio"))}
          />
        ) : null}
        {tab === "ranking" ? (
          <RankingView
            ops={ops}
            setOps={setOps}
            onDetails={(t) => (setFocusTrader(t), setTab("score"))}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ── A · Nota do trader ─────────────────────────────────────────────── */

function ScoreView({ initial }: { initial: DemoTrader | null }) {
  const demo = useMemo(() => demoTraders(), []);
  const [src, setSrc] = useState<{
    nome: string;
    trades: Trade[];
    seal: "Declarado" | "Verificado";
    skipped: number;
  }>(() => {
    const t = initial ?? demo[0]!;
    return { nome: t.nome, trades: t.trades, seal: t.seal, skipped: 0 };
  });
  const [err, setErr] = useState("");
  const s = useMemo(() => (src.trades.length ? score(src.trades, src.seal) : null), [src]);
  const load = async (f: File) => {
    const { trades, skipped } = parseTrades(await f.text());
    if (!trades.length)
      return setErr(
        "Não encontrei operações. O ficheiro precisa de colunas de data, ativo e lucro (ou preços de entrada e saída).",
      );
    setErr("");
    setSrc({ nome: f.name, trades, seal: "Declarado", skipped });
  };
  return (
    <>
      <Panel
        title="Importar histórico"
        subtitle="CSV/Excel exportado (MetaTrader 5, Binance, corretoras) · lido só neste navegador · ligação por API só de leitura: em preparação (F1)"
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-caption font-semibold text-white focus-within:ring-2 focus-within:ring-white/60 hover:bg-white/14">
            <Upload size={15} aria-hidden /> Carregar histórico
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void load(f);
                e.target.value = "";
              }}
            />
          </label>
          <label className="sr-only" htmlFor="demo-trader">
            Trader de exemplo
          </label>
          <select
            id="demo-trader"
            className={cn(fieldCls, "h-10 w-auto")}
            value={demo.some((d) => d.nome === src.nome) ? src.nome : ""}
            onChange={(e) => {
              const t = demo.find((d) => d.nome === e.target.value);
              if (t) setSrc({ nome: t.nome, trades: t.trades, seal: t.seal, skipped: 0 });
            }}
          >
            <option value="" disabled className="bg-[#10131a]">
              Exemplos…
            </option>
            {demo.map((d) => (
              <option key={d.id} value={d.nome} className="bg-[#10131a]">
                {d.nome}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="ghost"
            icon={FileUp}
            onClick={() => {
              const b = new Blob([toCsv(src.trades)], { type: "text/csv" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(b);
              a.download = "historico-normalizado.csv";
              a.click();
            }}
          >
            Exportar normalizado
          </Button>
        </div>
        {err ? (
          <p role="alert" className="mt-2 text-micro text-[#fca5a5]">
            {err}
          </p>
        ) : null}
        <p className="mt-2 text-micro text-white/60">
          {src.nome} · {src.trades.length} operações
          {src.skipped ? ` · ${src.skipped} linhas ignoradas` : ""} · selo {src.seal}
        </p>
      </Panel>
      {s ? <ScoreCard s={s} nome={src.nome} /> : null}
    </>
  );
}

function ScoreCard({ s, nome }: { s: Score; nome: string }) {
  const m = s.metrics;
  return (
    <>
      <section
        aria-label={`Nota de ${nome}`}
        className="cx-glass-thick relative grid items-center gap-6 px-5 py-6 lg:grid-cols-[auto_1fr]"
      >
        <Gauge
          label="Nota do trader"
          size={260}
          min={0}
          max={100}
          value={s.total}
          valueText={String(s.total)}
          sub={`selo ${s.seal}`}
          tone={s.total >= 75 ? "good" : s.total >= 50 ? "warn" : "bad"}
          zones={[
            { from: 0, to: 50, tone: "bad" },
            { from: 75, to: 100, tone: "good" },
          ]}
        />
        <div className="flex flex-col gap-3">
          {(Object.keys(WEIGHTS) as Component[]).map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <div className="flex justify-between text-caption">
                <span className="text-white/85">
                  {LABEL[k]}{" "}
                  <span className="text-white/60">· peso {Math.round(WEIGHTS[k] * 100)}%</span>
                </span>
                <span className="font-bold tabular-nums text-white">{Math.round(s.parts[k])}</span>
              </div>
              <Meter
                value={s.parts[k] / 100}
                label={`${LABEL[k]}: ${Math.round(s.parts[k])} de 100`}
                tone={s.parts[k] >= 75 ? "good" : s.parts[k] >= 50 ? "warn" : "bad"}
              />
            </div>
          ))}
        </div>
        <div aria-hidden className="cx-ambient-line absolute inset-x-[10%] -bottom-px" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Leitura da nota" subtitle={DISCLAIMER}>
          <ul className="flex flex-col gap-2 text-caption">
            {s.forcas.map((f) => (
              <li key={f}>
                <Chip tone="good">Força</Chip> <span className="ml-1 text-white/85">{f}</span>
              </li>
            ))}
            {s.fraquezas.map((f) => (
              <li key={f}>
                <Chip tone="bad">Fraqueza</Chip> <span className="ml-1 text-white/85">{f}</span>
              </li>
            ))}
            <li className="mt-1 text-white/80">
              <b className="text-white">Sugestão:</b> {s.sugestao}
            </li>
          </ul>
          <p className="mt-3 text-micro text-white/60">
            Biometria (ritmo cardíaco, stress): módulo opcional com consentimento explícito; não
            entra na nota.
          </p>
        </Panel>
        <Panel title="Métricas medidas">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-caption">
            {[
              ["Retorno total", pct(m.retornoTotal)],
              ["Retorno anualizado", pct(m.retornoAnual)],
              ["Sharpe", m.sharpe.toFixed(2).replace(".", ",")],
              ["Sortino", m.sortino.toFixed(2).replace(".", ",")],
              ["Meses positivos", pct(m.pctMesesPos, 0).replace("+", "")],
              ["Estabilidade (R²)", m.estabilidade.toFixed(2).replace(".", ",")],
              ["Queda máxima", pct(-m.maxDD)],
              ["VaR 95% diário", pct(-m.var95)],
              ["Uso de stop-loss", pct(m.usoStop, 0).replace("+", "")],
              ["Taxa de acerto", pct(m.winRate, 0).replace("+", "")],
              ["Operações", String(m.trades)],
              ["Meses de histórico", String(m.meses)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-white/8 py-1">
                <dt className="text-white/70">{k}</dt>
                <dd className="tabular-nums text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
      <Panel title="Evolução do capital" subtitle="Capital inicial de referência: 10 000">
        <div className="h-[220px]" aria-hidden inert>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={s.equity}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="t" {...axisProps} minTickGap={40} />
              <YAxis {...axisProps} width={60} />
              <Tooltip {...tooltipProps} />
              <Line
                dataKey="v"
                name="Capital"
                stroke="var(--ambient)"
                dot={false}
                strokeWidth={2}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}

/* ── B · Marketplace e comunidade ───────────────────────────────────── */

function MarketView({
  ops,
  setOps,
  onApply,
}: {
  ops: State;
  setOps: (f: (s: State) => State) => void;
  onApply: (f: string) => void;
}) {
  const [tag, setTag] = useState<string | null>(null);
  const pub = ops.indicadores.filter((i) => i.publicado);
  const tags = [...new Set(pub.flatMap((i) => i.tags))];
  const list = pub.filter((i) => !tag || i.tags.includes(tag)).sort((a, b) => b.vendas - a.vendas);
  const ranking = creators(ops.indicadores);
  const buy = (id: string) =>
    setOps((s) => ({
      ...s,
      compras: [...s.compras, id],
      indicadores: s.indicadores.map((i) => (i.id === id ? { ...i, vendas: i.vendas + 1 } : i)),
    }));
  const rate = (id: string, nota: number) =>
    setOps((s) => ({
      ...s,
      indicadores: s.indicadores.map((i) =>
        i.id === id
          ? {
              ...i,
              avaliacoes: [
                ...i.avaliacoes.filter((a) => a.autor !== ME),
                { autor: ME, nota, texto: "" },
              ],
            }
          : i,
      ),
    }));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_minmax(0,360px)]">
      <Panel
        title="Indicadores à venda"
        subtitle={`Só indicadores com backtest · comissão da plataforma ${Math.round(COMISSAO * 100)}% · ${DISCLAIMER}`}
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[null, ...tags].map((t) => (
            <button
              key={t ?? "todos"}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={cn(
                "min-h-6 rounded-full border px-2.5 py-1 text-micro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                tag === t
                  ? "border-white/40 bg-white/14 text-white"
                  : "border-white/12 text-white/75",
              )}
            >
              {t ?? "Todos"}
            </button>
          ))}
        </div>
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((i) => {
            const own = ops.compras.includes(i.id) || i.autor === ME;
            const myRate = i.avaliacoes.find((a) => a.autor === ME)?.nota ?? 0;
            return (
              <li
                key={i.id}
                className="cx-glass-thin flex flex-col gap-2 rounded-[var(--cx-r3)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-caption font-bold text-white">{i.titulo}</p>
                  <span className="shrink-0 text-caption font-bold tabular-nums text-white">
                    {mt(i.preco)}
                  </span>
                </div>
                <p className="text-micro text-white/70">
                  {i.autor} · {i.vendas} vendas · {rating(i).toFixed(1).replace(".", ",")} ★ (
                  {i.avaliacoes.length})
                </p>
                <code className="block truncate rounded-lg bg-black/30 px-2 py-1 text-micro text-white/80">
                  {i.formula}
                </code>
                {i.backtest ? (
                  <p className="text-micro text-white/75">
                    Backtest: retorno {pct(i.backtest.retorno)} vs {pct(i.backtest.buyHold)} ·
                    acerto {pct(i.backtest.acerto, 0).replace("+", "")} · {i.backtest.operacoes}{" "}
                    operações
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  {own ? (
                    <Button size="sm" variant="primary" onClick={() => onApply(i.formula)}>
                      Aplicar
                    </Button>
                  ) : (
                    <Button size="sm" variant="primary" onClick={() => buy(i.id)}>
                      Comprar
                    </Button>
                  )}
                  {ops.compras.includes(i.id) ? (
                    <span role="radiogroup" aria-label={`Avaliar ${i.titulo}`} className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={myRate === n}
                          aria-label={`${n} estrelas`}
                          onClick={() => rate(i.id, n)}
                          className="grid h-8 w-8 place-items-center rounded-full text-[#fbbf24] hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        >
                          <Star
                            size={15}
                            aria-hidden
                            fill={n <= myRate ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel
        title="Ranking de criadores"
        subtitle="Pontos: vendas, avaliações, qualidade do backtest e nº de indicadores"
      >
        <ol className="flex flex-col gap-2">
          {ranking.map((c, i) => (
            <li
              key={c.autor}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-caption"
            >
              <span className="flex items-center gap-2 text-white">
                <b className="w-5 tabular-nums">{i + 1}</b> {c.autor}{" "}
                <Chip tone={c.nivel === "Mestre" ? "good" : undefined}>{c.nivel}</Chip>
              </span>
              <span className="text-right text-micro text-white/75">
                {c.pontos} pts · {c.vendas} vendas
                <br />
                receita {mt(c.receita)}
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

/* ── D · Painel de Ranking e Contratos Inteligentes (simulação) ─────── */

function RankingView({
  ops,
  setOps,
  onDetails,
}: {
  ops: State;
  setOps: (f: (s: State) => State) => void;
  onDetails: (t: DemoTrader) => void;
}) {
  const traders = useMemo(() => demoTraders().map((t) => ({ t, s: score(t.trades, t.seal) })), []);
  const [filtro, setFiltro] = useState<"top10" | "categoria" | "rentab">("top10");
  const [cat, setCat] = useState<string>("Todas");
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ valor: "50000", pct: "20", meses: "12", carteira: "" });
  const list = traders
    .filter((x) => filtro !== "categoria" || cat === "Todas" || x.t.categoria === cat)
    .sort((a, b) =>
      filtro === "rentab"
        ? b.s.metrics.retornoTotal - a.s.metrics.retornoTotal
        : b.s.total - a.s.total,
    )
    .slice(0, 10);
  const cur = list[Math.min(sel, list.length - 1)]!;
  const walletOk = /^0x[0-9a-fA-F]{40}$/.test(form.carteira);
  const sign = () => {
    const c: Contrato = {
      id: `c${Date.now()}`,
      trader: cur.t.nome,
      valor: +form.valor,
      pct: +form.pct,
      meses: +form.meses,
      carteira: form.carteira,
      estado: "Em verificação",
      criado: new Date().toISOString().slice(0, 10),
    };
    setOps((s) => ({ ...s, contratos: [c, ...s.contratos] }));
    setOpen(false);
    window.setTimeout(
      () =>
        setOps((s) => ({
          ...s,
          contratos: s.contratos.map((x) => (x.id === c.id ? { ...x, estado: "Ativo" } : x)),
        })),
      1500,
    );
  };
  const medal = ["#fbbf24", "#cbd5e1", "#d97706"];
  return (
    <div className="flex flex-col gap-4">
      <header
        className="rounded-[var(--cx-r3)] px-5 py-4"
        style={{ background: "linear-gradient(90deg,#1d4ed8,#1e40af)" }}
      >
        <h3 className="text-title font-bold text-white">
          Painel de Ranking e Contratos Inteligentes
        </h3>
        <p className="text-micro text-white/85">
          Simulação: contratos registados localmente, sem blockchain · rede de teste após parecer
          jurídico (fase F5)
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[200px_1fr_minmax(0,340px)]">
        <nav
          aria-label="Filtros do ranking"
          className="cx-glass-thin flex flex-row flex-wrap gap-2 rounded-[var(--cx-r3)] p-3 lg:flex-col"
        >
          {(
            [
              ["top10", "Top 10"],
              ["categoria", "Por categoria"],
              ["rentab", "Por rentabilidade"],
            ] as const
          ).map(([id, l]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filtro === id}
              onClick={() => (setFiltro(id), setSel(0))}
              className={cn(
                "min-h-10 rounded-xl px-3 text-left text-caption font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                filtro === id ? "bg-white/14 text-white" : "text-white/75 hover:bg-white/8",
              )}
            >
              {l}
            </button>
          ))}
          {filtro === "categoria" ? (
            <select
              aria-label="Categoria"
              value={cat}
              onChange={(e) => (setCat(e.target.value), setSel(0))}
              className={cn(fieldCls, "h-10")}
            >
              {["Todas", "Forex", "Cripto", "Ações", "Metais"].map((c) => (
                <option key={c} className="bg-[#10131a]">
                  {c}
                </option>
              ))}
            </select>
          ) : null}
        </nav>
        <Panel title="Ranking de traders">
          <div
            tabIndex={0}
            role="region"
            aria-label="Tabela do ranking"
            className="thin-scrollbar overflow-x-auto"
          >
            <table className="w-full min-w-[480px] text-caption">
              <thead>
                <tr className="text-left text-micro font-bold uppercase tracking-wider text-white/60">
                  <th className="py-2">Posição</th>
                  <th>Trader</th>
                  <th className="text-right">Nota</th>
                  <th className="text-right">Rentabilidade</th>
                  <th className="text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {list.map((x, i) => (
                  <tr
                    key={x.t.id}
                    aria-selected={i === sel}
                    className={cn(
                      "cursor-pointer border-t border-white/8",
                      i === sel && "bg-white/[0.06]",
                    )}
                    onClick={() => setSel(i)}
                  >
                    <td className="py-2">
                      {i < 3 ? (
                        <Medal size={16} aria-label={`${i + 1}.º`} style={{ color: medal[i] }} />
                      ) : (
                        <span className="tabular-nums">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-1.5">
                      <span className="flex items-center gap-2.5">
                        <Avatar nome={x.t.nome} foto={ops.fotos[x.t.id]} size={36} />
                        <span>
                          <button
                            type="button"
                            onClick={() => setSel(i)}
                            className="min-h-6 text-left font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          >
                            {x.t.nome}
                          </button>
                          <span className="block text-micro text-white/60">{x.t.categoria}</span>
                        </span>
                      </span>
                    </td>
                    <td className="text-right font-bold tabular-nums text-white">{x.s.total}</td>
                    <td
                      className={cn(
                        "text-right tabular-nums",
                        x.s.metrics.retornoTotal >= 0 ? "text-[#86efac]" : "text-[#fca5a5]",
                      )}
                    >
                      {pct(x.s.metrics.retornoTotal)}
                    </td>
                    <td className="text-right">
                      <Chip tone={x.t.seal === "Verificado" ? "good" : undefined}>{x.t.seal}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <TraderProfile
          t={cur.t}
          s={cur.s}
          foto={ops.fotos[cur.t.id]}
          seguindo={ops.seguindo.includes(cur.t.id)}
          onFoto={(f) =>
            void readPhoto(f).then((url) =>
              setOps((x) => ({ ...x, fotos: { ...x.fotos, [cur.t.id]: url } })),
            )
          }
          onSeguir={() =>
            setOps((x) => ({
              ...x,
              seguindo: x.seguindo.includes(cur.t.id)
                ? x.seguindo.filter((id) => id !== cur.t.id)
                : [...x.seguindo, cur.t.id],
            }))
          }
          onDetalhes={() => onDetails(cur.t)}
          onContrato={() => setOpen(true)}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Histórico de operações" subtitle={DISCLAIMER}>
          <div className="h-[180px]" aria-hidden inert>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cur.s.equity}>
                <XAxis dataKey="t" {...axisProps} minTickGap={50} />
                <YAxis {...axisProps} width={56} />
                <Line
                  dataKey="v"
                  stroke="#22c55e"
                  dot={false}
                  strokeWidth={2}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-2 w-full text-caption">
            <caption className="sr-only">Últimas 5 operações</caption>
            <tbody>
              {cur.t.trades
                .slice(-5)
                .reverse()
                .map((t, i) => (
                  <tr key={i} className="border-t border-white/8">
                    <td className="py-1.5 text-white/70">{t.close}</td>
                    <td className="text-white">
                      {t.symbol} · {t.side === "buy" ? "compra" : "venda"}
                    </td>
                    <td
                      className={cn(
                        "text-right tabular-nums",
                        t.pnl >= 0 ? "text-[#86efac]" : "text-[#fca5a5]",
                      )}
                    >
                      {t.pnl >= 0 ? "+" : "−"}
                      {Math.abs(t.pnl).toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Contratos" subtitle="Estados: Em verificação → Ativo → Encerrado">
          <ul className="flex flex-col gap-2">
            {ops.contratos.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-caption"
              >
                <span className="text-white">
                  {c.trader}
                  <span className="block text-micro text-white/65">
                    {mt(c.valor)} · {c.pct}% do lucro · {c.meses} meses · {c.carteira.slice(0, 6)}…
                    {c.carteira.slice(-4)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Chip
                    tone={
                      c.estado === "Ativo"
                        ? "good"
                        : c.estado === "Em verificação"
                          ? "warn"
                          : undefined
                    }
                  >
                    {c.estado}
                  </Chip>
                  {c.estado === "Ativo" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setOps((s) => ({
                          ...s,
                          contratos: s.contratos.map((x) =>
                            x.id === c.id ? { ...x, estado: "Encerrado" } : x,
                          ),
                        }))
                      }
                    >
                      Encerrar
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {!ops.contratos.length ? (
            <p className="text-caption text-white/70">Ainda sem contratos.</p>
          ) : null}
        </Panel>
      </div>
      <FollowPanel items={traders.filter((x) => ops.seguindo.includes(x.t.id))} fotos={ops.fotos} />
      <footer className="cx-glass-thin flex flex-wrap items-center justify-between gap-3 rounded-[var(--cx-r3)] px-4 py-3 text-micro text-white/80">
        <span className="flex items-center gap-2">
          <Lock size={14} aria-hidden /> Registo local auditável · simulação, sem blockchain nem
          movimento de dinheiro
        </span>
        {cur.t.seal === "Verificado" ? (
          <span className="flex items-center gap-1.5 font-bold text-[#86efac]">
            <ShieldCheck size={14} aria-hidden /> Trader verificado
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Award size={14} aria-hidden /> Histórico declarado (por verificar)
          </span>
        )}
      </footer>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Criar contrato blockchain (simulação)"
        width={480}
      >
        <div className="flex flex-col gap-3 p-5">
          <p className="text-micro text-white/75">
            Trader: <b className="text-white">{cur.t.nome}</b> · nota {cur.s.total}. Nenhum valor é
            transferido: esta é uma simulação até haver parecer jurídico e rede de teste.
          </p>
          <Field label="Valor do investimento (MT)">
            {(id) => (
              <input
                id={id}
                inputMode="numeric"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className={fieldCls}
              />
            )}
          </Field>
          <Field
            label="Percentagem do lucro para o trader (%)"
            hint="Proposta do plano: 5–10% royalties ou taxa + %"
          >
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                inputMode="numeric"
                value={form.pct}
                onChange={(e) => setForm({ ...form, pct: e.target.value })}
                className={fieldCls}
              />
            )}
          </Field>
          <Field label="Duração (meses)">
            {(id) => (
              <input
                id={id}
                inputMode="numeric"
                value={form.meses}
                onChange={(e) => setForm({ ...form, meses: e.target.value })}
                className={fieldCls}
              />
            )}
          </Field>
          <Field
            label="Endereço da carteira"
            hint="Formato 0x seguido de 40 caracteres hexadecimais"
            error={form.carteira && !walletOk ? "Endereço inválido." : undefined}
          >
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                value={form.carteira}
                onChange={(e) => setForm({ ...form, carteira: e.target.value.trim() })}
                placeholder="0x…"
                className={cn(fieldCls, "font-mono")}
              />
            )}
          </Field>
          <Button
            variant="primary"
            icon={Link2}
            disabled={!walletOk || !(+form.valor > 0)}
            onClick={sign}
          >
            Assinar contrato
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
