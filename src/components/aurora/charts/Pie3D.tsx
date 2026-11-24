/**
 * Pie3D — a 3D donut drawn in SVG (vector: sharp at 4K and beyond, no WebGL).
 * Tilted ellipse top face, shaded outer/inner walls on the visible half, a
 * specular sheen and a soft floor shadow. The slices are also listed as text
 * (sr-only) so the chart is fully accessible.
 */
import { useId, useState } from "react";

export interface Pie3DDatum {
  name: string;
  value: number;
  color: string;
}

function shade(color: string, f: number) {
  const c = color.trim();
  const hex = /^#?([0-9a-f]{6})$/i.exec(c);
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/i.exec(c);
  let r: number;
  let g: number;
  let b: number;
  let a = 1;
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  } else if (rgb) {
    r = +rgb[1]!;
    g = +rgb[2]!;
    b = +rgb[3]!;
    a = rgb[4] ? +rgb[4] : 1;
  } else return c;
  const k = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgba(${k(r)},${k(g)},${k(b)},${a})`;
}

const TAU = Math.PI * 2;

export function Pie3D({
  data,
  size = 220,
  depth = 0.13,
  tilt = 0.56,
  inner = 0.58,
  label,
  center,
  format = (v: number) => v.toLocaleString("pt-PT"),
}: {
  data: Pie3DDatum[];
  size?: number;
  /** Wall height as a fraction of the radius. */
  depth?: number;
  /** Vertical squash of the top face (1 = flat circle seen from above). */
  tilt?: number;
  /** Hole radius as a fraction of the radius (0 = full pie). */
  inner?: number;
  label: string;
  center?: React.ReactNode;
  format?: (v: number) => string;
}) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  const W = size;
  const R = W * 0.46;
  const ry = R * tilt;
  const r = R * inner;
  const rry = ry * inner;
  const h = R * depth;
  const cx = W / 2;
  const cy = ry + 6;
  const H = cy + ry + h + 14;

  const pt = (a: number, rx: number, ryy: number, dy = 0) =>
    [cx + rx * Math.cos(a), cy + ryy * Math.sin(a) + dy] as const;
  let acc = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const a0 = acc;
    const a1 = acc + (Math.max(0, d.value) / total) * TAU;
    acc = a1;
    return { ...d, i, a0, a1, mid: (a0 + a1) / 2 };
  });

  const arcTop = (a0: number, a1: number) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = pt(a0, R, ry);
    const [x1, y1] = pt(a1, R, ry);
    const [ix1, iy1] = pt(a1, r, rry);
    const [ix0, iy0] = pt(a0, r, rry);
    return inner > 0
      ? `M${x0},${y0} A${R},${ry} 0 ${large} 1 ${x1},${y1} L${ix1},${iy1} A${r},${rry} 0 ${large} 0 ${ix0},${iy0} Z`
      : `M${cx},${cy} L${x0},${y0} A${R},${ry} 0 ${large} 1 ${x1},${y1} Z`;
  };
  // Wall between two angles on an ellipse of radius rx/ryy (only the front half is visible).
  const wall = (a0: number, a1: number, rx: number, ryy: number) => {
    const s = Math.max(a0, 0);
    const e = Math.min(a1, Math.PI);
    if (e <= s) return null;
    const [x0, y0] = pt(s, rx, ryy);
    const [x1, y1] = pt(e, rx, ryy);
    return `M${x0},${y0} A${rx},${ryy} 0 0 1 ${x1},${y1} L${x1},${y1 + h} A${rx},${ryy} 0 0 0 ${x0},${y0 + h} Z`;
  };
  // Angles normalised to [0, 2π) so the front half is 0..π.
  const norm = (a: number) => ((a % TAU) + TAU) % TAU;
  const walls = slices.flatMap((s) => {
    const a0 = norm(s.a0);
    const a1 = a0 + (s.a1 - s.a0);
    const out: { d: string; color: string; i: number; kind: "outer" | "inner" }[] = [];
    // A slice can cross 2π; split it.
    const parts =
      a1 > TAU
        ? [
            [a0, TAU],
            [0, a1 - TAU],
          ]
        : [[a0, a1]];
    for (const [p0, p1] of parts) {
      const o = wall(p0!, p1!, R, ry);
      if (o) out.push({ d: o, color: s.color, i: s.i, kind: "outer" });
    }
    return out;
  });
  // Inner wall: the back half of the hole is what faces the viewer (π..2π).
  const innerWalls =
    inner > 0
      ? slices.flatMap((s) => {
          const a0 = norm(s.a0);
          const a1 = a0 + (s.a1 - s.a0);
          const parts =
            a1 > TAU
              ? [
                  [a0, TAU],
                  [TAU, a1],
                ]
              : [[a0, a1]];
          return parts.flatMap(([p0, p1]) => {
            const st = Math.max(p0!, Math.PI);
            const en = Math.min(p1!, TAU);
            if (en <= st) return [];
            const [x0, y0] = pt(st, r, rry);
            const [x1, y1] = pt(en, r, rry);
            return [
              {
                d: `M${x0},${y0} A${r},${rry} 0 0 1 ${x1},${y1} L${x1},${y1 + h} A${r},${rry} 0 0 0 ${x0},${y0 + h} Z`,
                color: s.color,
                i: s.i,
              },
            ];
          });
        })
      : [];

  return (
    <figure className="relative m-0 w-full" style={{ maxWidth: W }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        aria-hidden
        shapeRendering="geometricPrecision"
      >
        <defs>
          <radialGradient id={`${id}-floor`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.42)" />
            <stop offset="35%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
          </linearGradient>
        </defs>
        <ellipse
          cx={cx}
          cy={cy + h + ry * 0.18}
          rx={R * 1.04}
          ry={ry * 0.9}
          fill={`url(#${id}-floor)`}
        />
        {/* inner wall (back of the hole) first, then outer walls, then the top face */}
        {innerWalls.map((w, k) => (
          <g key={`iw${k}`}>
            <path d={w.d} fill={shade(w.color, 0.42)} />
            <path d={w.d} fill={`url(#${id}-wall)`} opacity={0.6} />
          </g>
        ))}
        {walls.map((w, k) => (
          <g
            key={`ow${k}`}
            style={{
              transform: hover === w.i ? `translateY(-${h * 0.25}px)` : undefined,
              transition: "transform 150ms cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            <path d={w.d} fill={shade(w.color, 0.62)} />
            <path d={w.d} fill={`url(#${id}-wall)`} />
          </g>
        ))}
        {slices.map((s) => (
          <g
            key={s.i}
            onPointerEnter={() => setHover(s.i)}
            onPointerLeave={() => setHover(null)}
            style={{
              transform: hover === s.i ? `translateY(-${h * 0.25}px)` : undefined,
              transition: "transform 150ms cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            <path
              d={arcTop(s.a0, s.a1)}
              fill={s.color}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.6}
            />
            <path d={arcTop(s.a0, s.a1)} fill={`url(#${id}-sheen)`} />
          </g>
        ))}
        {/* rim highlight */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={R}
          ry={ry}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={0.8}
        />
        {inner > 0 ? (
          <ellipse
            cx={cx}
            cy={cy}
            rx={r}
            ry={rry}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={0.6}
          />
        ) : null}
      </svg>
      {center ? (
        <div
          className="pointer-events-none absolute inset-x-0 grid place-items-center text-center"
          style={{ top: `${(cy / H) * 100}%`, transform: "translateY(-50%)" }}
        >
          {center}
        </div>
      ) : null}
      {hover !== null ? (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-white/15 bg-[rgba(12,14,20,0.9)] px-2.5 py-1 text-micro font-bold tabular-nums text-white shadow-lg">
          {slices[hover]!.name} ·{" "}
          {((slices[hover]!.value / total) * 100).toFixed(1).replace(".", ",")}%
        </div>
      ) : null}
      <figcaption className="sr-only">
        {label}:{" "}
        {slices
          .map((s) => `${s.name} ${format(s.value)} (${((s.value / total) * 100).toFixed(1)}%)`)
          .join("; ")}
      </figcaption>
    </figure>
  );
}
