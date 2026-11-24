/**
 * Trader media and follow-up: cover photo (free-licence, credited like
 * Notícias), avatar ring (like Aurora Chat) with the trader's own photo when
 * uploaded, follow button and a follow-up feed.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Bell,
  BellOff,
  Bookmark,
  Camera,
  Heart,
  Link2,
  MapPin,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { Button, Panel } from "../primitives";
import { Chip } from "../cockpit/Rail";
import { PhotoCredit } from "../home/NewsAtoms";
import { PHOTOS, type NewsImage } from "@/data/newsData";
import type { DemoTrader } from "@/lib/operadores/demo";
import type { Score } from "@/lib/operadores/score";

const RING = "conic-gradient(from 210deg, #f9ce34, #ee2a7b, #8a3ab9, #4a9eff, #f9ce34)";
export const COVER: Record<DemoTrader["categoria"], NewsImage> = {
  Forex: PHOTOS.maputo,
  Cripto: PHOTOS.datacenter,
  Ações: PHOTOS.nyse,
  Metais: PHOTOS.oil,
};
const LOCAL: Record<DemoTrader["categoria"], string> = {
  Forex: "Maputo, Moçambique",
  Cripto: "Centro de dados",
  Ações: "Bolsa de Nova Iorque",
  Metais: "Campos de petróleo",
};

/** Highest-resolution sources for a Commons photo (1920 → 3840 → original). */
export function hiRes(img: NewsImage): { src: string; srcSet: string } {
  if (!img.src.includes("/thumb/")) return { src: img.src, srcSet: `${img.src} 2000w` };
  const original = img.src
    .replace(
      "thumb.wikimedia.org/wikipedia/commons/thumb/",
      "upload.wikimedia.org/wikipedia/commons/",
    )
    .replace(/\/\d+px-[^/]+$/, "");
  return {
    src: img.src,
    srcSet: `${img.src} 1920w, ${img.src.replace("/1920px-", "/3840px-")} 3840w, ${original} 6000w`,
  };
}

/** Instagram-style post: header, 4:5 graded photo, actions, caption with credit. */
export function InstaPost({ t, foto, s }: { t: DemoTrader; foto?: string; s: Score }) {
  const [gosto, setGosto] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const cover = COVER[t.categoria];
  const img = hiRes(cover);
  return (
    <article
      aria-label={`Publicação de ${t.nome}`}
      className="overflow-hidden rounded-[var(--cx-r3)] border border-white/10 bg-[#0b0d13]"
    >
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar nome={t.nome} foto={foto} size={38} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-caption font-bold text-white">
            {t.nome
              .toLowerCase()
              .replace(/\s+/g, ".")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")}
          </p>
          <p className="flex items-center gap-1 text-micro text-white/70">
            <MapPin size={11} aria-hidden /> {LOCAL[t.categoria]}
          </p>
        </div>
        <MoreHorizontal size={18} aria-hidden className="text-white/60" />
      </header>
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={img.src}
          srcSet={img.srcSet}
          sizes="(min-width: 1280px) 360px, 92vw"
          alt={`${LOCAL[t.categoria]} — imagem de capa do perfil`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "contrast(1.08) saturate(1.2) brightness(1.03)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-soft-light"
          style={{
            background: "linear-gradient(160deg, rgba(255,170,90,.35), rgba(80,120,255,.25))",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.55) 100%)",
          }}
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-micro font-bold text-white backdrop-blur-md">
          Nota {s.total} · {t.seal}
        </span>
      </div>
      <div className="flex items-center gap-1 px-1.5 pt-1">
        <button
          type="button"
          aria-pressed={gosto}
          aria-label="Gosto"
          onClick={() => setGosto((g) => !g)}
          className="grid h-10 w-10 place-items-center rounded-full text-white transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Heart
            size={22}
            aria-hidden
            fill={gosto ? "#ff3b5c" : "none"}
            color={gosto ? "#ff3b5c" : "currentColor"}
          />
        </button>
        <button
          type="button"
          aria-label="Partilhar perfil"
          onClick={() =>
            void navigator.clipboard?.writeText(
              `${location.origin}${location.pathname}#trader-${t.id}`,
            )
          }
          className="grid h-10 w-10 place-items-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Send size={20} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={guardado}
          aria-label="Guardar"
          onClick={() => setGuardado((g) => !g)}
          className="ml-auto grid h-10 w-10 place-items-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Bookmark size={21} aria-hidden fill={guardado ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="px-3 pb-3 text-caption leading-relaxed text-white/90">
        <b className="text-white">{t.nome.split(" ")[0]}</b> {t.categoria} · {s.metrics.trades}{" "}
        operações · retorno {pct(s.metrics.retornoTotal)} · queda máx. {pct(-s.metrics.maxDD)}
        <p className="mt-1 text-micro text-white/60">
          Desempenho passado não garante resultados futuros.
        </p>
        <PhotoCredit image={cover} className="mt-1.5 !bg-white/8" />
      </div>
    </article>
  );
}

const initials = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
const pct = (x: number, d = 1) =>
  `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x * 100)
    .toFixed(d)
    .replace(".", ",")}%`;

export function Avatar({
  nome,
  foto,
  size = 56,
  children,
}: {
  nome: string;
  foto?: string;
  size?: number;
  children?: ReactNode;
}) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: RING, padding: size > 60 ? 3 : 2.5 }}
    >
      {foto ? (
        <img
          src={foto}
          alt={`Fotografia de ${nome}`}
          className="h-full w-full rounded-full border-2 border-[#1a1613] object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="grid h-full w-full place-items-center rounded-full border-2 border-[#1a1613] font-semibold text-white"
          style={{
            background: "linear-gradient(140deg,#3b4558,#161b26)",
            fontSize: Math.max(11, size * 0.3),
          }}
        >
          {initials(nome)}
        </span>
      )}
      {children}
    </span>
  );
}

/** Downscale an uploaded photo to a 320 px JPEG data URL (kept in this browser only). */
export function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = 320;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const k = Math.max(s / img.width, s / img.height);
      const w = img.width * k;
      const h = img.height * k;
      c.getContext("2d")!.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      resolve(c.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = URL.createObjectURL(file);
  });
}

export function TraderProfile({
  t,
  s,
  foto,
  seguindo,
  onFoto,
  onSeguir,
  onDetalhes,
  onContrato,
}: {
  t: DemoTrader;
  s: Score;
  foto?: string;
  seguindo: boolean;
  onFoto: (f: File) => void;
  onSeguir: () => void;
  onDetalhes: () => void;
  onContrato: () => void;
}) {
  return (
    <section aria-label={`Perfil de ${t.nome}`} className="cx-glass overflow-hidden">
      <div className="p-3 pb-0">
        <InstaPost t={t} foto={foto} s={s} />
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Avatar nome={t.nome} foto={foto} size={64} />
          <div className="min-w-0">
            <p className="truncate text-body font-bold text-white">{t.nome}</p>
            <p className="text-micro text-white/70">
              Nota {s.total} · {t.categoria}
            </p>
          </div>
          <span className="ml-auto pb-1">
            <Chip tone={t.seal === "Verificado" ? "good" : undefined}>{t.seal}</Chip>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 text-micro font-semibold text-white focus-within:ring-2 focus-within:ring-white/60 hover:bg-white/14">
            <Camera size={14} aria-hidden /> {foto ? "Trocar fotografia" : "Carregar fotografia"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFoto(f);
                e.target.value = "";
              }}
            />
          </label>
          <Button
            size="sm"
            variant={seguindo ? "secondary" : "primary"}
            icon={seguindo ? BellOff : Bell}
            aria-pressed={seguindo}
            onClick={onSeguir}
          >
            {seguindo ? "A seguir" : "Seguir"}
          </Button>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Rentab. média/mês", pct(s.metrics.retornoTotal / Math.max(1, s.metrics.meses))],
            ["Queda máx.", pct(-s.metrics.maxDD)],
            ["Consistência", String(Math.round(s.parts.consistencia))],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/[0.04] p-2">
              <dt className="text-micro text-white/60">{k}</dt>
              <dd className="font-bold tabular-nums text-white">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onDetalhes}>
            Ver detalhes
          </Button>
          <Button size="sm" variant="primary" icon={Link2} onClick={onContrato}>
            Conectar com investidor
          </Button>
        </div>
      </div>
    </section>
  );
}

export function FollowPanel({
  items,
  fotos,
}: {
  items: { t: DemoTrader; s: Score }[];
  fotos: Record<string, string>;
}) {
  return (
    <Panel
      title="Acompanhamento"
      subtitle="Traders que segue · últimas operações e alertas de risco"
    >
      {!items.length ? (
        <p className="text-caption text-white/70">
          Ainda não segue nenhum trader. Use «Seguir» no perfil para acompanhar operações e alertas.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ t, s }) => {
            const last = t.trades.slice(-3).reverse();
            const loss3 = t.trades.slice(-3).every((x) => x.pnl < 0);
            return (
              <li key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <Avatar nome={t.nome} foto={fotos[t.id]} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-bold text-white">{t.nome}</p>
                    <p className="text-micro text-white/65">
                      Nota {s.total} · retorno {pct(s.metrics.retornoTotal)} · queda máx.{" "}
                      {pct(-s.metrics.maxDD)}
                    </p>
                  </div>
                  {loss3 ? (
                    <Chip tone="warn">3 perdas seguidas</Chip>
                  ) : s.metrics.maxDD > 0.15 ? (
                    <Chip tone="bad">Queda &gt; 15%</Chip>
                  ) : (
                    <Chip tone="good">Estável</Chip>
                  )}
                </div>
                <ul className="mt-2 flex flex-col gap-1 text-micro">
                  {last.map((x, i) => (
                    <li key={i} className="flex justify-between gap-2 text-white/75">
                      <span>
                        {x.close} · {x.symbol} · {x.side === "buy" ? "compra" : "venda"}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{ color: x.pnl >= 0 ? "#86efac" : "#fca5a5" }}
                      >
                        {x.pnl >= 0 ? "+" : "−"}
                        {Math.abs(x.pnl).toFixed(2).replace(".", ",")}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
