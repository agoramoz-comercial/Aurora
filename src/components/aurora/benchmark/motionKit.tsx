/**
 * motionKit — motion layer of the IIPA workspace (ECC motion-foundations).
 *
 * One token set, one reduced-motion gate, and the animated chart atoms used by
 * every section. Only transform / opacity / pathLength are animated; widths
 * and heights never are. With reduced motion everything settles instantly.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useSpring, useTransform, type Variants } from "framer-motion";
import { CHART } from "../chartTheme";

/* ── Tokens ────────────────────────────────────────────────────────────── */

export const motionTokens = {
  duration: { instant: 0.08, fast: 0.18, normal: 0.35, slow: 0.6, crawl: 1.0, story: 1.4 },
  easing: {
    smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
    sharp: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  stagger: 0.07,
  distance: { sm: 8, md: 16 },
} as const;

export const springs = {
  snappy: { type: "spring", stiffness: 420, damping: 32 },
  gentle: { type: "spring", stiffness: 140, damping: 22, mass: 0.9 },
  counter: { stiffness: 90, damping: 22, mass: 0.8 },
} as const;

/** Stagger container + item for cards and tiles. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: motionTokens.stagger, delayChildren: 0.04 } },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.sm },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth },
  },
};

/** Recharts animation props, disabled under reduced motion. */
export function useChartMotion() {
  const reduced = useReducedMotion();
  return (order = 0) => ({
    isAnimationActive: !reduced,
    animationDuration: Math.round(motionTokens.duration.crawl * 1000),
    animationBegin: Math.round(order * motionTokens.stagger * 1000 * 1.5),
    animationEasing: "ease-out" as const,
  });
}

/* ── Animated number ───────────────────────────────────────────────────── */

export function AnimatedNumber({
  value,
  format,
  className,
  style,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const spring = useSpring(reduced ? value : 0, springs.counter);
  const text = useTransform(spring, (n) => format(n));
  useEffect(() => {
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [value, reduced, spring]);
  return (
    <motion.span className={`tabular-nums ${className ?? ""}`} style={style}>
      {text}
    </motion.span>
  );
}

/* ── Probability ring ──────────────────────────────────────────────────── */

export function ProbabilityRing({
  value,
  size = 72,
  stroke = 6,
  color,
  label,
  delay = 0,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const tone =
    color ?? (value >= 0.6 ? CHART.positive : value >= 0.35 ? CHART.warn : CHART.negative);
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? v : 0 }}
          animate={{ pathLength: v }}
          transition={{
            duration: reduced ? 0 : motionTokens.duration.crawl,
            delay,
            ease: motionTokens.easing.smooth,
          }}
          style={{ filter: `drop-shadow(0 0 6px ${tone}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <AnimatedNumber
          value={v * 100}
          format={(n) => `${Math.round(n)}%`}
          className="font-bold text-white"
          style={{ fontSize: size * 0.22 }}
        />
        {label ? (
          <span className="mt-1 text-[8px] uppercase tracking-[0.12em] text-white/45">{label}</span>
        ) : null}
      </div>
    </div>
  );
}

/* ── Reveal bar (scaleX only) ──────────────────────────────────────────── */

export function RevealBar({
  value,
  color = CHART.accent,
  delay = 0,
  height = 6,
  marker,
  track = true,
}: {
  /** 0–1 share of the track. */
  value: number;
  color?: string;
  delay?: number;
  height?: number;
  /** Optional limit marker, 0–1 along the track. */
  marker?: number;
  track?: boolean;
}) {
  const reduced = useReducedMotion();
  const v = Math.max(0, Math.min(1, value));
  /* Hex colours get a soft gradient + glow; rgba() colours are used as-is. */
  const isHex = /^#[0-9a-f]{6}$/i.test(color);
  return (
    <div
      className="relative w-full overflow-hidden rounded-full"
      style={{ height, background: track ? "rgba(255,255,255,0.08)" : "transparent" }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 w-full origin-left rounded-full"
        style={{
          background: isHex ? `linear-gradient(90deg, ${color}aa, ${color})` : color,
          boxShadow: isHex ? `0 0 10px ${color}55` : undefined,
        }}
        initial={{ scaleX: reduced ? v : 0 }}
        animate={{ scaleX: v }}
        transition={{
          duration: reduced ? 0 : motionTokens.duration.slow * 1.4,
          delay,
          ease: motionTokens.easing.smooth,
        }}
      />
      {marker !== undefined ? (
        <span
          className="absolute inset-y-[-2px] w-[2px] rounded-full bg-white/80"
          style={{ left: `calc(${Math.min(1, Math.max(0, marker)) * 100}% - 1px)` }}
        />
      ) : null}
    </div>
  );
}

/* ── Container width hook ──────────────────────────────────────────────── */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/* ── Fan chart (probability cone) ──────────────────────────────────────── */

export interface FanDatum {
  t: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  target: number;
}

export function FanChart({
  data,
  baseline,
  height = 260,
  format,
  timeLabel,
  accent = CHART.accent,
  footer,
}: {
  data: FanDatum[];
  baseline: number;
  height?: number;
  format: (n: number) => string;
  timeLabel: (t: number) => string;
  accent?: string;
  footer?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 58, r: 20, t: 16, b: 26 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;

  const geo = useMemo(() => {
    if (!data.length || w <= 0) return null;
    const tMax = data[data.length - 1]!.t || 1;
    const lo = Math.min(baseline, ...data.map((d) => d.p5)) * 0.94;
    const hi = Math.max(...data.map((d) => Math.max(d.p95, d.target))) * 1.03;
    const x = (t: number) => pad.l + (t / tMax) * w;
    const y = (v: number) => pad.t + h - ((v - lo) / (hi - lo)) * h;
    const line = (k: keyof FanDatum) =>
      data.map((d, i) => `${i ? "L" : "M"}${x(d.t)},${y(d[k])}`).join("");
    const band = (a: keyof FanDatum, b: keyof FanDatum) =>
      `${data.map((d, i) => `${i ? "L" : "M"}${x(d.t)},${y(d[b])}`).join("")}${[...data]
        .reverse()
        .map((d) => `L${x(d.t)},${y(d[a])}`)
        .join("")}Z`;
    const ticks = Array.from({ length: 4 }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / 4);
    const xTicks = data.filter(
      (_, i) => data.length <= 13 || i % Math.ceil(data.length / 11) === 0,
    );
    return { x, y, line, band, ticks, xTicks, tMax };
  }, [data, baseline, w, h, pad.l, pad.t]);

  const last = data[data.length - 1];
  const hv = hover !== null ? data[hover] : null;
  const uid = useMemo(() => Math.random().toString(36).slice(2), []);

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {geo && width > 0 ? (
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            const px = e.clientX - box.left - pad.l;
            const t = Math.max(0, Math.min(1, px / w)) * geo.tMax;
            let best = 0;
            data.forEach((d, i) => {
              if (Math.abs(d.t - t) < Math.abs(data[best]!.t - t)) best = i;
            });
            setHover(best);
          }}
        >
          <defs>
            <clipPath id={`reveal-${uid}`}>
              <motion.rect
                x={pad.l}
                y={0}
                width={w + 2}
                height={height}
                initial={{ scaleX: reduced ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: reduced ? 0 : motionTokens.duration.story,
                  ease: motionTokens.easing.smooth,
                }}
                style={{ originX: 0 }}
              />
            </clipPath>
            <linearGradient id={`outer-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.2} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.06} />
            </linearGradient>
          </defs>

          {geo.ticks.map((v) => (
            <g key={v}>
              <line
                x1={pad.l}
                x2={pad.l + w}
                y1={geo.y(v)}
                y2={geo.y(v)}
                stroke={CHART.grid}
                strokeDasharray="3 4"
              />
              <text x={pad.l - 8} y={geo.y(v) + 3} textAnchor="end" fontSize={10} fill={CHART.axis}>
                {format(v)}
              </text>
            </g>
          ))}
          {geo.xTicks.map((d) => (
            <text
              key={d.t}
              x={geo.x(d.t)}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              fill={CHART.axis}
            >
              {timeLabel(d.t)}
            </text>
          ))}

          {/* capital invested */}
          <line
            x1={pad.l}
            x2={pad.l + w}
            y1={geo.y(baseline)}
            y2={geo.y(baseline)}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={1}
          />

          <g clipPath={`url(#reveal-${uid})`}>
            <path d={geo.band("p5", "p95")} fill={`url(#outer-${uid})`} />
            <path d={geo.band("p25", "p75")} fill={accent} fillOpacity={0.24} />
          </g>

          {/* target path */}
          <motion.path
            d={geo.line("target")}
            fill="none"
            stroke={CHART.warn}
            strokeWidth={1.6}
            strokeDasharray="5 5"
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduced ? 0 : 0.6, duration: motionTokens.duration.normal }}
          />

          {/* median path */}
          <motion.path
            d={geo.line("p50")}
            fill="none"
            stroke="#fff"
            strokeWidth={2.4}
            strokeLinecap="round"
            initial={{ pathLength: reduced ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: reduced ? 0 : motionTokens.duration.story,
              ease: motionTokens.easing.smooth,
            }}
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
          />

          {last ? (
            <motion.g
              initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: reduced ? 0 : motionTokens.duration.story * 0.9,
                ...springs.snappy,
              }}
            >
              <circle
                cx={geo.x(last.t)}
                cy={geo.y(last.p50)}
                r={9}
                fill={accent}
                fillOpacity={0.25}
              />
              <circle cx={geo.x(last.t)} cy={geo.y(last.p50)} r={4.5} fill="#fff" />
            </motion.g>
          ) : null}

          {hv ? (
            <g pointerEvents="none">
              <line
                x1={geo.x(hv.t)}
                x2={geo.x(hv.t)}
                y1={pad.t}
                y2={pad.t + h}
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="2 3"
              />
              <circle cx={geo.x(hv.t)} cy={geo.y(hv.p50)} r={4} fill="#fff" />
              <circle cx={geo.x(hv.t)} cy={geo.y(hv.target)} r={3} fill={CHART.warn} />
            </g>
          ) : null}
        </svg>
      ) : null}

      {hv && geo ? (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[170px] rounded-[12px] px-3 py-2 text-[11px]"
          style={{
            left: Math.min(width - 190, Math.max(0, geo.x(hv.t) + 12)),
            background: "linear-gradient(135deg, rgba(16,20,30,0.96), rgba(10,14,22,0.94))",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}
        >
          <p className="mb-1 text-[10px] text-white/50">{timeLabel(hv.t)}</p>
          <p className="flex justify-between gap-3 text-white">
            <span className="text-white/60">Resultado central</span>
            <b className="tabular-nums">{format(hv.p50)}</b>
          </p>
          <p className="flex justify-between gap-3 text-white">
            <span className="text-white/60">Intervalo provável</span>
            <b className="tabular-nums">
              {format(hv.p25)}–{format(hv.p75)}
            </b>
          </p>
          <p className="flex justify-between gap-3" style={{ color: CHART.warn }}>
            <span className="opacity-80">Meta</span>
            <b className="tabular-nums">{format(hv.target)}</b>
          </p>
        </div>
      ) : null}

      {footer}
    </div>
  );
}

/* ── Legend dot ────────────────────────────────────────────────────────── */

export function LegendDot({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-white/55">
      <span
        className="inline-block h-[2px] w-4 rounded-full"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}
