import { useState } from "react";
import { Check, Gauge, HardDrive, Info, Keyboard, RotateCcw } from "lucide-react";
import { useBrokerStore } from "@/data/brokerStore";
import { ActionButton, Panel, WorkspaceHeader } from "../primitives";

/** localStorage keys owned by workspace stores that mount on demand. */
const PORTFOLIO_KEY = "aurora-portfolio-v1";
const MARKETPLACE_KEY = "ollympius.marketplace.v1";

function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable — nothing persisted to clear.
  }
}

export function SettingsWorkspace({
  reduceMotion,
  onReduceMotion,
}: {
  reduceMotion: boolean;
  onReduceMotion: (v: boolean) => void;
}) {
  const { resetToDemo } = useBrokerStore();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const mark = (id: string) => setDone((d) => ({ ...d, [id]: true }));

  const resets = [
    {
      id: "portfolio",
      title: "Carteira personalizada",
      hint: "Volta às posições de referência usadas pelo Benchmark e pelo Plano.",
      run: () => removeKey(PORTFOLIO_KEY),
    },
    {
      id: "brokers",
      title: "Corretoras",
      hint: "Remove as ligações adicionadas e repõe as duas contas de demonstração.",
      run: resetToDemo,
    },
    {
      id: "marketplace",
      title: "Marketplace",
      hint: "Apaga listagens, pedidos e favoritos criados neste browser.",
      run: () => removeKey(MARKETPLACE_KEY),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="Definições"
        subtitle="Preferências e dados locais · guardados apenas neste browser"
      />
      <div className="thin-scrollbar mt-4 grid min-h-0 flex-1 grid-cols-1 content-start gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
        <Panel title="Movimento" subtitle="Acessibilidade e conforto visual">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/6 text-white/70">
                <Gauge size={16} />
              </span>
              <div>
                <p id="pref-motion" className="text-[13px] font-semibold text-white">
                  Reduzir movimento
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/50">
                  Desliga transições e animações de entrada. O sistema operativo já é respeitado por
                  omissão.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reduceMotion}
              aria-labelledby="pref-motion"
              onClick={() => onReduceMotion(!reduceMotion)}
              className="relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{
                background: reduceMotion ? "var(--aurora-accent)" : "rgba(255,255,255,0.16)",
                boxShadow: reduceMotion ? "0 0 14px rgba(74,158,255,0.45)" : undefined,
              }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200"
                style={{ left: reduceMotion ? 22 : 2 }}
              />
            </button>
          </div>
        </Panel>

        <Panel title="Atalhos" subtitle="Teclado">
          <ul className="flex flex-col gap-2 text-[12px]">
            {[
              ["Ctrl / ⌘ + K", "Paleta de comandos"],
              ["Esc", "Fechar painéis e diálogos"],
              ["Tab", "Navegar entre controlos"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/70">
                  <Keyboard size={13} className="text-white/40" />
                  {v}
                </span>
                <kbd className="rounded-md border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                  {k}
                </kbd>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Dados locais"
          subtitle="Repor o estado de cada módulo"
          className="lg:col-span-2"
        >
          <ul className="flex flex-col divide-y divide-white/6">
            {resets.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/6 text-white/70">
                    <HardDrive size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white">{r.title}</p>
                    <p className="mt-0.5 text-[11px] text-white/50">{r.hint}</p>
                  </div>
                </div>
                <ActionButton
                  tone="ghost"
                  icon={done[r.id] ? Check : RotateCcw}
                  onClick={() => {
                    r.run();
                    mark(r.id);
                  }}
                >
                  {done[r.id] ? "Reposto" : "Repor"}
                </ActionButton>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Sobre" subtitle="Aurora · Ollympius" className="lg:col-span-2">
          <div className="flex items-start gap-3 text-[12px] leading-relaxed text-white/60">
            <Info size={15} className="mt-0.5 shrink-0 text-[var(--aurora-accent)]" />
            <p>
              Todos os modelos correm no browser a partir de drivers explícitos. Os datasets, as
              cotações e as ligações a corretoras são ilustrativos e servem para demonstrar o motor:
              não constituem recomendação de investimento.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
