/**
 * brokerStore.tsx
 *
 * Broker connections (demo mode) — React context + localStorage, same pattern
 * as portfolioStore. Only the connection records persist; positions, P&L and
 * equity curves are derived deterministically from each connection id, so a
 * reload shows the same book without storing it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gaussian, rng, seedFor } from "@/lib/finance/baseline";
import { BROKER_BY_ID, getInstrument, type BrokerAssetClass, type ConnectMethod } from "./brokers";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConnectionStatus = "syncing" | "connected";
export type AccountMode = "demo" | "paper";

export interface BrokerConnection {
  id: string;
  brokerId: string;
  label: string;
  method: ConnectMethod;
  mode: AccountMode;
  status: ConnectionStatus;
  addedAt: string;
  lastSync: string | null;
}

export interface BrokerPosition {
  key: string;
  connectionId: string;
  brokerId: string;
  symbol: string;
  name: string;
  cls: BrokerAssetClass;
  qty: number;
  avgCost: number;
  price: number;
  value: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  dayPct: number;
  dayPnl: number;
}

export interface CurvePoint {
  time: string;
  value: number;
}

export interface ConnectionSnapshot {
  positions: BrokerPosition[];
  value: number;
  cost: number;
  pnl: number;
  dayPnl: number;
  curve: CurvePoint[];
}

export interface BrokerTotals {
  value: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  dayPnl: number;
  dayPct: number;
  accounts: number;
  syncing: number;
  positions: number;
}

interface BrokerStoreState {
  connections: BrokerConnection[];
  /** Snapshots for connected accounts only (syncing accounts have no book yet). */
  snapshots: Record<string, ConnectionSnapshot>;
  positions: BrokerPosition[];
  curve: CurvePoint[];
  totals: BrokerTotals;
  addConnection: (input: {
    brokerId: string;
    label: string;
    method: ConnectMethod;
    mode: AccountMode;
  }) => string;
  removeConnection: (id: string) => void;
  resync: (id: string) => void;
  rename: (id: string, label: string) => void;
  resetToDemo: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "aurora-brokers-v1";
/** How long a simulated sync takes; the wizard's progress steps follow it. */
export const SYNC_MS = 1800;
const CURVE_DAYS = 180;

function defaultConnections(): BrokerConnection[] {
  const now = new Date().toISOString();
  return [
    {
      id: "ibkr-main",
      brokerId: "ibkr",
      label: "Conta principal",
      method: "api",
      mode: "demo",
      status: "connected",
      addedAt: now,
      lastSync: now,
    },
    {
      id: "binance-main",
      brokerId: "binance",
      label: "Carteira cripto",
      method: "api",
      mode: "demo",
      status: "connected",
      addedAt: now,
      lastSync: now,
    },
  ];
}

// ─── Simulation ──────────────────────────────────────────────────────────────

function lastDays(n: number): string[] {
  const today = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function roundQty(qty: number, price: number, cls: BrokerAssetClass): number {
  if (cls === "crypto") return Math.max(0.0001, Math.round(qty * 1e4) / 1e4);
  if (price < 10) return Math.max(100, Math.round(qty / 100) * 100);
  return Math.max(1, Math.round(qty));
}

const snapshotCache = new Map<string, ConnectionSnapshot>();

/**
 * Deterministic book for one connection. Holdings (which symbols, how many,
 * at what cost) key on the connection id alone so they never reshuffle; the
 * day move and curve shape key on the date as well.
 */
function buildSnapshot(c: BrokerConnection, dates: string[]): ConnectionSnapshot {
  const cacheKey = `${c.id}|${c.brokerId}|${dates.at(-1)}`;
  const hit = snapshotCache.get(cacheKey);
  if (hit) return hit;

  const broker = BROKER_BY_ID[c.brokerId];
  const r = rng(seedFor(c.id));
  const rDay = rng(seedFor(cacheKey));
  const pool = [...(broker?.universe ?? ["AAPL"])];
  const n = Math.min(pool.length, 3 + Math.floor(r() * 4));
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(r() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }

  const positions: BrokerPosition[] = pool.slice(0, n).map((symbol) => {
    const inst = getInstrument(symbol);
    const qty = roundQty((4000 + r() * 36000) / inst.price, inst.price, inst.cls);
    const sinceEntry = -0.18 + r() * 0.5;
    const avgCost = inst.price / (1 + sinceEntry);
    const dayPct = gaussian(rDay) * inst.vol;
    const value = qty * inst.price;
    const cost = qty * avgCost;
    return {
      key: `${c.id}:${symbol}`,
      connectionId: c.id,
      brokerId: c.brokerId,
      symbol,
      name: inst.name,
      cls: inst.cls,
      qty,
      avgCost,
      price: inst.price,
      value,
      cost,
      pnl: value - cost,
      pnlPct: cost ? (value - cost) / cost : 0,
      dayPct,
      dayPnl: value - value / (1 + dayPct),
    };
  });

  const value = positions.reduce((a, p) => a + p.value, 0);
  const cost = positions.reduce((a, p) => a + p.cost, 0);
  const dayPnl = positions.reduce((a, p) => a + p.dayPnl, 0);

  // Walk the curve backwards from today's value with the book's blended vol,
  // drifting towards cost so the history is consistent with the P&L shown.
  const vol = value
    ? positions.reduce((a, p) => a + getInstrument(p.symbol).vol * p.value, 0) / value
    : 0.01;
  const mu = cost > 0 ? Math.log(value / cost) / dates.length : 0;
  const vals = new Array<number>(dates.length);
  vals[dates.length - 1] = value;
  vals[dates.length - 2] =
    value / (1 + positions.reduce((a, p) => a + p.dayPct * p.value, 0) / (value || 1));
  for (let i = dates.length - 3; i >= 0; i--) {
    vals[i] = vals[i + 1]! / Math.exp(mu + vol * 0.85 * gaussian(rDay));
  }
  const curve = dates.map((time, i) => ({ time, value: Math.round(vals[i]! * 100) / 100 }));

  const snap = { positions, value, cost, pnl: value - cost, dayPnl, curve };
  snapshotCache.set(cacheKey, snap);
  return snap;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadFromStorage(): BrokerConnection[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (c: Record<string, unknown>) =>
          typeof c === "object" &&
          c !== null &&
          typeof c.id === "string" &&
          typeof c.brokerId === "string" &&
          typeof c.label === "string" &&
          c.brokerId in BROKER_BY_ID,
      )
      .map((c) => {
        const conn = c as BrokerConnection;
        // A sync interrupted by a reload resumes as completed.
        return conn.status === "syncing"
          ? { ...conn, status: "connected" as const, lastSync: new Date().toISOString() }
          : conn;
      });
  } catch {
    return null;
  }
}

function saveToStorage(connections: BrokerConnection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  } catch {
    // Storage full or unavailable — the session still works in memory.
  }
}

function newId(brokerId: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${brokerId}-${rand}`;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const BrokerStoreContext = createContext<BrokerStoreState | null>(null);

export function BrokerStoreProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<BrokerConnection[]>(
    () => loadFromStorage() ?? defaultConnections(),
  );
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    saveToStorage(connections);
  }, [connections]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const scheduleSync = useCallback((id: string) => {
    const prev = timers.current.get(id);
    if (prev) clearTimeout(prev);
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id);
        setConnections((list) =>
          list.map((c) =>
            c.id === id ? { ...c, status: "connected", lastSync: new Date().toISOString() } : c,
          ),
        );
      }, SYNC_MS),
    );
  }, []);

  const addConnection = useCallback<BrokerStoreState["addConnection"]>(
    (input) => {
      const id = newId(input.brokerId);
      const now = new Date().toISOString();
      setConnections((list) => [
        ...list,
        { ...input, id, status: "syncing", addedAt: now, lastSync: null },
      ]);
      scheduleSync(id);
      return id;
    },
    [scheduleSync],
  );

  const removeConnection = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setConnections((list) => list.filter((c) => c.id !== id));
  }, []);

  const resync = useCallback(
    (id: string) => {
      setConnections((list) => list.map((c) => (c.id === id ? { ...c, status: "syncing" } : c)));
      scheduleSync(id);
    },
    [scheduleSync],
  );

  const rename = useCallback((id: string, label: string) => {
    const clean = label.trim();
    if (!clean) return;
    setConnections((list) => list.map((c) => (c.id === id ? { ...c, label: clean } : c)));
  }, []);

  const resetToDemo = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setConnections(defaultConnections());
  }, []);

  const derived = useMemo(() => {
    const dates = lastDays(CURVE_DAYS);
    const snapshots: Record<string, ConnectionSnapshot> = {};
    for (const c of connections) {
      if (c.status === "connected") snapshots[c.id] = buildSnapshot(c, dates);
    }
    const snaps = Object.values(snapshots);
    const positions = snaps.flatMap((s) => s.positions).sort((a, b) => b.value - a.value);
    const value = snaps.reduce((a, s) => a + s.value, 0);
    const cost = snaps.reduce((a, s) => a + s.cost, 0);
    const dayPnl = snaps.reduce((a, s) => a + s.dayPnl, 0);
    const curve = snaps.length
      ? dates.map((time, i) => ({
          time,
          value: Math.round(snaps.reduce((a, s) => a + s.curve[i]!.value, 0) * 100) / 100,
        }))
      : [];
    const totals: BrokerTotals = {
      value,
      cost,
      pnl: value - cost,
      pnlPct: cost ? (value - cost) / cost : 0,
      dayPnl,
      dayPct: value - dayPnl ? dayPnl / (value - dayPnl) : 0,
      accounts: connections.length,
      syncing: connections.filter((c) => c.status === "syncing").length,
      positions: positions.length,
    };
    return { snapshots, positions, curve, totals };
  }, [connections]);

  const value = useMemo<BrokerStoreState>(
    () => ({
      connections,
      ...derived,
      addConnection,
      removeConnection,
      resync,
      rename,
      resetToDemo,
    }),
    [connections, derived, addConnection, removeConnection, resync, rename, resetToDemo],
  );

  return <BrokerStoreContext.Provider value={value}>{children}</BrokerStoreContext.Provider>;
}

export function useBrokerStore(): BrokerStoreState {
  const ctx = useContext(BrokerStoreContext);
  if (!ctx) throw new Error("useBrokerStore must be used within a BrokerStoreProvider");
  return ctx;
}
