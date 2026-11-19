/**
 * Património — buy/sell assets, payments, statement and receipt import, price
 * comparison and wealth advice. The UI only reads `useBrain()`; the agents in
 * lib/finance/wealth do the work (ingest → classify → prices ∥ costs → advise).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileUp,
  Lightbulb,
  MapPin,
  Receipt as ReceiptIcon,
  Send,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button, MetricCard, Panel, SegmentedTabs } from "../primitives";
import { cn } from "@/lib/utils";
import { useWealth } from "@/data/personalFinance/wealthStore";
import { iso, mzn, pct, netWorth } from "@/lib/finance/personal";
import { ASSETS, feeFor, heldQty, positions } from "@/lib/finance/wealth/portfolio";
import {
  METHOD_LABEL,
  cheapestMethod,
  methodFee,
  type Method,
} from "@/lib/finance/wealth/payments";
import { DEMO_RECEIPT, parseReceipt, type Receipt } from "@/lib/finance/wealth/receipts";
import {
  REFERENCE_DATE,
  boards,
  checkPaid,
  loadQuotes,
  type PriceProvider,
  type PriceQuote,
} from "@/lib/finance/wealth/prices";
import { advise, extraCosts } from "@/lib/finance/wealth/advisor";
import { DEMO_STATEMENT, importStatement, type ImportResult } from "@/lib/finance/wealth/pipeline";
import { uid } from "@/lib/finance/wealth/text";
import { Field, Meter, fieldCls } from "./atoms";

type Say = (t: string, tone?: "ok" | "warn") => void;

/* ── Orchestrator hook: every derived number for the five views ─────── */

export function useBrain() {
  const { w, wd, f } = useWealth();
  const [quotes, setQuotes] = useState<PriceQuote[]>([]);
  const [source, setSource] = useState<PriceProvider | null>(null);
  useEffect(() => {
    let live = true;
    void loadQuotes().then((r) => {
      if (!live) return;
      setQuotes(r.quotes);
      setSource(r.source);
    });
    return () => {
      live = false;
    };
  }, []);
  const bs = useMemo(() => boards(quotes), [quotes]);
  const checks = useMemo(
    () =>
      checkPaid(
        w.receipts.flatMap((r) =>
          r.items.map((i) => ({
            name: i.name,
            unitPrice: i.unitPrice,
            qty: i.qty,
            store: r.store,
          })),
        ),
        bs,
      ),
    [w.receipts, bs],
  );
  const pos = useMemo(() => positions(w.trades), [w.trades]);
  const costs = useMemo(
    () =>
      extraCosts({
        transactions: f.state.transactions,
        payments: w.payments,
        positions: pos,
        receipts: w.receipts,
        checks,
      }),
    [f.state.transactions, w.payments, pos, w.receipts, checks],
  );
  const monthlySpend = useMemo(
    () => f.state.categories.reduce((s, c) => s + c.target, 0),
    [f.state.categories],
  );
  const income = useMemo(() => {
    const m = f.state.month;
    return f.state.transactions
      .filter((t) => t.amount > 0 && t.date.startsWith(m))
      .reduce((s, t) => s + t.amount, 0);
  }, [f.state.transactions, f.state.month]);
  const advice = useMemo(
    () =>
      advise({
        accounts: f.accounts,
        debts: f.state.debts,
        monthlySpend,
        income,
        positions: pos,
        costs,
        checks,
      }),
    [f.accounts, f.state.debts, monthlySpend, income, pos, costs, checks],
  );
  return { w, wd, f, bs, checks, pos, costs, advice, source };
}
type Brain = ReturnType<typeof useBrain>;

const cashAccounts = (b: Brain) =>
  b.f.accounts.filter((a) => a.kind === "caixa" || a.kind === "poupanca");

function Select({
  id,
  value,
  onChange,
  options,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  describedBy?: string;
}) {
  return (
    <select
      id={id}
      aria-describedby={describedBy}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(fieldCls, "appearance-none")}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#10131a]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Row({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-caption">
      <span className="text-white/70">{k}</span>
      <span className={cn("tabular-nums", strong ? "font-bold text-white" : "text-white/90")}>
        {v}
      </span>
    </div>
  );
}

/** Alert-card styled notice (same finish as the Alertas cards). */
function Notice({
  tone,
  title,
  children,
  right,
}: {
  tone: "bad" | "warn" | "good";
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const c = tone === "bad" ? "255,77,79" : tone === "warn" ? "251,191,36" : "74,222,128";
  const Icon = tone === "good" ? CheckCircle2 : AlertTriangle;
  return (
    <div
      className="flex gap-3 rounded-xl border p-3"
      style={{ background: `rgba(${c},0.08)`, borderColor: `rgba(${c},0.22)` }}
    >
      <Icon size={16} aria-hidden className="mt-0.5 shrink-0" style={{ color: `rgb(${c})` }} />
      <div className="min-w-0 flex-1">
        <p className="text-caption font-bold text-white">{title}</p>
        <div className="mt-0.5 text-micro leading-relaxed text-white/75">{children}</div>
      </div>
      {right ? <div className="shrink-0 self-center">{right}</div> : null}
    </div>
  );
}

/* ── 1. Investir: compra e venda ─────────────────────────────────────── */

export function InvestView({ say }: { say: Say }) {
  const b = useBrain();
  const [side, setSide] = useState<"compra" | "venda">("compra");
  const [sym, setSym] = useState(ASSETS[0]!.symbol);
  const asset = ASSETS.find((a) => a.symbol === sym)!;
  const [qty, setQty] = useState("10");
  const [price, setPrice] = useState(String(asset.price));
  const [acc, setAcc] = useState("acc-bci");
  useEffect(() => setPrice(String(asset.price)), [asset.price]);
  const q = Math.max(0, Number(qty) || 0);
  const p = Math.max(0, Number(price.replace(",", ".")) || 0);
  const gross = q * p;
  const fee = gross ? feeFor(gross, asset.market) : 0;
  const total = side === "compra" ? gross + fee : gross - fee;
  const held = heldQty(b.w.trades, sym);
  const cash = b.f.accounts.find((a) => a.id === acc)?.balance ?? 0;
  const err =
    !q || !p
      ? "Indique quantidade e preço."
      : side === "venda" && q > held
        ? `Só tem ${held} ${sym} para vender.`
        : side === "compra" && total > cash
          ? `Saldo insuficiente: ${mzn(cash)} disponíveis.`
          : "";
  const value = b.pos.reduce((s, x) => s + x.value, 0);
  const unreal = b.pos.reduce((s, x) => s + x.unrealized, 0);
  const real = b.pos.reduce((s, x) => s + x.realized, 0);
  const fees = b.pos.reduce((s, x) => s + x.fees, 0);

  const submit = () => {
    if (err) return;
    const date = iso(new Date());
    b.wd({
      type: "trade",
      trade: { id: uid("t"), date, symbol: sym, side, qty: q, price: p, fee, accountId: acc },
    });
    b.f.dispatch({
      type: "addTx",
      tx: {
        date,
        payee: `${side === "compra" ? "Compra" : "Venda"} · ${q} ${sym}`,
        amount: Math.round(side === "compra" ? -total : total),
        categoryId: side === "compra" ? "investimento" : null,
        accountId: acc,
        note: `Corretagem ${mzn(fee)}`,
      },
    });
    say(`${side === "compra" ? "Compra" : "Venda"} registada: ${q} ${sym} por ${mzn(total)}.`);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Valor da carteira"
          value={mzn(value)}
          hint={`${b.pos.filter((x) => x.qty).length} posições`}
        />
        <MetricCard
          label="Ganho por realizar"
          value={mzn(unreal, { sign: true })}
          tone={unreal >= 0 ? "good" : "bad"}
          hint="Preço atual vs custo médio"
        />
        <MetricCard
          label="Ganho realizado"
          value={mzn(real, { sign: true })}
          tone={real >= 0 ? "good" : "bad"}
          hint="Vendas já fechadas"
        />
        <MetricCard
          label="Corretagem paga"
          value={mzn(fees)}
          tone="warn"
          hint="Entra em custos adicionais"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Panel
          title="Ordem de compra e venda"
          subtitle="Bolsa de Valores de Moçambique, Tesouro, fundos e EUA"
        >
          <div className="flex flex-col gap-3">
            <SegmentedTabs
              size="sm"
              tabs={[
                { id: "compra" as const, label: "Comprar" },
                { id: "venda" as const, label: "Vender" },
              ]}
              active={side}
              onSelect={setSide}
            />
            <Field label="Ativo">
              {(id) => (
                <Select
                  id={id}
                  value={sym}
                  onChange={setSym}
                  options={ASSETS.map((a) => ({
                    value: a.symbol,
                    label: `${a.symbol} · ${a.name.split(" · ").pop()}`,
                  }))}
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Quantidade"
                hint={side === "venda" ? `Em carteira: ${held}` : undefined}
              >
                {(id, d) => (
                  <input
                    id={id}
                    aria-describedby={d}
                    inputMode="decimal"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className={fieldCls}
                  />
                )}
              </Field>
              <Field label="Preço (MT)" hint="Referência editável">
                {(id, d) => (
                  <input
                    id={id}
                    aria-describedby={d}
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={fieldCls}
                  />
                )}
              </Field>
            </div>
            <Field label={side === "compra" ? "Pagar a partir de" : "Receber em"}>
              {(id) => (
                <Select
                  id={id}
                  value={acc}
                  onChange={setAcc}
                  options={cashAccounts(b).map((a) => ({
                    value: a.id,
                    label: `${a.name} · ${mzn(a.balance)}`,
                  }))}
                />
              )}
            </Field>
            <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <Row k="Valor bruto" v={mzn(gross)} />
              <Row k={`Corretagem e taxas (${asset.market})`} v={mzn(fee)} />
              <Row
                k={side === "compra" ? "Total a pagar" : "Total a receber"}
                v={mzn(total)}
                strong
              />
            </div>
            {err ? (
              <p role="alert" className="text-micro text-[#fca5a5]">
                {err}
              </p>
            ) : null}
            <Button
              variant="primary"
              icon={side === "compra" ? TrendingUp : TrendingDown}
              onClick={submit}
              disabled={!!err}
            >
              {side === "compra" ? "Confirmar compra" : "Confirmar venda"}
            </Button>
          </div>
        </Panel>
        <Panel
          title="Posições"
          subtitle="Custo médio ponderado · as ordens movem a conta escolhida"
        >
          <div
            tabIndex={0}
            role="region"
            aria-label="Tabela de posições"
            className="thin-scrollbar overflow-x-auto"
          >
            <table className="w-full min-w-[560px] text-caption">
              <thead>
                <tr className="text-left text-micro font-bold uppercase tracking-wider text-white/60">
                  <th className="py-2 pr-2">Ativo</th>
                  <th className="py-2 pr-2 text-right">Qtd</th>
                  <th className="py-2 pr-2 text-right">Custo médio</th>
                  <th className="py-2 pr-2 text-right">Valor</th>
                  <th className="py-2 pr-2 text-right">Ganho</th>
                  <th className="py-2 text-right">Peso</th>
                </tr>
              </thead>
              <tbody>
                {b.pos.map((x) => (
                  <tr key={x.asset.symbol} className="border-t border-white/8">
                    <td className="py-2 pr-2">
                      <span className="font-bold text-white">{x.asset.symbol}</span>
                      <span className="block text-micro text-white/60">{x.asset.market}</span>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {x.qty.toLocaleString("pt-PT")}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{mzn(x.avgCost)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-white">{mzn(x.value)}</td>
                    <td
                      className={cn(
                        "py-2 pr-2 text-right tabular-nums",
                        x.unrealized >= 0 ? "text-[#86efac]" : "text-[#fca5a5]",
                      )}
                    >
                      {mzn(x.unrealized, { sign: true })}
                    </td>
                    <td className="py-2 text-right tabular-nums">{pct(x.weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h4 className="mt-4 text-micro font-bold uppercase tracking-wider text-white/60">
            Histórico de ordens
          </h4>
          <ul className="mt-2 flex flex-col gap-1.5">
            {[...b.w.trades]
              .reverse()
              .slice(0, 6)
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-caption">
                  <span className="text-white/85">
                    <b className={t.side === "compra" ? "text-[#86efac]" : "text-[#fca5a5]"}>
                      {t.side === "compra" ? "Compra" : "Venda"}
                    </b>{" "}
                    · {t.qty} {t.symbol} a {mzn(t.price)}
                  </span>
                  <span className="text-micro tabular-nums text-white/60">{t.date}</span>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

/* ── 2. Pagamentos ───────────────────────────────────────────────────── */

export function PaymentsView({ say }: { say: Say }) {
  const b = useBrain();
  const today = iso(new Date());
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(today);
  const [method, setMethod] = useState<Method>("mpesa");
  const [acc, setAcc] = useState("acc-mpesa");
  const [cat, setCat] = useState("energia");
  const [repeat, setRepeat] = useState<"nunca" | "mensal">("nunca");
  const amt = Math.max(0, Number(amount.replace(/\s/g, "").replace(",", ".")) || 0);
  const best = cheapestMethod(amt || 1);
  const pending = b.w.payments.filter((p) => !p.paidOn).sort((x, y) => x.due.localeCompare(y.due));
  const paid = b.w.payments
    .filter((p) => p.paidOn)
    .slice(-6)
    .reverse();
  const days = (d: string) => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);

  const pay = (id: string) => {
    const p = b.w.payments.find((x) => x.id === id)!;
    const fee = methodFee(p.method, p.amount);
    b.wd({ type: "paid", id, on: today, fee });
    b.f.dispatch({
      type: "addTx",
      tx: {
        date: today,
        payee: p.payee,
        amount: -(p.amount + fee),
        categoryId: p.categoryId,
        accountId: p.accountId,
        note: `${METHOD_LABEL[p.method]} · inclui envio ${mzn(fee)}`,
      },
    });
    say(`${p.payee} pago: ${mzn(p.amount)} + ${mzn(fee)} de envio.`);
  };
  const schedule = () => {
    if (!payee.trim() || !amt) return say("Indique o beneficiário e o montante.", "warn");
    b.wd({
      type: "schedule",
      payment: {
        id: uid("p"),
        payee: payee.trim(),
        amount: Math.round(amt),
        due,
        method,
        accountId: acc,
        categoryId: cat || null,
        repeat,
      },
    });
    setPayee("");
    setAmount("");
    say("Pagamento agendado.");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Novo pagamento" subtitle="Contas da casa, serviços, propinas ou transferências">
        <div className="flex flex-col gap-3">
          <Field label="Beneficiário">
            {(id) => (
              <input
                id={id}
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="Ex.: FIPAG · Água"
                className={fieldCls}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Montante (MT)">
              {(id) => (
                <input
                  id={id}
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
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className={fieldCls}
                />
              )}
            </Field>
          </div>
          <Field label="Método">
            {(id) => (
              <Select
                id={id}
                value={method}
                onChange={(v) => setMethod(v as Method)}
                options={(Object.keys(METHOD_LABEL) as Method[]).map((m) => ({
                  value: m,
                  label: `${METHOD_LABEL[m]} · envio ${mzn(methodFee(m, amt || 1))}`,
                }))}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Conta">
              {(id) => (
                <Select
                  id={id}
                  value={acc}
                  onChange={setAcc}
                  options={cashAccounts(b).map((a) => ({ value: a.id, label: a.name }))}
                />
              )}
            </Field>
            <Field label="Categoria">
              {(id) => (
                <Select
                  id={id}
                  value={cat}
                  onChange={setCat}
                  options={b.f.state.categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}
            </Field>
          </div>
          <Field label="Repetir">
            {(id) => (
              <Select
                id={id}
                value={repeat}
                onChange={(v) => setRepeat(v as "nunca" | "mensal")}
                options={[
                  { value: "nunca", label: "Só uma vez" },
                  { value: "mensal", label: "Todos os meses" },
                ]}
              />
            )}
          </Field>
          {amt && methodFee(method, amt) > best.fee ? (
            <Notice tone="warn" title={`Mais barato por ${METHOD_LABEL[best.method]}`}>
              Poupa {mzn(methodFee(method, amt) - best.fee)} de envio neste pagamento.
            </Notice>
          ) : null}
          <Button variant="primary" icon={Send} onClick={schedule}>
            Agendar pagamento
          </Button>
        </div>
      </Panel>
      <div className="flex flex-col gap-4">
        <Panel
          title="A pagar"
          subtitle="Pague com um toque · o movimento entra no orçamento e no saldo"
        >
          <ul className="flex flex-col gap-2">
            {pending.map((p) => {
              const n = days(p.due);
              return (
                <li key={p.id}>
                  <Notice
                    tone={n < 0 ? "bad" : n <= 3 ? "warn" : "good"}
                    title={`${p.payee} · ${mzn(p.amount)}`}
                    right={
                      <Button size="sm" variant="primary" onClick={() => pay(p.id)}>
                        Pagar
                      </Button>
                    }
                  >
                    {n < 0
                      ? `Em atraso há ${-n} dias`
                      : n === 0
                        ? "Vence hoje"
                        : `Vence em ${n} dias (${p.due})`}{" "}
                    · {METHOD_LABEL[p.method]} · envio {mzn(methodFee(p.method, p.amount))}
                    {p.repeat === "mensal" ? " · mensal" : ""}
                  </Notice>
                </li>
              );
            })}
            {!pending.length ? <p className="text-caption text-white/70">Nada pendente.</p> : null}
          </ul>
        </Panel>
        <Panel title="Pagos recentemente">
          <ul className="flex flex-col gap-1.5">
            {paid.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 text-caption">
                <span className="text-white/85">{p.payee}</span>
                <span className="tabular-nums text-white/70">
                  {mzn(p.amount)} · envio {mzn(p.fee ?? 0)} · {p.paidOn}
                </span>
              </li>
            ))}
            {!paid.length ? (
              <p className="text-caption text-white/70">Ainda sem pagamentos feitos aqui.</p>
            ) : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* ── 3. Importar: extratos e recibos ─────────────────────────────────── */

async function ocrImage(file: File, onProgress: (p: number) => void): Promise<string> {
  const T = await import("tesseract.js");
  const worker = await T.createWorker("por", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress(m.progress);
    },
  });
  try {
    const r = await worker.recognize(file);
    return r.data.text;
  } finally {
    await worker.terminate();
  }
}

export function ImportView({ say }: { say: Say }) {
  const b = useBrain();
  const today = iso(new Date());
  const [acc, setAcc] = useState("acc-bci");
  const [res, setRes] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [receipt, setReceipt] = useState<Omit<Receipt, "id"> | null>(null);
  const [ocr, setOcr] = useState<{ busy: boolean; p: number; err?: string }>({ busy: false, p: 0 });
  const [asExpense, setAsExpense] = useState(true);
  const [text, setText] = useState("");
  const camRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const runStatement = (name: string, body: string) => {
    setFileName(name);
    setRes(
      importStatement(
        { name, text: body },
        { accountId: acc, existing: b.f.state.transactions, rules: b.f.state.rules },
      ),
    );
  };
  const commit = () => {
    if (!res) return;
    const rows = res.rows.filter((r) => !r.duplicate).map(({ duplicate: _d, ...t }) => t);
    b.f.dispatch({ type: "addTxs", txs: rows });
    say(
      `${rows.length} movimentos importados${res.duplicates ? `, ${res.duplicates} repetidos ignorados` : ""}.`,
    );
    setRes(null);
  };
  const readImage = async (file: File) => {
    setOcr({ busy: true, p: 0 });
    try {
      const t = await ocrImage(file, (p) => setOcr({ busy: true, p }));
      setText(t);
      setReceipt(parseReceipt(t, today));
      setOcr({ busy: false, p: 1 });
    } catch {
      setOcr({
        busy: false,
        p: 0,
        err: "Não foi possível ler a imagem. Tente outra fotografia ou cole o texto do recibo.",
      });
    }
  };
  const saveReceipt = () => {
    if (!receipt) return;
    b.wd({ type: "receipt", receipt: { ...receipt, id: uid("r") } });
    if (asExpense)
      b.f.dispatch({
        type: "addTx",
        tx: {
          date: receipt.date,
          payee: receipt.store,
          amount: -Math.round(receipt.total),
          categoryId: "mercado",
          accountId: acc,
          note: `Recibo · ${receipt.items.length} artigos`,
        },
      });
    say(`Recibo de ${receipt.store} guardado. Veja a comparação em «Preços».`);
    setReceipt(null);
    setText("");
  };
  const preview = receipt
    ? checkPaid(
        receipt.items.map((i) => ({ ...i, store: receipt.store })),
        b.bs,
      )
    : [];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel
        title="Extrato bancário"
        subtitle="CSV ou OFX de BCI, Millennium bim, Standard Bank, Absa, M-Pesa · lido só neste navegador"
      >
        <div className="flex flex-col gap-3">
          <Field label="Conta de destino">
            {(id) => (
              <Select
                id={id}
                value={acc}
                onChange={setAcc}
                options={cashAccounts(b).map((a) => ({ value: a.id, label: a.name }))}
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-caption font-semibold text-white transition-colors duration-150 hover:bg-white/14 focus-within:ring-2 focus-within:ring-white/60">
              <FileUp size={15} aria-hidden /> Carregar extrato
              <input
                type="file"
                accept=".csv,.ofx,.qfx,.txt"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) runStatement(f.name, await f.text());
                  e.target.value = "";
                }}
              />
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => runStatement("extrato-exemplo.csv", DEMO_STATEMENT)}
            >
              Usar exemplo
            </Button>
          </div>
          {res ? (
            <>
              <p className="text-caption text-white/80">
                <b className="text-white">{fileName}</b>: {res.rows.length} linhas · {res.fresh}{" "}
                novas · {res.duplicates} repetidas · {res.classified} categorizadas automaticamente
              </p>
              <div
                tabIndex={0}
                role="region"
                aria-label="Pré-visualização do extrato"
                className="thin-scrollbar max-h-[300px] overflow-auto rounded-xl border border-white/10"
              >
                <table className="w-full text-caption">
                  <tbody>
                    {res.rows.map((r, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-t border-white/8 first:border-0",
                          r.duplicate && "opacity-50",
                        )}
                      >
                        <td className="px-3 py-1.5 tabular-nums text-white/60">{r.date}</td>
                        <td className="px-2 py-1.5 text-white">
                          {r.payee}
                          {r.duplicate ? " · repetido" : ""}
                        </td>
                        <td className="px-2 py-1.5 text-white/60">
                          {b.f.state.categories.find((c) => c.id === r.categoryId)?.name ??
                            (r.amount > 0 ? "Entrada" : "Sem categoria")}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-1.5 text-right tabular-nums",
                            r.amount < 0 ? "text-[#fca5a5]" : "text-[#86efac]",
                          )}
                        >
                          {mzn(r.amount, { sign: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={commit} disabled={!res.fresh}>
                  Importar {res.fresh} movimentos
                </Button>
                <Button variant="ghost" onClick={() => setRes(null)}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Panel>

      <Panel
        title="Recibos"
        subtitle="Fotografe o talão: lemos os artigos e comparamos cada preço com o mercado"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={Camera}
              onClick={() => camRef.current?.click()}
            >
              Fotografar recibo
            </Button>
            <Button size="sm" icon={FileUp} onClick={() => imgRef.current?.click()}>
              Carregar imagem
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={ReceiptIcon}
              onClick={() => {
                setText(DEMO_RECEIPT);
                setReceipt(parseReceipt(DEMO_RECEIPT, today));
              }}
            >
              Usar exemplo
            </Button>
            <input
              ref={camRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readImage(f);
                e.target.value = "";
              }}
            />
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readImage(f);
                e.target.value = "";
              }}
            />
          </div>
          {ocr.busy ? (
            <div role="status" className="flex flex-col gap-1.5">
              <p className="text-caption text-white/80">
                A ler o recibo… {Math.round(ocr.p * 100)}%
              </p>
              <Meter value={ocr.p} label="Leitura do recibo" />
            </div>
          ) : null}
          {ocr.err ? (
            <p role="alert" className="text-micro text-[#fca5a5]">
              {ocr.err}
            </p>
          ) : null}
          <Field
            label="Texto do recibo"
            hint="Corrija aqui o que a leitura falhou; a análise atualiza ao escrever"
          >
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                rows={5}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setReceipt(e.target.value.trim() ? parseReceipt(e.target.value, today) : null);
                }}
                className={cn(fieldCls, "h-auto py-2 font-mono text-micro")}
              />
            )}
          </Field>
          {receipt ? (
            <>
              <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Row k="Loja" v={receipt.store} strong />
                <Row k="Data" v={receipt.date} />
                <Row k="Artigos" v={receipt.items.length} />
                <Row k="Taxas e extras" v={mzn(receipt.fees)} />
                <Row k="Total" v={mzn(receipt.total)} strong />
              </div>
              <ul className="flex flex-col gap-2">
                {preview.map((c, i) => (
                  <li key={i}>
                    <Notice
                      tone={c.verdict === "caro" ? "bad" : c.verdict === "bom" ? "good" : "warn"}
                      title={`${c.item} · ${mzn(c.paid)}`}
                    >
                      {c.verdict === "caro"
                        ? `${pct(c.vsMedian)} acima da mediana (${mzn(c.board.median)}). `
                        : c.verdict === "bom"
                          ? `Abaixo da mediana (${mzn(c.board.median)}). `
                          : `Perto da mediana (${mzn(c.board.median)}). `}
                      Mais barato: <b className="text-white">{c.board.min.store}</b> a{" "}
                      {mzn(c.board.min.price)}.
                    </Notice>
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-caption text-white/85">
                <input
                  type="checkbox"
                  checked={asExpense}
                  onChange={(e) => setAsExpense(e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                Registar também como despesa de supermercado
              </label>
              <Button variant="primary" onClick={saveReceipt}>
                Guardar recibo
              </Button>
            </>
          ) : null}
          {b.w.receipts.length ? (
            <p className="text-micro text-white/60">
              {b.w.receipts.length} recibos guardados · últimos:{" "}
              {b.w.receipts
                .slice(0, 3)
                .map((r) => r.store)
                .join(", ")}
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

/* ── 4. Preços: comparação e alertas ─────────────────────────────────── */

export function PricesView() {
  const b = useBrain();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const alerts = b.checks.filter((c) => c.verdict === "caro");
  const list = b.bs
    .filter((x) => !q || x.product.toLowerCase().includes(q.toLowerCase()))
    .sort((x, y) => y.spread - x.spread);
  return (
    <>
      <p className="glass-soft px-4 py-2 text-caption text-white/80">
        Fonte: <b className="text-white">{b.source?.label ?? "a carregar…"}</b>
        {b.source && !b.source.live
          ? ` · supermercados, mercados e marketplaces de Maputo · amostra de ${REFERENCE_DATE}. Ligue uma fonte em linha para preços do dia.`
          : " · atualizado agora"}
      </p>
      <Panel
        title="Alertas de preço"
        subtitle="Onde pagou acima da mediana e onde comprar mais barato"
      >
        <ul className="flex flex-col gap-2">
          {alerts.map((c, i) => (
            <li key={i}>
              <Notice tone="bad" title={`${c.board.product}: pagou ${mzn(c.paid)} em ${c.store}`}>
                Mediana {mzn(c.board.median)} ({pct(c.vsMedian)} acima). Melhor preço:{" "}
                <b className="text-white">{c.board.min.store}</b> · {c.board.min.location} a{" "}
                {mzn(c.board.min.price)} · poupança {mzn(c.saving)}.
              </Notice>
            </li>
          ))}
          {!alerts.length ? (
            <p className="text-caption text-white/70">
              Sem alertas. Fotografe um recibo em «Importar» para comparar o que pagou.
            </p>
          ) : null}
        </ul>
      </Panel>
      <Panel
        title="Comparador de preços"
        subtitle="Do mais caro ao mais barato · mediana como referência justa"
        right={
          <input
            aria-label="Procurar produto"
            placeholder="Procurar produto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={cn(fieldCls, "h-9 w-48")}
          />
        }
      >
        <ul className="flex flex-col gap-2">
          {list.map((x) => (
            <li key={x.productId} className="rounded-xl border border-white/10 bg-white/[0.03]">
              <button
                type="button"
                aria-expanded={open === x.productId}
                onClick={() => setOpen(open === x.productId ? null : x.productId)}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-left transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <span className="text-caption font-bold text-white">{x.product}</span>
                <span className="flex flex-wrap gap-3 text-micro tabular-nums text-white/75">
                  <span>
                    Mediana <b className="text-white">{mzn(x.median)}</b>
                  </span>
                  <span className="text-[#86efac]">
                    <MapPin size={11} aria-hidden className="mr-0.5 inline" />
                    {x.min.store} {mzn(x.min.price)}
                  </span>
                  <span className="text-[#fca5a5]">
                    {x.max.store} {mzn(x.max.price)}
                  </span>
                  <span>Diferença {pct(x.spread)}</span>
                </span>
              </button>
              {open === x.productId ? (
                <ol className="flex flex-col gap-1.5 px-3 pb-3">
                  {x.ranked.map((r) => (
                    <li
                      key={r.store}
                      className="grid grid-cols-[minmax(0,1fr)_120px_80px] items-center gap-2 text-micro"
                    >
                      <span className="truncate text-white/85">
                        {r.store} · <span className="text-white/60">{r.location}</span>
                      </span>
                      <Meter
                        value={r.price / x.max.price}
                        label={`${r.store}: ${mzn(r.price)}`}
                        tone={r.price <= x.median ? "good" : "bad"}
                      />
                      <span className="text-right tabular-nums text-white">{mzn(r.price)}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

/* ── 5. Património: custos adicionais e recomendações ────────────────── */

export function WealthView() {
  const b = useBrain();
  const nw = netWorth(b.f.accounts, b.f.state.debts);
  const inv = b.pos.reduce((s, x) => s + x.value, 0);
  const byKind = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of b.costs) m.set(c.kind, (m.get(c.kind) ?? 0) + c.amount);
    return [...m.entries()].sort((x, y) => y[1] - x[1]);
  }, [b.costs]);
  const totalCosts = byKind.reduce((s, [, v]) => s + v, 0);
  const top = byKind[0]?.[1] ?? 1;
  const impact = b.advice.reduce((s, a) => s + a.impact, 0);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Património líquido"
          value={mzn(nw.net + inv, { compact: true })}
          hint="Contas + carteira − dívidas"
        />
        <MetricCard
          label="Investimentos"
          value={mzn(inv, { compact: true })}
          hint={`${b.pos.filter((x) => x.qty).length} posições`}
        />
        <MetricCard
          label="Custos adicionais"
          value={mzn(totalCosts)}
          tone="bad"
          hint={`${b.costs.length} ocorrências detetadas`}
        />
        <MetricCard
          label="Potencial por ano"
          value={mzn(impact, { compact: true })}
          tone="good"
          hint="Se seguir as recomendações"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Recomendações de gestão de património"
          subtitle="Ordenadas pelo impacto em meticais por ano"
        >
          <ul className="flex flex-col gap-2">
            {b.advice.map((a) => (
              <li key={a.id}>
                <Notice
                  tone={a.tone}
                  title={a.title}
                  right={
                    a.impact ? (
                      <span className="text-micro font-bold tabular-nums text-[#86efac]">
                        +{mzn(a.impact, { compact: true })}/ano
                      </span>
                    ) : undefined
                  }
                >
                  {a.body}
                </Notice>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel
          title="Custos adicionais"
          subtitle="Comissões, juros, impostos, taxas de envio, corretagem e sobrepreços"
        >
          <ul className="flex flex-col gap-3">
            {byKind.map(([k, v]) => (
              <li key={k} className="flex flex-col gap-1">
                <div className="flex justify-between text-caption">
                  <span className="text-white/85">{k}</span>
                  <span className="tabular-nums font-bold text-white">{mzn(v)}</span>
                </div>
                <Meter value={v / top} label={`${k}: ${mzn(v)}`} tone="bad" />
              </li>
            ))}
            {!byKind.length ? (
              <p className="text-caption text-white/70">Sem custos adicionais detetados.</p>
            ) : null}
          </ul>
          <h4 className="mt-4 flex items-center gap-1.5 text-micro font-bold uppercase tracking-wider text-white/60">
            <Lightbulb size={12} aria-hidden /> Maiores ocorrências
          </h4>
          <ul className="mt-2 flex flex-col gap-1.5">
            {[...b.costs]
              .sort((x, y) => y.amount - x.amount)
              .slice(0, 6)
              .map((c, i) => (
                <li key={i} className="flex justify-between gap-2 text-caption">
                  <span className="truncate text-white/80">
                    {c.label}
                    <span className="text-white/60"> · {c.kind}</span>
                  </span>
                  <span className="tabular-nums text-[#fca5a5]">{mzn(c.amount)}</span>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
