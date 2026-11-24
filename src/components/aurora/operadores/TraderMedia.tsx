/**
 * Trader media and follow-up: cover photo (free-licence, credited like
 * Notícias), avatar ring (like Aurora Chat) with the trader's own photo when
 * uploaded, follow button and a follow-up feed.
 */
import type { ReactNode } from "react";
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

/** Profile hero in Aurora style: the trader's own photo when uploaded, otherwise the free-licence cover at full resolution. */
export function ProfileHero({ t, foto, s }: { t: DemoTrader; foto?: string; s: Score }) {
  const cover = COVER[t.categoria];
  const img = hiRes(cover);
  return (
    <figure className="cx-photo relative m-0 aspect-[4/5] overflow-hidden rounded-[var(--cx-r3)] border border-white/10">
      <img
        src={foto ?? img.src}
        srcSet={foto ? undefined : img.srcSet}
        sizes="(min-width: 1280px) 380px, 92vw"
        alt={foto ? `Fotografia de ${t.nome}` : `${LOCAL[t.categoria]} — imagem de capa`}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(5,7,12,.88) 0%, rgba(5,7,12,.25) 30%, transparent 50%)",
        }}
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
        <span
          className="text-[20px] font-extrabold leading-tight text-white"
          style={{ fontFamily: '"Inter Display", Inter, sans-serif' }}
        >
          {t.nome}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-micro text-white/85">
          <MapPin size={12} aria-hidden /> {LOCAL[t.categoria]} · Nota {s.total}
          <Chip tone={t.seal === "Verificado" ? "good" : undefined}>{t.seal}</Chip>
        </span>
      </figcaption>
      {foto ? null : <PhotoCredit image={cover} className="absolute right-2 top-2" />}
    </figure>
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

/** Uploaded photo → high-quality JPEG (≤ 1600 px, original framing), kept in this browser only. */
export function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)); // keep detail, cap storage
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      const g = c.getContext("2d")!;
      g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.92));
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
        <ProfileHero t={t} foto={foto} s={s} />
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
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
