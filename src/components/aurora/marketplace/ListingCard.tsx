import { useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Car,
  Eye,
  Gem,
  Heart,
  Home,
  Plane,
  Sailboat,
  Shirt,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_BY_ID, type Category, type Listing } from "@/data/marketplaceData";
import { cn } from "@/lib/utils";
import { IconButton } from "../primitives";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  cars: Car,
  homes: Home,
  jewelry: Gem,
  fashion: Shirt,
  tickets: Ticket,
  yachts: Sailboat,
  jets: Plane,
};

/** Full USD for prices under $1M, compact above — luxury buyers read "$14.8M". */
export function formatPrice(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

/** Image with a generated fallback (category tint + icon) when it fails to load. */
export function ListingImage({
  src,
  category,
  className,
  zoomOnHover = false,
  alt = "",
}: {
  src?: string;
  category: Category;
  className?: string;
  zoomOnHover?: boolean;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const meta = CATEGORY_BY_ID[category];
  const Icon = CATEGORY_ICON[category];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="absolute inset-0 grid place-items-center"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 70% 20%, ${meta.color}40, transparent 70%), linear-gradient(135deg, #0d1322 0%, #151b2b 100%)`,
        }}
      >
        <Icon size={42} strokeWidth={1.1} style={{ color: `${meta.color}99` }} />
      </div>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "img-outline absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            zoomOnHover && "group-hover:scale-[1.06]",
          )}
        />
      ) : null}
    </div>
  );
}

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const meta = CATEGORY_BY_ID[category];
  const Icon = CATEGORY_ICON[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md",
        className,
      )}
      style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${meta.color}66`, color: "#fff" }}
    >
      <Icon size={10} style={{ color: meta.color }} /> {meta.singular}
    </span>
  );
}

export function ListingCard({
  listing,
  index,
  favorite,
  onToggleFavorite,
  onOpen,
}: {
  listing: Listing;
  index: number;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}) {
  const soldOutSoon = listing.stock !== undefined && listing.stock <= 3;
  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className="glass-soft group relative flex min-w-0 cursor-pointer flex-col overflow-hidden p-1.5 transition-[box-shadow,background-color] duration-200 hover:bg-white/[0.04] hover:shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
      style={{ borderRadius: 20 }}
      onClick={onOpen}
    >
      {/* Media — radius 14 inside a 20 card with 6px padding (concentric) */}
      <div className="relative">
        <ListingImage
          src={listing.images[0]}
          category={listing.category}
          zoomOnHover
          alt={listing.title}
          className="aspect-[4/3] w-full rounded-[14px]"
        />
        <div className="pointer-events-none absolute inset-0 rounded-[14px] bg-gradient-to-t from-black/55 via-transparent to-black/20" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <CategoryBadge category={listing.category} />
          {listing.mine ? (
            <span className="rounded-full bg-[var(--aurora-accent)] px-2 py-0.5 text-[10px] font-bold text-white">
              O seu anúncio
            </span>
          ) : null}
        </div>
        <div className="absolute right-2 top-2">
          <IconButton
            icon={Heart}
            label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            active={favorite}
            activeColor="#f87171"
            size={36}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          />
        </div>
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between text-[10px] text-white/80">
          <span className="rounded-full bg-black/45 px-2 py-0.5 backdrop-blur-md">
            {listing.location}
          </span>
          {listing.stock !== undefined ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold backdrop-blur-md",
                soldOutSoon ? "bg-[rgba(248,113,113,0.35)] text-white" : "bg-black/45",
              )}
            >
              {listing.stock} {listing.stock === 1 ? "lugar" : "lugares"}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 tabular-nums backdrop-blur-md">
              <Eye size={10} /> {listing.views.toLocaleString("en-US")}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-2 pb-1.5 pt-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
          {listing.brand}
          {listing.seller.verified ? (
            <BadgeCheck
              size={12}
              className="text-[var(--aurora-accent)]"
              aria-label="Vendedor verificado"
            />
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">
          {listing.title}
        </h3>

        {/* Spec strip — StatTile grammar applied to the object */}
        <dl
          className="grid grid-cols-3 gap-1 rounded-[12px] p-1"
          style={{ background: "var(--aurora-surface-1)" }}
        >
          {listing.specs.slice(0, 3).map((s) => (
            <div key={s.label} className="min-w-0 rounded-[9px] px-2 py-1.5">
              <dt className="truncate text-[9px] uppercase tracking-[0.08em] text-white/40">
                {s.label}
              </dt>
              <dd className="truncate text-[11px] font-semibold tabular-nums text-white/90">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <span className="block text-[9px] uppercase tracking-[0.12em] text-white/40">
              {listing.category === "tickets" ? "Por lugar" : "Preço"}
            </span>
            <span className="text-[18px] font-bold tabular-nums tracking-[-0.01em] text-white">
              {formatPrice(listing.priceUsd)}
            </span>
          </div>
          <span className="text-[10px] text-white/40">{listing.condition}</span>
        </div>
      </div>
    </motion.article>
  );
}
