/**
 * Rail + FocusCard — horizontal carousel with console-style focus: arrow keys
 * move focus (roving tabindex), the focused card scales up, glows in the
 * ambient colour and reveals its detail line. Enter activates.
 */
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RailItem {
  id: string;
  title: string;
  eyebrow?: ReactNode;
  detail?: string;
  meta?: string;
  art?: ReactNode;
  tone?: "bad" | "warn" | "good";
}

export function Rail({
  label,
  items,
  onOpen,
  width = 236,
}: {
  label: string;
  items: RailItem[];
  onOpen?: (id: string) => void;
  width?: number;
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number) => {
    const n = (i + items.length) % items.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-5 flex items-end gap-4 overflow-x-auto px-7 pb-6 pt-8 [mask-image:linear-gradient(90deg,#000_88%,transparent)] [scrollbar-width:none]"
    >
      {items.map((it, i) => {
        const on = i === active;
        return (
          <button
            key={it.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={on ? 0 : -1}
            data-focused={on}
            onFocus={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            onClick={() => onOpen?.(it.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                move(i + 1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                move(i - 1);
              }
            }}
            className="cx-focusable relative flex shrink-0 origin-bottom flex-col justify-end overflow-hidden rounded-[var(--cx-r3)] border border-[var(--cx-hair)] p-4 text-left"
            style={{
              width: on ? width * 1.3 : width,
              height: on ? 250 : 210,
              background: "var(--cx-glass-regular)",
              transition:
                "width var(--cx-t-view) var(--cx-ease), height var(--cx-t-view) var(--cx-ease), transform var(--cx-t-comp) var(--cx-ease), box-shadow var(--cx-t-comp) var(--cx-ease)",
            }}
          >
            {it.art ? (
              <div aria-hidden className="absolute inset-0">
                {it.art}
              </div>
            ) : null}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(0deg, rgba(5,7,12,.96) 0%, rgba(5,7,12,.35) 60%, rgba(5,7,12,.1) 100%)",
              }}
            />
            <div className="relative">
              {it.eyebrow}
              <p
                className={cn(
                  "mt-2 font-bold leading-snug text-[var(--cx-ink-1)]",
                  on ? "text-[17px]" : "text-[14px]",
                )}
              >
                {it.title}
              </p>
              {on && it.detail ? (
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--cx-ink-2)]">
                  {it.detail}
                </p>
              ) : null}
              {it.meta ? (
                <p className="mt-2 text-[11px] text-[var(--cx-ink-3)]">{it.meta}</p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ tone, children }: { tone?: "bad" | "warn" | "good"; children: ReactNode }) {
  const c =
    tone === "bad"
      ? "255,93,108"
      : tone === "warn"
        ? "255,181,71"
        : tone === "good"
          ? "62,224,143"
          : null;
  return (
    <span
      className="inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] backdrop-blur-md"
      style={{
        color: c ? `rgb(${c})` : "var(--cx-ink-2)",
        borderColor: c ? `rgba(${c},.45)` : "var(--cx-hair-2)",
        background: c ? `rgba(${c},.14)` : "rgba(0,0,0,.35)",
      }}
    >
      {c ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: `rgb(${c})`, boxShadow: `0 0 8px rgb(${c})` }}
        />
      ) : null}
      {children}
    </span>
  );
}
