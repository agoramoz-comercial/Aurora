import { useRef } from "react";
import { AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import type { PrimaryNewsItem } from "@/data/newsData";
import { CHART } from "../chartTheme";
import { Drawer } from "../primitives";
import { AttentionBadge, EvidenceDots, ImpactRing, SaveButton, StoryArt } from "./NewsAtoms";
import {
  ATTENTION_LABEL,
  EVENT_LABEL,
  EVIDENCE_META,
  HERO_IMAGES,
  HORIZON_LABEL,
  attentionColor,
  confidenceBadge,
  formatMinutesAgo,
  signed,
} from "./newsUtils";

export function NewsDrawer({
  item: current,
  onClose,
  saved,
  onToggleSave,
}: {
  item: PrimaryNewsItem | null;
  onClose: () => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
  /* Keep the last story mounted while the drawer animates out. */
  const last = useRef(current);
  if (current) last.current = current;
  const item = current ?? last.current;
  const col = item ? attentionColor(item.attentionLevel) : undefined;

  return (
    <Drawer
      open={current !== null}
      onClose={onClose}
      accent={col?.border}
      eyebrow={
        item ? (
          <>
            <AttentionBadge level={item.attentionLevel} />
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/65">
              {EVENT_LABEL[item.eventType]} · {item.status}
            </span>
          </>
        ) : null
      }
      title={item?.headline ?? ""}
      footer={
        item ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-white/40">
              {item.sourceCount} fontes · há {formatMinutesAgo(item.minutesAgo)}
            </span>
            <SaveButton saved={saved} onToggle={onToggleSave} />
          </div>
        ) : null
      }
    >
      {item ? (
        <div className="flex flex-col gap-5 p-5">
          {/* Visual header */}
          <div
            className="relative h-36 overflow-hidden rounded-[16px]"
            style={{ border: `1px solid ${col!.border}` }}
          >
            {HERO_IMAGES[item.id] ? (
              <img
                src={HERO_IMAGES[item.id]}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
            ) : (
              <StoryArt ticker={item.ticker} level={item.attentionLevel} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,12,22,0.95)] to-transparent" />
            <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
              <div>
                <span className="rounded-md bg-white/15 px-2 py-0.5 text-[12px] font-bold text-white backdrop-blur-md">
                  {item.ticker}
                </span>
                <p className="mt-1.5 text-[11px] text-white/60">
                  {item.assetName} · {item.sector} · {item.geography}
                </p>
              </div>
              <ImpactRing score={item.impactScore} level={item.attentionLevel} />
            </div>
          </div>

          <p className="text-pretty text-[13px] leading-relaxed text-white/70">{item.summary}</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Preço", value: signed(item.priceChange), good: item.priceChange >= 0 },
              { label: "Volume vs média", value: `+${item.volumeChange}%`, good: true },
              {
                label: "Volatilidade",
                value: signed(item.volChange, "pp"),
                good: item.volChange < 0,
              },
            ].map((k) => (
              <div
                key={k.label}
                className="flex flex-col gap-1 rounded-[12px] p-3"
                style={{ background: "var(--aurora-surface-2)" }}
              >
                <span className="text-[10px] text-white/45">{k.label}</span>
                <span
                  className="text-[15px] font-bold tabular-nums"
                  style={{ color: k.good ? CHART.positive : CHART.negative }}
                >
                  {k.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span
              className="rounded-full px-3 py-1"
              style={{
                background: "rgba(74,158,255,0.12)",
                color: confidenceBadge(item.confidenceBand).color,
              }}
            >
              {confidenceBadge(item.confidenceBand).label}
            </span>
            <span className="rounded-full bg-white/8 px-3 py-1 text-white/60">
              {HORIZON_LABEL[item.horizon]}
            </span>
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/6 px-2.5 py-1 text-[10px] text-white/50"
              >
                #{t}
              </span>
            ))}
          </div>

          <section>
            <header className="mb-2.5 flex items-center gap-2">
              <Layers size={13} className="text-[var(--aurora-accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                Camadas de evidência
              </span>
              <EvidenceDots count={item.evidenceCount} />
            </header>
            <ol className="flex flex-col gap-2">
              {Object.entries(item.evidenceLayers)
                .filter(([, v]) => v)
                .map(([key, text]) => {
                  const meta = EVIDENCE_META[key];
                  const Icon = meta?.icon ?? Layers;
                  return (
                    <li
                      key={key}
                      className="flex gap-2.5 rounded-[12px] p-3"
                      style={{
                        background: "var(--aurora-surface-1)",
                        border: "1px solid var(--aurora-hairline)",
                      }}
                    >
                      <Icon size={12} className="mt-0.5 shrink-0 text-[var(--aurora-accent)]" />
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                          {meta?.label ?? key}
                        </span>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-white/70">{text}</p>
                      </div>
                    </li>
                  );
                })}
            </ol>
          </section>

          <section
            className="rounded-[14px] p-4"
            style={{
              background: "rgba(74,158,255,0.08)",
              border: "1px solid rgba(74,158,255,0.2)",
            }}
          >
            <header className="mb-2 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[var(--aurora-accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--aurora-accent)]">
                Leitura analítica
              </span>
            </header>
            <p className="text-[12px] leading-relaxed text-white/65">
              Nível de atenção{" "}
              <b className="text-white">{ATTENTION_LABEL[item.attentionLevel].toLowerCase()}</b>,
              impacto direto em <b className="text-white">{item.ticker}</b> com horizonte{" "}
              {HORIZON_LABEL[item.horizon].toLowerCase()}. Sinal sustentado por{" "}
              <b className="text-white">{item.evidenceCount} camadas</b> de evidência pública —
              rever exposição, cobertura e tese.
            </p>
          </section>

          <p className="flex items-start gap-2 text-[10px] leading-relaxed text-white/35">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            Contexto, evidência e níveis de confiança. Não constitui aconselhamento de investimento
            nem recomendação transacional.
          </p>
        </div>
      ) : null}
    </Drawer>
  );
}
