/**
 * Finanças Pessoais — zero-based budget (YNAB), flex groups (Monarch), recurring
 * tracker (Copilot/Rocket Money), net worth (Empower), debt planner and forecast.
 * Spec: docs/prompts/FINANCAS-PESSOAIS.md.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRightLeft,
  CandlestickChart,
  Gem,
  ScanLine,
  Send,
  Tags,
  CalendarClock,
  CheckCircle2,
  Landmark,
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Wand2,
  X,
} from "lucide-react";
import {
  Button,
  Drawer,
  EmptyState,
  Panel,
  SegmentedTabs,
  WorkspaceHeader,
  AccentBadge,
} from "../primitives";
import { CHART, axisProps, legendProps, tooltipProps } from "../chartTheme";
import { cn } from "@/lib/utils";
import { FinanceStoreProvider, useFinance } from "@/data/personalFinance/store";
import {
  GROUP_LABEL,
  budgetRows,
  daysLeftInMonth,
  detectRecurring,
  emergencyTarget,
  forecast,
  goalPlan,
  iso,
  monthFlow,
  monthKey,
  mzn,
  netWorth,
  payoffPlan,
  pct,
  readyToAssign,
  runwayMonths,
  safeToSpendToday,
  savingsRate,
  addMonths,
  type CategoryRow,
  type Group,
  type Strategy,
} from "@/lib/finance/personal";
import { Field, Meter, Metric, Money, MoneyInput, fieldCls } from "./atoms";
import { FinanceInstruments } from "./FinanceInstruments";
import { isV3 } from "../cockpit/ambient";
import { WealthStoreProvider } from "@/data/personalFinance/wealthStore";
import { ImportView, InvestView, PaymentsView, PricesView, WealthView } from "./WealthViews";

type View =
  | "geral"
  | "orcamento"
  | "transacoes"
  | "recorrentes"
  | "dividas"
  | "objetivos"
  | "previsao"
  | "investir"
  | "pagamentos"
  | "importar"
  | "precos"
  | "patrimonio";
const VIEWS: { id: View; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: "geral", label: "Visão geral", shortLabel: "Geral", icon: LayoutDashboard },
  { id: "orcamento", label: "Orçamento", shortLabel: "Orçamento", icon: Wallet },
  { id: "transacoes", label: "Transações", shortLabel: "Movimentos", icon: ListChecks },
  { id: "recorrentes", label: "Recorrentes", shortLabel: "Recorrentes", icon: Repeat },
  { id: "dividas", label: "Dívidas", shortLabel: "Dívidas", icon: Landmark },
  { id: "objetivos", label: "Objetivos", shortLabel: "Objetivos", icon: Target },
  { id: "previsao", label: "Previsão", shortLabel: "Previsão", icon: TrendingUp },
  { id: "investir", label: "Investir", shortLabel: "Investir", icon: CandlestickChart },
  { id: "pagamentos", label: "Pagamentos", shortLabel: "Pagar", icon: Send },
  { id: "importar", label: "Extratos e recibos", shortLabel: "Importar", icon: ScanLine },
  { id: "precos", label: "Preços", shortLabel: "Preços", icon: Tags },
  { id: "patrimonio", label: "Património", shortLabel: "Património", icon: Gem },
];

export function PersonalFinanceWorkspace() {
  return (
    <FinanceStoreProvider>
      <WealthStoreProvider>
        <Workspace />
      </WealthStoreProvider>
    </FinanceStoreProvider>
  );
}

type Toast = { text: string; tone?: "ok" | "warn" } | null;

function useDerived() {
  const f = useFinance();
  const today = iso(new Date());
  const { state, accounts, assigned } = f;
  const rows = useMemo(
    () => budgetRows(state.categories, assigned, state.transactions, state.month),
    [state.categories, assigned, state.transactions, state.month],
  );
  const rta = readyToAssign(accounts, assigned, rows);
  const flow = monthFlow(state.transactions, state.month);
  const prev = monthFlow(state.transactions, monthKey(addMonths(state.month + "-01", -1)));
  const nw = netWorth(accounts, state.debts);
  return {
    ...f,
    today,
    rows,
    rta,
    flow,
    prev,
    nw,
    safe: safeToSpendToday(rows, today),
    runway: runwayMonths(accounts, state.categories),
  };
}

function Workspace() {
  const d = useDerived();
  const [view, setView] = useState<View>("geral");
  const [toast, setToast] = useState<Toast>(null);
  const [addOpen, setAddOpen] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);
  const overspent = d.rows.filter((r) => r.overspent).length;
  const uncategorized = d.state.transactions.filter(
    (t) => t.amount < 0 && !t.categoryId && monthKey(t.date) === d.state.month,
  ).length;
  const monthLabel = new Date(d.state.month + "-01T00:00:00Z").toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const say = (text: string, tone: "ok" | "warn" = "ok") => setToast({ text, tone });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4">
      <WorkspaceHeader
        title="Finanças Pessoais"
        badge={<AccentBadge>{monthLabel}</AccentBadge>}
        subtitle="Cada metical com uma função · dados de demonstração guardados só neste navegador"
        right={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={() => {
                d.dispatch({ type: "reset" });
                say("Dados de demonstração repostos.");
              }}
              className="hidden md:inline-flex"
            >
              Repor
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>
              Transação
            </Button>
          </>
        }
      />
      {!d.storageOk ? (
        <p role="status" className="glass-soft px-4 py-2 text-caption text-[#fcd34d]">
          O armazenamento local está bloqueado: as alterações ficam só nesta sessão.
        </p>
      ) : null}
      <SegmentedTabs
        tabs={VIEWS.map((v) => ({
          ...v,
          count:
            v.id === "orcamento" && overspent
              ? overspent
              : v.id === "transacoes" && uncategorized
                ? uncategorized
                : undefined,
        }))}
        active={view}
        onSelect={setView}
      />
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
      >
        <AnimatePresence>
          {toast ? (
            <motion.p
              key={toast.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(16,18,24,0.96)] px-4 py-2.5 text-caption font-medium text-white shadow-2xl"
            >
              {toast.tone === "warn" ? (
                <AlertTriangle size={15} className="text-[#fcd34d]" aria-hidden />
              ) : (
                <CheckCircle2 size={15} className="text-[#86efac]" aria-hidden />
              )}
              {toast.text}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      <motion.div
        key={view}
        tabIndex={0}
        role="region"
        aria-label="Conteúdo de Finanças Pessoais"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-4 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:overflow-y-auto lg:pr-1"
      >
        {view === "geral" ? <Overview d={d} go={setView} /> : null}
        {view === "orcamento" ? <Budget d={d} say={say} /> : null}
        {view === "transacoes" ? (
          <Transactions d={d} say={say} onAdd={() => setAddOpen(true)} />
        ) : null}
        {view === "recorrentes" ? <Recurring d={d} say={say} /> : null}
        {view === "dividas" ? <Debts d={d} /> : null}
        {view === "objetivos" ? <Goals d={d} say={say} /> : null}
        {view === "previsao" ? <Forecast d={d} /> : null}
        {view === "investir" ? <InvestView say={say} /> : null}
        {view === "pagamentos" ? <PaymentsView say={say} /> : null}
        {view === "importar" ? <ImportView say={say} /> : null}
        {view === "precos" ? <PricesView /> : null}
        {view === "patrimonio" ? <WealthView /> : null}
      </motion.div>
      <AddTransaction
        open={addOpen}
        onClose={() => setAddOpen(false)}
        d={d}
        onDone={(m) => say(m)}
      />
    </div>
  );
}

type D = ReturnType<typeof useDerived>;

/* ── Visão geral ─────────────────────────────────────────────────────── */

function Overview({ d, go }: { d: D; go: (v: View) => void }) {
  const rate = savingsRate(d.flow.income, d.flow.spend);
  const em = emergencyTarget(d.state.categories);
  const days = daysLeftInMonth(d.today);
  const months = useMemo(() => {
    const out: { m: string; Entradas: number; Saídas: number }[] = [];
    for (let i = -3; i <= 0; i++) {
      const k = monthKey(addMonths(d.state.month + "-01", i));
      const f = monthFlow(d.state.transactions, k);
      out.push({
        m: new Date(k + "-01T00:00:00Z").toLocaleDateString("pt-PT", {
          month: "short",
          timeZone: "UTC",
        }),
        Entradas: f.income,
        Saídas: f.spend,
      });
    }
    return out;
  }, [d.state.transactions, d.state.month]);
  const topSpend = [...d.rows].sort((a, b) => b.spent - a.spent).slice(0, 5);
  const totalSpent = d.rows.reduce((s, r) => s + r.spent, 0) || 1;
  const actions: {
    icon: React.ElementType;
    text: string;
    cta: string;
    view: View;
    tone: "warn" | "bad" | "accent";
  }[] = [];
  if (d.rta > 0)
    actions.push({
      icon: Sparkles,
      text: `${mzn(d.rta)} ainda sem função. Atribua antes de gastar.`,
      cta: "Atribuir",
      view: "orcamento",
      tone: "accent",
    });
  if (d.rta < 0)
    actions.push({
      icon: AlertTriangle,
      text: `Atribuiu ${mzn(-d.rta)} a mais do que tem.`,
      cta: "Corrigir",
      view: "orcamento",
      tone: "bad",
    });
  d.rows
    .filter((r) => r.overspent)
    .forEach((r) =>
      actions.push({
        icon: AlertTriangle,
        text: `${r.category.name} excedeu ${mzn(-r.available)}.`,
        cta: "Cobrir",
        view: "orcamento",
        tone: "bad",
      }),
    );
  const unc = d.state.transactions.filter(
    (t) => t.amount < 0 && !t.categoryId && monthKey(t.date) === d.state.month,
  ).length;
  if (unc)
    actions.push({
      icon: ListChecks,
      text: `${unc} ${unc === 1 ? "despesa sem categoria" : "despesas sem categoria"} este mês.`,
      cta: "Categorizar",
      view: "transacoes",
      tone: "warn",
    });
  if (d.runway < 3)
    actions.push({
      icon: PiggyBank,
      text: `A reserva cobre ${d.runway.toFixed(1).replace(".", ",")} meses de despesas fixas. O recomendado é 3 a 6.`,
      cta: "Ver objetivo",
      view: "objetivos",
      tone: "warn",
    });

  return (
    <>
      {isV3() ? (
        <FinanceInstruments
          assigned={d.rows.reduce((s, r) => s + r.assigned, 0)}
          spent={d.rows.reduce((s, r) => s + r.spent, 0)}
          runway={d.runway}
          rate={rate}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Seguro gastar hoje"
          value={mzn(d.safe)}
          hint={`${days} ${days === 1 ? "dia" : "dias"} até ao fim do mês`}
          tone="accent"
          how="Soma do que ainda está disponível nas categorias Flexíveis, a dividir pelos dias que faltam no mês, incluindo hoje. As Fixas e os objetivos já estão protegidos."
        />
        <Metric
          label="Pronto para atribuir"
          value={<Money value={d.rta} />}
          hint={
            d.rta === 0
              ? "Cada metical tem função"
              : d.rta > 0
                ? "Dinheiro à espera de função"
                : "Atribuído a mais"
          }
          tone={d.rta < 0 ? "bad" : d.rta > 0 ? "warn" : "good"}
          how="Saldo das contas à ordem e M-Pesa, mais o que já gastou este mês, menos tudo o que atribuiu às categorias. O objetivo é chegar a zero."
        />
        <Metric
          label="Património líquido"
          value={mzn(d.nw.net, { compact: true })}
          hint={`${mzn(d.nw.assets, { compact: true })} ativos · ${mzn(d.nw.liabilities, { compact: true })} dívidas`}
          how="Tudo o que tem (contas, poupança, investimentos) menos tudo o que deve (registo de dívidas, incluindo o cartão)."
        />
        <Metric
          label="Fluxo do mês"
          value={mzn(d.flow.net, { sign: true, compact: true })}
          hint={`${mzn(d.flow.income, { compact: true })} entrou · ${mzn(d.flow.spend, { compact: true })} saiu`}
          tone={d.flow.net >= 0 ? "good" : "bad"}
          how="Entradas menos saídas registadas neste mês até hoje."
        />
        <Metric
          label="Taxa de poupança"
          value={pct(rate)}
          hint={
            d.prev.income
              ? `Mês anterior ${pct(savingsRate(d.prev.income, d.prev.spend))}`
              : undefined
          }
          tone={rate >= 0.2 ? "good" : rate >= 0.1 ? "warn" : "bad"}
          how="(Entradas − saídas) ÷ entradas do mês. A meio do mês tende a ser alta, porque o salário já entrou e ainda faltam despesas."
        />
        <Metric
          label="Meses de reserva"
          value={`${d.runway.toFixed(1).replace(".", ",")} meses`}
          hint={`Meta: ${mzn(em.min, { compact: true })}–${mzn(em.max, { compact: true })}`}
          tone={d.runway >= 6 ? "good" : d.runway >= 3 ? "accent" : "warn"}
          how="Saldo da poupança a dividir pelas despesas Fixas de um mês. Serve para perda de rendimento: 3 a 6 meses é o intervalo recomendado."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel
          title="O que fazer agora"
          subtitle={
            actions.length
              ? `${actions.length} ${actions.length === 1 ? "ação" : "ações"} por ordem de impacto`
              : "Tudo em ordem"
          }
        >
          {actions.length ? (
            <ul className="flex flex-col gap-2">
              {actions.slice(0, 6).map((a, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <a.icon
                    size={17}
                    aria-hidden
                    className={
                      a.tone === "bad"
                        ? "text-[#fca5a5]"
                        : a.tone === "warn"
                          ? "text-[#fcd34d]"
                          : "text-[var(--aurora-accent)]"
                    }
                  />
                  <span className="min-w-0 flex-1 text-body text-white/90">{a.text}</span>
                  <Button size="sm" variant="secondary" onClick={() => go(a.view)}>
                    {a.cta}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Orçamento equilibrado"
              hint="Sem excessos, sem dinheiro por atribuir e reserva saudável."
            />
          )}
        </Panel>
        <Panel title="Entradas e saídas" subtitle="Últimos 4 meses">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} barGap={4}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="m" {...axisProps} />
                <YAxis
                  {...axisProps}
                  width={48}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip {...tooltipProps} formatter={(v) => mzn(Number(v))} />
                <Legend {...legendProps} />
                <Bar
                  animationDuration={300}
                  animationEasing="ease-out"
                  dataKey="Entradas"
                  fill={CHART.positive}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  animationDuration={300}
                  animationEasing="ease-out"
                  dataKey="Saídas"
                  fill={CHART.accent}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Para onde vai o dinheiro" subtitle="Maiores categorias deste mês">
          <ul className="flex flex-col gap-3">
            {topSpend.map((r) => (
              <li key={r.category.id} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-body">
                  <span className="truncate text-white/90">
                    <span aria-hidden>{r.category.emoji}</span> {r.category.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-white">
                    {mzn(r.spent)}{" "}
                    <span className="text-micro text-white/55">· {pct(r.spent / totalSpent)}</span>
                  </span>
                </div>
                <Meter
                  value={r.spent / totalSpent}
                  label={`${r.category.name}: ${pct(r.spent / totalSpent)} do gasto`}
                />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Contas" subtitle="Saldos de hoje">
          <ul className="flex flex-col divide-y divide-white/8">
            {d.accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-body">
                <span className="min-w-0">
                  <span className="block truncate text-white/90">{a.name}</span>
                  <span className="text-micro capitalize text-white/55">
                    {a.kind === "caixa" ? "à ordem" : a.kind}
                  </span>
                </span>
                <Money value={a.balance} className="shrink-0 font-semibold" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

/* ── Orçamento ───────────────────────────────────────────────────────── */

const GROUPS: Group[] = ["fixas", "flexiveis", "naoMensais", "objetivos"];

function Budget({ d, say }: { d: D; say: (m: string, t?: "ok" | "warn") => void }) {
  const [move, setMove] = useState<CategoryRow | null>(null);
  const totalAssigned = Object.values(d.assigned).reduce((s, n) => s + n, 0);
  const toTarget = d.state.categories.reduce(
    (s, c) => s + Math.max(0, c.target - (d.assigned[c.id] ?? 0)),
    0,
  );
  return (
    <>
      <div
        className={cn(
          "glass flex flex-wrap items-center gap-4 p-4",
          d.rta < 0 && "ring-1 ring-[#f87171]/50",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-micro font-semibold uppercase tracking-[0.12em] text-white/60">
            Pronto para atribuir
          </p>
          <p
            className="text-hero font-semibold tabular-nums"
            style={{ color: d.rta < 0 ? "#fca5a5" : d.rta === 0 ? "#86efac" : "#fff" }}
          >
            {mzn(d.rta)}
          </p>
          <p className="text-caption text-white/65">
            {d.rta === 0
              ? "Cada metical tem uma função."
              : d.rta > 0
                ? "Dê uma função a este dinheiro: categoria, objetivo ou dívida."
                : "Atribuiu mais do que tem. Retire de uma categoria."}{" "}
            Atribuído: {mzn(totalAssigned)}.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Wand2}
          disabled={toTarget === 0 || d.rta <= 0}
          onClick={() => {
            d.dispatch({ type: "assignTargets" });
            say(`Alvos atribuídos: ${mzn(Math.min(toTarget, Math.max(0, d.rta)))} distribuídos.`);
          }}
        >
          Atribuir alvos {toTarget ? `(${mzn(toTarget, { compact: true })})` : ""}
        </Button>
      </div>
      {GROUPS.map((g) => {
        const rows = d.rows.filter((r) => r.category.group === g);
        const sum = rows.reduce(
          (s, r) => ({ a: s.a + r.assigned, sp: s.sp + r.spent, av: s.av + r.available }),
          { a: 0, sp: 0, av: 0 },
        );
        return (
          <Panel
            key={g}
            title={GROUP_LABEL[g]}
            subtitle={
              g === "naoMensais"
                ? "Poupe todos os meses para despesas que chegam uma vez por ano"
                : g === "objetivos"
                  ? "Contribuições mensais para os seus objetivos"
                  : undefined
            }
            right={
              <span className="text-caption tabular-nums text-white/70">
                {mzn(sum.av)} disponível
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-body">
                <thead>
                  <tr className="text-left text-micro uppercase tracking-[0.1em] text-white/55">
                    <th scope="col" className="pb-2 font-semibold">
                      Categoria
                    </th>
                    <th scope="col" className="pb-2 text-right font-semibold">
                      Atribuído
                    </th>
                    <th scope="col" className="pb-2 text-right font-semibold">
                      Gasto
                    </th>
                    <th scope="col" className="pb-2 text-right font-semibold">
                      Disponível
                    </th>
                    <th scope="col" className="w-10 pb-2">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.category.id} className="border-t border-white/8">
                      <td className="py-2 pr-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-white/90">
                            <span aria-hidden>{r.category.emoji}</span> {r.category.name}
                          </span>
                          <Meter
                            value={r.progress}
                            label={`${r.category.name}: ${pct(r.progress)} usado`}
                            tone={
                              r.overspent
                                ? "bad"
                                : r.category.group === "flexiveis" && r.progress > 0.9
                                  ? "warn"
                                  : r.progress >= 1
                                    ? "good"
                                    : "accent"
                            }
                          />
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <MoneyInput
                          value={r.assigned}
                          label={`Atribuído a ${r.category.name}`}
                          onCommit={(n) =>
                            d.dispatch({ type: "assign", categoryId: r.category.id, amount: n })
                          }
                        />
                      </td>
                      <td className="py-2 text-right tabular-nums text-white/75">{mzn(r.spent)}</td>
                      <td className="py-2 text-right">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-caption font-semibold tabular-nums",
                            r.overspent
                              ? "bg-[#7f1d1d] text-white"
                              : r.available === 0
                                ? "bg-white/10 text-white/70"
                                : "bg-[#14532d] text-[#dcfce7]",
                          )}
                        >
                          {mzn(r.available)}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setMove(r)}
                          aria-label={
                            r.overspent
                              ? `Cobrir excesso de ${r.category.name}`
                              : `Mover dinheiro de ${r.category.name}`
                          }
                          title={r.overspent ? "Cobrir excesso" : "Mover dinheiro"}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-full hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                            r.overspent ? "text-[#fca5a5]" : "text-white/70",
                          )}
                        >
                          <ArrowRightLeft size={15} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        );
      })}
      <MoveMoney row={move} d={d} onClose={() => setMove(null)} onDone={(m) => say(m)} />
    </>
  );
}

function MoveMoney({
  row,
  d,
  onClose,
  onDone,
}: {
  row: CategoryRow | null;
  d: D;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const covering = !!row?.overspent;
  const [other, setOther] = useState("");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!row) return;
    const candidates = d.rows
      .filter((r) => r.category.id !== row.category.id && r.available > 0)
      .sort((a, b) => b.available - a.available);
    setOther(candidates[0]?.category.id ?? "");
    setAmount(String(covering ? -row.available : Math.max(0, row.available)));
    setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.category.id]);
  if (!row)
    return (
      <Drawer open={false} onClose={onClose} title="">
        {null}
      </Drawer>
    );
  const options = d.rows.filter((r) => r.category.id !== row.category.id);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.round(Number(amount));
    const from = covering ? other : row.category.id;
    const to = covering ? row.category.id : other;
    const fromAssigned = d.assigned[from] ?? 0;
    if (!other) return setErr("Escolha uma categoria.");
    if (!Number.isFinite(n) || n <= 0) return setErr("Indique um valor maior que zero.");
    if (n > fromAssigned) return setErr(`A origem só tem ${mzn(fromAssigned)} atribuído.`);
    d.dispatch({ type: "move", from, to, amount: n });
    const name = (id: string) => d.state.categories.find((c) => c.id === id)?.name ?? id;
    onDone(`${mzn(n)} movidos de ${name(from)} para ${name(to)}.`);
    onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      width={440}
      eyebrow={covering ? "Cobrir excesso" : "Mover dinheiro"}
      title={row.category.name}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="move-form">
            {covering ? "Cobrir" : "Mover"}
          </Button>
        </div>
      }
    >
      <form id="move-form" onSubmit={submit} className="flex flex-col gap-4 p-5">
        <p className="text-body text-white/80">
          {covering
            ? `Esta categoria excedeu ${mzn(-row.available)}. Retire de outra categoria com dinheiro disponível; o total atribuído não muda.`
            : `Disponível: ${mzn(row.available)}. Mover não altera o total atribuído.`}
        </p>
        <Field label={covering ? "Retirar de" : "Mover para"}>
          {(id) => (
            <select
              id={id}
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className={fieldCls}
            >
              <option value="">Escolher…</option>
              {options.map((r) => (
                <option key={r.category.id} value={r.category.id}>
                  {r.category.name} · {mzn(r.available)} disponível
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Valor (MT)" error={err}>
          {(id, db) => (
            <input
              id={id}
              aria-describedby={db}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldCls}
            />
          )}
        </Field>
      </form>
    </Drawer>
  );
}

/* ── Transações ──────────────────────────────────────────────────────── */

function Transactions({ d, say, onAdd }: { d: D; say: (m: string) => void; onAdd: () => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todas" | "semCategoria" | "entradas" | "saidas">("todas");
  const [ruleFor, setRuleFor] = useState<{ payee: string; categoryId: string } | null>(null);
  const cat = (id: string | null) => d.state.categories.find((c) => c.id === id);
  const list = d.state.transactions
    .filter((t) =>
      filter === "semCategoria"
        ? t.amount < 0 && !t.categoryId
        : filter === "entradas"
          ? t.amount > 0
          : filter === "saidas"
            ? t.amount < 0
            : true,
    )
    .filter(
      (t) =>
        !q.trim() ||
        `${t.payee} ${cat(t.categoryId)?.name ?? ""}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
    )
    .slice(0, 120);
  const recat = (id: string, payee: string, categoryId: string) => {
    d.dispatch({ type: "recategorize", id, categoryId: categoryId || null });
    if (categoryId) setRuleFor({ payee, categoryId });
  };
  return (
    <Panel
      title="Transações"
      subtitle={`${list.length} de ${d.state.transactions.length} · as regras categorizam automaticamente`}
      right={
        <Button size="sm" variant="primary" icon={Plus} onClick={onAdd}>
          Adicionar
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-[12px] border border-white/14 bg-black/30 px-3 focus-within:ring-2 focus-within:ring-white/30">
          <Search size={15} className="text-white/55" aria-hidden />
          <label htmlFor="pf-search" className="sr-only">
            Pesquisar transações
          </label>
          <input
            id="pf-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar comerciante ou categoria"
            className="min-w-0 flex-1 bg-transparent text-body text-white outline-none placeholder:text-white/45"
          />
        </div>
        <SegmentedTabs
          size="sm"
          active={filter}
          onSelect={setFilter}
          tabs={[
            { id: "todas", label: "Todas" },
            {
              id: "semCategoria",
              label: "Sem categoria",
              count: d.state.transactions.filter((t) => t.amount < 0 && !t.categoryId).length,
            },
            { id: "saidas", label: "Saídas" },
            { id: "entradas", label: "Entradas" },
          ]}
        />
      </div>
      {ruleFor ? (
        <div
          role="status"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-[14px] border border-[var(--aurora-accent)]/40 bg-white/92/10 px-3 py-2.5 text-body text-[#0b0f17]"
        >
          <Wand2 size={15} aria-hidden className="text-[var(--aurora-accent)]" />
          <span className="flex-1">
            Categorizar sempre «{ruleFor.payee}» como {cat(ruleFor.categoryId)?.name}?
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              d.dispatch({ type: "addRule", match: ruleFor.payee, categoryId: ruleFor.categoryId });
              say(`Regra criada: «${ruleFor.payee}» → ${cat(ruleFor.categoryId)?.name}.`);
              setRuleFor(null);
            }}
          >
            Criar regra
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRuleFor(null)}>
            Agora não
          </Button>
        </div>
      ) : null}
      {list.length ? (
        <ul className="flex flex-col divide-y divide-white/8">
          {list.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-2.5 sm:grid-cols-[88px_minmax(0,1fr)_190px_120px_32px]"
            >
              <span className="hidden text-caption tabular-nums text-white/55 sm:block">
                {new Date(t.date + "T00:00:00Z").toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "short",
                  timeZone: "UTC",
                })}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-body text-white/90">{t.payee}</span>
                <span className="text-micro text-white/55 sm:hidden">{t.date}</span>
              </span>
              <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                {t.amount > 0 ? (
                  <span className="text-caption text-[#86efac]">Entrada · para atribuir</span>
                ) : (
                  <>
                    <label htmlFor={`cat-${t.id}`} className="sr-only">
                      Categoria de {t.payee}
                    </label>
                    <select
                      id={`cat-${t.id}`}
                      value={t.categoryId ?? ""}
                      onChange={(e) => recat(t.id, t.payee, e.target.value)}
                      className={cn(
                        fieldCls,
                        "h-8 text-caption",
                        !t.categoryId && "border-[#fbbf24]/60 text-[#fde68a]",
                      )}
                    >
                      <option value="">Sem categoria</option>
                      {d.state.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </span>
              <Money
                value={t.amount}
                sign
                className="row-start-1 text-right text-body font-semibold sm:row-start-auto"
              />
              <button
                type="button"
                onClick={() => {
                  d.dispatch({ type: "deleteTx", id: t.id });
                  say(`Removida: ${t.payee}.`);
                }}
                aria-label={`Remover ${t.payee} de ${t.date}`}
                title="Remover"
                className="hidden h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:grid"
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Search} title="Sem transações" hint="Mude o filtro ou a pesquisa." />
      )}
      {d.state.rules.length ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="mb-2 text-micro font-semibold uppercase tracking-[0.12em] text-white/60">
            Regras ativas
          </p>
          <ul className="flex flex-wrap gap-2">
            {d.state.rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 py-1 pl-3 pr-1 text-caption text-white/85"
              >
                «{r.match}» → {cat(r.categoryId)?.name}
                <button
                  type="button"
                  onClick={() => d.dispatch({ type: "removeRule", id: r.id })}
                  aria-label={`Remover regra ${r.match}`}
                  className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/12"
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}

function AddTransaction({
  open,
  onClose,
  d,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  d: D;
  onDone: (m: string) => void;
}) {
  const [kind, setKind] = useState<"saida" | "entrada">("saida");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(d.today);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("acc-bci");
  const [err, setErr] = useState<{ payee?: string; amount?: string }>({});
  useEffect(() => {
    if (open) {
      setPayee("");
      setAmount("");
      setDate(d.today);
      setCategoryId("");
      setErr({});
    }
  }, [open, d.today]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.round(Number(amount.replace(/\s/g, "").replace(",", ".")));
    const next: typeof err = {};
    if (!payee.trim()) next.payee = "Indique o comerciante ou a origem.";
    if (!Number.isFinite(n) || n <= 0) next.amount = "Indique um valor maior que zero.";
    setErr(next);
    if (Object.keys(next).length) return;
    d.dispatch({
      type: "addTx",
      tx: {
        date,
        payee: payee.trim(),
        amount: kind === "saida" ? -n : n,
        categoryId: kind === "entrada" ? null : categoryId || null,
        accountId,
      },
    });
    onDone(
      kind === "saida"
        ? `Despesa de ${mzn(n)} registada.`
        : `Entrada de ${mzn(n)} pronta para atribuir.`,
    );
    onClose();
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      eyebrow="Nova transação"
      title="Registar movimento"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="tx-form">
            Guardar
          </Button>
        </div>
      }
    >
      <form id="tx-form" onSubmit={submit} className="flex flex-col gap-4 p-5" noValidate>
        <SegmentedTabs
          active={kind}
          onSelect={setKind}
          tabs={[
            { id: "saida", label: "Despesa" },
            { id: "entrada", label: "Entrada" },
          ]}
        />
        <Field label="Comerciante ou origem" error={err.payee}>
          {(id, db) => (
            <input
              id={id}
              aria-describedby={db}
              aria-invalid={!!err.payee}
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder="Ex.: Shoprite, Salário"
              className={fieldCls}
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (MT)" error={err.amount}>
            {(id, db) => (
              <input
                id={id}
                aria-describedby={db}
                aria-invalid={!!err.amount}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={fieldCls}
              />
            )}
          </Field>
          <Field label="Data">
            {(id) => (
              <input
                id={id}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldCls}
              />
            )}
          </Field>
        </div>
        {kind === "saida" ? (
          <Field label="Categoria" hint="Se ficar vazia, as regras tentam categorizar.">
            {(id, db) => (
              <select
                id={id}
                aria-describedby={db}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={fieldCls}
              >
                <option value="">Automática (regras)</option>
                {d.state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : null}
        <Field label="Conta">
          {(id) => (
            <select
              id={id}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={fieldCls}
            >
              {d.accounts
                .filter((a) => a.kind === "caixa")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          )}
        </Field>
      </form>
    </Drawer>
  );
}

/* ── Recorrentes ─────────────────────────────────────────────────────── */

function Recurring({ d, say }: { d: D; say: (m: string) => void }) {
  const rec = useMemo(() => detectRecurring(d.state.transactions), [d.state.transactions]);
  const isBill = (categoryId: string | null) =>
    d.state.categories.find((c) => c.id === categoryId)?.group === "fixas";
  const bills = rec.filter((r) => isBill(r.categoryId));
  const subs = rec.filter((r) => !isBill(r.categoryId));
  const annual = rec.reduce((s, r) => s + r.annualCost, 0);
  const cancelSaving = rec
    .filter((r) => d.state.cancelList.includes(r.payee))
    .reduce((s, r) => s + r.annualCost, 0);
  const soon = rec.filter((r) => daysUntil(d.today, r.next) <= 7);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Recorrentes"
          value={rec.length}
          hint="Detetadas automaticamente"
          how="Mesmo comerciante, pelo menos 2 cobranças, com intervalo médio de 25 a 35 dias (mensal) ou 350 a 380 dias (anual)."
        />
        <Metric
          label="Custo anual"
          value={mzn(annual, { compact: true })}
          hint={`${mzn(annual / 12)} por mês`}
          how="Soma do último valor de cada recorrente, anualizado."
        />
        <Metric
          label="Nos próximos 7 dias"
          value={soon.length}
          hint={soon.length ? mzn(soon.reduce((s, r) => s + r.amount, 0)) : "Nada a vencer"}
          tone={soon.length ? "warn" : "good"}
          how="Recorrentes cuja próxima data estimada cai nos próximos 7 dias."
        />
        <Metric
          label="Poupança se cancelar"
          value={mzn(cancelSaving, { compact: true })}
          hint={`${d.state.cancelList.length} marcadas`}
          tone={cancelSaving ? "good" : undefined}
          how="Custo anual das recorrentes que marcou para cancelar. Cancele no fornecedor; aqui só fica o lembrete."
        />
      </div>
      {(
        [
          [
            "Subscrições e serviços",
            "Pode cancelar no fornecedor; aqui fica o lembrete e a poupança",
            subs,
            true,
          ],
          [
            "Contas fixas",
            "Renda, propinas e serviços essenciais: planeie, não cancele",
            bills,
            false,
          ],
        ] as const
      ).map(([title, subtitle, list, cancellable]) => (
        <Panel
          key={title}
          title={title}
          subtitle={`${subtitle} · ${mzn(list.reduce((s, r) => s + r.annualCost, 0))}/ano`}
        >
          {list.length ? (
            <ul className="flex flex-col divide-y divide-white/8">
              {list.map((r) => {
                const marked = d.state.cancelList.includes(r.payee);
                const days = daysUntil(d.today, r.next);
                return (
                  <li key={r.payee} className="flex flex-wrap items-center gap-3 py-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white/8 text-title"
                      aria-hidden
                    >
                      {d.state.categories.find((c) => c.id === r.categoryId)?.emoji ?? "🔁"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-body font-semibold text-white",
                          marked && "line-through decoration-white/50",
                        )}
                      >
                        {r.payee}
                      </span>
                      <span className="flex items-center gap-1 text-micro text-white/65">
                        <CalendarClock size={12} aria-hidden /> {r.cadence} · próxima{" "}
                        {new Date(r.next + "T00:00:00Z").toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                          timeZone: "UTC",
                        })}
                        {days >= 0 && days <= 7
                          ? ` (em ${days} ${days === 1 ? "dia" : "dias"})`
                          : ""}{" "}
                        · {r.count} cobranças
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-body font-semibold tabular-nums text-white">
                        {mzn(r.amount)}
                      </span>
                      <span className="text-micro tabular-nums text-white/60">
                        {mzn(r.annualCost)}/ano
                      </span>
                    </span>
                    {cancellable ? (
                      <Button
                        size="sm"
                        variant={marked ? "secondary" : "ghost"}
                        aria-pressed={marked}
                        aria-label={
                          marked ? `${r.payee}: desmarcar` : `Marcar ${r.payee} para cancelar`
                        }
                        onClick={() => {
                          d.dispatch({ type: "toggleCancel", payee: r.payee });
                          say(
                            marked
                              ? `${r.payee}: lembrete removido.`
                              : `${r.payee} marcada para cancelar · poupa ${mzn(r.annualCost)}/ano.`,
                          );
                        }}
                      >
                        {marked ? "Marcada" : "Cancelar?"}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Repeat}
              title="Nada detetado"
              hint="Precisa de pelo menos 2 cobranças com intervalo regular."
            />
          )}
        </Panel>
      ))}
    </>
  );
}

const daysUntil = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/* ── Dívidas ─────────────────────────────────────────────────────────── */

function Debts({ d }: { d: D }) {
  const [extra, setExtra] = useState(5000);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const av = useMemo(() => payoffPlan(d.state.debts, extra, "avalanche"), [d.state.debts, extra]);
  const sb = useMemo(() => payoffPlan(d.state.debts, extra, "snowball"), [d.state.debts, extra]);
  const base = useMemo(() => payoffPlan(d.state.debts, 0, "avalanche"), [d.state.debts]);
  const plan = strategy === "avalanche" ? av : sb;
  const total = d.state.debts.reduce((s, x) => s + x.balance, 0);
  const free = addMonths(d.today, plan.months);
  const len = Math.max(av.series.length, sb.series.length, base.series.length);
  const at = (xs: { balance: number }[], i: number) =>
    Math.round(xs[Math.min(i, xs.length - 1)]?.balance ?? 0);
  const series = Array.from({ length: len }, (_, i) => ({
    mês: i,
    Avalanche: at(av.series, i),
    "Bola de neve": at(sb.series, i),
    "Só mínimos": at(base.series, i),
  }));
  const extraId = "pf-extra";
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Dívida total"
          value={mzn(total, { compact: true })}
          hint={`${d.state.debts.length} dívidas · mínimos ${mzn(d.state.debts.reduce((s, x) => s + x.minimum, 0))}/mês`}
          how="Soma dos saldos em dívida do registo."
        />
        <Metric
          label="Livre de dívidas"
          value={
            plan.feasible
              ? new Date(free + "T00:00:00Z").toLocaleDateString("pt-PT", {
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })
              : "Nunca"
          }
          hint={`${plan.months} meses com ${strategy === "avalanche" ? "avalanche" : "bola de neve"}`}
          tone={plan.feasible ? "good" : "bad"}
          how="Simulação mês a mês: juro mensal = taxa anual ÷ 12; paga os mínimos de todas e o extra (mais os mínimos libertados) vai para a primeira dívida da ordem."
        />
        <Metric
          label="Juros totais"
          value={mzn(plan.totalInterest, { compact: true })}
          hint={`Só mínimos: ${mzn(base.totalInterest, { compact: true })}`}
          tone="warn"
          how="Juros somados até a última dívida chegar a zero."
        />
        <Metric
          label="Poupa com avalanche"
          value={mzn(Math.max(0, sb.totalInterest - av.totalInterest), { compact: true })}
          hint="em juros, face à bola de neve"
          tone="good"
          how="A avalanche paga primeiro a taxa mais alta e por isso nunca paga mais juros. A bola de neve paga primeiro o saldo mais pequeno e dá vitórias mais cedo."
        />
      </div>
      <Panel title="Plano de pagamento" subtitle="Escolha o método e o valor extra por mês">
        <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <SegmentedTabs
            active={strategy}
            onSelect={setStrategy}
            tabs={[
              { id: "avalanche", label: "Avalanche · maior juro" },
              { id: "snowball", label: "Bola de neve · menor saldo" },
            ]}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={extraId}
              className="flex justify-between text-caption font-semibold text-white/80"
            >
              Pagamento extra por mês <span className="tabular-nums text-white">{mzn(extra)}</span>
            </label>
            <input
              id={extraId}
              type="range"
              min={0}
              max={30000}
              step={500}
              value={extra}
              onChange={(e) => setExtra(Number(e.target.value))}
              className="w-full accent-[#4a9eff]"
            />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ol className="flex flex-col gap-2" aria-label="Ordem de pagamento">
            {plan.order.map((o, i) => {
              const debt = d.state.debts.find((x) => x.id === o.id)!;
              return (
                <li
                  key={o.id}
                  className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-caption font-bold text-[#0b0f17]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold text-white">
                      {debt.name}
                    </span>
                    <span className="text-micro text-white/60">
                      {mzn(debt.balance)} · {String(debt.apr).replace(".", ",")}% ao ano · mín.{" "}
                      {mzn(debt.minimum)}
                    </span>
                  </span>
                  <span className="text-right text-micro text-white/70">
                    paga no
                    <br />
                    <b className="text-caption text-white">mês {o.paidOffMonth}</b>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="mês" {...axisProps} />
                <YAxis
                  {...axisProps}
                  width={52}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v) => mzn(Number(v))}
                  labelFormatter={(l) => `Mês ${l}`}
                />
                <Legend {...legendProps} />
                <Line
                  animationDuration={300}
                  animationEasing="ease-out"
                  type="monotone"
                  dataKey="Avalanche"
                  stroke={CHART.positive}
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  animationDuration={300}
                  animationEasing="ease-out"
                  type="monotone"
                  dataKey="Bola de neve"
                  stroke={CHART.violet}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  animationDuration={300}
                  animationEasing="ease-out"
                  type="monotone"
                  dataKey="Só mínimos"
                  stroke={CHART.muted}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>
    </>
  );
}

/* ── Objetivos ───────────────────────────────────────────────────────── */

function Goals({ d, say }: { d: D; say: (m: string) => void }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [ng, setNg] = useState({ name: "", target: "", due: addMonths(d.today, 6) });
  const [err, setErr] = useState("");
  const em = emergencyTarget(d.state.categories);
  return (
    <>
      <div className="glass flex flex-wrap items-center gap-4 p-4">
        <PiggyBank size={28} className="text-[var(--aurora-accent)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-title font-semibold text-white">Reserva para perda de rendimento</p>
          <p className="text-caption text-white/70">
            Despesas fixas: {mzn(em.essential)}/mês. Meta recomendada: {mzn(em.min)} (3 meses) a{" "}
            {mzn(em.max)} (6 meses). Hoje cobre {d.runway.toFixed(1).replace(".", ",")} meses.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Meter
            value={d.runway / 6}
            label={`Reserva: ${d.runway.toFixed(1)} de 6 meses`}
            tone={d.runway >= 3 ? "good" : "warn"}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {d.state.goals.map((g) => {
          const p = goalPlan(g, d.today);
          const v = amounts[g.id] ?? "";
          const id = `goal-${g.id}`;
          return (
            <section
              key={g.id}
              aria-labelledby={`${id}-t`}
              className="glass flex flex-col gap-3 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 id={`${id}-t`} className="text-title font-semibold text-white">
                  <span aria-hidden>{g.emoji}</span> {g.name}
                </h3>
                {p.done ? (
                  <span className="rounded-full bg-[#14532d] px-2.5 py-0.5 text-micro font-semibold text-[#dcfce7]">
                    Concluído
                  </span>
                ) : p.overdue ? (
                  <span className="rounded-full bg-[#7f1d1d] px-2.5 py-0.5 text-micro font-semibold text-white">
                    Atrasado
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline justify-between text-body">
                <span className="text-metric font-semibold tabular-nums text-white">
                  {mzn(g.saved, { compact: true })}
                </span>
                <span className="tabular-nums text-white/65">
                  de {mzn(g.target, { compact: true })}
                </span>
              </div>
              <Meter
                value={p.progress}
                label={`${g.name}: ${pct(p.progress)}`}
                tone={p.done ? "good" : "accent"}
              />
              <p className="text-caption text-white/75">
                {p.done
                  ? "Objetivo atingido."
                  : p.overdue
                    ? `A data passou e faltam ${mzn(p.remaining)}. Defina nova data.`
                    : `Faltam ${mzn(p.remaining)} · ${mzn(p.monthly)}/mês durante ${p.months} ${p.months === 1 ? "mês" : "meses"} (até ${new Date(g.due + "T00:00:00Z").toLocaleDateString("pt-PT", { month: "short", year: "numeric", timeZone: "UTC" })}).`}
              </p>
              {!p.done ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Math.round(Number(v || p.monthly));
                    if (n > 0) {
                      d.dispatch({ type: "contribute", goalId: g.id, amount: n });
                      say(`${mzn(n)} adicionados a ${g.name}.`);
                      setAmounts((a) => ({ ...a, [g.id]: "" }));
                    }
                  }}
                >
                  <label htmlFor={id} className="sr-only">
                    Contribuição para {g.name}
                  </label>
                  <input
                    id={id}
                    inputMode="numeric"
                    value={v}
                    placeholder={String(Math.round(p.monthly))}
                    onChange={(e) => setAmounts((a) => ({ ...a, [g.id]: e.target.value }))}
                    className={cn(fieldCls, "h-9")}
                  />
                  <Button size="sm" variant="primary" type="submit">
                    Contribuir
                  </Button>
                </form>
              ) : null}
            </section>
          );
        })}
        <section className="glass flex flex-col gap-3 p-4">
          {adding ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const t = Math.round(Number(ng.target));
                if (!ng.name.trim() || !(t > 0)) return setErr("Indique nome e valor.");
                if (ng.due <= d.today) return setErr("A data tem de ser no futuro.");
                d.dispatch({
                  type: "addGoal",
                  goal: { name: ng.name.trim(), target: t, saved: 0, due: ng.due, emoji: "🎯" },
                });
                say(`Objetivo criado: ${ng.name.trim()}.`);
                setAdding(false);
                setNg({ name: "", target: "", due: addMonths(d.today, 6) });
                setErr("");
              }}
            >
              <Field label="Nome">
                {(id) => (
                  <input
                    id={id}
                    value={ng.name}
                    onChange={(e) => setNg({ ...ng, name: e.target.value })}
                    className={fieldCls}
                  />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Valor (MT)">
                  {(id) => (
                    <input
                      id={id}
                      inputMode="numeric"
                      value={ng.target}
                      onChange={(e) => setNg({ ...ng, target: e.target.value })}
                      className={fieldCls}
                    />
                  )}
                </Field>
                <Field label="Data">
                  {(id) => (
                    <input
                      id={id}
                      type="date"
                      value={ng.due}
                      onChange={(e) => setNg({ ...ng, due: e.target.value })}
                      className={fieldCls}
                    />
                  )}
                </Field>
              </div>
              {err ? (
                <p role="alert" className="text-micro text-[#fca5a5]">
                  {err}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Criar
                </Button>
              </div>
            </form>
          ) : (
            <EmptyState
              icon={Target}
              title="Novo objetivo"
              hint="Casa, carro, estudos: diga quanto e quando."
              action={
                <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdding(true)}>
                  Criar objetivo
                </Button>
              }
            />
          )}
        </section>
      </div>
    </>
  );
}

/* ── Previsão ────────────────────────────────────────────────────────── */

function Forecast({ d }: { d: D }) {
  const [incomeChange, setIncomeChange] = useState(0);
  const [extra, setExtra] = useState(0);
  const income = d.prev.income || d.flow.income || 1;
  const spend = d.prev.spend || d.flow.spend;
  const data = useMemo(
    () =>
      forecast({
        startNetWorth: d.nw.net,
        monthlyIncome: income,
        monthlySpend: spend,
        incomeChange: incomeChange / 100,
        extraSaving: extra,
      }).map((p) => ({ mês: p.month, Atual: p.base, Cenário: p.scenario })),
    [d.nw.net, income, spend, incomeChange, extra],
  );
  const last = data[data.length - 1]!;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric
          label="Daqui a 12 meses"
          value={mzn(last.Atual, { compact: true })}
          hint="Ritmo do mês anterior"
          how={`Património de hoje + (entradas ${mzn(income)} − saídas ${mzn(spend)}) por mês, mais 6% ao ano sobre o saldo positivo. Não é uma promessa: muda com cada mês real.`}
        />
        <Metric
          label="Com o cenário"
          value={mzn(last.Cenário, { compact: true })}
          hint={`${incomeChange >= 0 ? "+" : ""}${incomeChange}% rendimento · −${mzn(extra)}/mês de gasto`}
          tone={last.Cenário >= last.Atual ? "good" : "bad"}
          how="O mesmo cálculo com as entradas alteradas pela percentagem escolhida e as saídas reduzidas pelo corte mensal."
        />
        <Metric
          label="Diferença"
          value={<Money value={last.Cenário - last.Atual} sign />}
          hint="Cenário vs ritmo atual"
          how="Cenário menos ritmo atual no mês 12."
        />
      </div>
      <Panel
        title="Projeção do património"
        subtitle="12 meses · simulação, não aconselhamento financeiro"
      >
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pf-inc"
              className="flex justify-between text-caption font-semibold text-white/80"
            >
              Variação do rendimento{" "}
              <span className="tabular-nums text-white">
                {incomeChange > 0 ? "+" : ""}
                {incomeChange}%
              </span>
            </label>
            <input
              id="pf-inc"
              type="range"
              min={-50}
              max={50}
              step={5}
              value={incomeChange}
              onChange={(e) => setIncomeChange(Number(e.target.value))}
              className="w-full accent-[#4a9eff]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pf-cut"
              className="flex justify-between text-caption font-semibold text-white/80"
            >
              Cortar gastos por mês <span className="tabular-nums text-white">{mzn(extra)}</span>
            </label>
            <input
              id="pf-cut"
              type="range"
              min={0}
              max={30000}
              step={1000}
              value={extra}
              onChange={(e) => setExtra(Number(e.target.value))}
              className="w-full accent-[#4a9eff]"
            />
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="pf-scen" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CHART.positive} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.positive} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pf-base" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="mês" {...axisProps} />
              <YAxis
                {...axisProps}
                width={56}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                {...tooltipProps}
                formatter={(v) => mzn(Number(v))}
                labelFormatter={(l) => `Mês ${l}`}
              />
              <Legend {...legendProps} />
              <Area
                animationDuration={300}
                animationEasing="ease-out"
                type="monotone"
                dataKey="Atual"
                stroke={CHART.accent}
                fill="url(#pf-base)"
                strokeWidth={2}
              />
              <Area
                animationDuration={300}
                animationEasing="ease-out"
                type="monotone"
                dataKey="Cenário"
                stroke={CHART.positive}
                fill="url(#pf-scen)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
