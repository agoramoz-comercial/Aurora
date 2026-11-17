/**
 * Spatial three-pane social layout (profile · feed · messages) on frosted
 * "milk glass" panes that float over the Aurora room background.
 * The logic underneath is ProofMarket: posts are auditable theses.
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
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Camera,
  Clock3,
  Gauge,
  Grid3x3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  PenSquare,
  Plus,
  Repeat2,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Author, Thesis } from "@/data/proofmarket/types";
import { useProofMarket } from "@/data/proofmarket/store";
import { ME_ID } from "@/data/proofmarket/seed";
import type { Conversation, Folder } from "@/data/proofmarket/messages";
import {
  daysBetween,
  evidenceQuality,
  hasConflict,
  iso,
  latest,
  scamSignals,
} from "@/lib/proofmarket/rules";
import { HORIZON_LABEL, LEVEL_LABEL, RISK_LABEL } from "../atoms";

/* ── Material ─────────────────────────────────────────────────────────── */

export const visionGlass: CSSProperties = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.14) 55%, rgba(255,255,255,0.18) 100%)",
  border: "1px solid rgba(255,255,255,0.38)",
  borderRadius: 30,
  backdropFilter: "blur(34px) saturate(150%)",
  WebkitBackdropFilter: "blur(34px) saturate(150%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(255,255,255,0.12), 0 30px 60px -20px rgba(20,12,4,0.45)",
};

const pill = "rounded-full bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]";

function RoundIcon({
  icon: Icon,
  label,
  onClick,
  badge,
  active,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative grid h-8 w-8 shrink-0 place-items-center transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
        pill,
        active && "bg-white/35",
      )}
    >
      <Icon size={15} strokeWidth={1.9} aria-hidden />
    </button>
  );
}

/* ── Avatars & story rings ────────────────────────────────────────────── */

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
        background: seen ? "rgba(255,255,255,0.45)" : RING,
        padding: 2.5,
        opacity: dim ? 0.7 : 1,
      }}
    >
      <span
        className="grid h-full w-full place-items-center rounded-full text-[12px] font-semibold text-white"
        style={{
          background: "linear-gradient(140deg, #3b4558, #1c2230)",
          border: "2px solid rgba(255,255,255,0.85)",
          fontSize: Math.max(10, size * 0.24),
        }}
      >
        {initials}
      </span>
      {children}
    </span>
  );
}

/* ── Generated thesis art (no stock photos; drawn from the thesis) ──── */

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
    const xs = pts.map((_, i) => (i / (pts.length - 1)) * 200);
    const l = pts.map((p, i) => `${i ? "L" : "M"}${xs[i]!.toFixed(1)},${p.toFixed(1)}`).join(" ");
    return { line: l, area: `${l} L200,110 L0,110 Z` };
  }, [thesis.id, thesis.stance]);
  const hue = hash(thesis.entity.id) % 360;
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(120% 90% at 85% 0%, hsla(${hue},70%,55%,0.45), transparent 60%), radial-gradient(90% 80% at 0% 100%, rgba(240,170,90,0.35), transparent 65%), linear-gradient(160deg, #1d2433 0%, #0e131d 100%)`,
      }}
    >
      <span
        className="absolute -bottom-3 -right-1 select-none font-black leading-none tracking-tighter"
        style={{
          color: "rgba(255,255,255,0.07)",
          fontSize: 120,
          display: compact ? "none" : undefined,
        }}
      >
        {thesis.entity.code ?? thesis.entity.name.split(" ")[0]}
      </span>
      <svg
        viewBox="0 0 200 110"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[70%] w-full"
      >
        <defs>
          <linearGradient id={`g-${thesis.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#g-${thesis.id})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={compact ? 2.2 : 1.6}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {!compact ? (
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      ) : null}
    </div>
  );
}

/* ── Profile pane ─────────────────────────────────────────────────────── */

type GridTab = "teses" | "seguir" | "guardadas" | "revisao";

export function ProfilePane({
  onOpen,
  onCreate,
  onReputation,
  onReview,
  onShare,
}: {
  onOpen: (id: string) => void;
  onCreate: () => void;
  onReputation: () => void;
  onReview: (id: string) => void;
  onShare: () => void;
}) {
  const pm = useProofMarket();
  const me = pm.me;
  const [tab, setTab] = useState<GridTab>("seguir");
  const today = iso(Date.now());
  const mine = pm.theses.filter((t) => t.authorId === ME_ID);
  const due = mine.filter((t) => t.status === "ativa" && daysBetween(t.reviewDue, today) >= -7);
  const lists: Record<GridTab, Thesis[]> = {
    teses: mine,
    seguir: pm.theses.filter((t) => pm.followed.includes(t.id)),
    guardadas: pm.theses.filter((t) => pm.saved.includes(t.id)),
    revisao: pm.theses.filter(
      (t) => t.reviews.length > 0 || (t.status === "ativa" && daysBetween(t.reviewDue, today) >= 0),
    ),
  };
  const grid = lists[tab];
  const tabs: { id: GridTab; icon: React.ElementType; label: string }[] = [
    { id: "seguir", icon: Grid3x3, label: "Teses que segue" },
    { id: "teses", icon: PenSquare, label: "As suas teses" },
    { id: "revisao", icon: Clock3, label: "Revisões" },
    { id: "guardadas", icon: Bookmark, label: "Guardadas" },
  ];
  return (
    <section
      aria-label="Perfil"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden"
      style={visionGlass}
    >
      <header className="flex items-center justify-between gap-2 px-5 pt-5">
        <h2 className="text-[17px] font-semibold text-white">Perfil</h2>
        <div className="flex gap-1.5">
          <RoundIcon icon={Upload} label="Partilhar perfil" onClick={onShare} />
          <RoundIcon icon={Gauge} label="Ver reputação" onClick={onReputation} />
          <RoundIcon icon={Plus} label="Criar tese" onClick={onCreate} />
        </div>
      </header>
      <div className="thin-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5">
        <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
          <Ring initials={me.initials} size={78} />
          <p className="mt-1 text-[14px] font-semibold uppercase tracking-[0.04em] text-white">
            Você · {LEVEL_LABEL[me.level]}
          </p>
          <p className="text-[11.5px] text-white/70">{me.handle}</p>
        </div>
        <dl className="mt-3 grid grid-cols-3 text-center">
          {[
            [mine.length, "teses"],
            [pm.followed.length, "a seguir"],
            [pm.saved.length, "guardadas"],
          ].map(([n, l]) => (
            <div key={l as string} className="flex flex-col-reverse">
              <dt className="text-[11px] text-white/70">{l}</dt>
              <dd className="text-[15px] font-semibold tabular-nums text-white">{n}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-white/80">
          {me.verifiedWhat}. Publique teses com fontes, conflitos e data de revisão.
          {due.length ? (
            <span className="block font-semibold text-[#fde68a]">{due.length} revisão devida</span>
          ) : null}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          {due[0] ? (
            <button
              type="button"
              onClick={() => onReview(due[0]!.id)}
              className={cn(
                "px-4 py-1.5 text-[11.5px] font-semibold hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                pill,
              )}
            >
              Rever tese
            </button>
          ) : null}
          <button
            type="button"
            onClick={onReputation}
            className={cn(
              "px-4 py-1.5 text-[11.5px] font-semibold hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
              pill,
            )}
          >
            Reputação
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-white/60">
          Dados de demonstração · não é aconselhamento financeiro
        </p>
        <div
          role="tablist"
          aria-label="Grelha do perfil"
          className="mt-4 grid grid-cols-4 border-b border-white/25"
        >
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              aria-label={label}
              title={label}
              onClick={() => setTab(id)}
              className={cn(
                "grid place-items-center pb-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                tab === id && "text-white shadow-[inset_0_-2px_0_#fff]",
              )}
            >
              <Icon size={16} aria-hidden />
            </button>
          ))}
        </div>
        {grid.length ? (
          <ul
            className="mt-2 grid grid-cols-3 gap-1"
            aria-label={tabs.find((t) => t.id === tab)?.label}
          >
            {grid.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen(t.id)}
                  aria-label={`${t.entity.code ?? t.entity.name}: ${latest(t).claim}`}
                  className="relative block aspect-square w-full overflow-hidden rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ThesisArt thesis={t} compact />
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-sm">
                    {t.entity.code ?? t.entity.name.split(" ")[0]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-center text-[11.5px] text-white/70">Ainda nada aqui.</p>
        )}
      </div>
    </section>
  );
}

/* ── Feed pane ────────────────────────────────────────────────────────── */

export function FeedPane({
  items,
  mode,
  onMode,
  counts,
  onOpen,
  onCounter,
  onReport,
  onCreate,
  onControls,
  onAuthor,
  authorFilter,
  onShare,
}: {
  items: { thesis: Thesis; reasons: string[] }[];
  mode: "paraMim" | "seguindo" | "revisao";
  onMode: (m: "paraMim" | "seguindo" | "revisao") => void;
  counts: Record<"paraMim" | "seguindo" | "revisao", number>;
  onOpen: (id: string, tab?: "resumo" | "evidencias" | "contraditorio") => void;
  onCounter: (id: string) => void;
  onReport: (id: string) => void;
  onCreate: () => void;
  onControls: () => void;
  onAuthor: (id: string | null) => void;
  authorFilter: string | null;
  onShare: (t: Thesis) => void;
}) {
  const pm = useProofMarket();
  const storyAuthors = pm.authors.filter((a) => a.id !== ME_ID);
  return (
    <section
      aria-label="Feed de teses"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden"
      style={visionGlass}
    >
      <header className="flex items-center justify-between gap-2 px-5 pt-4">
        <span className="w-8" />
        <h2
          className="text-[22px] font-semibold tracking-[-0.01em] text-white"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
        >
          ProofMarket
        </h2>
        <RoundIcon icon={SlidersHorizontal} label="Controlo do feed" onClick={onControls} />
      </header>
      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        <ul className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2 pt-3" aria-label="Autores">
          <li>
            <button
              type="button"
              onClick={onCreate}
              className="flex w-[60px] flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-xl"
            >
              <Ring initials={pm.me.initials} seen>
                <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[var(--aurora-accent-strong)] text-white">
                  <Plus size={11} aria-hidden />
                </span>
              </Ring>
              <span className="w-full truncate text-center text-[10.5px] text-white/85">
                A sua tese
              </span>
            </button>
          </li>
          {storyAuthors.map((a) => {
            const active = authorFilter === a.id;
            const hasNew = pm.theses.some(
              (t) => t.authorId === a.id && daysBetween(latest(t).date, iso(Date.now())) <= 30,
            );
            return (
              <li key={a.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`Ver teses de ${a.name}`}
                  onClick={() => onAuthor(active ? null : a.id)}
                  className={cn(
                    "flex w-[60px] flex-col items-center gap-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                    active && "bg-white/15",
                  )}
                >
                  <Ring initials={a.initials} seen={!hasNew} />
                  <span className="w-full truncate text-center text-[10.5px] text-white/85">
                    {a.name.split(" ")[0]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div
          role="tablist"
          aria-label="Feed"
          className="mx-5 mb-2 grid grid-cols-3 gap-1 rounded-full bg-white/12 p-1"
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
              aria-selected={mode === id}
              onClick={() => onMode(id)}
              className={cn(
                "rounded-full py-1.5 text-[11px] font-semibold text-white/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                mode === id &&
                  "bg-white/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
              )}
            >
              {l} <span className="tabular-nums text-white/60">{counts[id]}</span>
            </button>
          ))}
        </div>
        {authorFilter ? (
          <p className="mx-5 mb-2 flex items-center justify-between rounded-full bg-white/15 px-3 py-1 text-[11px] text-white">
            A mostrar teses de {pm.getAuthor(authorFilter).name}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => onAuthor(null)}
            >
              Ver todas
            </button>
          </p>
        ) : null}
        <div className="flex flex-col">
          {items.length ? (
            items.map(({ thesis, reasons }) => (
              <PostCard
                key={thesis.id}
                thesis={thesis}
                reasons={reasons}
                onOpen={onOpen}
                onCounter={onCounter}
                onReport={onReport}
                onShare={onShare}
              />
            ))
          ) : (
            <p className="px-5 py-10 text-center text-[12px] text-white/75">
              Nada para mostrar neste feed.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ago(isoDate: string) {
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
}

function PostCard({
  thesis,
  reasons,
  onOpen,
  onCounter,
  onReport,
  onShare,
}: {
  thesis: Thesis;
  reasons: string[];
  onOpen: (id: string, tab?: "resumo" | "evidencias" | "contraditorio") => void;
  onCounter: (id: string) => void;
  onReport: (id: string) => void;
  onShare: (t: Thesis) => void;
}) {
  const pm = useProofMarket();
  const v = latest(thesis);
  const a = pm.getAuthor(thesis.authorId);
  const mine = pm.reactions[thesis.id] ?? [];
  const useful = mine.includes("evidencia_util");
  const total = Object.values(thesis.reactionCounts).reduce((s, n) => s + n, 0) + mine.length;
  const counters = pm.allCounters.filter((c) => c.thesisId === thesis.id).length;
  const followed = pm.followed.includes(thesis.id);
  const saved = pm.saved.includes(thesis.id);
  const q = evidenceQuality(v);
  const [menu, setMenu] = useState(false);
  const [why, setWhy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!menu) return;
    const off = (e: MouseEvent) =>
      menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);
  const act =
    "grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";
  return (
    <article aria-labelledby={titleId} className="border-t border-white/20 pb-4 pt-3">
      <header className="flex items-center gap-2.5 px-5">
        <Ring initials={a.initials} size={34} seen={a.id === ME_ID} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold text-white">{a.name}</p>
          <p className="truncate text-[10.5px] text-white/70">
            {LEVEL_LABEL[a.level]} · {thesis.entity.code ?? thesis.entity.name}
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
            <MoreHorizontal size={17} aria-hidden />
          </button>
          {menu ? (
            <div
              role="menu"
              className="absolute right-0 top-10 z-20 flex w-56 flex-col gap-0.5 rounded-[16px] p-1.5"
              style={{
                background: "rgba(30,26,22,0.92)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(20px)",
              }}
            >
              {[
                ["Porque estou a ver isto?", () => setWhy((w) => !w)],
                ["Ver evidências", () => onOpen(thesis.id, "evidencias")],
                ["Ocultar do feed", () => pm.toggleHidden(thesis.id)],
                ["Reportar", () => onReport(thesis.id)],
              ].map(([l, fn]) => (
                <button
                  key={l as string}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    (fn as () => void)();
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-2 text-left text-[12px] hover:bg-white/12 focus-visible:bg-white/12 focus-visible:outline-none",
                    l === "Reportar" ? "text-[#fca5a5]" : "text-white/90",
                  )}
                >
                  {l as string}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>
      <button
        type="button"
        onClick={() => onOpen(thesis.id)}
        aria-label={`Abrir tese ${thesis.id}`}
        className="relative mx-3 mt-2.5 block aspect-[4/3] w-[calc(100%-24px)] overflow-hidden rounded-[18px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ThesisArt thesis={thesis} />
        <span className="absolute left-3 top-3 flex flex-wrap gap-1">
          <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
            {HORIZON_LABEL[thesis.horizon]}
          </span>
          <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
            {RISK_LABEL[thesis.risk]}
          </span>
          {thesis.status !== "ativa" ? (
            <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-[#1c2230]">
              {thesis.status === "concluida"
                ? "Concluída"
                : thesis.status === "invalidada"
                  ? "Invalidada"
                  : thesis.status === "inconclusiva"
                    ? "Inconclusiva"
                    : "Arquivada"}
            </span>
          ) : null}
        </span>
        <span className="absolute inset-x-3 bottom-3 rounded-[12px] bg-black/45 px-3 py-2 text-[11px] leading-snug text-white backdrop-blur-md">
          <b className="text-[#fca5a5]">Falsa se </b>
          {v.invalidation.replace(/^Esta tese é falsa se[\s,]*/i, "")}
        </span>
      </button>
      <div className="flex items-center gap-0.5 px-3.5 pt-1.5">
        <button
          type="button"
          className={act}
          aria-pressed={useful}
          aria-label={useful ? "Retirar Evidência útil" : "Marcar Evidência útil"}
          onClick={() => pm.toggleReaction(thesis.id, "evidencia_util")}
        >
          <Heart
            size={20}
            aria-hidden
            fill={useful ? "#ff3b5c" : "none"}
            stroke={useful ? "#ff3b5c" : "currentColor"}
          />
        </button>
        <button
          type="button"
          className={act}
          aria-label={`Contestar (${counters} contra-teses)`}
          onClick={() => onCounter(thesis.id)}
        >
          <MessageCircle size={20} aria-hidden />
        </button>
        <button
          type="button"
          className={act}
          aria-pressed={followed}
          aria-label={followed ? "Deixar de seguir tese" : "Seguir tese"}
          onClick={() => pm.toggleFollowed(thesis.id)}
        >
          <Repeat2 size={20} aria-hidden stroke={followed ? "#7dd3fc" : "currentColor"} />
        </button>
        <button
          type="button"
          className={act}
          aria-label="Partilhar referência da tese"
          onClick={() => onShare(thesis)}
        >
          <Send size={19} aria-hidden />
        </button>
        <button
          type="button"
          className={cn(act, "ml-auto")}
          aria-pressed={saved}
          aria-label={saved ? "Remover dos guardados" : "Guardar tese"}
          onClick={() => pm.toggleSaved(thesis.id)}
        >
          <Bookmark size={20} aria-hidden fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-col gap-1 px-5">
        <p className="text-[12px] font-semibold tabular-nums text-white">
          {total} reações · {thesis.reactionCounts.evidencia_util + (useful ? 1 : 0)} evidência útil
        </p>
        <h3 id={titleId} className="text-[12.5px] leading-snug text-white/90">
          <b className="font-semibold text-white">{a.handle.replace("@", "")}</b> {v.claim}
        </h3>
        <p className="flex flex-wrap gap-x-2 text-[10.5px] text-white/75">
          <span>
            Evidência {q.label.toLowerCase()} · {q.n} fontes
          </span>
          <span>{hasConflict(v) ? "Conflito declarado" : "Sem conflitos declarados"}</span>
          {v.conflict.sponsor ? (
            <span className="text-[#f5d0fe]">Patrocinado · {v.conflict.sponsor}</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => onOpen(thesis.id, "contraditorio")}
          className="self-start text-[11.5px] text-white/70 hover:text-white"
        >
          {counters ? `Ver contraditório (${counters})` : "Ainda sem contraditório"}
        </button>
        {why ? (
          <ul
            className="mt-1 list-disc rounded-[12px] bg-black/25 py-2 pl-7 pr-3 text-[11px] text-white/85"
            aria-label="Porque estou a ver isto"
          >
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={() => onCounter(thesis.id)}
          className="mt-1 flex items-center gap-2 rounded-full py-1 text-left text-[11.5px] text-white/60 hover:text-white"
        >
          <Ring initials={pm.me.initials} size={22} seen />
          Contestar com evidência…
        </button>
        <p className="text-[10px] uppercase tracking-[0.06em] text-white/55">
          {ago(v.date)} · v{v.version}
        </p>
      </div>
    </article>
  );
}

/* ── Messages pane ────────────────────────────────────────────────────── */

function when(at: number) {
  const m = Math.round((Date.now() - at) / 60000);
  return m < 60
    ? `${Math.max(1, m)} min`
    : m < 1440
      ? `${Math.round(m / 60)} h`
      : `${Math.round(m / 1440)} d`;
}

export function MessagesPane({ onAuthor }: { onAuthor: (a: Author) => void }) {
  const pm = useProofMarket();
  const [folder, setFolder] = useState<Folder>("principal");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState(false);
  const unread = pm.conversations.filter((c) => c.unread > 0 && c.folder !== "pedidos").length;
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
  return (
    <section
      aria-label="Mensagens"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden"
      style={visionGlass}
    >
      {open ? (
        <Thread conv={open} onBack={() => setOpenId(null)} onAuthor={onAuthor} />
      ) : (
        <>
          <header className="flex items-center justify-between gap-2 px-5 pt-5">
            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-white">
              Mensagens
              {unread + requests ? (
                <span
                  className="grid h-5 min-w-5 place-items-center rounded-full bg-[#e5243b] px-1.5 text-[11px] font-bold tabular-nums text-white"
                  aria-label={`${unread + requests} por ler`}
                >
                  {unread + requests}
                </span>
              ) : null}
            </h2>
            <div className="flex gap-1.5">
              <RoundIcon
                icon={PenSquare}
                label="Escrever nota"
                onClick={() => setNoteEdit((n) => !n)}
                active={noteEdit}
              />
              <RoundIcon
                icon={Bell}
                label="Pedidos de mensagem"
                onClick={() => setFolder("pedidos")}
                badge={requests}
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
              <label htmlFor="pm-note" className="sr-only">
                A sua nota
              </label>
              <input
                id="pm-note"
                maxLength={60}
                value={pm.myNote}
                onChange={(e) => pm.setNote(e.target.value)}
                placeholder="Ex.: A rever a tese da Amazon"
                className="min-w-0 flex-1 rounded-full bg-white/20 px-3 py-1.5 text-[12px] text-white placeholder:text-white/55 outline-none focus:ring-2 focus:ring-white/70"
              />
              <button type="submit" className={cn("px-3 text-[11.5px] font-semibold", pill)}>
                Guardar
              </button>
            </form>
          ) : null}
          <ul
            className="no-scrollbar mt-1 flex gap-3 overflow-x-auto px-5 pb-1 pt-6"
            aria-label="Notas"
          >
            <li className="flex w-[58px] flex-col items-center gap-1">
              <span className="relative">
                {pm.myNote ? (
                  <span className="absolute -top-4 left-1/2 z-10 max-w-[80px] -translate-x-1/2 truncate rounded-xl bg-white/85 px-1.5 py-0.5 text-[9px] font-medium text-[#1c2230]">
                    {pm.myNote}
                  </span>
                ) : null}
                <Ring initials={pm.me.initials} size={48} seen />
              </span>
              <span className="text-[10.5px] text-white/80">A sua nota</span>
            </li>
            {pm.conversations
              .filter((c) => c.note)
              .map((c) => (
                <li key={c.id} className="flex w-[58px] flex-col items-center gap-1">
                  <span className="relative">
                    <span
                      className="absolute -top-4 left-1/2 z-10 max-w-[80px] -translate-x-1/2 truncate rounded-xl bg-white/85 px-1.5 py-0.5 text-[9px] font-medium text-[#1c2230]"
                      title={c.note}
                    >
                      {c.note}
                    </span>
                    <Ring initials={c.initials} size={48} />
                  </span>
                  <span className="w-full truncate text-center text-[10.5px] text-white/80">
                    {c.name.split(" ")[0]}
                  </span>
                </li>
              ))}
          </ul>
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 focus-within:ring-2 focus-within:ring-white/70">
            <Search size={14} className="text-white/75" aria-hidden />
            <label htmlFor="pm-dm-search" className="sr-only">
              Pesquisar mensagens
            </label>
            <input
              id="pm-dm-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar mensagens"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-white placeholder:text-white/65 outline-none"
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
                  "rounded-full py-1.5 text-[11.5px] font-semibold text-white/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                  folder === id &&
                    "bg-white/28 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
                )}
              >
                {l}
                {id === "pedidos" && requests ? ` ${requests}` : ""}
              </button>
            ))}
          </div>
          <ul className="thin-scrollbar mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
            {list.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const risky = last && last.from === "them" && scamSignals(last.text).length > 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(c.id);
                      pm.readConversation(c.id);
                    }}
                    className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  >
                    <Ring initials={c.initials} size={44} seen={c.unread === 0} dim={!c.verified} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate text-[12.5px] font-semibold text-white">
                        {c.name}
                        {!c.verified ? (
                          <span className="rounded-full bg-[#e5243b]/80 px-1.5 text-[9px] font-bold">
                            Não verificado
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-[11px]",
                          c.unread ? "font-semibold text-white" : "text-white/70",
                        )}
                      >
                        {risky ? "⚠ Possível burla · " : last?.from === "me" ? "Você: " : ""}
                        {last?.text} · {last ? when(last.at) : ""}
                      </span>
                    </span>
                    {c.unread ? (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-[#4a9eff]"
                        aria-label="Por ler"
                      />
                    ) : null}
                    <Camera size={17} className="shrink-0 text-white/70" aria-hidden />
                  </button>
                </li>
              );
            })}
            {!list.length ? (
              <li className="py-8 text-center text-[11.5px] text-white/70">
                {folder === "pedidos" ? "Sem pedidos de mensagem." : "Sem conversas."}
              </li>
            ) : null}
          </ul>
        </>
      )}
    </section>
  );
}

function Thread({
  conv,
  onBack,
  onAuthor,
}: {
  conv: Conversation;
  onBack: () => void;
  onAuthor: (a: Author) => void;
}) {
  const pm = useProofMarket();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus();
  }, [conv.id]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conv.messages.length]);
  const flagged = conv.messages.some((m) => m.from === "them" && scamSignals(m.text).length > 0);
  const author = conv.authorId ? pm.getAuthor(conv.authorId) : null;
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const s = scamSignals(t);
    if (s.length)
      return setErr(
        `Não enviado: ${s.join(", ")}. Mantenha a conversa na plataforma e sem pedidos de dinheiro.`,
      );
    setErr("");
    pm.sendMessage(conv.id, t);
    setText("");
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2.5 border-b border-white/20 px-4 py-3.5">
        <button
          ref={backRef}
          type="button"
          onClick={onBack}
          aria-label="Voltar às conversas"
          className="grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <ArrowLeft size={17} aria-hidden />
        </button>
        <Ring initials={conv.initials} size={34} seen dim={!conv.verified} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{conv.name}</p>
          <p className="text-[10.5px] text-white/70">
            {author ? LEVEL_LABEL[author.level] : "Conta não verificada"}
          </p>
        </div>
        {author ? (
          <RoundIcon
            icon={Gauge}
            label={`Reputação de ${conv.name}`}
            onClick={() => onAuthor(author)}
          />
        ) : null}
      </header>
      {flagged ? (
        <div
          role="alert"
          className="mx-4 mt-3 flex items-start gap-2 rounded-[14px] bg-[#7f1d1d]/70 px-3 py-2 text-[11.5px] text-white"
        >
          <ShieldAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            Esta conversa tem sinais de burla: pedido de dinheiro, promessa de retorno ou contacto
            fora da plataforma. A ProofMarket nunca pede pagamentos por mensagem.
          </span>
        </div>
      ) : null}
      <ol
        className="thin-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3"
        aria-label={`Conversa com ${conv.name}`}
      >
        {conv.messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-[18px] px-3 py-2 text-[12.5px] leading-snug",
              m.from === "me"
                ? "self-end rounded-br-md bg-[var(--aurora-accent-strong)] text-white"
                : "self-start rounded-bl-md bg-white/25 text-white",
            )}
          >
            {m.text}
            <span className="mt-0.5 block text-right text-[9.5px] text-white/70">{when(m.at)}</span>
          </li>
        ))}
        <div ref={endRef} />
      </ol>
      {conv.folder === "pedidos" ? (
        <div className="flex gap-2 border-t border-white/20 p-3">
          <button
            type="button"
            onClick={() => {
              pm.moveConversation(conv.id, null);
              onBack();
            }}
            className="flex-1 rounded-full bg-[#e5243b]/85 py-2 text-[12px] font-semibold text-white hover:brightness-110"
          >
            Recusar e bloquear
          </button>
          <button
            type="button"
            onClick={() => pm.moveConversation(conv.id, "geral")}
            className={cn("flex-1 py-2 text-[12px] font-semibold", pill)}
          >
            Aceitar
          </button>
        </div>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-1.5 border-t border-white/20 p-3">
          {err ? (
            <p role="alert" className="text-[11px] text-[#fecaca]">
              {err}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <label htmlFor={`dm-${conv.id}`} className="sr-only">
              Mensagem para {conv.name}
            </label>
            <input
              id={`dm-${conv.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Mensagem…"
              className="min-w-0 flex-1 rounded-full bg-white/20 px-3.5 py-2 text-[12.5px] text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white/70"
            />
            <button
              type="submit"
              aria-label="Enviar mensagem"
              className="grid h-9 w-9 place-items-center rounded-full bg-[var(--aurora-accent-strong)] text-white hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Send size={15} aria-hidden />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
