/**
 * Aurora Chat — Instagram-pattern social layer over ProofMarket logic.
 * One step at a time: Feed → Perfil → Chat. Darker "smoked glass" so text
 * stays legible over the room background.
 */
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Bookmark,
  ChevronDown,
  Clock3,
  Gauge,
  Grid3x3,
  Heart,
  Layers,
  MessageCircle,
  MoreHorizontal,
  PenSquare,
  Plus,
  Repeat2,
  Scale,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Author, ReactionId, Thesis } from "@/data/proofmarket/types";
import { useProofMarket } from "@/data/proofmarket/store";
import { ME_ID } from "@/data/proofmarket/seed";
import type { Conversation, Folder } from "@/data/proofmarket/messages";
import {
  daysBetween,
  evidenceQuality,
  formatDate,
  hasConflict,
  iso,
  latest,
  reputationFor,
  scamSignals,
  STATUS_LABEL,
} from "@/lib/proofmarket/rules";
import {
  HORIZON_LABEL,
  KIND_LABEL,
  LEVEL_LABEL,
  REACTIONS,
  RISK_LABEL,
  STANCE_LABEL,
} from "../atoms";

/* ── Material ─────────────────────────────────────────────────────────── */

export const auroraGlass: CSSProperties = {
  background:
    "linear-gradient(165deg, rgba(34,27,22,0.72) 0%, rgba(18,15,14,0.66) 60%, rgba(24,20,18,0.7) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 28,
  backdropFilter: "blur(36px) saturate(140%)",
  WebkitBackdropFilter: "blur(36px) saturate(140%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 40px 80px -30px rgba(0,0,0,0.7)",
};

const chip =
  "rounded-full bg-white/10 text-white transition-colors hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";

function IconBtn({
  icon: Icon,
  label,
  onClick,
  active,
  badge,
  size = 36,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
  size?: number;
}) {
  return (
    <button
      type="button"
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn("relative grid shrink-0 place-items-center", chip, active && "bg-white/25")}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.44)} strokeWidth={1.9} aria-hidden />
      {badge ? (
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e5243b] px-1 text-micro font-bold">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/* ── Avatar ring + thesis art ─────────────────────────────────────────── */

const RING = "conic-gradient(from 210deg, #f9ce34, #ee2a7b, #8a3ab9, #4a9eff, #f9ce34)";

export function Ring({
  initials,
  size = 52,
  seen = false,
  dim = false,
  children,
}: {
  initials: string;
  size?: number;
  seen?: boolean;
  dim?: boolean;
  children?: ReactNode;
}) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: seen ? "rgba(255,255,255,0.28)" : RING,
        padding: size > 60 ? 3 : 2.5,
        opacity: dim ? 0.75 : 1,
      }}
    >
      <span
        className="grid h-full w-full place-items-center rounded-full font-semibold text-white"
        style={{
          background: "linear-gradient(140deg, #3b4558, #161b26)",
          border: `${size > 60 ? 3 : 2}px solid #1a1613`,
          fontSize: Math.max(11, size * 0.27),
        }}
      >
        {initials}
      </span>
      {children}
    </span>
  );
}

const STANCE_COLOR = {
  positiva: "#4ade80",
  negativa: "#f87171",
  neutra: "#93c5fd",
  condicional: "#d8b4fe",
} as const;
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function ThesisArt({ thesis, compact = false }: { thesis: Thesis; compact?: boolean }) {
  const color = STANCE_COLOR[thesis.stance];
  const { line, area } = useMemo(() => {
    let seed = hash(thesis.id);
    const rnd = () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0) % 1000) / 1000;
    const drift = thesis.stance === "positiva" ? 0.9 : thesis.stance === "negativa" ? -0.9 : 0.2;
    const pts: number[] = [];
    let y = 60;
    for (let i = 0; i < 26; i++) {
      y = Math.max(14, Math.min(92, y - drift * 1.6 + (rnd() - 0.5) * 14));
      pts.push(y);
    }
    const l = pts
      .map((p, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * 200).toFixed(1)},${p.toFixed(1)}`)
      .join(" ");
    return { line: l, area: `${l} L200,110 L0,110 Z` };
  }, [thesis.id, thesis.stance]);
  const hue = hash(thesis.entity.id) % 360;
  const gid = `ac-${thesis.id}-${compact ? "c" : "f"}`;
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(120% 90% at 85% 0%, hsla(${hue},70%,52%,0.5), transparent 60%), radial-gradient(90% 80% at 0% 100%, rgba(240,170,90,0.32), transparent 65%), linear-gradient(160deg, #1b2130 0%, #0c1018 100%)`,
      }}
    >
      {!compact ? (
        <span
          className="absolute -bottom-4 right-2 select-none font-black leading-none tracking-tighter"
          style={{ color: "rgba(255,255,255,0.06)", fontSize: 128 }}
        >
          {thesis.entity.code ?? thesis.entity.name.split(" ")[0]}
        </span>
      ) : null}
      <svg
        viewBox="0 0 200 110"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[68%] w-full"
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={compact ? 2.4 : 1.8}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {!compact ? (
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      ) : null}
    </div>
  );
}

const ago = (isoDate: string) => {
  const d = daysBetween(isoDate, iso(Date.now()));
  return d <= 0
    ? "hoje"
    : d === 1
      ? "há 1 dia"
      : d < 30
        ? `há ${d} dias`
        : d < 365
          ? `há ${Math.round(d / 30)} meses`
          : `há ${Math.round(d / 365)} anos`;
};

/* ── Step control (Feed → Perfil → Chat) ─────────────────────────────── */

export type Step = "feed" | "perfil" | "chat";
const STEPS: { id: Step; n: number; label: string; hint: string }[] = [
  { id: "feed", n: 1, label: "Feed", hint: "Descobrir teses" },
  { id: "perfil", n: 2, label: "Perfil", hint: "Desempenho e coleção" },
  { id: "chat", n: 3, label: "Chat", hint: "Conversar e partilhar" },
];

export function StepControl({
  step,
  onStep,
  unread,
}: {
  step: Step;
  onStep: (s: Step) => void;
  unread: number;
}) {
  const idx = STEPS.findIndex((s) => s.id === step);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = STEPS[(idx + (e.key === "ArrowRight" ? 1 : STEPS.length - 1)) % STEPS.length]!;
    onStep(n.id);
    requestAnimationFrame(() => document.getElementById(`ac-step-${n.id}`)?.focus());
  };
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2">
      <div
        role="tablist"
        aria-label="Aurora Chat"
        onKeyDown={onKey}
        className="relative grid grid-cols-3 gap-1 p-1.5"
        style={{ ...auroraGlass, borderRadius: 999 }}
      >
        <motion.span
          aria-hidden
          layout
          className="absolute bottom-1.5 top-1.5 rounded-full"
          style={{
            left: `calc(${(idx * 100) / 3}% + 6px)`,
            width: "calc(33.333% - 8px)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.1))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        />
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            id={`ac-step-${s.id}`}
            role="tab"
            type="button"
            tabIndex={s.id === step ? 0 : -1}
            aria-selected={s.id === step}
            aria-controls="ac-stage"
            onClick={() => onStep(s.id)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-full px-2 py-2 text-[12.5px] font-semibold text-white/65 hover:text-white",
              focusRing,
              s.id === step && "text-white",
            )}
          >
            <span
              className={cn(
                "grid h-5 w-5 place-items-center rounded-full text-micro tabular-nums",
                i <= idx ? "bg-white text-[#1a1613]" : "bg-white/15 text-white/75",
              )}
            >
              {s.n}
            </span>
            {s.label}
            {s.id === "chat" && unread ? (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#e5243b] px-1 text-micro font-bold text-white">
                {unread}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-white/70">
        Passo {idx + 1} de 3 · {STEPS[idx]!.hint}
      </p>
    </div>
  );
}

/* ── FEED ─────────────────────────────────────────────────────────────── */

export function FeedView(props: {
  items: { thesis: Thesis; reasons: string[] }[];
  mode: "paraMim" | "seguindo" | "revisao";
  onMode: (m: "paraMim" | "seguindo" | "revisao") => void;
  counts: Record<"paraMim" | "seguindo" | "revisao", number>;
  authorFilter: string | null;
  onAuthor: (id: string | null) => void;
  onOpen: (id: string, tab?: "resumo" | "evidencias" | "contraditorio") => void;
  onCounter: (id: string) => void;
  onReport: (id: string) => void;
  onCreate: () => void;
  onControls: () => void;
  onProfile: (authorId: string) => void;
  onShare: (t: Thesis) => void;
  onNext: () => void;
  toast: (msg: string, action?: { label: string; run: () => void }) => void;
}) {
  const pm = useProofMarket();
  const others = pm.authors.filter((a) => a.id !== ME_ID);
  return (
    <section
      aria-label="Feed"
      className="mx-auto flex w-full max-w-[600px] min-h-0 flex-1 flex-col overflow-hidden"
      style={auroraGlass}
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5">
        <IconBtn icon={Plus} label="Criar tese" onClick={props.onCreate} />
        <h2 className="flex items-baseline gap-1.5 text-[22px] font-bold tracking-[-0.02em] text-white">
          Aurora{" "}
          <span className="bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#8a3ab9] bg-clip-text font-extrabold text-transparent">
            Chat
          </span>
        </h2>
        <IconBtn icon={SlidersHorizontal} label="Controlo do feed" onClick={props.onControls} />
      </header>
      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        <ul
          className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-3 pt-4"
          aria-label="Autores"
        >
          <li>
            <button
              type="button"
              onClick={props.onCreate}
              className={cn("flex w-[66px] flex-col items-center gap-1.5 rounded-xl", focusRing)}
            >
              <Ring initials={pm.me.initials} size={60} seen>
                <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-[#1a1613] bg-white/92 text-[#0b0f17]">
                  <Plus size={11} aria-hidden />
                </span>
              </Ring>
              <span className="w-full truncate text-center text-[11px] text-white/85">
                A sua tese
              </span>
            </button>
          </li>
          {others.map((a) => {
            const active = props.authorFilter === a.id;
            const fresh = pm.theses.some(
              (t) => t.authorId === a.id && daysBetween(latest(t).date, iso(Date.now())) <= 30,
            );
            return (
              <li key={a.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`Ver teses de ${a.name}`}
                  onClick={() => props.onAuthor(active ? null : a.id)}
                  className={cn(
                    "flex w-[66px] flex-col items-center gap-1.5 rounded-xl",
                    focusRing,
                  )}
                >
                  <motion.span animate={{ scale: active ? 1.06 : 1 }}>
                    <Ring initials={a.initials} size={60} seen={!fresh} />
                  </motion.span>
                  <span
                    className={cn(
                      "w-full truncate text-center text-[11px]",
                      active ? "font-semibold text-white" : "text-white/85",
                    )}
                  >
                    {a.name.split(" ")[0]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div
          role="tablist"
          aria-label="Tipo de feed"
          className="mx-5 mb-3 grid grid-cols-3 gap-1 rounded-full bg-white/8 p-1"
        >
          {(
            [
              ["paraMim", "Para mim"],
              ["seguindo", "Seguindo"],
              ["revisao", "Revisão"],
            ] as const
          ).map(([id, l]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={props.mode === id}
              onClick={() => props.onMode(id)}
              className={cn(
                "rounded-full py-1.5 text-[12px] font-semibold text-white/70 hover:text-white",
                focusRing,
                props.mode === id && "bg-white/18 text-white",
              )}
            >
              {l} <span className="tabular-nums text-white/55">{props.counts[id]}</span>
            </button>
          ))}
        </div>
        {props.authorFilter ? (
          <p className="mx-5 mb-3 flex items-center justify-between gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[12px] text-white">
            Teses de {pm.getAuthor(props.authorFilter).name}
            <span className="flex gap-3">
              <button
                type="button"
                className="font-semibold underline-offset-2 hover:underline"
                onClick={() => props.onProfile(props.authorFilter!)}
              >
                Ver perfil
              </button>
              <button
                type="button"
                className="font-semibold underline-offset-2 hover:underline"
                onClick={() => props.onAuthor(null)}
              >
                Ver todas
              </button>
            </span>
          </p>
        ) : null}
        {props.items.length ? (
          props.items.map(({ thesis, reasons }) => (
            <Post key={thesis.id} thesis={thesis} reasons={reasons} {...props} />
          ))
        ) : (
          <p className="px-5 py-12 text-center text-[13px] text-white/75">
            Nada neste feed. Experimente Para mim.
          </p>
        )}
        <div className="flex flex-col items-center gap-2 border-t border-white/10 px-5 py-6 text-center">
          <p className="text-[12px] text-white/70">Chegou ao fim das teses deste feed.</p>
          <button
            type="button"
            onClick={props.onNext}
            className={cn("px-5 py-2 text-[12.5px] font-semibold", chip)}
          >
            Seguinte: o seu perfil →
          </button>
        </div>
      </div>
    </section>
  );
}

function Post({
  thesis,
  reasons,
  onOpen,
  onCounter,
  onReport,
  onProfile,
  onShare,
  toast,
}: { thesis: Thesis; reasons: string[] } & Parameters<typeof FeedView>[0]) {
  const pm = useProofMarket();
  const v = latest(thesis);
  const a = pm.getAuthor(thesis.authorId);
  const mine = pm.reactions[thesis.id] ?? [];
  const useful = mine.includes("evidencia_util");
  const followed = pm.followed.includes(thesis.id);
  const saved = pm.saved.includes(thesis.id);
  const counters = pm.allCounters.filter((c) => c.thesisId === thesis.id);
  const lastCounter = counters[0];
  const q = evidenceQuality(v);
  const total = Object.values(thesis.reactionCounts).reduce((s, n) => s + n, 0) + mine.length;
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState(false);
  const [why, setWhy] = useState(false);
  const [burst, setBurst] = useState(0);
  const clickTimer = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const detailsId = useId();

  useEffect(() => {
    if (!menu) return;
    const off = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);
  useEffect(
    () => () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
    },
    [],
  );

  const like = (on?: boolean) => {
    if (on === true && useful) {
      setBurst((b) => b + 1);
      return;
    }
    pm.toggleReaction(thesis.id, "evidencia_util");
    if (!useful) setBurst((b) => b + 1);
  };
  const onMedia = () => {
    if (clickTimer.current) return;
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      onOpen(thesis.id);
    }, 260);
  };
  const onMediaDouble = () => {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = null;
    like(true);
  };
  const act = cn(
    "grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/12",
    focusRing,
  );
  const sc = Object.fromEntries(v.scenarios.map((s) => [s.kind, s])) as Record<
    string,
    { probability: number; outcome: string }
  >;

  return (
    <article aria-labelledby={titleId} className="border-t border-white/10 pb-5 pt-4">
      <header className="flex items-center gap-3 px-5">
        <button
          type="button"
          onClick={() => onProfile(a.id)}
          aria-label={`Ver perfil de ${a.name}`}
          className={cn("rounded-full", focusRing)}
        >
          <Ring initials={a.initials} size={40} seen={a.id === ME_ID} />
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onProfile(a.id)}
            className="flex min-h-6 items-center gap-1 truncate text-[13.5px] font-semibold text-white hover:underline"
          >
            {a.handle.replace("@", "")}
            {a.level !== "N1" ? (
              <BadgeCheck
                size={14}
                className="shrink-0 text-[#60a5fa]"
                aria-label={LEVEL_LABEL[a.level]}
              />
            ) : null}
          </button>
          <p className="truncate text-[11.5px] text-white/70">
            {thesis.entity.name}
            {thesis.entity.market ? ` · ${thesis.entity.market}` : ""} · {KIND_LABEL[thesis.kind]}
          </p>
        </div>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Mais ações"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className={act}
          >
            <MoreHorizontal size={18} aria-hidden />
          </button>
          <AnimatePresence>
            {menu ? (
              <motion.div
                role="menu"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-11 z-30 flex w-60 flex-col overflow-hidden rounded-[18px] text-[13px]"
                style={{
                  transformOrigin: "top right",
                  background: "rgba(24,20,18,0.97)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
                }}
              >
                {(
                  [
                    ["Porque estou a ver isto?", () => setWhy((w) => !w), false],
                    ["Ver tese completa", () => onOpen(thesis.id), false],
                    ["Ver evidências", () => onOpen(thesis.id, "evidencias"), false],
                    ["Ir para o perfil", () => onProfile(a.id), false],
                    [
                      "Ocultar do feed",
                      () => {
                        pm.toggleHidden(thesis.id);
                        toast("Tese ocultada do feed.", {
                          label: "Desfazer",
                          run: () => pm.toggleHidden(thesis.id),
                        });
                      },
                      false,
                    ],
                    ["Reportar", () => onReport(thesis.id), true],
                  ] as [string, () => void, boolean][]
                ).map(([l, fn, danger]) => (
                  <button
                    key={l}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      fn();
                    }}
                    className={cn(
                      "border-b border-white/8 px-4 py-3 text-left last:border-0 hover:bg-white/8 focus-visible:bg-white/10 focus-visible:outline-none",
                      danger ? "font-semibold text-[#fda4af]" : "text-white",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <div className="relative mt-3">
        <button
          type="button"
          onClick={onMedia}
          onDoubleClick={onMediaDouble}
          aria-label={`Abrir tese ${thesis.id}. Toque duas vezes para marcar Evidência útil.`}
          className={cn("relative block aspect-[4/3] w-full overflow-hidden text-left", focusRing)}
        >
          <ThesisArt thesis={thesis} />
          <span className="absolute left-4 right-4 top-4 flex flex-wrap gap-1.5 sm:right-36">
            {[
              HORIZON_LABEL[thesis.horizon],
              RISK_LABEL[thesis.risk],
              STANCE_LABEL[thesis.stance],
            ].map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
              >
                {t}
              </span>
            ))}
            {thesis.status !== "ativa" ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#1a1613]">
                {STATUS_LABEL[thesis.status]}
              </span>
            ) : null}
          </span>
          <span className="absolute right-4 top-4 hidden rounded-full bg-black/55 sm:block px-2.5 py-1 font-mono text-micro text-white/90 backdrop-blur-md">
            {thesis.id} · v{v.version}
          </span>
          <span className="absolute inset-x-4 bottom-4 rounded-[14px] bg-black/60 px-3.5 py-2.5 text-[12px] leading-snug text-white backdrop-blur-md">
            <b className="text-[#fda4af]">Falsa se </b>
            {v.invalidation.replace(/^Esta tese é falsa se[\s,]*/i, "")}
          </span>
        </button>
        <AnimatePresence>
          {burst ? (
            <motion.span
              key={burst}
              aria-hidden
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.12, 1], opacity: [0, 1, 1] }}
              exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onAnimationComplete={() => window.setTimeout(() => setBurst(0), 350)}
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <Heart
                size={96}
                fill="#ff3b5c"
                stroke="none"
                style={{ filter: "drop-shadow(0 8px 24px rgba(255,59,92,0.55))" }}
              />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-0.5 px-3 pt-1.5">
        <motion.button
          whileTap={{ scale: 0.82 }}
          type="button"
          className={act}
          aria-pressed={useful}
          aria-label={useful ? "Retirar Evidência útil" : "Marcar Evidência útil"}
          onClick={() => like()}
        >
          <motion.span
            key={String(useful)}
            initial={{ scale: useful ? 0.6 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
          >
            <Heart
              size={24}
              aria-hidden
              fill={useful ? "#ff3b5c" : "none"}
              stroke={useful ? "#ff3b5c" : "currentColor"}
            />
          </motion.span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          className={act}
          aria-label={`Contestar (${counters.length} contra-teses)`}
          onClick={() => onCounter(thesis.id)}
        >
          <MessageCircle size={23} aria-hidden />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          className={act}
          aria-pressed={followed}
          aria-label={followed ? "Deixar de seguir tese" : "Seguir tese"}
          onClick={() => {
            pm.toggleFollowed(thesis.id);
            toast(
              followed ? "Deixou de seguir a tese." : "A seguir: recebe revisões e contra-teses.",
            );
          }}
        >
          <Repeat2 size={24} aria-hidden stroke={followed ? "#7dd3fc" : "currentColor"} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          className={act}
          aria-label="Partilhar num chat"
          onClick={() => onShare(thesis)}
        >
          <Send size={22} aria-hidden />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          className={cn(act, "ml-auto")}
          aria-pressed={saved}
          aria-label={saved ? "Remover dos guardados" : "Guardar tese"}
          onClick={() => {
            pm.toggleSaved(thesis.id);
            toast(saved ? "Removida dos guardados." : "Guardada na secção privada do seu perfil.");
          }}
        >
          <Bookmark size={23} aria-hidden fill={saved ? "currentColor" : "none"} />
        </motion.button>
      </div>

      <div className="flex flex-col gap-1.5 px-5">
        <p className="text-[13px] font-semibold tabular-nums text-white">
          {thesis.reactionCounts.evidencia_util + (useful ? 1 : 0)} evidência útil · {total} reações
        </p>
        <h3 id={titleId} className="text-[13.5px] leading-snug text-white">
          <button
            type="button"
            onClick={() => onProfile(a.id)}
            className="mr-1 font-semibold hover:underline"
          >
            {a.handle.replace("@", "")}
          </button>
          {v.claim}
        </h3>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <Fact icon={Layers}>
            Evidência {q.label.toLowerCase()} · {q.strong}/{q.n} fontes fortes
          </Fact>
          <Fact tone={hasConflict(v) ? "warn" : undefined}>
            {hasConflict(v) ? "Conflito declarado" : "Sem conflitos"}
          </Fact>
          {v.conflict.sponsor ? (
            <Fact tone="violet">Patrocinado · {v.conflict.sponsor}</Fact>
          ) : null}
          <Fact icon={Clock3}>Revisão {formatDate(thesis.reviewDue)}</Fact>
        </div>

        <button
          type="button"
          aria-expanded={more}
          aria-controls={detailsId}
          onClick={() => setMore((m) => !m)}
          className="flex min-h-6 items-center gap-1 self-start text-[12.5px] font-medium text-white/75 hover:text-white"
        >
          {more ? "Menos" : "Mais detalhes"}{" "}
          <ChevronDown
            size={14}
            aria-hidden
            className={cn("transition-transform", more && "rotate-180")}
          />
        </button>
        <AnimatePresence initial={false}>
          {more ? (
            <motion.div
              id={detailsId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 rounded-[16px] bg-white/6 p-3.5 text-[12.5px] text-white/85">
                <div>
                  <p className="mb-1 text-micro font-semibold uppercase tracking-[0.12em] text-white/55">
                    Mecanismo
                  </p>
                  <p className="leading-relaxed">{v.mechanism}</p>
                </div>
                <div>
                  <p className="mb-1 text-micro font-semibold uppercase tracking-[0.12em] text-white/55">
                    Premissas
                  </p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    {v.assumptions.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="mb-1.5 text-micro font-semibold uppercase tracking-[0.12em] text-white/55">
                    Cenários declarados
                  </p>
                  <div
                    className="flex h-2.5 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`Base ${sc.base?.probability}%, positivo ${sc.positivo?.probability}%, adverso ${sc.adverso?.probability}%`}
                  >
                    <span style={{ width: `${sc.base?.probability}%`, background: "#60a5fa" }} />
                    <span
                      style={{ width: `${sc.positivo?.probability}%`, background: "#4ade80" }}
                    />
                    <span style={{ width: `${sc.adverso?.probability}%`, background: "#f87171" }} />
                  </div>
                  <ul className="mt-2 space-y-1">
                    {(["base", "positivo", "adverso"] as const).map((k) => (
                      <li key={k} className="flex gap-2">
                        <b className="w-20 shrink-0 capitalize text-white">
                          {k} {sc[k]?.probability}%
                        </b>
                        <span>{sc[k]?.outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-micro font-semibold uppercase tracking-[0.12em] text-white/55">
                    Reações estruturadas
                  </p>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reagir">
                    {REACTIONS.map((r) => {
                      const on = mine.includes(r.id as ReactionId);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => pm.toggleReaction(thesis.id, r.id)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[11.5px] font-semibold",
                            focusRing,
                            on
                              ? "bg-white text-[#1a1613]"
                              : "bg-white/10 text-white hover:bg-white/18",
                          )}
                        >
                          {r.label}{" "}
                          <span className="tabular-nums opacity-60">
                            {thesis.reactionCounts[r.id] + (on ? 1 : 0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(thesis.id)}
                  className={cn("self-start px-4 py-2 text-[12.5px] font-semibold", chip)}
                >
                  Ver tese completa
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {lastCounter ? (
          <p className="text-[12.5px] leading-snug text-white/85">
            <b className="font-semibold text-white">
              {pm.getAuthor(lastCounter.authorId).handle.replace("@", "")}
            </b>{" "}
            {lastCounter.body.slice(0, 110)}
            {lastCounter.body.length > 110 ? "…" : ""}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onOpen(thesis.id, "contraditorio")}
          className="min-h-6 self-start text-[12.5px] text-white/65 hover:text-white"
        >
          {counters.length ? `Ver as ${counters.length} contra-teses` : "Ainda sem contraditório"}
        </button>
        {why ? (
          <div
            className="rounded-[14px] bg-white/8 p-3 text-[12px] text-white/85"
            role="region"
            aria-label="Porque estou a ver isto"
          >
            <p className="mb-1 font-semibold text-white">Porque está a ver esta tese</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => onCounter(thesis.id)}
          className="mt-1 flex items-center gap-2.5 text-left text-[12.5px] text-white/55 hover:text-white"
        >
          <Ring initials={pm.me.initials} size={26} seen /> Contestar com evidência…
        </button>
        <p className="text-micro uppercase tracking-[0.06em] text-white/50">{ago(v.date)}</p>
      </div>
    </article>
  );
}

function Fact({
  children,
  icon: Icon,
  tone,
}: {
  children: ReactNode;
  icon?: React.ElementType;
  tone?: "warn" | "violet";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
        tone === "warn"
          ? "bg-[#f59e0b]/20 text-[#fde68a]"
          : tone === "violet"
            ? "bg-[#a855f7]/22 text-[#f5d0fe]"
            : "bg-white/10 text-white/85",
      )}
    >
      {Icon ? <Icon size={12} aria-hidden /> : null}
      {children}
    </span>
  );
}

/* ── PERFIL ───────────────────────────────────────────────────────────── */

type GridTab = "teses" | "seguir" | "guardadas" | "revisoes" | "contestou";

export function ProfileView({
  authorId,
  onOpen,
  onCreate,
  onReview,
  onMessage,
  onBackToMe,
  onNext,
  toast,
}: {
  authorId: string;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onReview: (id: string) => void;
  onMessage: (authorId: string) => void;
  onBackToMe: () => void;
  onNext: () => void;
  toast: (m: string) => void;
}) {
  const pm = useProofMarket();
  const a = pm.getAuthor(authorId);
  const isMe = a.id === ME_ID;
  const today = iso(Date.now());
  const own = pm.theses.filter((t) => t.authorId === a.id);
  const contested = pm.allCounters.filter((c) => c.authorId === a.id);
  const reviewed = own.filter((t) => t.reviews.length);
  const onTime = reviewed.filter((t) => t.reviews[t.reviews.length - 1]!.onTime).length;
  const due = own.filter(
    (t) => isMe && t.status === "ativa" && daysBetween(t.reviewDue, today) >= -7,
  );
  const [tab, setTab] = useState<GridTab>(isMe ? "seguir" : "teses");
  useEffect(() => setTabSafe(), [authorId]); // eslint-disable-line react-hooks/exhaustive-deps
  function setTabSafe() {
    setTab(isMe ? "seguir" : "teses");
  }
  const lists: Partial<Record<GridTab, Thesis[]>> = isMe
    ? {
        seguir: pm.theses.filter((t) => pm.followed.includes(t.id)),
        teses: own,
        guardadas: pm.theses.filter((t) => pm.saved.includes(t.id)),
        revisoes: pm.theses.filter((t) => t.reviews.length > 0),
      }
    : {
        teses: own,
        contestou: pm.theses.filter((t) => contested.some((c) => c.thesisId === t.id)),
      };
  const tabs = (
    isMe
      ? [
          ["seguir", Grid3x3, "A seguir"],
          ["teses", PenSquare, "As minhas"],
          ["revisoes", Clock3, "Revisões"],
          ["guardadas", Bookmark, "Guardadas"],
        ]
      : [
          ["teses", Grid3x3, "Teses"],
          ["contestou", Scale, "Contestou"],
        ]
  ) as [GridTab, React.ElementType, string][];
  const grid = lists[tab] ?? [];
  const followsAuthor = pm.followedAuthors.includes(a.id);
  const stats: [string, number | string][] = isMe
    ? [
        ["teses", own.length],
        ["a seguir", pm.followed.length],
        ["guardadas", pm.saved.length],
        ["contra-teses", contested.length],
      ]
    : [
        ["teses", own.length],
        ["contra-teses", contested.length],
        ["revistas no prazo", reviewed.length ? `${onTime}/${reviewed.length}` : "—"],
        ["domínios", a.domains.length],
      ];
  const highlights: [string, React.ElementType, GridTab][] = isMe
    ? [
        ["Revisões", Clock3, "revisoes"],
        ["Guardadas", Bookmark, "guardadas"],
        ["As minhas", PenSquare, "teses"],
        ["A seguir", Grid3x3, "seguir"],
      ]
    : [
        ["Teses", Grid3x3, "teses"],
        ["Contestou", Scale, "contestou"],
      ];

  return (
    <section
      aria-label={`Perfil de ${a.name}`}
      className="mx-auto flex w-full max-w-[920px] min-h-0 flex-1 flex-col overflow-hidden"
      style={auroraGlass}
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5">
        {isMe ? (
          <span className="w-9" />
        ) : (
          <IconBtn icon={ArrowLeft} label="Voltar ao seu perfil" onClick={onBackToMe} />
        )}
        <h2 className="truncate text-[16px] font-semibold text-white">
          {a.handle.replace("@", "")}
        </h2>
        {isMe ? (
          <IconBtn icon={Plus} label="Criar tese" onClick={onCreate} />
        ) : (
          <span className="w-9" />
        )}
      </header>
      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-6 px-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-5">
              <Ring initials={a.initials} size={96} seen={false} />
              <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map(([l, n]) => (
                  <div key={l} className="flex flex-col-reverse text-center">
                    <dt className="text-[11.5px] text-white/70">{l}</dt>
                    <dd className="text-[18px] font-bold tabular-nums text-white">{n}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-1.5 text-[15px] font-semibold text-white">
                {a.name}
                {a.level !== "N1" ? (
                  <BadgeCheck size={16} className="text-[#60a5fa]" aria-hidden />
                ) : null}
              </p>
              <p className="text-[12.5px] font-medium text-[#93c5fd]">{LEVEL_LABEL[a.level]}</p>
              <p className="text-[13px] leading-relaxed text-white/85">
                {a.declared ? `${a.declared} (declarado). ` : ""}
                {isMe
                  ? "Perfil de demonstração. Publique teses com fontes, conflitos e data de revisão."
                  : ""}
              </p>
              {a.domains.length ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {a.domains.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/85"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <Verified author={a} />
            <div className="flex flex-wrap gap-2">
              {isMe ? (
                <>
                  {due[0] ? (
                    <button
                      type="button"
                      onClick={() => onReview(due[0]!.id)}
                      className="flex-1 rounded-xl bg-white/92 px-4 py-2 text-[13px] font-semibold text-[#0b0f17] hover:bg-white"
                    >
                      Rever tese ({due.length})
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onCreate}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-2 text-[13px] font-semibold",
                      chip,
                      "rounded-xl",
                    )}
                  >
                    Criar tese
                  </button>
                  <button
                    type="button"
                    onClick={() => toast("A partilha de perfis fica disponível com servidor.")}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-2 text-[13px] font-semibold",
                      chip,
                      "rounded-xl",
                    )}
                  >
                    Partilhar perfil
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-pressed={followsAuthor}
                    onClick={() => {
                      pm.toggleFollowAuthor(a.id);
                      toast(
                        followsAuthor
                          ? `Deixou de seguir ${a.name}.`
                          : `A seguir ${a.name}. As teses aparecem em Seguindo.`,
                      );
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold",
                      followsAuthor
                        ? "bg-white/12 text-white"
                        : "bg-white/92 text-[#0b0f17] hover:bg-white",
                    )}
                  >
                    <UserPlus size={15} aria-hidden /> {followsAuthor ? "A seguir" : "Seguir"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onMessage(a.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold",
                      chip,
                      "rounded-xl",
                    )}
                  >
                    <MessageCircle size={15} aria-hidden /> Mensagem
                  </button>
                </>
              )}
            </div>
            <ul className="no-scrollbar flex gap-4 overflow-x-auto pb-1" aria-label="Destaques">
              {highlights.map(([l, Icon, t]) => (
                <li key={l}>
                  <button
                    type="button"
                    onClick={() => setTab(t)}
                    aria-pressed={tab === t}
                    className={cn("flex w-16 flex-col items-center gap-1.5 rounded-xl", focusRing)}
                  >
                    <span
                      className={cn(
                        "grid h-14 w-14 place-items-center rounded-full border-2",
                        tab === t ? "border-white bg-white/16" : "border-white/25 bg-white/6",
                      )}
                    >
                      <Icon size={20} className="text-white" aria-hidden />
                    </span>
                    <span className="text-[11px] text-white/85">{l}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Performance author={a} />
        </div>

        <div
          role="tablist"
          aria-label="Coleção"
          className="sticky top-0 z-10 flex border-y border-white/10 bg-[rgba(22,18,16,0.85)] backdrop-blur-md"
        >
          {tabs.map(([id, Icon, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-3 text-[12px] font-semibold text-white/60 hover:text-white",
                focusRing,
                tab === id && "text-white shadow-[inset_0_-2px_0_#fff]",
              )}
            >
              <Icon size={15} aria-hidden /> <span className="hidden sm:inline">{label}</span>{" "}
              <span className="tabular-nums text-white/50">{lists[id]?.length ?? 0}</span>
            </button>
          ))}
        </div>
        {grid.length ? (
          <ul
            className="grid grid-cols-3 gap-[3px] p-[3px]"
            aria-label={tabs.find((t) => t[0] === tab)?.[2]}
          >
            {grid.map((t) => {
              const tv = latest(t);
              const cc = pm.allCounters.filter((c) => c.thesisId === t.id).length;
              const rc = Object.values(t.reactionCounts).reduce((s, n) => s + n, 0);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(t.id)}
                    aria-label={`${t.entity.code ?? t.entity.name}: ${tv.claim}`}
                    className={cn(
                      "group relative block aspect-square w-full overflow-hidden",
                      focusRing,
                    )}
                  >
                    <ThesisArt thesis={t} compact />
                    <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-micro font-bold text-white">
                      {t.entity.code ?? t.entity.name.split(" ")[0]}
                    </span>
                    {t.status !== "ativa" ? (
                      <span className="absolute right-2 top-2 rounded-md bg-white px-1.5 py-0.5 text-micro font-bold text-[#1a1613]">
                        {STATUS_LABEL[t.status]}
                      </span>
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center gap-4 bg-black/55 text-[13px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="flex items-center gap-1">
                        <Heart size={15} fill="#fff" aria-hidden /> {rc}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={15} fill="#fff" aria-hidden /> {cc}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-[13px] text-white/70">
            Ainda nada nesta coleção.
          </p>
        )}
        <div className="flex justify-center px-5 py-6">
          <button
            type="button"
            onClick={onNext}
            className={cn("px-5 py-2 text-[12.5px] font-semibold", chip)}
          >
            Seguinte: Chat →
          </button>
        </div>
      </div>
    </section>
  );
}

function Verified({ author }: { author: Author }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="rounded-[16px] bg-white/6 p-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 text-left text-[12.5px] font-semibold text-white",
          focusRing,
        )}
      >
        <span className="flex items-center gap-1.5">
          <BadgeCheck size={15} className="text-[#60a5fa]" aria-hidden /> O que foi verificado
        </span>
        <ChevronDown
          size={15}
          aria-hidden
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <dl
          id={id}
          className="mt-2.5 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12px]"
        >
          <dt className="text-white/60">Verificado</dt>
          <dd className="text-white">{author.verifiedWhat}</dd>
          <dt className="text-white/60">Por</dt>
          <dd className="text-white">{author.verifiedBy}</dd>
          <dt className="text-white/60">Data</dt>
          <dd className="text-white tabular-nums">{formatDate(author.verifiedAt)}</dd>
          <dt className="text-white/60">Validade</dt>
          <dd className="text-white">
            {author.validUntil ? `até ${formatDate(author.validUntil)}` : "Sem expiração"}
          </dd>
          <dt className="text-white/60">Limites</dt>
          <dd className="text-white">{author.limits}</dd>
        </dl>
      ) : null}
    </div>
  );
}

const HOW_TO: Record<string, string> = {
  evidencia: "Use fontes primárias ou oficiais, sempre com data. Fontes secundárias contam metade.",
  rigor:
    "Declare probabilidades honestas nos cenários. O Brier mede a distância entre a probabilidade e o resultado.",
  revisao:
    "Reveja até 7 dias depois da data marcada. Rever uma tese que falhou também conta a favor.",
  transparencia:
    "Declare posição, remuneração, patrocínio e relação com a entidade em cada versão.",
  correcoes:
    "Corrija erros factuais cedo, com nota pública. Correções voluntárias aumentam a confiança.",
};

function Performance({ author }: { author: Author }) {
  const pm = useProofMarket();
  const dims = reputationFor(author, pm.theses);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section aria-labelledby="ac-perf" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 id="ac-perf" className="flex items-center gap-1.5 text-[14px] font-semibold text-white">
          <Gauge size={16} aria-hidden /> Desempenho
        </h3>
        <span className="text-[11px] text-white/60">
          {author.forecasts[0]?.domain ?? "Sem domínio ainda"}
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {dims.map((d) => {
          const isOpen = open === d.key;
          return (
            <li key={d.key} className={cn(d.key === "correcoes" && "sm:col-span-2")}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : d.key)}
                className={cn(
                  "flex w-full flex-col gap-1.5 rounded-[16px] bg-white/7 p-3 text-left transition-colors hover:bg-white/11",
                  focusRing,
                  isOpen && "bg-white/12",
                )}
              >
                <span className="flex items-center justify-between gap-2 text-[11.5px] text-white/70">
                  {d.label}
                  <ChevronDown
                    size={13}
                    aria-hidden
                    className={cn("transition-transform", isOpen && "rotate-180")}
                  />
                </span>
                <span className="text-[17px] font-bold tabular-nums text-white">
                  {d.enough ? d.value : "Dados insuficientes"}
                </span>
                {d.enough && d.ratio !== undefined ? (
                  <span className="h-1.5 overflow-hidden rounded-full bg-white/12" aria-hidden>
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: d.ratio }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    />
                  </span>
                ) : null}
                <span className="text-[11px] text-white/60">{d.sample}</span>
                {isOpen ? (
                  <span className="mt-1 flex flex-col gap-1 border-t border-white/10 pt-2 text-[12px] leading-relaxed text-white/85">
                    <span>{d.note}</span>
                    <span>
                      <b className="text-white">Como melhorar: </b>
                      {HOW_TO[d.key]}
                    </span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-white/55">
        Likes e seguidores não contam. Não há ranking geral de autores.
      </p>
    </section>
  );
}

/* ── CHAT ─────────────────────────────────────────────────────────────── */

function when(at: number) {
  const m = Math.round((Date.now() - at) / 60000);
  return m < 60
    ? `${Math.max(1, m)} min`
    : m < 1440
      ? `${Math.round(m / 60)} h`
      : `${Math.round(m / 1440)} d`;
}

export function ChatView({
  openId,
  setOpenId,
  onOpenThesis,
  onProfile,
  onShareFromChat,
}: {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onOpenThesis: (id: string) => void;
  onProfile: (authorId: string) => void;
  onShareFromChat: (convId: string) => void;
}) {
  const pm = useProofMarket();
  const [folder, setFolder] = useState<Folder>("principal");
  const [q, setQ] = useState("");
  const [noteEdit, setNoteEdit] = useState(false);
  const requests = pm.conversations.filter((c) => c.folder === "pedidos").length;
  const list = pm.conversations
    .filter((c) => c.folder === folder)
    .filter(
      (c) =>
        !q.trim() ||
        (c.name + c.messages.map((m) => m.text).join(" "))
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
    );
  const open = pm.conversations.find((c) => c.id === openId) ?? null;
  useEffect(() => {
    if (open && open.folder !== folder) setFolder(open.folder);
    if (open?.unread) pm.readConversation(open.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);
  return (
    <section
      aria-label="Chat"
      className="mx-auto grid w-full max-w-[1000px] min-h-0 flex-1 overflow-hidden md:grid-cols-[340px_minmax(0,1fr)]"
      style={auroraGlass}
    >
      <div
        className={cn(
          "flex min-h-0 flex-col border-white/10 md:border-r",
          open && "hidden md:flex",
        )}
      >
        <header className="flex items-center justify-between gap-2 px-5 pt-4">
          <h2 className="text-[18px] font-bold text-white">Chat</h2>
          <div className="flex gap-1.5">
            <IconBtn
              icon={PenSquare}
              label="Escrever nota"
              onClick={() => setNoteEdit((n) => !n)}
              active={noteEdit}
              size={34}
            />
            <IconBtn
              icon={Bell}
              label="Pedidos de mensagem"
              onClick={() => setFolder("pedidos")}
              badge={requests}
              size={34}
            />
          </div>
        </header>
        {noteEdit ? (
          <form
            className="mx-5 mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setNoteEdit(false);
            }}
          >
            <label htmlFor="ac-note" className="sr-only">
              A sua nota
            </label>
            <input
              id="ac-note"
              maxLength={60}
              value={pm.myNote}
              onChange={(e) => pm.setNote(e.target.value)}
              placeholder="Ex.: A rever a tese da Amazon"
              className="min-w-0 flex-1 rounded-full bg-white/12 px-3.5 py-2 text-[12.5px] text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/60"
            />
            <button type="submit" className={cn("px-4 text-[12px] font-semibold", chip)}>
              Guardar
            </button>
          </form>
        ) : null}
        <ul className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-1 pt-7" aria-label="Notas">
          <li className="flex w-[62px] flex-col items-center gap-1">
            <span className="relative">
              {pm.myNote ? (
                <span className="absolute -top-5 left-1/2 z-10 max-w-[66px] -translate-x-1/2 truncate rounded-2xl bg-white px-2 py-0.5 text-micro font-medium text-[#1a1613]">
                  {pm.myNote}
                </span>
              ) : null}
              <Ring initials={pm.me.initials} size={54} seen />
            </span>
            <span className="text-[11px] text-white/80">A sua nota</span>
          </li>
          {pm.conversations
            .filter((c) => c.note)
            .map((c) => (
              <li key={c.id} className="flex w-[62px] flex-col items-center gap-1">
                <span className="relative">
                  <span
                    className="absolute -top-5 left-1/2 z-10 max-w-[66px] -translate-x-1/2 truncate rounded-2xl bg-white px-2 py-0.5 text-micro font-medium text-[#1a1613]"
                    title={c.note}
                  >
                    {c.note}
                  </span>
                  <Ring initials={c.initials} size={54} />
                </span>
                <span className="w-full truncate text-center text-[11px] text-white/80">
                  {c.name.split(" ")[0]}
                </span>
              </li>
            ))}
        </ul>
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 focus-within:ring-2 focus-within:ring-white/60">
          <Search size={15} className="text-white/70" aria-hidden />
          <label htmlFor="ac-search" className="sr-only">
            Pesquisar mensagens
          </label>
          <input
            id="ac-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white placeholder:text-white/55 outline-none"
          />
        </div>
        <div role="tablist" aria-label="Pastas" className="mx-5 mt-3 grid grid-cols-3 gap-1">
          {(
            [
              ["principal", "Principal"],
              ["geral", "Geral"],
              ["pedidos", "Pedidos"],
            ] as const
          ).map(([id, l]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={folder === id}
              onClick={() => setFolder(id)}
              className={cn(
                "rounded-full py-1.5 text-[12px] font-semibold text-white/65 hover:text-white",
                focusRing,
                folder === id && "bg-white/16 text-white",
              )}
            >
              {l}
              {id === "pedidos" && requests ? ` (${requests})` : ""}
            </button>
          ))}
        </div>
        <p className="mx-5 mt-2 text-micro text-white/50">
          {folder === "principal"
            ? "Notificações ligadas."
            : folder === "geral"
              ? "Sem notificações; para ler mais tarde."
              : "Contas que ainda não aceitou. Mensagens suspeitas ficam aqui."}
        </p>
        <ul className="thin-scrollbar mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pb-4">
          {list.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const risky = !!last && last.from === "them" && scamSignals(last.text).length > 0;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={openId === c.id}
                  onClick={() => {
                    setOpenId(c.id);
                    pm.readConversation(c.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left hover:bg-white/8",
                    focusRing,
                    openId === c.id && "bg-white/12",
                  )}
                >
                  <Ring initials={c.initials} size={50} seen={c.unread === 0} dim={!c.verified} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-white">
                      {c.name}
                      {!c.verified ? (
                        <span className="rounded-full bg-[#e5243b] px-1.5 text-micro font-bold">
                          Não verificado
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-[12px]",
                        c.unread ? "font-semibold text-white" : "text-white/65",
                      )}
                    >
                      {risky ? "⚠ Possível burla · " : last?.from === "me" ? "Você: " : ""}
                      {last
                        ? last.thesisId
                          ? `Partilhou ${last.thesisId}`
                          : last.text
                        : "Nova conversa"}
                      {last ? ` · ${when(last.at)}` : ""}
                    </span>
                  </span>
                  {c.unread ? (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#4a9eff]"
                      aria-label="Por ler"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
          {!list.length ? (
            <li className="py-10 text-center text-[12.5px] text-white/65">
              {folder === "pedidos" ? "Sem pedidos de mensagem." : "Sem conversas."}
            </li>
          ) : null}
        </ul>
      </div>
      <div className={cn("min-h-0 flex-col", open ? "flex" : "hidden md:flex")}>
        {open ? (
          <Thread
            conv={open}
            onBack={() => setOpenId(null)}
            onOpenThesis={onOpenThesis}
            onProfile={onProfile}
            onShare={() => onShareFromChat(open.id)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-white/60">
              <Send size={34} className="text-white" aria-hidden />
            </span>
            <p className="text-[18px] font-semibold text-white">As suas mensagens</p>
            <p className="max-w-[280px] text-[12.5px] text-white/70">
              Partilhe teses e converse com autores. A Aurora nunca pede pagamentos por mensagem.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Thread({
  conv,
  onBack,
  onOpenThesis,
  onProfile,
  onShare,
}: {
  conv: Conversation;
  onBack: () => void;
  onOpenThesis: (id: string) => void;
  onProfile: (authorId: string) => void;
  onShare: () => void;
}) {
  const pm = useProofMarket();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [conv.id]);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv.messages.length, conv.id]);
  const flagged = conv.messages.some((m) => m.from === "them" && scamSignals(m.text).length > 0);
  const author = conv.authorId ? pm.getAuthor(conv.authorId) : null;
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const s = scamSignals(t);
    if (s.length) {
      setErr(
        `Não enviado: ${s.join(", ")}. Mantenha a conversa na plataforma e sem pedidos de dinheiro.`,
      );
      return;
    }
    setErr("");
    pm.sendMessage(conv.id, t);
    setText("");
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar às conversas"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10 md:hidden",
            focusRing,
          )}
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <Ring initials={conv.initials} size={40} seen dim={!conv.verified} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">{conv.name}</p>
          <p className="text-[11.5px] text-white/65">
            {author ? LEVEL_LABEL[author.level] : "Conta não verificada"}
          </p>
        </div>
        {author ? (
          <IconBtn
            icon={Gauge}
            label={`Ver perfil e desempenho de ${conv.name}`}
            onClick={() => onProfile(author.id)}
            size={34}
          />
        ) : null}
      </header>
      {flagged ? (
        <div
          role="alert"
          className="mx-4 mt-3 flex items-start gap-2 rounded-[14px] bg-[#7f1d1d] px-3.5 py-2.5 text-[12px] text-white"
        >
          <ShieldAlert size={15} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            Esta conversa tem sinais de burla: pedido de dinheiro, promessa de retorno ou contacto
            fora da plataforma. A Aurora nunca pede pagamentos por mensagem.
          </span>
        </div>
      ) : null}
      <ol
        ref={listRef}
        className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        aria-label={`Conversa com ${conv.name}`}
      >
        {!conv.messages.length ? (
          <li className="m-auto text-center text-[12.5px] text-white/65">
            Diga olá ou partilhe uma tese.
          </li>
        ) : null}
        {conv.messages.map((m) => {
          const t = m.thesisId ? pm.getThesis(m.thesisId) : undefined;
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex max-w-[78%] flex-col gap-1",
                m.from === "me" ? "self-end items-end" : "self-start items-start",
              )}
            >
              {t ? (
                <button
                  type="button"
                  onClick={() => onOpenThesis(t.id)}
                  className={cn(
                    "w-[240px] overflow-hidden rounded-[18px] bg-[#211b17] text-left",
                    focusRing,
                  )}
                >
                  <span className="relative block aspect-[16/10]">
                    <ThesisArt thesis={t} compact />
                  </span>
                  <span className="block px-3 py-2">
                    <span className="block text-[11px] font-semibold text-white/70">
                      {pm.getAuthor(t.authorId).handle} · {t.entity.code ?? t.entity.name}
                    </span>
                    <span className="line-clamp-2 block text-[12.5px] text-white">
                      {latest(t).claim}
                    </span>
                  </span>
                </button>
              ) : null}
              {m.text ? (
                <span
                  className={cn(
                    "rounded-[20px] px-3.5 py-2 text-[13px] leading-snug text-white",
                    m.from === "me"
                      ? "rounded-br-md bg-[linear-gradient(135deg,#7c3aed,#2563eb)]"
                      : "rounded-bl-md bg-white/14",
                  )}
                >
                  {m.text}
                </span>
              ) : null}
              <span className="px-1 text-micro text-white/50">{when(m.at)}</span>
            </motion.li>
          );
        })}
      </ol>
      {conv.folder === "pedidos" ? (
        <div className="flex flex-col gap-2 border-t border-white/10 p-3.5">
          <p className="text-[11.5px] text-white/70">
            Esta conta quer enviar-lhe mensagens. Só verá as mensagens seguintes se aceitar.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                pm.moveConversation(conv.id, null);
                onBack();
              }}
              className="flex-1 rounded-xl bg-[#e5243b] py-2.5 text-[12.5px] font-semibold text-white hover:brightness-110"
            >
              Recusar e bloquear
            </button>
            <button
              type="button"
              onClick={() => pm.moveConversation(conv.id, "geral")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-[12.5px] font-semibold",
                chip,
                "rounded-xl",
              )}
            >
              Aceitar
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-2 border-t border-white/10 p-3.5">
          {err ? (
            <p role="alert" className="text-[12px] text-[#fecaca]">
              {err}
            </p>
          ) : null}
          <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-4 pr-1 focus-within:ring-2 focus-within:ring-white/60">
            <label htmlFor={`ac-dm-${conv.id}`} className="sr-only">
              Mensagem para {conv.name}
            </label>
            <input
              ref={inputRef}
              id={`ac-dm-${conv.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Mensagem…"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-white placeholder:text-white/55 outline-none"
            />
            <button
              type="button"
              onClick={onShare}
              aria-label="Partilhar uma tese nesta conversa"
              className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/12"
            >
              <Layers size={17} aria-hidden />
            </button>
            <button
              type="submit"
              aria-label="Enviar mensagem"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/92 text-[#0b0f17] hover:bg-white"
            >
              <Send size={15} aria-hidden />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
