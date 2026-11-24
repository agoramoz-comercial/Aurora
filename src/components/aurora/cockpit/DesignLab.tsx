/**
 * DesignLab — reference screen for gate G2 (open with ?lab=cockpit).
 * Shows tokens v3, the three ambient modes and the new components with the
 * Portfolio Management demo data. Not linked from the navigation.
 */
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import roomBg from "@/assets/room-bg.jpg";
import type { SectionId } from "../navigation";
import { useAmbient } from "./ambient";
import { AreaRail } from "./AreaRail";
import { Gauge } from "./Gauge";
import { ModeSwitch } from "./ModeSwitch";
import { Chip, Rail } from "./Rail";
import { Stage } from "./Stage";

const SWATCHES = [
  ["Fundo", "var(--cx-bg)"],
  ["Luz ambiente", "var(--ambient)"],
  ["Positivo", "var(--cx-good)"],
  ["Atenção", "var(--cx-warn)"],
  ["Crítico", "var(--cx-bad)"],
] as const;
const TYPE = [
  ["Hero 60", 60, 800],
  ["Display 46", 46, 800],
  ["Título 22", 22, 700],
  ["Secção 15", 15, 700],
  ["Corpo 13", 13, 400],
  ["Legenda 11", 11, 600],
] as const;

function Stat({ k, v, tone }: { k: string; v: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <p className="cx-eyebrow">{k}</p>
      <p
        className="mt-1 text-[24px] font-bold tabular-nums"
        style={{ color: tone ? `var(--cx-${tone})` : "var(--cx-ink-1)" }}
      >
        {v}
      </p>
    </div>
  );
}

export function DesignLab() {
  const [mode, setMode] = useAmbient();
  const [area, setArea] = useState<SectionId>("grid");
  useEffect(() => {
    document.documentElement.dataset.design = "v3";
  }, []);
  return (
    <Stage image={roomBg} position="50% 50%" dim={0.86}>
      <div
        className="mx-auto flex max-w-[1440px] flex-col gap-6 px-8 pb-10 pt-5 text-[var(--cx-ink-1)]"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-[15px] font-bold tracking-[0.02em]">
            <span
              aria-hidden
              className="h-[22px] w-[22px] rounded-[7px]"
              style={{
                background:
                  "conic-gradient(from 200deg, var(--ambient), #6cb8ff, #b48cff, var(--ambient))",
                boxShadow: "0 0 18px rgba(var(--ambient-rgb), .5)",
              }}
            />
            AURORA
          </div>
          <AreaRail active={area} onSelect={setArea} />
          <div className="flex items-center gap-2.5">
            <ModeSwitch value={mode} onChange={setMode} />
            <button
              type="button"
              className="cx-glass-thin flex h-10 items-center gap-2 rounded-full px-3.5 text-[12px] text-[var(--cx-ink-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Search size={14} aria-hidden /> Pesquisar{" "}
              <kbd className="rounded-md border border-[var(--cx-hair-2)] px-1.5 text-[11px] font-semibold text-[var(--cx-ink-1)]">
                ⌘K
              </kbd>
            </button>
          </div>
        </header>

        <div>
          <p className="cx-eyebrow">F2 · Design system v3 · ecrã de referência</p>
          <h1
            className="mt-2 text-[46px] font-extrabold leading-none tracking-[-0.02em]"
            style={{ fontFamily: '"Inter Display", Inter, sans-serif' }}
          >
            Cockpit Aurora
          </h1>
        </div>

        <section
          aria-label="Instrumentos"
          className="cx-glass-thick relative grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-6 px-8 py-6"
        >
          <div className="flex flex-col gap-5">
            <Stat k="Alpha YTD" v="+7,64%" tone="good" />
            <Stat k="Desde o início" v="+35,07%" />
            <Stat k="MTD" v="+0,64%" />
          </div>
          <Gauge
            label="Concentração setorial"
            value={53.3}
            valueText="53,3%"
            sub="limite 30%"
            tone="bad"
            zones={[{ from: 30, to: 100, tone: "bad" }]}
          />
          <Gauge
            label="Retorno YTD"
            size={340}
            min={0}
            max={30}
            value={19.64}
            valueText="+19,64%"
            sub="S&P 500 +19,5% · marcador branco"
            marker={19.5}
            markerLabel="S&P 500 +19,5%"
          />
          <Gauge
            label="Exposição líquida"
            min={0}
            max={150}
            value={100}
            valueText="100%"
            sub="beta 98,69%"
            zones={[{ from: 120, to: 150, tone: "warn" }]}
          />
          <div className="flex flex-col items-end gap-5 text-right">
            <Stat k="Beta líquido" v="98,69%" />
            <Stat k="Maior setor" v="52,94%" tone="bad" />
            <Stat k="Alertas críticos" v="3" tone="bad" />
          </div>
          <div aria-hidden className="cx-ambient-line absolute inset-x-[10%] -bottom-px" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <section aria-label="Carril com foco" className="cx-glass px-5 pt-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-bold">Alertas prioritários · carril com foco</h2>
              <span className="text-[11px] text-[var(--cx-ink-3)]">← → navegar · Enter abrir</span>
            </div>
            <Rail
              label="Alertas prioritários"
              items={[
                {
                  id: "a1",
                  eyebrow: <Chip tone="bad">Crítico</Chip>,
                  title: "Concentração setorial acima de 30%",
                  detail: "Tecnologia de informação: 53,3% da carteira.",
                  meta: "Risco · limite do mandato",
                },
                {
                  id: "a2",
                  eyebrow: <Chip tone="bad">Crítico</Chip>,
                  title: "Beta setorial > 30%",
                  detail: "Exposição beta a tecnologia: 52,9%.",
                  meta: "Risco",
                },
                {
                  id: "a3",
                  eyebrow: <Chip tone="bad">Crítico</Chip>,
                  title: "Perto do stop-loss",
                  detail: "KO a 4,7% · F a 1,7% do stop.",
                  meta: "Execução",
                },
                {
                  id: "a4",
                  eyebrow: <Chip tone="warn">Atenção</Chip>,
                  title: "Rebalanceamento trimestral",
                  detail: "Desvio face à política acima de 5 p.p.",
                  meta: "Mandato",
                },
              ]}
              width={210}
            />
          </section>

          <section aria-label="Tokens" className="cx-glass flex flex-col gap-5 p-5">
            <h2 className="text-[15px] font-bold">Tokens v3</h2>
            <div className="flex flex-wrap gap-3">
              {SWATCHES.map(([n, v]) => (
                <div key={n} className="flex items-center gap-2 text-[12px] text-[var(--cx-ink-2)]">
                  <span
                    aria-hidden
                    className="h-6 w-6 rounded-[8px] border border-[var(--cx-hair-2)]"
                    style={{ background: v }}
                  />
                  {n}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              {TYPE.slice(2).map(([n, s, w]) => (
                <p key={n} className="leading-tight" style={{ fontSize: s, fontWeight: w }}>
                  {n} <span className="text-[var(--cx-ink-3)]">· Inter</span>
                </p>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-[12px] text-[var(--cx-ink-2)]">
              <div className="cx-glass-thin rounded-[var(--cx-r2)] p-3">
                Vidro fino
                <br />
                blur 16
              </div>
              <div className="cx-glass rounded-[var(--cx-r2)] p-3">
                Vidro regular
                <br />
                blur 28
              </div>
              <div className="cx-glass-thick rounded-[var(--cx-r2)] p-3">
                Vidro espesso
                <br />
                blur 40
              </div>
            </div>
          </section>
        </div>
      </div>
    </Stage>
  );
}
