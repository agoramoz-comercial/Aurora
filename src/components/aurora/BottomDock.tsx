import { CalendarDays, CheckSquare, Inbox, User } from "lucide-react";
import { motion } from "framer-motion";
import { dockChips } from "@/data/aurora";

const icons = [Inbox, CheckSquare, CalendarDays, User];

/** Each dock chip opens a real workspace (no dead buttons). */
const TARGETS: Record<string, { id: string; title: string }> = {
  d1: { id: "proofmarket:chat", title: "Abrir mensagens no Aurora Chat" },
  d2: { id: "businessPlan", title: "Abrir tarefas do Plano de Negócios" },
  d3: { id: "home", title: "Abrir Notícias de hoje" },
  d4: { id: "settings", title: "Abrir o seu perfil e definições" },
};

export function BottomDock({
  onOpen,
  active,
}: {
  onOpen: (target: string) => void;
  active?: string;
}) {
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
              type="button"
              title={TARGETS[chip.id]?.title}
              aria-current={
                active && TARGETS[chip.id]?.id.split(":")[0] === active ? "page" : undefined
              }
              onClick={() => TARGETS[chip.id] && onOpen(TARGETS[chip.id]!.id)}
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
