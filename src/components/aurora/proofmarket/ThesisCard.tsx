import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  EyeOff,
  Flag,
  HelpCircle,
  Layers,
  MessageSquareWarning,
  MoreHorizontal,
  Bell,
  Scale,
} from "lucide-react";
import { Avatar } from "../primitives";
import type { Thesis } from "@/data/proofmarket/types";
import { useProofMarket } from "@/data/proofmarket/store";
import {
  bannersFor,
  daysBetween,
  evidenceQuality,
  formatDate,
  hasConflict,
  iso,
  latest,
} from "@/lib/proofmarket/rules";
import {
  GhostButton,
  HORIZON_LABEL,
  KIND_LABEL,
  LevelTag,
  RISK_LABEL,
  STANCE_LABEL,
  StatusTag,
  Tag,
  riskTone,
} from "./atoms";

export type OpenTab = "resumo" | "evidencias" | "contraditorio" | "historico";

export function ThesisCard({
  thesis,
  reasons,
  index,
  onOpen,
  onCounter,
  onReport,
}: {
  thesis: Thesis;
  reasons?: string[];
  index: number;
  onOpen: (id: string, tab?: OpenTab) => void;
  onCounter: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const pm = useProofMarket();
  const v = latest(thesis);
  const author = pm.getAuthor(thesis.authorId);
  const q = evidenceQuality(v);
  const conflict = hasConflict(v);
  const banners = bannersFor(thesis);
  const saved = pm.saved.includes(thesis.id);
  const followed = pm.followed.includes(thesis.id);
  const counters = pm.allCounters.filter((c) => c.thesisId === thesis.id).length;
  const late = daysBetween(thesis.reviewDue, iso(Date.now()));
  const [why, setWhy] = useState(false);
  const titleId = useId();

  return (
    <motion.article
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className="glass-soft flex min-w-0 flex-col gap-3 p-4"
      style={{ borderRadius: 16 }}
    >
      <header className="flex items-start gap-2.5">
        <Avatar initials={author.initials} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[12.5px] font-semibold text-white">{author.name}</span>
            <LevelTag author={author} />
          </div>
          <p className="mt-0.5 text-[10.5px] tabular-nums text-white/45">
            {thesis.id} · v{v.version} · {formatDate(v.date)}
          </p>
        </div>
        <StatusTag status={thesis.status} />
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-white/12 px-1.5 py-0.5 text-[10.5px] font-bold text-white">
          {thesis.entity.code ?? thesis.entity.name}
        </span>
        {thesis.entity.code ? (
          <span className="text-[10.5px] text-white/50">{thesis.entity.name}</span>
        ) : null}
        <span className="text-[10.5px] text-white/35">·</span>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
          {KIND_LABEL[thesis.kind]} · {STANCE_LABEL[thesis.stance]}
        </span>
      </div>

      <h3 id={titleId} className="text-[14.5px] font-semibold leading-snug text-white">
        <button
          type="button"
          onClick={() => onOpen(thesis.id)}
          className="text-left hover:underline decoration-white/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm"
        >
          {v.claim}
        </button>
      </h3>

      <p
        className="rounded-[10px] px-2.5 py-1.5 text-[11.5px] leading-snug text-white/70"
        style={{
          background: "rgba(248,113,113,0.08)",
          borderLeft: "2px solid rgba(248,113,113,0.6)",
        }}
      >
        <b className="font-semibold text-[#fca5a5]">Falsa se: </b>
        {v.invalidation.replace(/^Esta tese é falsa se[\s,]*/i, "")}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <Tag>{HORIZON_LABEL[thesis.horizon]}</Tag>
        <Tag tone={riskTone(thesis.risk)}>{RISK_LABEL[thesis.risk]}</Tag>
        <Tag
          tone={q.label === "Forte" ? "ok" : q.label === "Média" ? "accent" : "warn"}
          icon={Layers}
        >
          Evidência {q.label.toLowerCase()} · {q.n} fontes
        </Tag>
        <Tag tone={conflict ? "warn" : "mute"}>
          {conflict ? "Conflito declarado" : "Sem conflitos declarados"}
        </Tag>
        {v.conflict.sponsor ? <Tag tone="violet">Patrocinado · {v.conflict.sponsor}</Tag> : null}
        {!thesis.counterOpen ? <Tag tone="warn">Contraditório fechado</Tag> : null}
        {late >= 0 && thesis.status === "ativa" ? (
          <Tag tone={late > 30 ? "crit" : "warn"}>
            {late > 30 ? `Revisão em atraso · ${late} dias` : "Revisão devida"}
          </Tag>
        ) : null}
        {banners.some((b) => b.text.startsWith("Evento material")) ? (
          <Tag tone="warn">Evento material</Tag>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <GhostButton icon={Layers} onClick={() => onOpen(thesis.id, "evidencias")}>
          Ver evidências
        </GhostButton>
        <GhostButton icon={Scale} onClick={() => onCounter(thesis.id)}>
          Contestar{counters ? ` · ${counters}` : ""}
        </GhostButton>
        <GhostButton
          icon={Bell}
          pressed={followed}
          onClick={() => pm.toggleFollowed(thesis.id)}
          label={followed ? "Deixar de seguir tese" : "Seguir tese"}
        >
          {followed ? "A seguir" : "Seguir"}
        </GhostButton>
        <GhostButton
          icon={Bookmark}
          pressed={saved}
          onClick={() => pm.toggleSaved(thesis.id)}
          label={saved ? "Remover dos guardados" : "Guardar tese"}
        >
          <span className="sr-only sm:not-sr-only">{saved ? "Guardada" : "Guardar"}</span>
        </GhostButton>
        <MoreMenu
          onWhy={() => setWhy((w) => !w)}
          whyOpen={why}
          onReport={() => onReport(thesis.id)}
          onHide={() => pm.toggleHidden(thesis.id)}
          onCounterView={() => onOpen(thesis.id, "contraditorio")}
        />
      </footer>

      {why ? (
        <div
          className="rounded-[12px] p-3 text-[11.5px]"
          style={{ background: "var(--aurora-surface-2)" }}
          role="region"
          aria-label="Porque estou a ver isto"
        >
          <p className="mb-1.5 font-semibold text-white/85">Porque estou a ver isto</p>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-white/65">
            {(reasons?.length ? reasons : ["Aparece porque segue a tese ou o autor."]).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-2 text-white/45">
            Pode mudar isto em Controlo do feed, na coluna da direita.
          </p>
        </div>
      ) : null}
    </motion.article>
  );
}

function MoreMenu({
  onWhy,
  whyOpen,
  onReport,
  onHide,
  onCounterView,
}: {
  onWhy: () => void;
  whyOpen: boolean;
  onReport: () => void;
  onHide: () => void;
  onCounterView: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(menuId)} button`)?.focus();
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, menuId]);
  const item = (label: string, Icon: React.ElementType, fn: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        fn();
      }}
      className={
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none " +
        (danger ? "text-[#fca5a5]" : "text-white/85")
      }
    >
      <Icon size={13} aria-hidden />
      {label}
    </button>
  );
  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        aria-label="Mais ações"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-xl bg-white/8 text-white/70 hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <MoreHorizontal size={15} aria-hidden />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute bottom-10 right-0 z-20 flex w-60 flex-col gap-0.5 rounded-[14px] p-1.5"
          style={{
            background: "rgba(14,18,30,0.97)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
          }}
        >
          {item(whyOpen ? "Fechar explicação" : "Porque estou a ver isto?", HelpCircle, onWhy)}
          {item("Ver contraditório", MessageSquareWarning, onCounterView)}
          {item("Ocultar do feed", EyeOff, onHide)}
          {item("Reportar", Flag, onReport, true)}
        </div>
      ) : null}
    </div>
  );
}
