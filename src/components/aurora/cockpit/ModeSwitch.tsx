/** ModeSwitch — radio group for the ambient light mode. */
import { AMBIENT_MODES, type AmbientMode } from "./ambient";

export function ModeSwitch({
  value,
  onChange,
}: {
  value: AmbientMode;
  onChange: (m: AmbientMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Modo de luz ambiente"
      className="cx-glass-thin flex rounded-full p-1 text-[12px] font-semibold"
    >
      {AMBIENT_MODES.map((m) => {
        const on = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={m.hint}
            onClick={() => onChange(m.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const i = AMBIENT_MODES.findIndex((x) => x.id === value);
              const n = AMBIENT_MODES[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3]!;
              onChange(n.id);
            }}
            tabIndex={on ? 0 : -1}
            className="flex h-8 items-center gap-2 rounded-full px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{
              color: on ? "var(--cx-ink-1)" : "var(--cx-ink-3)",
              background: on ? "rgba(var(--ambient-rgb), .16)" : "transparent",
              boxShadow: on ? "inset 0 0 0 1px rgba(var(--ambient-rgb), .45)" : "none",
            }}
          >
            {on ? (
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--ambient)", boxShadow: "0 0 8px var(--ambient)" }}
              />
            ) : null}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
