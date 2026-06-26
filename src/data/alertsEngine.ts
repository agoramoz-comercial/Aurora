/**
 * alertsEngine.ts
 *
 * Rule-based alert evaluation engine. Evaluates macro, micro, nano, and
 * sentiment conditions against current portfolio data and generates
 * triggered alerts with severity levels.
 */

import { holdingsData, macroSnapshot, redFlags } from "./portfolio";
import { getEnrichedHoldings, type EnrichedHolding } from "./portfolioEnriched";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlertCategory = "macro" | "micro" | "nano" | "sentiment";
export type AlertSeverity = "info" | "warning" | "critical";

export interface TriggeredAlert {
  id: string;
  ruleName: string;
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  affectedAssets: string[];
  targetTab: string;
  timestamp: number;
}

interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  evaluate: (enriched: EnrichedHolding[]) => TriggeredAlert | null;
}

// ─── Macro Rules ─────────────────────────────────────────────────────────────

function getMacroValue(label: string): number | undefined {
  return macroSnapshot.find((m) => m.label === label)?.value;
}

const macroRules: AlertRule[] = [
  {
    id: "macro-gdp-negative",
    name: "GDP Growth Negative",
    category: "macro",
    evaluate: () => {
      const gdp = getMacroValue("GDP Q Growth YoY");
      if (gdp !== undefined && gdp < 0)
        return {
          id: "macro-gdp-negative",
          ruleName: "GDP Growth Negative",
          category: "macro",
          severity: "critical",
          message: `GDP growth is negative at ${(gdp * 100).toFixed(1)}% YoY — recession risk elevated.`,
          affectedAssets: [],
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "macro-unemployment-high",
    name: "High Unemployment",
    category: "macro",
    evaluate: () => {
      const unemp = getMacroValue("Unemployment Rate");
      if (unemp !== undefined && unemp > 0.08)
        return {
          id: "macro-unemployment-high",
          ruleName: "High Unemployment",
          category: "macro",
          severity: "critical",
          message: `Unemployment rate at ${(unemp * 100).toFixed(1)}% — exceeds 8% threshold.`,
          affectedAssets: [],
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "macro-inflation-high",
    name: "Elevated Inflation",
    category: "macro",
    evaluate: () => {
      const inf = getMacroValue("Inflation Rate");
      if (inf !== undefined && inf > 0.02)
        return {
          id: "macro-inflation-high",
          ruleName: "Elevated Inflation",
          category: "macro",
          severity: "warning",
          message: `Inflation at ${(inf * 100).toFixed(1)}% — above 2% target, eroding real returns.`,
          affectedAssets: [],
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "macro-rates-high",
    name: "Interest Rate Spike",
    category: "macro",
    evaluate: () => {
      const rate = getMacroValue("Interest Rate");
      if (rate !== undefined && rate > 0.05)
        return {
          id: "macro-rates-high",
          ruleName: "Interest Rate Spike",
          category: "macro",
          severity: "critical",
          message: `Interest rate at ${(rate * 100).toFixed(1)}% — exceeds 5%, tightening financial conditions.`,
          affectedAssets: [],
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "macro-gold-high",
    name: "Gold Above $2,000",
    category: "macro",
    evaluate: () => {
      const gold = getMacroValue("Gold (per oz)");
      if (gold !== undefined && gold > 2000)
        return {
          id: "macro-gold-high",
          ruleName: "Gold Above $2,000",
          category: "macro",
          severity: "warning",
          message: `Gold at $${gold.toLocaleString()}/oz — safe-haven demand signals risk-off environment.`,
          affectedAssets: [],
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "macro-oil-high",
    name: "Oil Above $100",
    category: "macro",
    evaluate: () => {
      const oil = getMacroValue("Crude Oil (WTI)");
      if (oil !== undefined && oil > 100)
        return {
          id: "macro-oil-high",
          ruleName: "Oil Above $100",
          category: "macro",
          severity: "warning",
          message: `Crude oil at $${oil}/bbl — elevated energy costs impact margins across sectors.`,
          affectedAssets: ["XOM"],
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
];

// ─── Micro Rules ─────────────────────────────────────────────────────────────

const microRules: AlertRule[] = [
  {
    id: "micro-sector-concentration",
    name: "Sector Concentration > 30%",
    category: "micro",
    evaluate: () => {
      const sectorMap: Record<string, number> = {};
      const total = holdingsData.reduce((a, h) => a + h.positionSize, 0);
      holdingsData.forEach((h) => {
        sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.positionSize;
      });
      const overConcentrated = Object.entries(sectorMap).filter(([, val]) => val / total > 0.3);
      if (overConcentrated.length > 0)
        return {
          id: "micro-sector-concentration",
          ruleName: "Sector Concentration > 30%",
          category: "micro",
          severity: "critical",
          message: `${overConcentrated.map(([s, v]) => `${s}: ${((v / total) * 100).toFixed(1)}%`).join(", ")} — exceeds 30% concentration limit.`,
          affectedAssets: holdingsData
            .filter((h) => overConcentrated.some(([s]) => h.sector === s))
            .map((h) => h.symbol),
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "micro-beta-exposure",
    name: "Sector Beta Exposure > 30%",
    category: "micro",
    evaluate: () => {
      const flags = redFlags.filter((f) => f.id === "rf11" && f.status === "fail");
      if (flags.length > 0)
        return {
          id: "micro-beta-exposure",
          ruleName: "Sector Beta Exposure > 30%",
          category: "micro",
          severity: "critical",
          message: flags[0]!.answer,
          affectedAssets: [],
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "micro-single-stock-overweight",
    name: "Single Stock > 15% AUM",
    category: "micro",
    evaluate: () => {
      const overweight = holdingsData.filter((h) => h.exposurePct > 0.15);
      if (overweight.length > 0)
        return {
          id: "micro-single-stock-overweight",
          ruleName: "Single Stock > 15% AUM",
          category: "micro",
          severity: "warning",
          message: `${overweight.map((h) => `${h.symbol} (${(h.exposurePct * 100).toFixed(1)}%)`).join(", ")} exceed 15% single-stock limit.`,
          affectedAssets: overweight.map((h) => h.symbol),
          targetTab: "basic",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "micro-negative-crosses",
    name: "Multiple Negative Golden Crosses",
    category: "micro",
    evaluate: () => {
      const crosses = holdingsData.filter((h) => h.potNegativeCross);
      if (crosses.length >= 3)
        return {
          id: "micro-negative-crosses",
          ruleName: "Multiple Negative Golden Crosses",
          category: "micro",
          severity: "warning",
          message: `${crosses.length} holdings showing potential negative golden cross: ${crosses.map((h) => h.symbol).join(", ")}`,
          affectedAssets: crosses.map((h) => h.symbol),
          targetTab: "technical",
          timestamp: Date.now(),
        };
      return null;
    },
  },
];

// ─── Nano Rules ──────────────────────────────────────────────────────────────

const nanoRules: AlertRule[] = [
  {
    id: "nano-rsi-overbought",
    name: "RSI Overbought (>70)",
    category: "nano",
    evaluate: (enriched) => {
      const overbought = enriched.filter((e) => e.technical.rsi14 > 70);
      if (overbought.length > 0)
        return {
          id: "nano-rsi-overbought",
          ruleName: "RSI Overbought (>70)",
          category: "nano",
          severity: "warning",
          message: `${overbought.map((e) => `${e.holding.symbol} (RSI: ${e.technical.rsi14.toFixed(1)})`).join(", ")} in overbought territory.`,
          affectedAssets: overbought.map((e) => e.holding.symbol),
          targetTab: "technical",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "nano-stop-loss-close",
    name: "Near Stop Loss (<5%)",
    category: "nano",
    evaluate: () => {
      const near = holdingsData.filter((h) => h.pctFromStopLoss >= 0 && h.pctFromStopLoss < 0.05);
      if (near.length > 0)
        return {
          id: "nano-stop-loss-close",
          ruleName: "Near Stop Loss (<5%)",
          category: "nano",
          severity: "critical",
          message: `${near.map((h) => `${h.symbol} (${(h.pctFromStopLoss * 100).toFixed(1)}% from stop)`).join(", ")} approaching stop loss.`,
          affectedAssets: near.map((h) => h.symbol),
          targetTab: "risk",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "nano-deep-drawdown",
    name: "Stock Down >20% Since Purchase",
    category: "nano",
    evaluate: () => {
      const deep = holdingsData.filter(
        (h) => h.profitSinceInception / (h.purchasePrice * h.shares) < -0.2,
      );
      if (deep.length > 0)
        return {
          id: "nano-deep-drawdown",
          ruleName: "Stock Down >20% Since Purchase",
          category: "nano",
          severity: "critical",
          message: `${deep.map((h) => `${h.symbol} (${((h.profitSinceInception / (h.purchasePrice * h.shares)) * 100).toFixed(1)}%)`).join(", ")} down more than 20% since inception.`,
          affectedAssets: deep.map((h) => h.symbol),
          targetTab: "priceVolume",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "nano-volume-anomaly",
    name: "Volume Anomaly (3x Average)",
    category: "nano",
    evaluate: (enriched) => {
      const anomalies = enriched.filter((e) => e.volume.volumeRatio > 3);
      if (anomalies.length > 0)
        return {
          id: "nano-volume-anomaly",
          ruleName: "Volume Anomaly (3x Average)",
          category: "nano",
          severity: "warning",
          message: `${anomalies.map((e) => `${e.holding.symbol} (${e.volume.volumeRatio.toFixed(1)}x avg)`).join(", ")} trading at abnormal volume.`,
          affectedAssets: anomalies.map((e) => e.holding.symbol),
          targetTab: "priceVolume",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "nano-pe-extreme",
    name: "P/E Ratio > 50",
    category: "nano",
    evaluate: (enriched) => {
      const extreme = enriched.filter((e) => e.valuation.peRatio > 50);
      if (extreme.length > 0)
        return {
          id: "nano-pe-extreme",
          ruleName: "P/E Ratio > 50",
          category: "nano",
          severity: "info",
          message: `${extreme.map((e) => `${e.holding.symbol} (P/E: ${e.valuation.peRatio.toFixed(1)})`).join(", ")} have elevated P/E ratios.`,
          affectedAssets: extreme.map((e) => e.holding.symbol),
          targetTab: "valuation",
          timestamp: Date.now(),
        };
      return null;
    },
  },
];

// ─── Sentiment Rules ─────────────────────────────────────────────────────────

const sentimentRules: AlertRule[] = [
  {
    id: "sentiment-analyst-downgrade",
    name: "Analyst Majority Sell",
    category: "sentiment",
    evaluate: (enriched) => {
      const bearish = enriched.filter(
        (e) => e.sentiment.analystSell > e.sentiment.analystBuy + e.sentiment.analystHold,
      );
      if (bearish.length > 0)
        return {
          id: "sentiment-analyst-downgrade",
          ruleName: "Analyst Majority Sell",
          category: "sentiment",
          severity: "warning",
          message: `${bearish.map((e) => e.holding.symbol).join(", ")} have majority sell ratings from analysts.`,
          affectedAssets: bearish.map((e) => e.holding.symbol),
          targetTab: "sentiment",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "sentiment-social-negative",
    name: "Negative Social Sentiment",
    category: "sentiment",
    evaluate: (enriched) => {
      const negative = enriched.filter((e) => e.sentiment.socialSentiment < -0.5);
      if (negative.length > 0)
        return {
          id: "sentiment-social-negative",
          ruleName: "Negative Social Sentiment",
          category: "sentiment",
          severity: "info",
          message: `${negative.map((e) => `${e.holding.symbol} (${e.sentiment.socialSentiment.toFixed(2)})`).join(", ")} have strongly negative social sentiment.`,
          affectedAssets: negative.map((e) => e.holding.symbol),
          targetTab: "sentiment",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "sentiment-insider-selling",
    name: "Insider Selling Activity",
    category: "sentiment",
    evaluate: (enriched) => {
      const selling = enriched.filter((e) => e.sentiment.insiderSignal === "selling");
      if (selling.length >= 3)
        return {
          id: "sentiment-insider-selling",
          ruleName: "Insider Selling Activity",
          category: "sentiment",
          severity: "warning",
          message: `${selling.length} holdings show insider selling: ${selling.map((e) => e.holding.symbol).join(", ")}`,
          affectedAssets: selling.map((e) => e.holding.symbol),
          targetTab: "sentiment",
          timestamp: Date.now(),
        };
      return null;
    },
  },
  {
    id: "sentiment-fear-extreme",
    name: "Extreme Fear Index",
    category: "sentiment",
    evaluate: (enriched) => {
      // Use the average fear/greed across holdings
      const avg = enriched.reduce((a, e) => a + e.sentiment.fearGreedScore, 0) / enriched.length;
      if (avg < 25)
        return {
          id: "sentiment-fear-extreme",
          ruleName: "Extreme Fear Index",
          category: "sentiment",
          severity: "warning",
          message: `Market Fear & Greed Index at ${avg.toFixed(0)} — extreme fear territory.`,
          affectedAssets: [],
          targetTab: "sentiment",
          timestamp: Date.now(),
        };
      return null;
    },
  },
];

// ─── Engine ──────────────────────────────────────────────────────────────────

const ALL_RULES: AlertRule[] = [...macroRules, ...microRules, ...nanoRules, ...sentimentRules];

let _alertCache: TriggeredAlert[] | null = null;

export function evaluateAlerts(): TriggeredAlert[] {
  if (_alertCache) return _alertCache;

  const enriched = getEnrichedHoldings();
  const alerts: TriggeredAlert[] = [];

  for (const rule of ALL_RULES) {
    const result = rule.evaluate(enriched);
    if (result) alerts.push(result);
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  _alertCache = alerts;
  return alerts;
}

export function getAlertCounts(): Record<AlertSeverity, number> {
  const alerts = evaluateAlerts();
  return {
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };
}

export function getAlertsByCategory(category: AlertCategory): TriggeredAlert[] {
  return evaluateAlerts().filter((a) => a.category === category);
}
