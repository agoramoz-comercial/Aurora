import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Heart, MapPin } from "lucide-react";
import { CATEGORY_BY_ID, type Listing } from "@/data/marketplaceData";
import { IconButton } from "../primitives";
import { CategoryBadge, ListingImage, formatPrice } from "./ListingCard";

/** Bento showcase: one hero listing with full-bleed photography + spec strip. */
export function FeaturedShowcase({
  listing,
  favorite,
  onToggleFavorite,
  onOpen,
}: {
  listing: Listing;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}) {
  const meta = CATEGORY_BY_ID[listing.category];

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={listing.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="group relative min-h-[300px] cursor-pointer overflow-hidden rounded-[22px] sm:min-h-[340px]"
        style={{
          border: `1px solid ${meta.color}55`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 50px ${meta.color}1f`,
        }}
        onClick={onOpen}
        aria-label={`Em destaque: ${listing.title}`}
      >
        <ListingImage
          src={listing.images[0]}
          category={listing.category}
          zoomOnHover
          alt={listing.title}
          className="absolute inset-0"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,12,22,0.94) 0%, rgba(8,12,22,0.72) 38%, rgba(8,12,22,0.1) 75%), linear-gradient(to top, rgba(8,12,22,0.85), transparent 45%)",
          }}
        />

        <div className="absolute right-3 top-3">
          <IconButton
            icon={Heart}
            label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            active={favorite}
            activeColor="#f87171"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          />
        </div>

        <div className="relative flex h-full min-h-[inherit] max-w-[560px] flex-col justify-end gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              style={{
                background: "var(--aurora-accent)",
                boxShadow: "0 0 16px rgba(74,158,255,0.5)",
              }}
            >
              Em destaque
            </span>
            <CategoryBadge category={listing.category} />
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {listing.brand}
              {listing.seller.verified ? (
                <BadgeCheck size={13} className="text-[var(--aurora-accent)]" />
              ) : null}
            </p>
            <h2 className="mt-1 text-[24px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[30px]">
              {listing.title}
            </h2>
            <p className="mt-1.5 text-[12px] text-white/60">{listing.subtitle}</p>
          </div>

          <dl className="flex flex-wrap gap-x-5 gap-y-2">
            {listing.specs.slice(0, 4).map((s) => (
              <div key={s.label}>
                <dt className="text-[9px] uppercase tracking-[0.12em] text-white/40">{s.label}</dt>
                <dd className="text-[13px] font-semibold tabular-nums text-white">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-[28px] font-bold tabular-nums tracking-[-0.02em] text-white">
              {formatPrice(listing.priceUsd)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/50">
              <MapPin size={11} /> {listing.location}
            </span>
            <span className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[12px] font-bold text-[#0b1020] transition-transform duration-150 group-hover:translate-x-0.5">
              Ver ativo <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
