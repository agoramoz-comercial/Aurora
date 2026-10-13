import {
  BarChart3,
  Home,
  LayoutGrid,
  Plus,
  Settings,
  FileCheck,
  Building2,
  FileSpreadsheet,
  Gem,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const items = [
  { id: "home", icon: Home, label: "Notícias" },
  { id: "grid", icon: LayoutGrid, label: "Ollympius Dashboard" },
  { id: "bars", icon: BarChart3, label: "Analytics" },
  { id: "benchmarkPage", icon: Building2, label: "Benchmark & Projeções" },
  { id: "businessPlan", icon: FileCheck, label: "Plano de Negócios" },
  { id: "teslaModel", icon: FileSpreadsheet, label: "Modelo Financeiro & DCF Hub" },
  { id: "marketplace", icon: Gem, label: "Marketplace" },
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
        horizontal ? "no-scrollbar w-fit max-w-full flex-row overflow-x-auto" : "w-[60px] flex-col",
      )}
    >
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={label}
          aria-label={label}
          aria-pressed={active === id}
          data-active={active === id}
          onClick={() => onSelect(id)}
          className="group relative grid h-11 w-11 shrink-0 place-items-center text-white/85 transition-[background-color,color,box-shadow] duration-200 hover:bg-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[active=true]:text-white glass-soft data-[active=true]:bg-[rgba(74,158,255,0.22)] data-[active=true]:shadow-[inset_0_0_0_1px_rgba(74,158,255,0.45),0_0_18px_rgba(74,158,255,0.25)]"
        >
          <Icon size={18} strokeWidth={1.75} />
        </button>
      ))}
      <div className={cn("shrink-0 bg-white/20", horizontal ? "mx-1 h-8 w-px" : "my-1 h-px w-8")} />
      <button
        aria-label="New"
        title="New workspace"
        aria-pressed={active === "new"}
        data-active={active === "new"}
        onClick={() => onSelect("new")}
        className="glass-soft grid h-11 w-11 shrink-0 place-items-center text-white/85 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[active=true]:bg-[rgba(74,158,255,0.22)] data-[active=true]:text-white"
      >
        <Plus size={18} strokeWidth={1.75} />
      </button>
    </motion.nav>
  );
}
