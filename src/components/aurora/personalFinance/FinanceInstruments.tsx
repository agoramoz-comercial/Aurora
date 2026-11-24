/** Finanças Pessoais zero layer: budget used, emergency reserve and savings rate as instruments. */
import { Gauge } from "../cockpit/Gauge";

export function FinanceInstruments({
  assigned,
  spent,
  runway,
  rate,
}: {
  assigned: number;
  spent: number;
  runway: number;
  rate: number;
}) {
  const used = assigned > 0 ? (spent / assigned) * 100 : 0;
  const fmt = (n: number, d = 0) => n.toFixed(d).replace(".", ",");
  return (
    <section
      aria-label="Instrumentos das finanças"
      className="cx-glass-thick relative flex flex-wrap items-center justify-around gap-2 px-4 py-5"
    >
      <Gauge
        label="Orçamento usado"
        size={210}
        min={0}
        max={130}
        value={used}
        valueText={`${fmt(used)}%`}
        sub={`${Math.round(spent / 1000)} de ${Math.round(assigned / 1000)} mil MT`}
        tone={used > 100 ? "bad" : used > 90 ? "warn" : undefined}
        zones={[
          { from: 90, to: 100, tone: "warn" },
          { from: 100, to: 130, tone: "bad" },
        ]}
      />
      <Gauge
        label="Reserva de emergência"
        size={210}
        min={0}
        max={9}
        value={runway}
        valueText={`${fmt(runway, 1)} meses`}
        sub="meta 3–6 meses"
        tone={runway < 3 ? "bad" : runway < 6 ? "warn" : "good"}
        zones={[
          { from: 0, to: 3, tone: "bad" },
          { from: 6, to: 9, tone: "good" },
        ]}
      />
      <Gauge
        label="Taxa de poupança"
        size={210}
        min={0}
        max={50}
        value={rate * 100}
        valueText={`${fmt(rate * 100)}%`}
        sub="meta 20%"
        marker={20}
        markerLabel="meta de 20%"
        tone={rate < 0.1 ? "bad" : rate < 0.2 ? "warn" : "good"}
        zones={[{ from: 0, to: 10, tone: "bad" }]}
      />
      <div aria-hidden className="cx-ambient-line absolute inset-x-[10%] -bottom-px" />
    </section>
  );
}
