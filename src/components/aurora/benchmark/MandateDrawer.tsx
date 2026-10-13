import { useEffect, useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { DEFAULT_MANDATE, type Mandate } from "@/lib/finance/iipaData";
import { Drawer } from "../primitives";
import { money, pct } from "./sections/shared";
import { requiredReturn } from "./useIipaModel";

type NumericKey = {
  [K in keyof Mandate]: Mandate[K] extends number ? K : never;
}[keyof Mandate];

const FIELDS: {
  key: NumericKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}[] = [
  {
    key: "capitalUsd",
    label: "Capital sob gestão",
    hint: "Valor inicial do fundo",
    min: 10e6,
    max: 1e9,
    step: 10e6,
    format: (v) => money(v, 0),
  },
  {
    key: "realTarget",
    label: "Retorno real exigido",
    hint: "Acima da inflação, por ano",
    min: 0.02,
    max: 0.08,
    step: 0.005,
    format: (v) => pct(v),
  },
  {
    key: "inflation",
    label: "Inflação assumida",
    hint: "Média anual no horizonte",
    min: 0.01,
    max: 0.08,
    step: 0.005,
    format: (v) => pct(v),
  },
  {
    key: "horizonYears",
    label: "Horizonte estratégico",
    hint: "Anos até à avaliação final",
    min: 3,
    max: 20,
    step: 1,
    format: (v) => `${v} anos`,
  },
  {
    key: "maxLoss12m",
    label: "Perda máxima tolerável",
    hint: "Em qualquer período de 12 meses",
    min: 0.05,
    max: 0.3,
    step: 0.01,
    format: (v) => pct(v, 0),
  },
  {
    key: "minLiquidity",
    label: "Liquidez mínima",
    hint: "Monetário + soberanas",
    min: 0.05,
    max: 0.4,
    step: 0.01,
    format: (v) => pct(v, 0),
  },
  {
    key: "maxFxUnhedged",
    label: "Exposição cambial máxima",
    hint: "Não coberta",
    min: 0.1,
    max: 0.6,
    step: 0.01,
    format: (v) => pct(v, 0),
  },
];

export function MandateDrawer({
  open,
  mandate,
  onClose,
  onApply,
}: {
  open: boolean;
  mandate: Mandate;
  onClose: () => void;
  onApply: (m: Mandate) => void;
}) {
  const [draft, setDraft] = useState(mandate);
  useEffect(() => {
    if (open) setDraft(mandate);
  }, [open, mandate]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      eyebrow={
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--aurora-accent)]">
          <ShieldCheck size={12} /> Política de investimento
        </span>
      }
      title="Mandato do fundo"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_MANDATE)}
            className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold text-white/60 hover:bg-white/8 hover:text-white"
          >
            <RotateCcw size={13} /> Repor padrão
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="flex h-10 items-center rounded-xl px-5 text-[12px] font-bold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97]"
            style={{
              background: "var(--aurora-accent)",
              boxShadow: "0 0 24px rgba(74,158,255,0.45)",
            }}
          >
            Aplicar mandato
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <div
          className="flex items-center justify-between rounded-[14px] px-4 py-3"
          style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.22)" }}
        >
          <span className="text-[12px] text-white/65">Retorno nominal necessário</span>
          <span className="text-[20px] font-bold tabular-nums text-white">
            {pct(requiredReturn(draft), 2)}
          </span>
        </div>
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-2">
            <span className="flex items-baseline justify-between gap-2">
              <span>
                <span className="block text-[12px] font-semibold text-white/85">{f.label}</span>
                <span className="text-[10px] text-white/40">{f.hint}</span>
              </span>
              <span className="text-[14px] font-semibold tabular-nums text-white">
                {f.format(draft[f.key])}
              </span>
            </span>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={draft[f.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: Number(e.target.value) }))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[var(--aurora-accent)]"
            />
          </label>
        ))}
      </div>
    </Drawer>
  );
}
