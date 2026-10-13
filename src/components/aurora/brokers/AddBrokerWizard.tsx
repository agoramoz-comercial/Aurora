import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, ShieldCheck } from "lucide-react";
import {
  BROKERS,
  BROKER_BY_ID,
  CLASS_LABEL,
  METHOD_META,
  type BrokerAssetClass,
  type ConnectMethod,
} from "@/data/brokers";
import { SYNC_MS, useBrokerStore, type AccountMode } from "@/data/brokerStore";
import { cn } from "@/lib/utils";
import { ActionButton, Drawer, FilterChip, SearchField, formatUsd } from "../primitives";
import { BrokerMark } from "./BrokerMark";

type Step = "pick" | "configure" | "sync";

const STEPS: { id: Step; label: string }[] = [
  { id: "pick", label: "Corretora" },
  { id: "configure", label: "Ligação" },
  { id: "sync", label: "Sincronização" },
];

const PHASES = [
  "Ligação segura estabelecida",
  "Contas e subcontas lidas",
  "Posições importadas",
  "Consolidação calculada",
];

const CLASSES = Object.keys(CLASS_LABEL) as BrokerAssetClass[];

export function AddBrokerWizard({
  open,
  onClose,
  initialBrokerId,
  onOpenConnection,
}: {
  open: boolean;
  onClose: () => void;
  initialBrokerId?: string | null;
  onOpenConnection?: (id: string) => void;
}) {
  const { connections, snapshots, addConnection } = useBrokerStore();
  const [step, setStep] = useState<Step>("pick");
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState<BrokerAssetClass | "all">("all");
  const [method, setMethod] = useState<ConnectMethod>("api");
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<AccountMode>("demo");
  const [connId, setConnId] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);

  const choose = (id: string) => {
    const b = BROKER_BY_ID[id];
    if (!b) return;
    setBrokerId(id);
    setMethod(b.methods[0]!);
    setLabel(`Conta ${b.name}`);
    setStep("configure");
  };

  // Fresh wizard on every open; a preselected broker skips the picker.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCls("all");
    setMode("demo");
    setConnId(null);
    setPhase(0);
    if (initialBrokerId && BROKER_BY_ID[initialBrokerId]) {
      const b = BROKER_BY_ID[initialBrokerId];
      setBrokerId(b.id);
      setMethod(b.methods[0]!);
      setLabel(`Conta ${b.name}`);
      setStep("configure");
    } else {
      setBrokerId(null);
      setStep("pick");
    }
  }, [open, initialBrokerId]);

  // Progress phases track the store's simulated sync duration.
  useEffect(() => {
    if (step !== "sync") return;
    const t = setInterval(
      () => setPhase((p) => Math.min(PHASES.length, p + 1)),
      SYNC_MS / PHASES.length,
    );
    return () => clearInterval(t);
  }, [step]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BROKERS.filter(
      (b) =>
        (cls === "all" || b.classes.includes(cls)) &&
        (!q || b.name.toLowerCase().includes(q) || b.region.toLowerCase().includes(q)),
    );
  }, [query, cls]);

  const broker = brokerId ? BROKER_BY_ID[brokerId] : null;
  const conn = connId ? connections.find((c) => c.id === connId) : null;
  const done = conn?.status === "connected";
  const snap = connId ? snapshots[connId] : undefined;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const connect = () => {
    if (!broker) return;
    const id = addConnection({
      brokerId: broker.id,
      label: label.trim() || `Conta ${broker.name}`,
      method,
      mode,
    });
    setConnId(id);
    setPhase(0);
    setStep("sync");
  };

  const footer =
    step === "configure" ? (
      <div className="flex items-center justify-between gap-2">
        <ActionButton tone="ghost" icon={ArrowLeft} onClick={() => setStep("pick")}>
          Voltar
        </ActionButton>
        <ActionButton onClick={connect} disabled={!broker}>
          Ligar corretora
        </ActionButton>
      </div>
    ) : step === "sync" && done && connId ? (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ActionButton
          tone="ghost"
          onClick={() => {
            setBrokerId(null);
            setConnId(null);
            setStep("pick");
          }}
        >
          Adicionar outra
        </ActionButton>
        <ActionButton
          onClick={() => {
            onClose();
            onOpenConnection?.(connId);
          }}
        >
          Ver conta
        </ActionButton>
      </div>
    ) : undefined;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      title="Adicionar corretora"
      eyebrow={
        <ol className="flex items-center gap-1.5" aria-label="Passos">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              aria-current={i === stepIndex ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                i === stepIndex
                  ? "bg-[rgba(74,158,255,0.18)] text-[var(--aurora-accent)]"
                  : i < stepIndex
                    ? "bg-white/8 text-white/70"
                    : "bg-white/5 text-white/35",
              )}
            >
              <span className="tabular-nums">{i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>
      }
      footer={footer}
    >
      <div className="flex flex-col gap-4 p-5">
        <DemoNotice />

        {step === "pick" ? (
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Pesquisar corretora ou região…"
            />
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
              <FilterChip active={cls === "all"} onClick={() => setCls("all")}>
                Todas
              </FilterChip>
              {CLASSES.map((c) => (
                <FilterChip key={c} active={cls === c} onClick={() => setCls(c)}>
                  {CLASS_LABEL[c]}
                </FilterChip>
              ))}
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filtered.map((b) => {
                const count = connections.filter((c) => c.brokerId === b.id).length;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => choose(b.id)}
                      className="glass-soft flex w-full items-center gap-3 p-3 text-left transition-[background-color,box-shadow] hover:bg-white/10 hover:shadow-[inset_0_0_0_1px_rgba(74,158,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      <BrokerMark brokerId={b.id} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-semibold text-white">
                            {b.name}
                          </span>
                          {count ? (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-px text-[9px] font-semibold text-emerald-300">
                              {count} ligada{count > 1 ? "s" : ""}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-white/50">
                          {b.region} · {b.classes.map((c) => CLASS_LABEL[c]).join(" · ")}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!filtered.length ? (
              <p className="py-6 text-center text-[12px] text-white/45">
                Nenhuma corretora corresponde a “{query}”.
              </p>
            ) : null}
          </>
        ) : null}

        {step === "configure" && broker ? (
          <>
            <div className="glass-soft flex items-center gap-3 p-3.5">
              <BrokerMark brokerId={broker.id} size={44} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white">{broker.name}</p>
                <p className="mt-0.5 text-[11px] text-white/50">
                  {broker.region} · {broker.classes.map((c) => CLASS_LABEL[c]).join(" · ")}
                </p>
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                Método de ligação
              </legend>
              <div role="radiogroup" className="flex flex-col gap-2">
                {broker.methods.map((m) => {
                  const active = m === method;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMethod(m)}
                      className={cn(
                        "flex items-start gap-3 rounded-[14px] border p-3 text-left transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        active
                          ? "border-[rgba(74,158,255,0.5)] bg-[rgba(74,158,255,0.12)]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                          active ? "border-[var(--aurora-accent)]" : "border-white/30",
                        )}
                      >
                        {active ? (
                          <span className="h-2 w-2 rounded-full bg-[var(--aurora-accent)]" />
                        ) : null}
                      </span>
                      <span>
                        <span className="block text-[12px] font-semibold text-white">
                          {METHOD_META[m].label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-white/50">
                          {METHOD_META[m].hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                Nome da conta
              </span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={40}
                className="glass-soft h-10 px-3 text-[13px] text-white outline-none placeholder:text-white/35 focus:shadow-[inset_0_0_0_1px_rgba(74,158,255,0.5)]"
                style={{ borderRadius: 12 }}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                Tipo de conta
              </span>
              <div className="flex gap-1.5">
                <FilterChip size="md" active={mode === "demo"} onClick={() => setMode("demo")}>
                  Demonstração
                </FilterChip>
                <FilterChip size="md" active={mode === "paper"} onClick={() => setMode("paper")}>
                  Paper trading
                </FilterChip>
              </div>
            </div>
          </>
        ) : null}

        {step === "sync" && broker ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <BrokerMark brokerId={broker.id} size={44} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white">{conn?.label ?? label}</p>
                <p className="mt-0.5 text-[11px] text-white/50" aria-live="polite">
                  {done ? "Ligação concluída" : `A sincronizar com ${broker.name}…`}
                </p>
              </div>
            </div>
            <ol className="flex flex-col gap-2">
              {PHASES.map((p, i) => {
                const state = done || i < phase ? "done" : i === phase ? "active" : "todo";
                return (
                  <li
                    key={p}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px]",
                      state === "done" && "bg-emerald-500/8 text-white/85",
                      state === "active" && "bg-[rgba(74,158,255,0.10)] text-white",
                      state === "todo" && "text-white/35",
                    )}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center">
                      {state === "done" ? (
                        <Check size={14} className="text-emerald-300" />
                      ) : state === "active" ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-[var(--aurora-accent)] motion-reduce:animate-none"
                        />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                      )}
                    </span>
                    {p}
                  </li>
                );
              })}
            </ol>
            {done && snap ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-2"
              >
                <Fact label="Posições" value={String(snap.positions.length)} />
                <Fact label="Valor" value={formatUsd(snap.value)} />
                <Fact
                  label="P&L"
                  value={`${snap.pnl >= 0 ? "+" : ""}${formatUsd(snap.pnl)}`}
                  tone={snap.pnl >= 0 ? "up" : "down"}
                />
              </motion.div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}

function DemoNotice() {
  return (
    <div
      className="flex items-start gap-2.5 rounded-[14px] px-3 py-2.5 text-[11px] leading-snug text-white/70"
      style={{
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.25)",
      }}
    >
      <ShieldCheck size={15} className="mt-px shrink-0 text-[var(--aurora-warn)]" />
      <p>
        <span className="font-semibold text-[var(--aurora-warn)]">Modo demonstração.</span> Nenhuma
        credencial é pedida nem enviada. A ligação e as posições são simuladas para mostrar a
        consolidação multi-corretora.
      </p>
    </div>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="glass-soft flex flex-col gap-1 p-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{
          color:
            tone === "up"
              ? "var(--aurora-positive)"
              : tone === "down"
                ? "var(--aurora-negative)"
                : "#fff",
        }}
      >
        {value}
      </span>
    </div>
  );
}
