/** AreaRail — single top navigation: icons for every area; the active one expands with its name. */
import { SECTIONS, type SectionId } from "../navigation";

export function AreaRail({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav aria-label="Áreas" className="cx-glass-thin flex items-center gap-1 rounded-full p-1.5">
      {SECTIONS.map((s) => {
        const on = s.id === active;
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            type="button"
            aria-label={s.label}
            aria-current={on ? "page" : undefined}
            title={s.label}
            onClick={() => onSelect(s.id)}
            className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={
              on
                ? {
                    color: "var(--ambient-ink)",
                    background: "linear-gradient(180deg,#fff,#e6f6f5)",
                    boxShadow:
                      "0 0 0 1px rgba(255,255,255,.6), 0 0 24px rgba(var(--ambient-rgb), .55)",
                    paddingInline: 14,
                  }
                : { color: "var(--cx-ink-3)" }
            }
          >
            <Icon size={18} aria-hidden />
            {on ? <span>{s.label}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
