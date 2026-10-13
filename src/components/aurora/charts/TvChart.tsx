import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type SeriesType,
  type Time,
} from "lightweight-charts";
import { CHART } from "../chartTheme";
import { cn } from "@/lib/utils";

/**
 * TradingView Lightweight Charts, dressed in the Ollympius vocabulary.
 *
 * One wrapper for every price-grade surface in the app (candles, equity
 * curves, volume). The chart instance is created once per mount; data changes
 * only rebuild the series, so pan/zoom state survives re-renders that do not
 * change the dataset identity.
 */

export type TvBar = { time: string; open: number; high: number; low: number; close: number };
export type TvPoint = { time: string; value: number };
export type TvVolume = { time: string; value: number; up: boolean };
export type TvLine = { id: string; label: string; color: string; data: TvPoint[] };
/** Oscillator drawn in its own synced pane under the price pane (e.g. RSI). */
export type TvOscillator = {
  label: string;
  color: string;
  data: TvPoint[];
  bands?: number[];
  range?: [number, number];
};

type Hover = {
  time?: string;
  bar?: TvBar;
  area?: number;
  osc?: number;
  lines: Record<string, number>;
};

const toTime = (t: string) => t as Time;
// Stable defaults: the series effect keys on these, so fresh literals per
// render would rebuild every series (and reset zoom) on each parent render.
const NO_LINES: TvLine[] = [];
const fmt2 = (n: number) => n.toFixed(2);
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export function TvChart({
  candles,
  area,
  areaColor = CHART.accent,
  lines = NO_LINES,
  volume,
  oscillator,
  format = fmt2,
  label,
  className,
  legend = true,
}: {
  candles?: TvBar[];
  area?: TvPoint[];
  areaColor?: string;
  lines?: TvLine[];
  volume?: TvVolume[];
  oscillator?: TvOscillator;
  format?: (n: number) => string;
  /** Leading legend text, e.g. the instrument symbol. */
  label?: ReactNode;
  className?: string;
  legend?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  // Create once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = createChart(host, {
      autoSize: true,
      // Pin the locale: the library defaults to navigator.language, and some
      // environments report tags Intl rejects (e.g. "en-US@posix"), which
      // throws inside tick formatting and takes the whole workspace down.
      localization: { locale: "pt-PT" },
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: CHART.axis,
        fontSize: 10,
        fontFamily: "Inter, system-ui, sans-serif",
        // Attribution is rendered as a text link below (license NOTICE), which
        // sits in the axis corner instead of over the plot.
        attributionLogo: false,
        panes: { separatorColor: CHART.grid, separatorHoverColor: "rgba(74,158,255,0.25)" },
      },
      grid: {
        vertLines: { color: CHART.grid },
        horzLines: { color: CHART.grid },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, rightOffset: 3, fixLeftEdge: true },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(74,158,255,0.5)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1b2a44",
        },
        horzLine: {
          color: "rgba(74,158,255,0.5)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1b2a44",
        },
      },
    });
    chartRef.current = chart;
    return () => {
      chartRef.current = null;
      chart.remove();
    };
  }, []);

  // (Re)build series whenever the datasets change.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const created: ISeriesApi<SeriesType>[] = [];
    let main: ISeriesApi<SeriesType> | null = null;
    const lineSeries = new Map<string, ISeriesApi<SeriesType>>();

    if (candles?.length) {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: CHART.positive,
        downColor: CHART.negative,
        borderVisible: false,
        wickUpColor: alpha(CHART.positive, 0.75),
        wickDownColor: alpha(CHART.negative, 0.75),
        priceFormat: { type: "custom", formatter: format, minMove: 0.01 },
      });
      s.setData(candles.map((b) => ({ ...b, time: toTime(b.time) })));
      main = s;
      created.push(s);
    } else if (area?.length) {
      const s = chart.addSeries(AreaSeries, {
        lineColor: areaColor,
        lineWidth: 2,
        topColor: alpha(areaColor, 0.38),
        bottomColor: alpha(areaColor, 0),
        crosshairMarkerBackgroundColor: areaColor,
        crosshairMarkerBorderColor: "#ffffff",
        crosshairMarkerRadius: 4,
        priceFormat: { type: "custom", formatter: format, minMove: 0.01 },
      });
      s.setData(area.map((p) => ({ time: toTime(p.time), value: p.value })));
      main = s;
      created.push(s);
    }

    for (const l of lines) {
      const s = chart.addSeries(LineSeries, {
        color: l.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: "custom", formatter: format, minMove: 0.01 },
      });
      s.setData(l.data.map((p) => ({ time: toTime(p.time), value: p.value })));
      lineSeries.set(l.id, s);
      created.push(s);
    }

    if (volume?.length) {
      const s = chart.addSeries(HistogramSeries, {
        priceScaleId: "vol",
        priceFormat: { type: "volume" },
        lastValueVisible: false,
        priceLineVisible: false,
      });
      s.setData(
        volume.map((v) => ({
          time: toTime(v.time),
          value: v.value,
          color: alpha(v.up ? CHART.positive : CHART.negative, 0.32),
        })),
      );
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      created.push(s);
    }

    let oscSeries: ISeriesApi<SeriesType> | null = null;
    if (oscillator?.data.length) {
      const [lo, hi] = oscillator.range ?? [0, 100];
      const s = chart.addSeries(
        LineSeries,
        {
          color: oscillator.color,
          lineWidth: 1,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          priceFormat: { type: "custom", formatter: (n: number) => n.toFixed(0), minMove: 1 },
          autoscaleInfoProvider: () => ({ priceRange: { minValue: lo, maxValue: hi } }),
        },
        1,
      );
      s.setData(oscillator.data.map((p) => ({ time: toTime(p.time), value: p.value })));
      for (const b of oscillator.bands ?? []) {
        s.createPriceLine({
          price: b,
          color: "rgba(255,255,255,0.22)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
      }
      const panes = chart.panes();
      panes[0]?.setStretchFactor(3);
      panes[1]?.setStretchFactor(1);
      oscSeries = s;
      created.push(s);
    }

    chart
      .priceScale("right")
      .applyOptions({ scaleMargins: { top: 0.1, bottom: volume?.length ? 0.22 : 0.06 } });
    chart.timeScale().fitContent();

    const onMove = (param: MouseEventParams) => {
      if (!param.time || !main) {
        setHover(null);
        return;
      }
      const d = param.seriesData.get(main) as
        | { open?: number; high?: number; low?: number; close?: number; value?: number }
        | undefined;
      const lineVals: Record<string, number> = {};
      lineSeries.forEach((s, id) => {
        const v = param.seriesData.get(s) as { value?: number } | undefined;
        if (v?.value !== undefined) lineVals[id] = v.value;
      });
      const o = oscSeries
        ? (param.seriesData.get(oscSeries) as { value?: number } | undefined)
        : undefined;
      setHover({
        osc: o?.value,
        time: String(param.time),
        bar:
          d && d.open !== undefined
            ? {
                time: String(param.time),
                open: d.open,
                high: d.high!,
                low: d.low!,
                close: d.close!,
              }
            : undefined,
        area: d?.value,
        lines: lineVals,
      });
    };
    chart.subscribeCrosshairMove(onMove);

    return () => {
      // On unmount the create-once effect above cleans up first and has
      // already disposed the chart; touching it again throws.
      if (chartRef.current !== chart) return;
      chart.unsubscribeCrosshairMove(onMove);
      for (const s of created) chart.removeSeries(s);
    };
  }, [candles, area, areaColor, lines, volume, oscillator, format]);

  // Legend falls back to the latest bar when the pointer is outside the plot.
  const shown = useMemo<Hover | null>(() => {
    if (hover) return hover;
    const lastLines: Record<string, number> = {};
    for (const l of lines) {
      const v = l.data.at(-1)?.value;
      if (v !== undefined) lastLines[l.id] = v;
    }
    const osc = oscillator?.data.at(-1)?.value;
    if (candles?.length) {
      const b = candles.at(-1)!;
      return { time: b.time, bar: b, osc, lines: lastLines };
    }
    if (area?.length) {
      const p = area.at(-1)!;
      return { time: p.time, area: p.value, osc, lines: lastLines };
    }
    return null;
  }, [hover, candles, area, lines, oscillator]);

  return (
    <div className={cn("relative h-full min-h-[160px] w-full", className)}>
      <div ref={hostRef} className="absolute inset-0" />
      {legend && shown ? (
        <div className="pointer-events-none absolute left-2 top-1.5 z-10 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] tabular-nums">
          {label ? <span className="font-semibold text-white/85">{label}</span> : null}
          {shown.bar ? (
            <>
              {(["open", "high", "low", "close"] as const).map((k) => (
                <span key={k} className="text-white/45">
                  {k[0]!.toUpperCase()}{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color: shown.bar!.close >= shown.bar!.open ? CHART.positive : CHART.negative,
                    }}
                  >
                    {format(shown.bar![k])}
                  </span>
                </span>
              ))}
            </>
          ) : shown.area !== undefined ? (
            <span className="font-semibold text-white">{format(shown.area)}</span>
          ) : null}
          {lines.map((l) =>
            shown.lines[l.id] !== undefined ? (
              <span key={l.id} className="flex items-center gap-1 text-white/45">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
                {l.label} <span style={{ color: l.color }}>{format(shown.lines[l.id]!)}</span>
              </span>
            ) : null,
          )}
          {oscillator && shown.osc !== undefined ? (
            <span className="flex items-center gap-1 text-white/45">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: oscillator.color }} />
              {oscillator.label}{" "}
              <span style={{ color: oscillator.color }}>{shown.osc.toFixed(1)}</span>
            </span>
          ) : null}
          {shown.time ? <span className="text-white/35">{shown.time}</span> : null}
        </div>
      ) : null}
      <a
        href="https://www.tradingview.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-1 right-1 z-10 text-[8px] font-medium tracking-wide text-white/25 transition-colors hover:text-white/60"
      >
        TradingView
      </a>
    </div>
  );
}
