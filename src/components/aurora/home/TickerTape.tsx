import { impactPanelAssets, marketPulse } from "@/data/newsData";
import { CHART } from "../chartTheme";

type TapeItem = { key: string; label: string; value?: string; change: number };

const TAPE: TapeItem[] = [
  ...Object.entries(marketPulse).map(([key, e]) => ({
    key,
    label: e.label,
    value: e.value,
    change: e.change,
  })),
  ...impactPanelAssets.map((a) => ({ key: `a-${a.ticker}`, label: a.ticker, change: a.change })),
];

function TapeRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden}>
      {TAPE.map((t) => {
        const up = t.change >= 0;
        return (
          <li
            key={t.key}
            className="flex items-center gap-2 whitespace-nowrap px-4 text-[11px]"
            style={{ borderRight: "1px solid var(--aurora-hairline)" }}
          >
            <span className="font-semibold uppercase tracking-[0.08em] text-white/50">
              {t.label}
            </span>
            {t.value ? (
              <span className="font-semibold tabular-nums text-white">{t.value}</span>
            ) : null}
            <span
              className="flex items-center gap-0.5 font-semibold tabular-nums"
              style={{ color: up ? CHART.positive : CHART.negative }}
            >
              <span className="text-[8px]">{up ? "▲" : "▼"}</span>
              {Math.abs(t.change).toFixed(1)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Continuous market tape. Pauses on hover; static with reduced motion. */
export function TickerTape() {
  return (
    <div
      className="glass-soft relative shrink-0 overflow-hidden py-2"
      style={{
        borderRadius: 12,
        maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
      }}
      aria-label="Mercados em tempo real"
    >
      <div className="ticker-marquee flex w-max">
        <TapeRow />
        <TapeRow hidden />
      </div>
    </div>
  );
}
