import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Landmark, Plus, RefreshCw } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  BROKERS,
  BROKER_BY_ID,
  CLASS_LABEL,
  METHOD_META,
  type BrokerAssetClass,
} from "@/data/brokers";
import { useBrokerStore } from "@/data/brokerStore";
import { cn } from "@/lib/utils";
import { CHART, SERIES_COLORS, tooltipProps } from "../chartTheme";
import { TvChart } from "../charts/TvChart";
import {
  ActionButton,
  EmptyState,
  FilterChip,
  Panel,
  SegmentedTabs,
  StatTile,
  WorkspaceHeader,
  formatUsd,
} from "../primitives";
import { AddBrokerWizard } from "./AddBrokerWizard";
import { BrokerConnectionDrawer } from "./BrokerConnectionDrawer";
import { BrokerMark } from "./BrokerMark";
import { StatusBadge, fmtPct, fmtPrice, fmtQty } from "./brokerFormat";

const RANGES = [
  { id: "1M" as const, label: "1M", days: 30 },
  { id: "3M" as const, label: "3M", days: 90 },
  { id: "6M" as const, label: "6M", days: 180 },
];
type RangeId = (typeof RANGES)[number]["id"];

const fmtCurve = (n: number) => formatUsd(n, { digits: 1 });
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${formatUsd(Math.abs(n))}`;

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Last palette request served; module scope so it survives workspace remounts. */
let handledWizardSignal = 0;

export function BrokersWorkspace({ wizardSignal = 0 }: { wizardSignal?: number }) {
  const { connections, snapshots, positions, curve, totals, resync } = useBrokerStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [preselect, setPreselect] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [range, setRange] = useState<RangeId>("3M");
  const [allocBy, setAllocBy] = useState<"broker" | "class">("broker");
  const [clsFilter, setClsFilter] = useState<BrokerAssetClass | "all">("all");

  // External "add broker" requests (command palette). Each signal opens the
  // wizard once; remounting the workspace later must not replay it.
  useEffect(() => {
    if (wizardSignal > handledWizardSignal) {
      handledWizardSignal = wizardSignal;
      setPreselect(null);
      setWizardOpen(true);
    }
  }, [wizardSignal]);

  const openWizard = (brokerId: string | null = null) => {
    setPreselect(brokerId);
    setWizardOpen(true);
  };

  const shownCurve = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)!.days;
    return curve.slice(-days);
  }, [curve, range]);
  const curveUp = (shownCurve.at(-1)?.value ?? 0) >= (shownCurve[0]?.value ?? 0);

  const allocation = useMemo(() => {
    if (allocBy === "broker") {
      const byBroker = new Map<string, number>();
      for (const p of positions)
        byBroker.set(p.brokerId, (byBroker.get(p.brokerId) ?? 0) + p.value);
      return [...byBroker.entries()]
        .map(([id, value]) => ({
          key: id,
          name: BROKER_BY_ID[id]?.name ?? id,
          value,
          color: BROKER_BY_ID[id]?.color ?? CHART.muted,
          brokerId: id as string | undefined,
        }))
        .sort((a, b) => b.value - a.value);
    }
    const byCls = new Map<BrokerAssetClass, number>();
    for (const p of positions) byCls.set(p.cls, (byCls.get(p.cls) ?? 0) + p.value);
    return [...byCls.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cls, value], i) => ({
        key: cls,
        name: CLASS_LABEL[cls],
        value,
        color: SERIES_COLORS[i % SERIES_COLORS.length]!,
        brokerId: undefined as string | undefined,
      }));
  }, [positions, allocBy]);

  const classesHeld = useMemo(() => {
    const counts = new Map<BrokerAssetClass, number>();
    for (const p of positions) counts.set(p.cls, (counts.get(p.cls) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [positions]);

  const shownPositions = useMemo(
    () => (clsFilter === "all" ? positions : positions.filter((p) => p.cls === clsFilter)),
    [positions, clsFilter],
  );

  const lastSync = connections
    .map((c) => c.lastSync)
    .filter(Boolean)
    .sort()
    .at(-1);
  const distinctBrokers = new Set(connections.map((c) => c.brokerId)).size;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="Corretoras"
        subtitle={
          connections.length
            ? `${totals.accounts} conta${totals.accounts === 1 ? "" : "s"} · ${distinctBrokers} corretora${distinctBrokers === 1 ? "" : "s"} · sincronizado ${
                lastSync
                  ? new Date(lastSync).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
              }`
            : "Ligue contas para consolidar posições num só ecrã"
        }
        badge={
          <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-300">
            Demo
          </span>
        }
        right={
          <ActionButton icon={Plus} onClick={() => openWizard()}>
            <span className="hidden sm:inline">Adicionar corretora</span>
            <span className="sm:hidden">Adicionar</span>
          </ActionButton>
        }
      />

      {connections.length === 0 ? (
        <div className="thin-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto">
          <EmptyState
            icon={Landmark}
            title="Nenhuma corretora ligada"
            hint="Adicione uma conta para ver património, P&L e alocação consolidados entre corretoras."
            action={
              <ActionButton icon={Plus} onClick={() => openWizard()} className="mt-2">
                Adicionar corretora
              </ActionButton>
            }
          />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Populares
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {BROKERS.slice(0, 6).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => openWizard(b.id)}
                className="glass-soft flex items-center gap-2.5 p-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <BrokerMark brokerId={b.id} size={30} />
                <span className="truncate text-[12px] font-semibold text-white">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="thin-scrollbar mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
        >
          {/* KPI strip */}
          <motion.div variants={rise} className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatTile
              accent
              label="Património"
              value={formatUsd(totals.value)}
              footnote={
                <span style={{ color: totals.dayPnl >= 0 ? CHART.positive : CHART.negative }}>
                  Hoje {signed(totals.dayPnl)} ({fmtPct(totals.dayPct, 2)})
                </span>
              }
            />
            <StatTile
              label="P&L aberto"
              value={signed(totals.pnl)}
              footnote={
                <span style={{ color: totals.pnl >= 0 ? CHART.positive : CHART.negative }}>
                  {fmtPct(totals.pnlPct)} · custo {formatUsd(totals.cost)}
                </span>
              }
            />
            <StatTile
              label="Contas ligadas"
              value={String(totals.accounts)}
              footnote={
                totals.syncing
                  ? `${totals.syncing} a sincronizar`
                  : `${distinctBrokers} corretora${distinctBrokers === 1 ? "" : "s"}`
              }
            />
            <StatTile
              label="Posições"
              value={String(totals.positions)}
              footnote={classesHeld.map(([c, n]) => `${CLASS_LABEL[c]} ${n}`).join(" · ") || "—"}
            />
          </motion.div>

          {/* Equity + allocation */}
          <motion.div variants={rise} className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-12">
            <Panel
              title="Património consolidado"
              subtitle="Soma de todas as contas ligadas"
              className="lg:col-span-8"
              right={
                <SegmentedTabs
                  size="sm"
                  tabs={RANGES.map((r) => ({ id: r.id, label: r.label }))}
                  active={range}
                  onSelect={setRange}
                />
              }
            >
              <div className="h-[260px] sm:h-[300px]">
                {shownCurve.length > 1 ? (
                  <TvChart
                    area={shownCurve}
                    areaColor={curveUp ? CHART.positive : CHART.negative}
                    format={fmtCurve}
                    label="Total"
                  />
                ) : (
                  <ChartPending />
                )}
              </div>
            </Panel>

            <Panel
              title="Alocação"
              subtitle={allocBy === "broker" ? "Por corretora" : "Por classe de ativo"}
              className="lg:col-span-4"
              right={
                <SegmentedTabs
                  size="sm"
                  tabs={[
                    { id: "broker" as const, label: "Corretora" },
                    { id: "class" as const, label: "Classe" },
                  ]}
                  active={allocBy}
                  onSelect={setAllocBy}
                />
              }
            >
              {allocation.length ? (
                <div className="flex flex-col gap-3">
                  <div className="relative h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          {...tooltipProps}
                          formatter={(v: number) => [
                            `${formatUsd(v)} · ${((v / (totals.value || 1)) * 100).toFixed(1)}%`,
                            "Valor",
                          ]}
                        />
                        <Pie
                          data={allocation}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="64%"
                          outerRadius="92%"
                          paddingAngle={2}
                          stroke="none"
                          isAnimationActive={false}
                        >
                          {allocation.map((a) => (
                            <Cell key={a.key} fill={a.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                          Total
                        </p>
                        <p className="text-[16px] font-semibold tabular-nums text-white">
                          {formatUsd(totals.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {allocation.map((a) => {
                      const share = a.value / (totals.value || 1);
                      return (
                        <li key={a.key} className="flex items-center gap-2.5 text-[11px]">
                          {a.brokerId ? (
                            <BrokerMark brokerId={a.brokerId} size={22} />
                          ) : (
                            <span
                              aria-hidden
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: a.color }}
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex justify-between gap-2">
                              <span className="truncate text-white/80">{a.name}</span>
                              <span className="font-semibold tabular-nums text-white">
                                {(share * 100).toFixed(1)}%
                              </span>
                            </span>
                            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/8">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${share * 100}%`, background: a.color }}
                              />
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <ChartPending />
              )}
            </Panel>
          </motion.div>

          {/* Accounts + positions */}
          <motion.div variants={rise} className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-12">
            <Panel title="Contas" subtitle="Clique para ver detalhe" className="lg:col-span-4">
              <ul className="flex flex-col gap-1.5">
                {connections.map((c) => {
                  const b = BROKER_BY_ID[c.brokerId];
                  const snap = snapshots[c.id];
                  return (
                    <li key={c.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailId(c.id)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      >
                        <BrokerMark brokerId={c.brokerId} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold text-white">
                            {c.label}
                          </span>
                          <span className="block truncate text-[10px] text-white/45">
                            {b?.name} · {METHOD_META[c.method].label}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[12px] font-semibold tabular-nums text-white">
                            {snap ? formatUsd(snap.value) : "—"}
                          </span>
                          <StatusBadge status={c.status} />
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Sincronizar ${c.label}`}
                        title="Sincronizar"
                        disabled={c.status === "syncing"}
                        onClick={() => resync(c.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      >
                        <RefreshCw
                          size={13}
                          className={cn(
                            c.status === "syncing" && "animate-spin motion-reduce:animate-none",
                          )}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => openWizard()}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2.5 text-[11px] font-semibold text-white/55 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Plus size={13} /> Ligar outra conta
              </button>
            </Panel>

            <Panel
              title="Posições consolidadas"
              subtitle={`${shownPositions.length} posições · ordenadas por valor`}
              className="lg:col-span-8"
            >
              <div className="no-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1">
                <FilterChip active={clsFilter === "all"} onClick={() => setClsFilter("all")}>
                  Todas
                </FilterChip>
                {classesHeld.map(([c, n]) => (
                  <FilterChip
                    key={c}
                    active={clsFilter === c}
                    onClick={() => setClsFilter(c)}
                    count={n}
                  >
                    {CLASS_LABEL[c]}
                  </FilterChip>
                ))}
              </div>
              <div className="thin-scrollbar -mx-1 overflow-x-auto px-1">
                <table className="w-full text-[12px] sm:min-w-[520px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-white/40">
                      <th className="pb-2 font-semibold">Ativo</th>
                      <th className="pb-2 font-semibold">Corretora</th>
                      <th className="hidden pb-2 text-right font-semibold sm:table-cell">Qtd</th>
                      <th className="hidden pb-2 text-right font-semibold sm:table-cell">Preço</th>
                      <th className="pb-2 text-right font-semibold">Valor</th>
                      <th className="pb-2 text-right font-semibold">P&L</th>
                      <th className="hidden pb-2 text-right font-semibold sm:table-cell">Dia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {shownPositions.map((p) => (
                      <tr key={p.key} className="transition-colors hover:bg-white/[0.03]">
                        <td className="py-2 pr-2">
                          <span className="block font-semibold text-white">{p.symbol}</span>
                          <span className="block max-w-[140px] truncate text-[10px] text-white/45">
                            {p.name}
                          </span>
                        </td>
                        <td className="py-2 pr-2">
                          <button
                            type="button"
                            onClick={() => setDetailId(p.connectionId)}
                            className="flex items-center gap-1.5 rounded-lg text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          >
                            <BrokerMark brokerId={p.brokerId} size={20} />
                            <span className="hidden max-w-[110px] truncate text-[11px] sm:inline">
                              {BROKER_BY_ID[p.brokerId]?.name}
                            </span>
                          </button>
                        </td>
                        <td className="hidden py-2 text-right tabular-nums text-white/70 sm:table-cell">
                          {fmtQty(p.qty)}
                        </td>
                        <td className="hidden py-2 text-right tabular-nums text-white/70 sm:table-cell">
                          {fmtPrice(p.price)}
                        </td>
                        <td className="py-2 text-right font-semibold tabular-nums text-white">
                          {formatUsd(p.value)}
                        </td>
                        <td
                          className="py-2 text-right font-semibold tabular-nums"
                          style={{ color: p.pnl >= 0 ? CHART.positive : CHART.negative }}
                        >
                          {fmtPct(p.pnlPct)}
                        </td>
                        <td
                          className="hidden py-2 text-right tabular-nums sm:table-cell"
                          style={{ color: p.dayPct >= 0 ? CHART.positive : CHART.negative }}
                        >
                          {fmtPct(p.dayPct, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!shownPositions.length ? (
                  <p className="py-6 text-center text-[12px] text-white/45" aria-live="polite">
                    {totals.syncing ? "A sincronizar posições…" : "Sem posições nesta classe."}
                  </p>
                ) : null}
              </div>
            </Panel>
          </motion.div>

          <p className="shrink-0 pb-1 text-[10px] text-white/35">
            Modo demonstração · ligações e posições simuladas, sem credenciais. Não constitui
            recomendação de investimento.
          </p>
        </motion.div>
      )}

      <AddBrokerWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialBrokerId={preselect}
        onOpenConnection={setDetailId}
      />
      <BrokerConnectionDrawer connectionId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

function ChartPending() {
  return (
    <div className="grid h-full min-h-[120px] place-items-center rounded-[14px] border border-dashed border-white/10 text-[11px] text-white/40">
      A aguardar a primeira sincronização…
    </div>
  );
}
