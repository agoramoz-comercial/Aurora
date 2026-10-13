import { useMemo } from "react";
import type { SeriesPoint } from "@/lib/alphaVantage.types";
import { CHART } from "../chartTheme";
import {
  TvChart,
  type TvBar,
  type TvLine,
  type TvOscillator,
  type TvPoint,
  type TvVolume,
} from "../charts/TvChart";

export type PriceMode = "candles" | "area";

/** Rolling simple moving average over the full history, emitted only from `from` onwards. */
function rollingSma(full: SeriesPoint[], period: number, from: string): TvPoint[] {
  const out: TvPoint[] = [];
  let sum = 0;
  full.forEach((p, i) => {
    sum += p.close;
    if (i >= period) sum -= full[i - period]!.close;
    if (i >= period - 1 && p.date >= from) {
      out.push({ time: p.date, value: Math.round((sum / period) * 100) / 100 });
    }
  });
  return out;
}

/** RSI(period) over the full history (simple average of gains/losses), windowed from `from`. */
function rollingRsi(full: SeriesPoint[], period: number, from: string): TvPoint[] {
  const out: TvPoint[] = [];
  for (let i = period; i < full.length; i++) {
    if (full[i]!.date < from) continue;
    let gain = 0;
    let loss = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = full[j]!.close - full[j - 1]!.close;
      if (diff >= 0) gain += diff;
      else loss -= diff;
    }
    const rsi = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    out.push({ time: full[i]!.date, value: Math.round(rsi * 10) / 10 });
  }
  return out;
}

/**
 * Price panel for the Analytics workspace: candles (or area) with volume,
 * SMA20/SMA50 overlays and an RSI(14) pane sharing the time axis. Indicators
 * are computed on the full history and then windowed, so short timeframes
 * still show valid values from their first bar.
 */
export function MainPriceChart({
  series,
  full,
  up,
  mode,
  symbol,
}: {
  series: SeriesPoint[];
  full: SeriesPoint[];
  up: boolean;
  mode: PriceMode;
  symbol: string;
}) {
  const { candles, area, volume, lines, rsi } = useMemo(() => {
    const from = series[0]?.date ?? "";
    const candles: TvBar[] = series.map((p) => ({
      time: p.date,
      open: p.open ?? p.close,
      high: p.high ?? p.close,
      low: p.low ?? p.close,
      close: p.close,
    }));
    const area: TvPoint[] = series.map((p) => ({ time: p.date, value: p.close }));
    const volume: TvVolume[] = series
      .filter((p) => p.volume !== undefined)
      .map((p) => ({ time: p.date, value: p.volume!, up: p.close >= (p.open ?? p.close) }));
    const lines: TvLine[] = [
      { id: "sma20", label: "SMA20", color: CHART.accent, data: rollingSma(full, 20, from) },
      { id: "sma50", label: "SMA50", color: CHART.warn, data: rollingSma(full, 50, from) },
    ];
    const rsi: TvOscillator = {
      label: "RSI14",
      color: CHART.violet,
      data: rollingRsi(full, 14, from),
      bands: [30, 70],
    };
    return { candles, area, volume, lines, rsi };
  }, [series, full]);

  return (
    <TvChart
      label={symbol}
      candles={mode === "candles" ? candles : undefined}
      area={mode === "area" ? area : undefined}
      areaColor={up ? CHART.positive : CHART.negative}
      lines={lines}
      volume={volume}
      oscillator={rsi}
    />
  );
}
