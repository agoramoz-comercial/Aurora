import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pill({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "active" | "mute" | "alert" | "danger" | "success";
}) {
  return (
    <span
      className={cn(
        "glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium leading-none whitespace-nowrap text-white/90 tabular-nums",
        tone === "active" && "bg-white/30 text-white",
        tone === "mute" && "text-white/60",
        (tone === "alert" || tone === "danger") &&
          "bg-red-500/20 text-red-300 border border-red-500/30",
        tone === "success" && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white/90"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.1))",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      {initials}
    </div>
  );
}

export function ProgressBar({ value, label = "Progresso" }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: "rgba(255,255,255,0.18)" }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped}%`,
          background:
            "linear-gradient(90deg, var(--aurora-accent), color-mix(in oklab, var(--aurora-accent) 60%, white))",
          boxShadow: "0 0 12px var(--aurora-accent-glow)",
        }}
      />
    </div>
  );
}

/* ===========================================================================
 * Ollympius design language — shared workspace primitives.
 * Every workspace composes its chrome from these so the whole app reads as
 * one system (glass surfaces, pill headers, single accent, tabular numerals).
 * =========================================================================== */

/** Signature workspace header: pill title + optional badge, subtitle, right slot. */
export function WorkspaceHeader({
  title,
  subtitle,
  badge,
  right,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Pill className="!px-4 !py-1.5 !text-title !font-semibold">{title}</Pill>
          {badge}
        </div>
        {subtitle ? <p className="mt-1.5 truncate text-caption text-white/65">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </header>
  );
}

/** Small uppercase label that opens a band of related cards. */
export function SectionLabel({
  children,
  icon: Icon,
  tone = "accent",
  note,
}: {
  children: ReactNode;
  icon?: React.ElementType;
  tone?: "accent" | "violet" | "mute";
  note?: string;
}) {
  const palette =
    tone === "violet"
      ? { bg: "rgba(168,85,247,0.14)", border: "rgba(168,85,247,0.28)", color: "#c084fc" }
      : tone === "mute"
        ? {
            bg: "rgba(255,255,255,0.06)",
            border: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.6)",
          }
        : {
            bg: "rgba(74,158,255,0.14)",
            border: "rgba(74,158,255,0.30)",
            color: "var(--aurora-accent)",
          };

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <span
        className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-micro font-bold uppercase tracking-[0.12em]"
        style={{
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.color,
        }}
      >
        {Icon ? <Icon size={11} aria-hidden /> : null}
        {children}
      </span>
      {note ? <span className="truncate text-micro text-white/55">{note}</span> : null}
    </div>
  );
}

/**
 * Compact KPI tile in the Ollympius layout: pill label on top, value bottom-left,
 * delta pill bottom-right. The atom of every overview strip in the app.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaTone = "neutral",
  footnote,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  footnote?: ReactNode;
  accent?: boolean;
}) {
  return (
    <MetricCard
      label={label}
      value={value}
      delta={delta}
      tone={
        deltaTone === "up" ? "good" : deltaTone === "down" ? "bad" : accent ? "accent" : undefined
      }
      hint={footnote}
    />
  );
}

/** Ollympius metric card. `bare` drops the glass so it can sit inside another tile. */
export function MetricCard({
  label,
  value,
  delta,
  hint,
  tone,
  action,
  bare,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  hint?: ReactNode;
  tone?: "good" | "bad" | "warn" | "accent";
  action?: ReactNode;
  bare?: boolean;
  className?: string;
}) {
  const color =
    tone === "good" ? "#86efac" : tone === "bad" ? "#fca5a5" : tone === "warn" ? "#fcd34d" : "#fff";
  return (
    <div
      className={cn(
        !bare && "glass p-4",
        "relative flex min-w-0 flex-col justify-between gap-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="glass-pill inline-flex max-w-full items-center truncate px-2.5 py-1 text-micro font-medium text-white/80">
          {label}
        </span>
        {action}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <span className="truncate text-metric font-semibold tabular-nums" style={{ color }}>
            {value}
          </span>
          {delta ? (
            <span className="glass-pill shrink-0 px-2 py-0.5 text-micro tabular-nums text-white/75">
              {delta}
            </span>
          ) : null}
        </div>
        {hint ? <span className="text-micro leading-snug text-white/60">{hint}</span> : null}
      </div>
    </div>
  );
}

/** Segmented tab bar used by every multi-view workspace. */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onSelect,
  size = "md",
}: {
  tabs: {
    id: T;
    label: string;
    shortLabel?: string;
    icon?: React.ElementType;
    prefix?: string;
    count?: number;
  }[];
  active: T;
  onSelect: (id: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1" style={{ scrollbarWidth: "none" }}>
      <div className="glass-soft flex w-max min-w-full gap-0.5 p-1" style={{ borderRadius: 999 }}>
        {tabs.map(({ id, label, shortLabel, icon: Icon, prefix, count }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-pressed={isActive}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-[color,background-color,box-shadow] duration-200 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                size === "sm" ? "px-2.5 py-1.5 text-micro" : "px-3 py-2 text-caption",
                isActive ? "text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
              )}
              style={{
                background: isActive ? "rgba(255,255,255,0.24)" : undefined,
                boxShadow: isActive
                  ? "inset 0 0 0 1px rgba(255,255,255,0.32), inset 0 1px 0 rgba(255,255,255,0.4)"
                  : undefined,
              }}
            >
              {prefix ? (
                <span className="text-micro tabular-nums text-white/50">{prefix}</span>
              ) : null}
              {Icon ? (
                <Icon size={13} aria-hidden className={isActive ? "text-white" : ""} />
              ) : null}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel ?? label}</span>
              {count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-micro tabular-nums",
                    isActive ? "bg-white text-[#0b0f17]" : "bg-white/12 text-white/70",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Ticker chips — the universal instrument selector. */
export function TickerChips({
  symbols,
  active,
  onSelect,
  renderLead,
  renderTrail,
}: {
  symbols: readonly string[];
  active: string;
  onSelect: (s: string) => void;
  /** Optional icon/logo before the symbol. */
  renderLead?: (sym: string, isActive: boolean) => ReactNode;
  /** Optional quote/meta after the symbol (e.g. last price). */
  renderTrail?: (sym: string, isActive: boolean) => ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
      style={{ scrollbarWidth: "none" }}
    >
      {symbols.map((sym) => {
        const isActive = sym === active;
        return (
          <button
            key={sym}
            onClick={() => onSelect(sym)}
            aria-pressed={isActive}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tabular-nums transition-[color,background-color,box-shadow] duration-200",
              isActive
                ? "bg-white/30 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                : "bg-white/8 text-white/55 hover:bg-white/16 hover:text-white",
            )}
          >
            {renderLead ? renderLead(sym, isActive) : null}
            {sym}
            {renderTrail ? renderTrail(sym, isActive) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Panel: a titled glass surface for charts and tables. */
export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass flex min-w-0 flex-col p-4", className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-3">
        <div className="min-w-0">
          <h3 className="glass-pill inline-flex max-w-full items-center truncate px-3 py-1 text-caption font-semibold text-white">
            {title}
          </h3>
          {subtitle ? <p className="mt-1.5 truncate text-micro text-white/60">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex shrink-0 items-center gap-1.5">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

/* ===========================================================================
 * Interaction atoms — shared by News, Marketplace and every toolbar.
 * =========================================================================== */

/** Solid accent badge that sits next to a workspace title. */
export function AccentBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "glass-pill hidden items-center gap-1 px-3 py-1 text-micro font-semibold uppercase tracking-[0.1em] text-white/85 sm:inline-flex",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pulsing "live" indicator. */
export function LiveBadge({ label = "Live" }: { label?: string }) {
  return (
    <span className="glass-pill inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--aurora-accent)] opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--aurora-accent)]" />
      </span>
      <span className="text-micro font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </span>
    </span>
  );
}

/** Toggle chip — same grammar as TickerChips, for filters. */
export function FilterChip({
  children,
  active,
  onClick,
  icon: Icon,
  count,
  size = "sm",
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  count?: number;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        size === "md" ? "px-3.5 py-2 text-[12px]" : "px-3 py-1 text-micro",
        active
          ? "bg-white/30 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
          : "bg-white/8 text-white/55 hover:bg-white/14 hover:text-white",
      )}
    >
      {Icon ? <Icon size={size === "md" ? 14 : 11} strokeWidth={1.9} /> : null}
      {children}
      {count !== undefined ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-micro tabular-nums",
            active ? "bg-white/25 text-white" : "bg-white/10 text-white/50",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/** Glass search input. Esc clears. */
export function SearchField({
  value,
  onChange,
  placeholder = "Pesquisar…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "glass-soft flex h-9 min-w-0 items-center gap-2 px-3 text-white/50 focus-within:text-white/80 focus-within:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]",
        className,
      )}
      style={{ borderRadius: 12 }}
    >
      <Search size={14} className="shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("");
        }}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-white/35 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar pesquisa"
          className="-mr-1 grid h-6 w-6 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X size={12} />
        </button>
      ) : null}
    </label>
  );
}

/**
 * Button — the one text button of the app. Variants share radius (12px), height
 * (sm 32 · md 40), weight and focus ring, so every workspace reads the same.
 */
export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  className,
  children,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: React.ElementType;
}) {
  return (
    <button
      type={type}
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "h-9 px-3.5 text-caption" : "h-10 px-[18px] text-body",
        variant === "primary" &&
          "bg-white/92 text-[#0b0f17] shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:bg-white",
        variant === "secondary" && "glass-pill text-white hover:bg-white/24",
        variant === "ghost" && "text-white/75 hover:bg-white/8 hover:text-white",
        variant === "danger" && "bg-[#b91c1c] text-white hover:brightness-110",
        className,
      )}
    >
      {Icon ? <Icon size={size === "sm" ? 14 : 16} strokeWidth={2} aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Round glass icon button with a 40px hit area and tactile press. */
export function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  activeColor = "var(--aurora-accent)",
  size = 40,
  className,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  activeColor?: string;
  size?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-white/15 bg-black/30 text-white/80 backdrop-blur-md transition-[transform,background-color,color] duration-150 hover:bg-black/45 hover:text-white active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        className,
      )}
      style={{ width: size, height: size, color: active ? activeColor : undefined }}
    >
      <Icon
        size={Math.round(size * 0.4)}
        strokeWidth={1.9}
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}

/** Dashed placeholder for empty lists and unbuilt workspaces. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[16px] px-6 py-10 text-center",
        className,
      )}
      style={{ border: "1px dashed rgba(255,255,255,0.14)" }}
    >
      {Icon ? (
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/6 text-white/50">
          <Icon size={18} strokeWidth={1.75} />
        </span>
      ) : null}
      <p className="text-[13px] font-semibold text-white/75">{title}</p>
      {hint ? <p className="max-w-[320px] text-pretty text-[11px] text-white/40">{hint}</p> : null}
      {action}
    </div>
  );
}

/**
 * Right-hand slide-over. Portaled to <body> so it always covers the viewport,
 * closes on Esc / backdrop click, and moves focus to its title on open.
 */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 560,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  accent?: string;
}) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  /* Remember the trigger so focus can go back to it when the drawer closes. */
  if (open && !returnTo.current && typeof document !== "undefined") {
    returnTo.current = document.activeElement as HTMLElement | null;
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      /* Keep keyboard focus inside the modal (WCAG 2.4.3). */
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const list = [...nodes].filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (!list.length) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    titleRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      const target = returnTo.current;
      returnTo.current = null;
      if (target && document.contains(target)) requestAnimationFrame(() => target.focus());
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          key="drawer"
          className="fixed inset-0 z-50 flex justify-end text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <motion.div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="relative m-0 flex h-full w-full flex-col overflow-hidden sm:m-3 sm:h-[calc(100%-24px)] sm:rounded-[24px]"
            style={{
              maxWidth: width,
              background:
                "linear-gradient(160deg, rgba(18,22,34,0.97) 0%, rgba(8,12,22,0.97) 100%)",
              backdropFilter: "blur(40px) saturate(160%)",
              border: `1px solid ${accent ?? "rgba(255,255,255,0.14)"}`,
              boxShadow: `0 24px 80px rgba(0,0,0,0.55)${accent ? `, 0 0 60px ${accent}33` : ""}`,
            }}
          >
            <header
              className="flex shrink-0 items-start justify-between gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--aurora-hairline)" }}
            >
              <div className="min-w-0">
                {eyebrow ? (
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">{eyebrow}</div>
                ) : null}
                <h2
                  id={titleId}
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-[16px] font-semibold leading-snug text-white outline-none"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8 text-white/60 transition-colors hover:bg-white/16 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X size={15} />
              </button>
            </header>
            <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer ? (
              <footer
                className="shrink-0 px-5 py-3.5"
                style={{
                  borderTop: "1px solid var(--aurora-hairline)",
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                {footer}
              </footer>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/** USD with compact suffixes — shared by Benchmark and Marketplace. */
export function formatUsd(n: number, opts: { compact?: boolean; digits?: number } = {}): string {
  const { compact = true, digits } = opts;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (!compact) return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(digits ?? 2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits ?? 1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(digits ?? 1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}
