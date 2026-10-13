import { Sparkles } from "lucide-react";
import { CATEGORIES, type Category } from "@/data/marketplaceData";
import { cn } from "@/lib/utils";
import { CATEGORY_ICON } from "./ListingCard";

/** Large category tiles — icon, label and live count. */
export function CategoryRail({
  active,
  onSelect,
  counts,
  total,
}: {
  active: Category | "all";
  onSelect: (c: Category | "all") => void;
  counts: Record<Category, number>;
  total: number;
}) {
  const tiles: {
    id: Category | "all";
    label: string;
    icon: React.ElementType;
    color: string;
    count: number;
  }[] = [
    { id: "all", label: "Toda a coleção", icon: Sparkles, color: "#4a9eff", count: total },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      icon: CATEGORY_ICON[c.id],
      color: c.color,
      count: counts[c.id] ?? 0,
    })),
  ];

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {tiles.map(({ id, label, icon: Icon, color, count }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-pressed={isActive}
            className={cn(
              "glass-soft flex min-w-[124px] shrink-0 flex-col items-start gap-2.5 px-3 py-2.5 text-left transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
              isActive ? "text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white",
            )}
            style={{
              borderRadius: 14,
              background: isActive ? `linear-gradient(135deg, ${color}33, ${color}10)` : undefined,
              boxShadow: isActive ? `inset 0 0 0 1px ${color}99, 0 0 22px ${color}22` : undefined,
            }}
          >
            <span className="flex w-full items-center justify-between">
              <span
                className="grid h-8 w-8 place-items-center rounded-[10px]"
                style={{ background: `${color}22`, color }}
              >
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="text-[10px] font-semibold tabular-nums text-white/45">{count}</span>
            </span>
            <span className="text-[12px] font-semibold leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
