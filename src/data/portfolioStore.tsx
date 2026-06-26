/**
 * portfolioStore.ts
 *
 * Custom portfolio state management using React context + localStorage.
 * Allows users to build their own portfolio by adding/removing holdings
 * from the available baseline pool.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { holdingsData, type Holding } from "./portfolio";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomHolding {
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
  sector: string;
}

interface PortfolioStoreState {
  holdings: CustomHolding[];
  addHolding: (holding: CustomHolding) => void;
  removeHolding: (symbol: string) => void;
  updateHolding: (symbol: string, changes: Partial<CustomHolding>) => void;
  resetToDefault: () => void;
  isCustomized: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "aurora-portfolio-v1";

// Available symbols for the builder (existing portfolio + baseline tickers)
export const AVAILABLE_SYMBOLS: { symbol: string; name: string; sector: string }[] = [
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Information Technology" },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Information Technology" },
  { symbol: "GE", name: "General Electric Company", sector: "Industrials" },
  { symbol: "CAT", name: "Caterpillar, Inc.", sector: "Industrials" },
  { symbol: "DE", name: "Deere & Company", sector: "Industrials" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy" },
  { symbol: "GILD", name: "Gilead Sciences, Inc.", sector: "Health Care" },
  { symbol: "FB", name: "Facebook, Inc.", sector: "Information Technology" },
  { symbol: "KO", name: "Coca-Cola Company (The)", sector: "Consumer Staples" },
  { symbol: "IBM", name: "International Business Machines", sector: "Information Technology" },
  { symbol: "F", name: "Ford Motor Company", sector: "Consumer Discretionary" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Communication Services" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Communication Services" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors" },
];

// ─── Default holdings (from existing portfolio data) ─────────────────────────

function buildDefaultHoldings(): CustomHolding[] {
  return holdingsData.map((h: Holding) => ({
    symbol: h.symbol,
    name: h.name,
    shares: h.shares,
    purchasePrice: h.purchasePrice,
    purchaseDate: h.purchaseDate,
    sector: h.sector,
  }));
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadFromStorage(): CustomHolding[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Basic validation
    return parsed.filter(
      (item: Record<string, unknown>) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.symbol === "string" &&
        typeof item.shares === "number",
    ) as CustomHolding[];
  } catch {
    return null;
  }
}

function saveToStorage(holdings: CustomHolding[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const PortfolioStoreContext = createContext<PortfolioStoreState | null>(null);

export function PortfolioStoreProvider({ children }: { children: ReactNode }) {
  const defaults = buildDefaultHoldings();
  const [holdings, setHoldings] = useState<CustomHolding[]>(() => loadFromStorage() ?? defaults);

  // Check if customized (different from defaults)
  const isCustomized =
    holdings.length !== defaults.length ||
    holdings.some((h, i) => h.symbol !== defaults[i]?.symbol || h.shares !== defaults[i]?.shares);

  // Persist on change
  useEffect(() => {
    saveToStorage(holdings);
  }, [holdings]);

  const addHolding = useCallback((holding: CustomHolding) => {
    setHoldings((prev) => {
      // Don't add duplicates
      if (prev.some((h) => h.symbol === holding.symbol)) return prev;
      return [...prev, holding];
    });
  }, []);

  const removeHolding = useCallback((symbol: string) => {
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
  }, []);

  const updateHolding = useCallback((symbol: string, changes: Partial<CustomHolding>) => {
    setHoldings((prev) => prev.map((h) => (h.symbol === symbol ? { ...h, ...changes } : h)));
  }, []);

  const resetToDefault = useCallback(() => {
    setHoldings(buildDefaultHoldings());
  }, []);

  return (
    <PortfolioStoreContext.Provider
      value={{ holdings, addHolding, removeHolding, updateHolding, resetToDefault, isCustomized }}
    >
      {children}
    </PortfolioStoreContext.Provider>
  );
}

export function usePortfolioStore(): PortfolioStoreState {
  const ctx = useContext(PortfolioStoreContext);
  if (!ctx) {
    throw new Error("usePortfolioStore must be used within a PortfolioStoreProvider");
  }
  return ctx;
}
