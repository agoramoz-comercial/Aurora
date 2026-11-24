/**
 * Gauge — instrument dial (270° sweep) with ticks, limit zones, an optional
 * reference marker and a rim needle that sweeps to the value once. Exposed to
 * assistive tech as role="meter" with a text value.
 */
import { useEffect, useId, useState } from "react";

export interface GaugeZone {
  from: number;
  to: number;
  tone: "bad" | "warn" | "good";
}

const TONE = { bad: "var(--cx-bad)", warn: "var(--cx-warn)", good: "var(--cx-good)" };
const A0 = 135;
const SWEEP = 270;

export function Gauge({
  value,
  min = 0,
  max = 100,
  size = 240,
  label,
  valueText,
  sub,
  zones = [],
  marker,
  markerLabel,
  tone,
}: {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  label: string;
  valueText: string;
  sub?: string;
  zones?: GaugeZone[];
  marker?: number;
  markerLabel?: string;
  /** Needle/arc colour; defaults to the ambient light. */
  tone?: "bad" | "warn" | "good";
}) {
  const id = useId().replace(/:/g, "");
  const [shown, setShown] = useState(min);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(t);
  }, [value]);
  const c = size / 2;
  const r = size / 2 - 18;
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const ang = (v: number) => A0 + ((clamp(v) - min) / (max - min)) * SWEEP;
  const pt = (deg: number, rad: number) =>
    [c + rad * Math.cos((deg * Math.PI) / 180), c + rad * Math.sin((deg * Math.PI) / 180)] as const;
  const arc = (d0: number, d1: number, rad: number) => {
    const [x0, y0] = pt(d0, rad);
    const [x1, y1] = pt(d1, rad);
    return `M${x0},${y0} A${rad},${rad} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
  };
  const col = tone ? TONE[tone] : "var(--ambient)";
  const big = size >= 300;
  const ticks = Array.from({ length: 31 }, (_, i) => {
    const d = A0 + (SWEEP * i) / 30;
    const major = i % 5 === 0;
    const [x0, y0] = pt(d, r - 10);
    const [x1, y1] = pt(d, r - (major ? 22 : 16));
    return (
      <line
        key={i}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={`rgba(255,255,255,${major ? 0.55 : 0.22})`}
        strokeWidth={major ? 1.6 : 1}
      />
    );
  });
  const needleDeg = ang(shown);
  const [mx0, my0] = marker != null ? pt(ang(marker), r + 6) : [0, 0];
  const [mx1, my1] = marker != null ? pt(ang(marker), r - 26) : [0, 0];

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${valueText}${sub ? `, ${sub}` : ""}${markerLabel ? `, ${markerLabel}` : ""}`}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <radialGradient id={`${id}-face`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,.07)" />
            <stop offset="70%" stopColor="rgba(255,255,255,.015)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx={c} cy={c} r={r + 10} fill={`url(#${id}-face)`} stroke="rgba(255,255,255,.08)" />
        <path
          d={arc(A0, A0 + SWEEP, r)}
          stroke="rgba(255,255,255,.08)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
        {zones.map((z, i) => (
          <path
            key={i}
            d={arc(ang(z.from), ang(z.to), r)}
            stroke={TONE[z.tone]}
            strokeOpacity={0.45}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        <path
          d={arc(A0, ang(value), r)}
          stroke={col}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          filter={`url(#${id}-glow)`}
          opacity={0.8}
        />
        <path
          d={arc(A0, ang(value), r)}
          stroke={col}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
        {ticks}
        {marker != null ? (
          <line
            x1={mx0}
            y1={my0}
            x2={mx1}
            y2={my1}
            stroke="#fff"
            strokeWidth={2.5}
            strokeDasharray="3 3"
          />
        ) : null}
        <g
          className="cx-needle"
          style={{
            transform: `rotate(${needleDeg}deg)`,
            transformOrigin: `${c}px ${c}px`,
            transition: "transform var(--cx-t-stage) var(--cx-ease)",
          }}
        >
          <line
            x1={c + r - 40}
            y1={c}
            x2={c + r + 4}
            y2={c}
            stroke={col}
            strokeWidth={7}
            strokeLinecap="round"
            filter={`url(#${id}-glow)`}
            opacity={0.7}
          />
          <line
            x1={c + r - 40}
            y1={c}
            x2={c + r + 4}
            y2={c}
            stroke="#fff"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 text-center">
        <span
          className="font-extrabold tabular-nums tracking-[-0.02em] text-[var(--cx-ink-1)]"
          style={{ fontSize: big ? 44 : 30, fontFamily: '"Inter Display", Inter, sans-serif' }}
        >
          {valueText}
        </span>
        <span className="cx-eyebrow mt-1.5">{label}</span>
        {sub ? (
          <span className="mt-1.5 text-[12px] tabular-nums text-[var(--cx-ink-2)]">{sub}</span>
        ) : null}
      </div>
    </div>
  );
}
