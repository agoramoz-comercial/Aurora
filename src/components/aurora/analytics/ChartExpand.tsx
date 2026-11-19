/** Full-screen view for an analysis chart: portal overlay, Esc/close, focus kept inside. */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

export function ExpandButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Expandir ${label} para ecrã inteiro`}
      title="Expandir"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-white/70 transition-colors duration-150 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <Maximize2 size={14} aria-hidden />
    </button>
  );
}

export function ChartExpand({
  open,
  onClose,
  title,
  toolbar,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const list = [
        ...panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!list.length) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
      if (back && document.contains(back)) back.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 p-2 text-white sm:p-4"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[4px]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass relative flex h-full w-full flex-col !p-4"
        style={{ background: "linear-gradient(160deg, rgba(18,22,34,0.97), rgba(8,12,22,0.97))" }}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h2 id={titleId} className="text-title font-bold text-white">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {toolbar}
            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              aria-label="Fechar ecrã inteiro"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/12 bg-white/5 text-white/70 transition-colors duration-150 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        </header>
        <div className="relative mt-3 min-h-0 flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
