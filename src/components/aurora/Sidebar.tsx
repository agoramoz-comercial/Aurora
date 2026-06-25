import { BarChart3, Home, LayoutGrid, Plus, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const items = [
  { id: "home", icon: Home, label: "Home" },
  { id: "grid", icon: LayoutGrid, label: "Overview" },
  { id: "bars", icon: BarChart3, label: "Analytics" },
  { id: "settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  active: string;
  onSelect: (id: string) => void;
  orientation?: "vertical" | "horizontal";
}

export function Sidebar({ active, onSelect, orientation = "vertical" }: SidebarProps) {
  const horizontal = orientation === "horizontal";
  return (
    <motion.nav
      aria-label="Primary"
      initial={{ opacity: 0, x: horizontal ? 0 : -12, y: horizontal ? -8 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "glass flex items-center gap-2 p-2",
        horizontal ? "w-fit flex-row" : "w-[60px] flex-col",
      )}
    >
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          aria-label={label}
          aria-pressed={active === id}
          data-active={active === id}
          onClick={() => onSelect(id)}
          className="glass-soft grid h-11 w-11 place-items-center text-white/85 transition hover:bg-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[active=true]:bg-white/25 data-[active=true]:text-white"
        >
          <Icon size={18} strokeWidth={1.75} />
        </button>
      ))}
      <div
        className={cn(
          "bg-white/20",
          horizontal ? "mx-1 h-8 w-px" : "my-1 h-px w-8",
        )}
      />
      <button
        aria-label="New"
        aria-pressed={active === "new"}
        data-active={active === "new"}
        onClick={() => onSelect("new")}
        className="glass-soft grid h-11 w-11 place-items-center text-white/85 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[active=true]:bg-white/25 data-[active=true]:text-white"
      >
        <Plus size={18} strokeWidth={1.75} />
      </button>
    </motion.nav>
  );
}
