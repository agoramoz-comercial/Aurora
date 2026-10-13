import { motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Pencil } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SAMURAI } from "@/lib/finance/iipaData";
import { levelFor, type AlertLevel } from "@/lib/finance/iipaEngine";
import { CHART, tooltipProps } from "../../chartTheme";
import { Panel } from "../../primitives";
import { RevealBar, riseItem, staggerContainer, useChartMotion } from "../motionKit";
import type { IipaModel } from "../useIipaModel";
import { LEVEL_META, LevelChip, Rise, money, pct, pp } from "./shared";

function LimitCard({
  label,
  value,
  limit,
  usage,
  level,
  index,
}: {
  label: string;
  value: string;
  limit: string;
  usage: number;
  level: AlertLevel;
  index: number;
}) {
  return (
    <Rise>
      <div className="glass flex h-full flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
            {label}
          </span>
          <LevelChip level={level} compact />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[18px] font-semibold tabular-nums text-white">{value}</span>
          <span className="text-[10px] text-white/45">{limit}</span>
        </div>
        <RevealBar
          value={Math.min(1, usage / 1.5)}
          marker={1 / 1.5}
          color={LEVEL_META[level].color}
          delay={0.1 + index * 0.05}
        />
      </div>
    </Rise>
  );
}

export function MandateSection({
  model,
  onEditMandate,
}: {
  model: IipaModel;
  onEditMandate: () => void;
}) {
  const { mandate, alerts, layers, drift } = model;
  const chart = useChartMotion();
  const alert = (id: string) => alerts.find((a) => a.id === id)!;

  const limits = [
    { label: "Perda máx. em 12 meses", a: alert("loss") },
    { label: "Liquidez mínima", a: alert("liquidity") },
    { label: "Exposição cambial", a: alert("fx") },
    { label: "Concentração por emitente", a: alert("issuer") },
    { label: "Distância ao benchmark", a: alert("te") },
    { label: "Desvio estratégico", a: alert("drift") },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Mandate headline */}
      <div
        className="glass flex flex-wrap items-center justify-between gap-4 p-4"
        style={{ boxShadow: "inset 0 0 0 1px rgba(74,158,255,0.22)" }}
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {[
            { k: "Capital", v: money(mandate.capitalUsd, 0) },
            { k: "Objetivo", v: `Inflação + ${pct(mandate.realTarget, 0)}` },
            { k: "Retorno necessário", v: pct(model.target) },
            { k: "Horizonte", v: `${mandate.horizonYears} anos` },
            { k: "Moeda-base", v: "USD" },
          ].map((x) => (
            <div key={x.k}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {x.k}
              </p>
              <p className="text-[16px] font-semibold tabular-nums text-white">{x.v}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onEditMandate}
          className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-white/16"
        >
          <Pencil size={13} /> Ajustar mandato
        </button>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6"
      >
        {limits.map(({ label, a }, i) => (
          <LimitCard
            key={a.id}
            index={i}
            label={label}
            value={a.value.split(" · ")[0]!.split(" em ")[0]!}
            limit={a.limit}
            usage={a.usage}
            level={a.level}
          />
        ))}
      </motion.div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Hierarquia de benchmarks"
          subtitle="Sete referências, cada uma responde a uma pergunta diferente"
        >
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-1.5"
          >
            {layers.map((l) => (
              <motion.li
                key={l.id}
                variants={riseItem}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[13px] px-3 py-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_auto]"
                style={{
                  background: "var(--aurora-surface-1)",
                  border: "1px solid var(--aurora-hairline)",
                }}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
                    {l.ahead ? (
                      <CheckCircle2 size={13} style={{ color: CHART.positive }} />
                    ) : (
                      <CircleAlert size={13} style={{ color: CHART.warn }} />
                    )}
                    {l.label}
                  </p>
                  <p className="truncate text-[10px] text-white/45">{l.question}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[13px] font-semibold tabular-nums text-white">
                    {l.portfolio}{" "}
                    <span className="text-[11px] font-normal text-white/40">vs {l.reference}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="flex gap-0.5"
                    aria-label={`Qualidade do benchmark ${l.samuraiScore} de 7`}
                  >
                    {SAMURAI.map((c, i) => (
                      <span
                        key={c.key}
                        title={`${c.label}: ${l.samurai[i] ? "cumpre" : "não cumpre"}`}
                        className="grid h-4 w-4 place-items-center rounded-[4px] text-[8px] font-bold"
                        style={{
                          background: l.samurai[i]
                            ? "rgba(74,222,128,0.18)"
                            : "rgba(248,113,113,0.18)",
                          color: l.samurai[i] ? CHART.positive : CHART.negative,
                        }}
                      >
                        {c.key.slice(0, 1)}
                      </span>
                    ))}
                  </div>
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: l.needsReview ? CHART.warn : "rgba(255,255,255,0.45)" }}
                  >
                    {l.needsReview ? "Revisão do Comité" : `Qualidade ${l.samuraiScore}/7`}
                  </span>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </Panel>

        <Panel
          title="Alocação atual vs estratégica"
          subtitle="Anel exterior: hoje · interior: aprovada pelo Comité"
        >
          <div className="relative mx-auto h-[210px] w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...tooltipProps} formatter={(v: number) => pct(v)} />
                <Pie
                  data={drift.filter((d) => d.policy > 0)}
                  dataKey="policy"
                  nameKey="label"
                  innerRadius={46}
                  outerRadius={66}
                  paddingAngle={2}
                  stroke="none"
                  {...chart(0)}
                >
                  {drift
                    .filter((d) => d.policy > 0)
                    .map((d) => (
                      <Cell key={d.id} fill={d.color} fillOpacity={0.45} />
                    ))}
                </Pie>
                <Pie
                  data={drift}
                  dataKey="current"
                  nameKey="label"
                  innerRadius={72}
                  outerRadius={96}
                  paddingAngle={2}
                  stroke="none"
                  {...chart(2)}
                >
                  {drift.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[9px] uppercase tracking-[0.12em] text-white/45">Maior desvio</p>
                <p className="text-[14px] font-bold tabular-nums text-white">
                  {pp(model.maxDrift.delta)}
                </p>
                <p className="text-[9px] text-white/50">{model.maxDrift.short}</p>
              </div>
            </div>
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {drift.map((d, i) => {
              const level = levelFor(Math.abs(d.delta) / mandate.maxDrift);
              return (
                <li
                  key={d.id}
                  className="grid grid-cols-[92px_minmax(0,1fr)_56px] items-center gap-2 text-[11px]"
                >
                  <span className="flex items-center gap-1.5 truncate text-white/70">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: d.color }}
                    />
                    {d.short}
                  </span>
                  <RevealBar
                    value={d.current / 0.4}
                    marker={d.policy / 0.4}
                    color={d.color}
                    delay={0.2 + i * 0.05}
                    height={5}
                  />
                  <span
                    className="text-right font-semibold tabular-nums"
                    style={{
                      color: level === "green" ? "rgba(255,255,255,0.7)" : LEVEL_META[level].color,
                    }}
                  >
                    {pp(d.delta)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
