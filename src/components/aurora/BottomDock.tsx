import { CalendarDays, CheckSquare, Inbox, User } from "lucide-react";
import { motion } from "framer-motion";
import { dockChips } from "@/data/aurora";

const icons = [Inbox, CheckSquare, CalendarDays, User];

export function BottomDock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass mx-auto flex w-fit max-w-[92vw] items-center gap-1 p-1.5"
    >
      {dockChips.map((chip, i) => {
        const Icon = icons[i] ?? Inbox;
        const isLast = i === dockChips.length - 1;
        return (
          <div key={chip.id} className="flex items-center">
            {isLast && <span className="mx-1 h-6 w-px bg-white/25" />}
            <button
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-white/85 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={`${chip.label} ${chip.value}`}
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
              <span className="font-medium">{chip.label}</span>
              <span className="tabular-nums text-white/55">{chip.value}</span>
            </button>
          </div>
        );
      })}
    </motion.div>
  );
}
