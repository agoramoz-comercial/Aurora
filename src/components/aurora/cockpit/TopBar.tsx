/**
 * TopBar — the single Cockpit navigation: brand, area rail, live alert count,
 * search (⌘K) and the ambient light mode. Replaces the v2 sidebar and dock.
 */
import { useMemo } from "react";
import { BellRing, Search } from "lucide-react";
import { getAlertCounts } from "@/data/alertsEngine";
import type { SectionId } from "../navigation";
import { AreaRail } from "./AreaRail";
import { ModeSwitch } from "./ModeSwitch";
import type { AmbientMode } from "./ambient";

export function TopBar({
  active,
  onSelect,
  onCommand,
  mode,
  onMode,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  onCommand: () => void;
  mode: AmbientMode;
  onMode: (m: AmbientMode) => void;
}) {
  const alerts = useMemo(() => {
    const c = getAlertCounts();
    return c.critical + c.warning;
  }, []);
  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <button
        type="button"
        onClick={() => onSelect("home")}
        aria-label="Aurora — início"
        className="flex h-10 items-center gap-2.5 rounded-full text-[15px] font-bold tracking-[0.02em] text-[var(--cx-ink-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <span
          aria-hidden
          className="h-[22px] w-[22px] rounded-[7px]"
          style={{
            background:
              "conic-gradient(from 200deg, var(--ambient), #6cb8ff, #b48cff, var(--ambient))",
            boxShadow: "0 0 18px rgba(var(--ambient-rgb), .5)",
          }}
        />
        AURORA
      </button>
      <div className="order-3 w-full overflow-x-auto [scrollbar-width:none] xl:order-none xl:w-auto">
        <AreaRail active={active} onSelect={onSelect} />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect("bars")}
          aria-label={`Alertas: ${alerts}`}
          className="cx-glass-thin flex h-10 items-center gap-2 rounded-full px-3.5 text-[12px] font-semibold text-[var(--cx-ink-2)] transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <BellRing size={14} aria-hidden />
          <span className="hidden sm:inline">Alertas</span>
          <span
            className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold tabular-nums text-white"
            style={{ background: "#c62828" }}
          >
            {alerts}
          </span>
        </button>
        <button
          type="button"
          onClick={onCommand}
          aria-label="Pesquisar ⌘K"
          className="cx-glass-thin flex h-10 items-center gap-2 rounded-full px-3.5 text-[12px] text-[var(--cx-ink-2)] transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Search size={14} aria-hidden />
          <span className="hidden sm:inline">Pesquisar</span>
          <kbd className="hidden rounded-md border border-[var(--cx-hair-2)] px-1.5 text-[11px] font-semibold text-[var(--cx-ink-1)] sm:inline">
            ⌘K
          </kbd>
        </button>
        <div className="hidden lg:block">
          <ModeSwitch value={mode} onChange={onMode} />
        </div>
      </div>
    </header>
  );
}
