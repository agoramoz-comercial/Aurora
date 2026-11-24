/**
 * PmCockpit — Portfolio Management zero layer (Cockpit Aurora): instrument
 * cluster with concentration, YTD return vs S&P 500 and net exposure, flanked
 * by key stats, then a focus rail of the live alerts.
 */
import { evaluateAlerts } from "@/data/alertsEngine";
import { portfolioMetrics } from "@/data/portfolio";
import { Gauge } from "../cockpit/Gauge";
import { Chip, Rail } from "../cockpit/Rail";
import { Stat, pctPt } from "../cockpit/format";

/** Mandate concentration limit and the S&P 500 2017 return shown in the performance chart. */
const SECTOR_LIMIT = 0.3;
const SPX_YTD = 0.195;

export function PmCockpit() {
  const m = portfolioMetrics;
  const alerts = evaluateAlerts();
  const critical = alerts.filter((a) => a.severity === "critical").length;
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Instrumentos da carteira"
        className="cx-glass-thick relative grid items-center gap-6 px-5 py-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8"
      >
        <div className="grid grid-cols-3 gap-4 lg:flex lg:flex-col lg:gap-5">
          <Stat k="AUM" v={`$${m.aum.toLocaleString("pt-PT")}`} />
          <Stat
            k="Alpha YTD"
            v={pctPt(m.ytdAlpha, 2, true)}
            tone={m.ytdAlpha >= 0 ? "good" : "bad"}
          />
          <Stat k="Desde o início" v={pctPt(m.perfSinceInception, 2, true)} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Gauge
            label="Concentração setorial"
            size={220}
            value={m.largestSectorExposurePct * 100}
            valueText={pctPt(m.largestSectorExposurePct, 1)}
            sub={`limite ${pctPt(SECTOR_LIMIT, 0)}`}
            tone={m.largestSectorExposurePct > SECTOR_LIMIT ? "bad" : "good"}
            zones={[{ from: SECTOR_LIMIT * 100, to: 100, tone: "bad" }]}
          />
          <Gauge
            label="Retorno YTD"
            size={320}
            min={0}
            max={30}
            value={m.ytdPerf * 100}
            valueText={pctPt(m.ytdPerf, 2, true)}
            sub={`MTD ${pctPt(m.mtdPerf, 2, true)} · S&P 500 ${pctPt(SPX_YTD, 1, true)}`}
            marker={SPX_YTD * 100}
            markerLabel={`marcador: S&P 500 ${pctPt(SPX_YTD, 1, true)}`}
          />
          <Gauge
            label="Exposição líquida"
            size={220}
            min={0}
            max={150}
            value={m.netExposure * 100}
            valueText={pctPt(m.netExposure, 0)}
            sub={`beta ${pctPt(m.betaNetExposure, 2)}`}
            zones={[{ from: 120, to: 150, tone: "warn" }]}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 lg:flex lg:flex-col lg:items-end lg:gap-5 lg:text-right">
          <Stat k="Beta líquido" v={pctPt(m.betaNetExposure, 2)} />
          <Stat
            k="Maior setor"
            v={pctPt(m.largestSectorExposurePct, 2)}
            tone={m.largestSectorExposurePct > SECTOR_LIMIT ? "bad" : undefined}
          />
          <Stat k="Alertas críticos" v={String(critical)} tone={critical ? "bad" : "good"} />
        </div>
        <div aria-hidden className="cx-ambient-line absolute inset-x-[10%] -bottom-px" />
      </section>

      {alerts.length ? (
        <section aria-label="Alertas prioritários" className="cx-glass px-5 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-bold text-[var(--cx-ink-1)]">Alertas prioritários</h3>
            <span className="text-[11px] text-[var(--cx-ink-3)]">
              ← → navegar · separador Alerts para agir
            </span>
          </div>
          <Rail
            label="Alertas prioritários"
            width={230}
            items={alerts.slice(0, 6).map((a) => ({
              id: a.id,
              eyebrow:
                a.severity === "critical" ? (
                  <Chip tone="bad">Crítico</Chip>
                ) : a.severity === "warning" ? (
                  <Chip tone="warn">Atenção</Chip>
                ) : (
                  <Chip>Info</Chip>
                ),
              title: a.ruleName,
              detail: a.message,
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}
