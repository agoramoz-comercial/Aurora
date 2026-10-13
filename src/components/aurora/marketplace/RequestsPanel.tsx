import { Check, Inbox, Loader2 } from "lucide-react";
import type { Listing } from "@/data/marketplaceData";
import { useMarketplace, type RequestStatus } from "@/data/marketplaceStore";
import { EmptyState } from "../primitives";
import { ListingImage, formatPrice } from "./ListingCard";

const STATUS: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "A aguardar vendedor", color: "#fcd34d", bg: "rgba(251,191,36,0.14)" },
  accepted: { label: "Aceite", color: "#4ade80", bg: "rgba(74,222,128,0.14)" },
  confirmed: { label: "Confirmada", color: "#4ade80", bg: "rgba(74,222,128,0.14)" },
  countered: { label: "Contraproposta", color: "#93c5fd", bg: "rgba(74,158,255,0.16)" },
  declined: { label: "Recusada", color: "#fca5a5", bg: "rgba(248,113,113,0.14)" },
  cancelled: { label: "Cancelada", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
};

export function RequestStatusPill({ status }: { status: RequestStatus }) {
  const s = STATUS[status];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: s.color, background: s.bg }}
    >
      {status === "pending" ? (
        <Loader2 size={10} className="animate-spin motion-reduce:animate-none" />
      ) : null}
      {s.label}
    </span>
  );
}

function timeAgo(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
}

export function RequestsPanel({ onOpen }: { onOpen: (l: Listing) => void }) {
  const store = useMarketplace();

  if (store.requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Ainda não enviou pedidos"
        hint="Ofertas e reservas que fizer aparecem aqui, com a resposta do vendedor em tempo real."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {store.requests.map((r) => {
        const listing = store.getListing(r.listingId);
        return (
          <li
            key={r.id}
            className="glass-soft flex flex-wrap items-center gap-3 p-2.5 sm:flex-nowrap"
            style={{ borderRadius: 16 }}
          >
            <button
              type="button"
              onClick={() => listing && onOpen(listing)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              disabled={!listing}
            >
              {listing ? (
                <ListingImage
                  src={listing.images[0]}
                  category={listing.category}
                  className="h-14 w-20 shrink-0 rounded-[10px]"
                />
              ) : (
                <span className="h-14 w-20 shrink-0 rounded-[10px] bg-white/5" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-white">
                  {listing?.title ?? "Anúncio retirado"}
                </span>
                <span className="block text-[11px] text-white/50">
                  {r.kind === "offer"
                    ? `Oferta de ${formatPrice(r.amountUsd)}`
                    : r.quantity > 1
                      ? `Reserva de ${r.quantity} lugares · ${formatPrice(r.amountUsd)}`
                      : "Pedido de reserva"}{" "}
                  · {timeAgo(r.createdAt)}
                </span>
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-2">
              {r.status === "countered" && r.counterUsd ? (
                <button
                  type="button"
                  onClick={() => store.acceptCounter(r.id)}
                  className="flex h-8 items-center gap-1 rounded-lg bg-[var(--aurora-accent)] px-3 text-[11px] font-bold text-white hover:brightness-110"
                >
                  <Check size={12} /> Aceitar {formatPrice(r.counterUsd)}
                </button>
              ) : null}
              {r.status === "pending" || r.status === "countered" ? (
                <button
                  type="button"
                  onClick={() => store.cancelRequest(r.id)}
                  className="h-8 rounded-lg px-3 text-[11px] font-semibold text-white/55 hover:bg-white/8 hover:text-white"
                >
                  Cancelar
                </button>
              ) : null}
              <RequestStatusPill status={r.status} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
