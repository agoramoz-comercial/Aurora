/**
 * Spatial components — Aurora implementations of three 21st.dev patterns
 * (re-written for this design system, not copied):
 *  - Number Ticker  · pattern by Daniel Petho (fancycomponents.dev) on 21st.dev
 *  - Spotlight Card · cursor-follow border glow, pattern by Julien Thibeaut (ibelick) on 21st.dev
 *  - Bento Grid     · asymmetric tile layout, common 21st.dev pattern
 * All respect prefers-reduced-motion and the Aurora type scale.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Tweens from the previous value to `value`; renders the final text for screen readers. */
export function NumberTicker({
  value,
  format,
  className,
  duration = 0.6,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const prev = useRef(reduce ? value : value * 0.92);
  const [shown, setShown] = useState(prev.current);
  const started = useRef(false);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      prev.current = value;
      return;
    }
    // First reveal tweens (rare, once); later updates are quick so values never feel laggy.
    const first = !started.current;
    started.current = true;
    const controls = animate(prev.current, value, {
      duration: first ? duration : 0.25,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, inView, reduce, duration]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/** Glass card whose border lights up under the pointer (spatial "spotlight"). */
export function SpotlightCard({
  children,
  className,
  glow = "rgba(74,158,255,0.55)",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
  as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const reduce = useReducedMotion();
  // Decorative pointer tracking only for fine pointers (no false hovers on touch).
  const fine = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(hover: hover) and (pointer: fine)").matches,
    [],
  );
  return (
    <Tag
      ref={ref as never}
      {...rest}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        if (reduce || !fine) return;
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onPointerLeave={() => setPos(null)}
      className={cn("glass relative isolate overflow-hidden", className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: pos ? 1 : 0,
          background: pos
            ? `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, ${glow.replace(/[\d.]+\)$/, "0.14)")}, transparent 60%)`
            : undefined,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: pos ? 1 : 0,
          padding: 1,
          background: pos
            ? `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, ${glow}, transparent 70%)`
            : undefined,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {children}
    </Tag>
  );
}

/** Asymmetric bento layout: 4 columns on xl, 2 on md, 1 on phones. */
export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
export function BentoTile({
  children,
  span = 1,
  rows = 1,
  className,
  label,
}: {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
  rows?: 1 | 2;
  className?: string;
  label?: string;
}) {
  return (
    <SpotlightCard
      as="section"
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-col p-4",
        span === 2 && "md:col-span-2",
        span === 3 && "md:col-span-2 xl:col-span-3",
        span === 4 && "md:col-span-2 xl:col-span-4",
        rows === 2 && "xl:row-span-2",
        className,
      )}
    >
      {children}
    </SpotlightCard>
  );
}
