import { useMemo } from "react";
import { BellRing, Command, Landmark, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { getAlertCounts } from "@/data/alertsEngine";
import { useBrokerStore } from "@/data/brokerStore";
import type { SectionId } from "./navigation";

/** Bottom dock: live counters that double as shortcuts. */
export function BottomDock({
  onNavigate,
  onCommand,
}: {
  onNavigate: (id: SectionId) => void;
  onCommand: () => void;
}) {
  const { totals } = useBrokerStore();
  const alerts = useMemo(() => {
    const c = getAlertCounts();
    return c.critical + c.warning;
  }, []);

  const chips = [
    {
      id: "alerts",
      icon: BellRing,
      label: "Alertas",
      value: String(alerts),
      onClick: () => onNavigate("bars"),
    },
    {
      id: "brokers",
      icon: Landmark,
      label: "Corretoras",
      value: String(totals.accounts),
      onClick: () => onNavigate("brokers"),
    },
    { id: "cmd", icon: Command, label: "Pesquisar", value: "⌘K", onClick: onCommand },
    {
      id: "settings",
      icon: Settings,
      label: "Definições",
      value: "",
      onClick: () => onNavigate("settings"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass mx-auto flex w-fit max-w-[92vw] items-center gap-1 p-1.5"
    >
      {chips.map(({ id, icon: Icon, label, value, onClick }, i) => (
        <div key={id} className="flex items-center">
          {i === chips.length - 1 && <span className="mx-1 h-6 w-px bg-white/25" />}
          <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-white/85 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label={value ? `${label}: ${value}` : label}
          >
            <span
              className="grid h-6 w-6 place-items-center rounded-md"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Icon size={13} strokeWidth={1.8} />
            </span>
            <span className="font-medium">{label}</span>
            {value ? <span className="tabular-nums text-white/55">{value}</span> : null}
          </button>
        </div>
      ))}
    </motion.div>
  );
}
