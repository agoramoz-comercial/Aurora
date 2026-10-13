import { useEffect, useState } from "react";
import { Check, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { BROKER_BY_ID, CLASS_LABEL, METHOD_META } from "@/data/brokers";
import { useBrokerStore } from "@/data/brokerStore";
import { CHART } from "../chartTheme";
import { TvChart } from "../charts/TvChart";
import { ActionButton, Drawer, Pill, formatUsd } from "../primitives";
import { BrokerMark } from "./BrokerMark";
import { StatusBadge, fmtPct, fmtPrice, fmtQty } from "./brokerFormat";

const fmtCurve = (n: number) => formatUsd(n, { digits: 1 });

export function BrokerConnectionDrawer({
  connectionId,
  onClose,
}: {
  connectionId: string | null;
  onClose: () => void;
}) {
  const { connections, snapshots, resync, rename, removeConnection } = useBrokerStore();
  const conn = connections.find((c) => c.id === connectionId) ?? null;
  const snap = conn ? snapshots[conn.id] : undefined;
  const broker = conn ? BROKER_BY_ID[conn.brokerId] : undefined;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    setEditing(false);
    setConfirmRemove(false);
    setDraft(conn?.label ?? "");
    // Reset only when switching accounts, not on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  const open = Boolean(conn && broker);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={620}
      accent={broker ? `${broker.color}66` : undefined}
      eyebrow={
        conn && broker ? (
          <>
            <StatusBadge status={conn.status} />
            <Pill tone="mute" className="!px-2 !py-0.5 !text-[10px]">
              {METHOD_META[conn.method].label}
            </Pill>
            <Pill tone="mute" className="!px-2 !py-0.5 !text-[10px]">
              {conn.mode === "paper" ? "Paper trading" : "Demonstração"}
            </Pill>
          </>
        ) : null
      }
      title={
        conn && broker ? (
          <span className="flex items-center gap-3">
            <BrokerMark brokerId={broker.id} size={38} />
            <span className="min-w-0">
              {editing ? (
                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    rename(conn.id, draft);
                    setEditing(false);
                  }}
                >
                  <input
                    autoFocus
                    aria-label="Nome da conta"
                    value={draft}
                    maxLength={40}
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-8 min-w-0 rounded-lg border border-white/15 bg-white/8 px-2 text-[14px] text-white outline-none focus:border-[var(--aurora-accent)]"
                  />
                  <button
                    type="submit"
                    aria-label="Guardar nome"
                    className="grid h-8 w-8 place-items-center rounded-full bg-[var(--aurora-accent)] text-white"
                  >
                    <Check size={14} />
                  </button>
                </form>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{conn.label}</span>
                  <button
                    type="button"
                    aria-label="Renomear conta"
                    onClick={() => {
                      setDraft(conn.label);
                      setEditing(true);
                    }}
                    className="grid h-7 w-7 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil size={12} />
                  </button>
                </span>
              )}
              <span className="block text-[11px] font-normal text-white/50">
                {broker.name} · {broker.region}
              </span>
            </span>
          </span>
        ) : (
          ""
        )
      }
      footer={
        conn ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {confirmRemove ? (
              <div className="flex items-center gap-2">
                <ActionButton
                  tone="danger"
                  icon={Trash2}
                  onClick={() => {
                    removeConnection(conn.id);
                    onClose();
                  }}
                >
                  Confirmar remoção
                </ActionButton>
                <ActionButton tone="ghost" onClick={() => setConfirmRemove(false)}>
                  Cancelar
                </ActionButton>
              </div>
            ) : (
              <ActionButton tone="ghost" icon={Trash2} onClick={() => setConfirmRemove(true)}>
                Remover
              </ActionButton>
            )}
            <ActionButton
              icon={RefreshCw}
              onClick={() => resync(conn.id)}
              disabled={conn.status === "syncing"}
            >
              {conn.status === "syncing" ? "A sincronizar…" : "Sincronizar"}
            </ActionButton>
          </div>
        ) : undefined
      }
    >
      {conn && snap ? (
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Fact label="Valor" value={formatUsd(snap.value)} />
            <Fact
              label="P&L total"
              value={`${snap.pnl >= 0 ? "+" : ""}${formatUsd(snap.pnl)}`}
              color={snap.pnl >= 0 ? CHART.positive : CHART.negative}
            />
            <Fact
              label="Dia"
              value={`${snap.dayPnl >= 0 ? "+" : ""}${formatUsd(snap.dayPnl)}`}
              color={snap.dayPnl >= 0 ? CHART.positive : CHART.negative}
            />
            <Fact label="Posições" value={String(snap.positions.length)} />
          </div>

          <section className="glass-soft flex h-[220px] flex-col p-3">
            <p className="mb-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Património · 180 dias
            </p>
            <div className="min-h-0 flex-1">
              <TvChart
                area={snap.curve}
                areaColor={snap.pnl >= 0 ? CHART.positive : CHART.negative}
                format={fmtCurve}
              />
            </div>
          </section>

          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Posições
            </p>
            <ul className="flex flex-col divide-y divide-white/6">
              {snap.positions.map((p) => (
                <li key={p.key} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
                      {p.symbol}
                      <span className="rounded-full bg-white/8 px-1.5 py-px text-[9px] font-medium text-white/55">
                        {CLASS_LABEL[p.cls]}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-white/45">
                      {fmtQty(p.qty)} × {fmtPrice(p.price)} · custo médio {fmtPrice(p.avgCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold tabular-nums text-white">
                      {formatUsd(p.value)}
                    </p>
                    <p
                      className="text-[11px] font-semibold tabular-nums"
                      style={{ color: p.pnl >= 0 ? CHART.positive : CHART.negative }}
                    >
                      {fmtPct(p.pnlPct)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[10px] text-white/35">
            Última sincronização:{" "}
            {conn.lastSync ? new Date(conn.lastSync).toLocaleString("pt-PT") : "—"} · dados
            simulados
          </p>
        </div>
      ) : conn ? (
        <div className="grid place-items-center p-10 text-[12px] text-white/55" aria-live="polite">
          A sincronizar posições…
        </div>
      ) : null}
    </Drawer>
  );
}

function Fact({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass-soft flex flex-col gap-1 p-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
      <span className="text-[15px] font-semibold tabular-nums" style={{ color: color ?? "#fff" }}>
        {value}
      </span>
    </div>
  );
}
