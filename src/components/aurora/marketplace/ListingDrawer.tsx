import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Gavel,
  Heart,
  MapPin,
  Minus,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { CATEGORY_BY_ID, type Listing } from "@/data/marketplaceData";
import { useMarketplace } from "@/data/marketplaceStore";
import { cn } from "@/lib/utils";
import { Drawer, IconButton, SegmentedTabs } from "../primitives";
import { CategoryBadge, ListingImage, formatPrice } from "./ListingCard";
import { RequestStatusPill } from "./RequestsPanel";

const MIN_OFFER_RATIO = 0.7;

function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "A decorrer";
  const d = Math.floor(ms / 86_400_000);
  return d > 60 ? `em ${Math.round(d / 30)} meses` : `em ${d} dias`;
}

export function ListingDrawer({
  listing: current,
  onClose,
  onEdit,
}: {
  listing: Listing | null;
  onClose: () => void;
  onEdit: (l: Listing) => void;
}) {
  const store = useMarketplace();
  /* Keep the last listing mounted while the drawer animates out. */
  const last = useRef(current);
  if (current) last.current = current;
  const listing = current ?? last.current;

  const [imageIdx, setImageIdx] = useState(0);
  const [mode, setMode] = useState<"offer" | "reserve">("offer");
  const [offer, setOffer] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!current) return;
    setImageIdx(0);
    setMode(current.category === "tickets" ? "reserve" : "offer");
    setOffer(String(Math.round((current.priceUsd * 0.9) / 1000) * 1000 || current.priceUsd));
    setQty(1);
    setNote("");
  }, [current]);

  if (!listing)
    return (
      <Drawer open={false} onClose={onClose} title="">
        {null}
      </Drawer>
    );

  const meta = CATEGORY_BY_ID[listing.category];
  const isTicket = listing.category === "tickets";
  const favorite = store.isFavorite(listing.id);
  const requests = store.requests.filter((r) => r.listingId === listing.id);
  const offerNum = Number(offer.replace(/[^0-9]/g, ""));
  const minOffer = Math.ceil(listing.priceUsd * MIN_OFFER_RATIO);
  const offerError = !offerNum
    ? "Indique um valor"
    : offerNum < minOffer
      ? `Mínimo ${formatPrice(minOffer)} (70% do preço)`
      : null;
  const maxQty = listing.stock ?? 1;

  const submit = () => {
    if (mode === "offer") {
      if (offerError) return;
      store.sendRequest({
        listingId: listing.id,
        kind: "offer",
        amountUsd: offerNum,
        quantity: 1,
        note,
      });
    } else {
      store.sendRequest({
        listingId: listing.id,
        kind: "reserve",
        amountUsd: isTicket ? listing.priceUsd * qty : 0,
        quantity: isTicket ? qty : 1,
        note,
      });
    }
    setNote("");
  };

  return (
    <Drawer
      open={current !== null}
      onClose={onClose}
      width={620}
      accent={`${meta.color}88`}
      eyebrow={
        <>
          <CategoryBadge category={listing.category} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            {listing.brand}
          </span>
        </>
      }
      title={listing.title}
      footer={
        listing.mine ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/50">
              Este anúncio é seu · {listing.views} visualizações
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(listing)}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-[12px] font-semibold text-white hover:bg-white/16"
              >
                <Pencil size={13} /> Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  store.removeListing(listing.id);
                  onClose();
                }}
                className="flex h-10 items-center gap-1.5 rounded-xl px-4 text-[12px] font-semibold text-[var(--aurora-negative)] hover:bg-[rgba(248,113,113,0.12)]"
              >
                <Trash2 size={13} /> Retirar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <IconButton
              icon={Heart}
              label={favorite ? "Remover dos favoritos" : "Guardar nos favoritos"}
              active={favorite}
              activeColor="#f87171"
              onClick={() => store.toggleFavorite(listing.id)}
            />
            <button
              type="button"
              onClick={submit}
              disabled={mode === "offer" && !!offerError}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-white transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                background: "var(--aurora-accent)",
                boxShadow: "0 0 24px rgba(74,158,255,0.4)",
              }}
            >
              {mode === "offer" ? (
                <>
                  <Gavel size={15} /> Enviar oferta {offerNum ? `· ${formatPrice(offerNum)}` : ""}
                </>
              ) : (
                <>
                  <CalendarClock size={15} /> {meta.reserveLabel}
                  {isTicket ? ` · ${formatPrice(listing.priceUsd * qty)}` : ""}
                </>
              )}
            </button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-5 p-5">
        {/* Gallery */}
        <div className="flex flex-col gap-2">
          <ListingImage
            key={listing.images[imageIdx]}
            src={listing.images[imageIdx]}
            category={listing.category}
            alt={listing.title}
            className="aspect-[16/10] w-full rounded-[16px]"
          />
          {listing.images.length > 1 ? (
            <div className="flex gap-2">
              {listing.images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setImageIdx(i)}
                  aria-label={`Imagem ${i + 1}`}
                  className={cn(
                    "overflow-hidden rounded-[10px] transition-[opacity,box-shadow] duration-150",
                    i === imageIdx
                      ? "shadow-[0_0_0_2px_var(--aurora-accent)]"
                      : "opacity-55 hover:opacity-90",
                  )}
                >
                  <ListingImage src={img} category={listing.category} className="h-14 w-20" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Price + location */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-white/40">
              {isTicket ? "Preço por lugar" : "Preço pedido"}
            </span>
            <span className="text-[30px] font-bold tabular-nums tracking-[-0.02em] text-white">
              {formatPrice(listing.priceUsd)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-[11px] text-white/55">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {listing.location}
            </span>
            {listing.eventDate ? (
              <span className="flex items-center gap-1 text-[var(--aurora-teal)]">
                <CalendarClock size={12} /> {countdown(listing.eventDate)} · {listing.stock} lugares
              </span>
            ) : (
              <span>
                {listing.condition} · {listing.watchers} a seguir
              </span>
            )}
          </div>
        </div>

        <p className="text-pretty text-[13px] leading-relaxed text-white/70">
          {listing.description}
        </p>

        {/* Specs */}
        <dl className="grid grid-cols-2 gap-2">
          {listing.specs.map((s) => (
            <div
              key={s.label}
              className="rounded-[12px] px-3 py-2.5"
              style={{ background: "var(--aurora-surface-2)" }}
            >
              <dt className="text-[10px] uppercase tracking-[0.1em] text-white/40">{s.label}</dt>
              <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-white">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Seller */}
        <div
          className="flex items-center gap-3 rounded-[14px] p-3"
          style={{
            background: "var(--aurora-surface-1)",
            border: "1px solid var(--aurora-hairline)",
          }}
        >
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${meta.color}66, rgba(255,255,255,0.08))`,
            }}
          >
            {listing.seller.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-[13px] font-semibold text-white">
              {listing.seller.name}
              {listing.seller.verified ? (
                <BadgeCheck size={14} className="shrink-0 text-[var(--aurora-accent)]" />
              ) : null}
            </p>
            <p className="flex items-center gap-2 text-[11px] text-white/50">
              <span className="flex items-center gap-0.5 text-[var(--aurora-warn)]">
                <Star size={11} fill="currentColor" /> {listing.seller.rating.toFixed(1)}
              </span>
              {listing.seller.sales} vendas · desde {listing.seller.since}
            </p>
          </div>
        </div>

        {/* Action composer */}
        {!listing.mine ? (
          <section
            className="flex flex-col gap-3 rounded-[16px] p-4"
            style={{
              background: "rgba(74,158,255,0.06)",
              border: "1px solid rgba(74,158,255,0.18)",
            }}
          >
            {!isTicket ? (
              <SegmentedTabs
                size="sm"
                active={mode}
                onSelect={setMode}
                tabs={[
                  { id: "offer", label: "Fazer oferta", icon: Gavel },
                  {
                    id: "reserve",
                    label: meta.reserveLabel,
                    shortLabel: "Reservar",
                    icon: CalendarClock,
                  },
                ]}
              />
            ) : null}

            {mode === "offer" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-white/70">A sua oferta (USD)</span>
                <div
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-xl bg-black/30 px-3",
                    offerError
                      ? "shadow-[inset_0_0_0_1px_rgba(248,113,113,0.6)]"
                      : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
                  )}
                >
                  <span className="text-[14px] text-white/45">$</span>
                  <input
                    inputMode="numeric"
                    value={offerNum ? offerNum.toLocaleString("en-US") : offer}
                    onChange={(e) => setOffer(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold tabular-nums text-white outline-none"
                    aria-invalid={!!offerError}
                  />
                  <span className="text-[11px] tabular-nums text-white/40">
                    {offerNum ? `${Math.round((offerNum / listing.priceUsd) * 100)}% do preço` : ""}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[0.85, 0.9, 0.95, 1].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setOffer(String(Math.round(listing.priceUsd * r)))}
                      className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/65 hover:bg-white/14 hover:text-white"
                    >
                      {r === 1 ? "Preço pedido" : `${Math.round(r * 100)}%`}
                    </button>
                  ))}
                </div>
                {offerError ? (
                  <span className="text-[11px] text-[var(--aurora-negative)]">{offerError}</span>
                ) : null}
              </label>
            ) : isTicket ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold text-white/75">Lugares</span>
                <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1">
                  <button
                    type="button"
                    aria-label="Menos um lugar"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-[15px] font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    aria-label="Mais um lugar"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-white/60">
                O concierge confirma data e local com o vendedor. A reserva não é vinculativa.
              </p>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Mensagem para o vendedor (opcional)"
              className="resize-none rounded-xl bg-black/30 px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/35 focus:shadow-[inset_0_0_0_1px_rgba(74,158,255,0.5)]"
            />

            <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-white/40">
              <ShieldCheck size={12} className="mt-px shrink-0 text-[var(--aurora-accent)]" />
              Pedidos intermediados pelo concierge Ollympius. Nenhum pagamento é processado nesta
              plataforma.
            </p>
          </section>
        ) : null}

        {/* Request history for this listing */}
        {requests.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
              Os seus pedidos
            </h3>
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-[12px] px-3 py-2"
                style={{ background: "var(--aurora-surface-1)" }}
              >
                <span className="text-[12px] text-white/75">
                  {r.kind === "offer"
                    ? `Oferta ${formatPrice(r.amountUsd)}`
                    : `Reserva${r.quantity > 1 ? ` · ${r.quantity} lugares` : ""}`}
                  {r.status === "countered" && r.counterUsd ? (
                    <span className="text-white/45">
                      {" "}
                      · contraproposta {formatPrice(r.counterUsd)}
                    </span>
                  ) : null}
                </span>
                <RequestStatusPill status={r.status} />
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </Drawer>
  );
}
