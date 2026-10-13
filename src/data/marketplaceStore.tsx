/**
 * marketplaceStore.tsx — client-side state for the Private Collection.
 *
 * Favourites, offers/reservations and the user's own listings live in a
 * reducer and are mirrored to localStorage. No real payments exist: sellers are
 * simulated, answering each request a few seconds after it is sent.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { SEED_LISTINGS, type Listing } from "./marketplaceData";

export type RequestKind = "offer" | "reserve";
export type RequestStatus =
  | "pending"
  | "accepted"
  | "countered"
  | "declined"
  | "confirmed"
  | "cancelled";

export interface MarketRequest {
  id: string;
  listingId: string;
  kind: RequestKind;
  amountUsd: number;
  quantity: number;
  note?: string;
  createdAt: number;
  status: RequestStatus;
  counterUsd?: number;
}

interface State {
  favorites: string[];
  requests: MarketRequest[];
  userListings: Listing[];
}

type Action =
  | { type: "toggleFavorite"; id: string }
  | { type: "addRequest"; request: MarketRequest }
  | { type: "setStatus"; id: string; status: RequestStatus; counterUsd?: number }
  | { type: "publish"; listing: Listing }
  | { type: "removeListing"; id: string };

const STORAGE_KEY = "ollympius.marketplace.v1";
const EMPTY: State = { favorites: [], requests: [], userListings: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "toggleFavorite":
      return {
        ...state,
        favorites: state.favorites.includes(action.id)
          ? state.favorites.filter((f) => f !== action.id)
          : [action.id, ...state.favorites],
      };
    case "addRequest":
      return { ...state, requests: [action.request, ...state.requests] };
    case "setStatus":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id
            ? { ...r, status: action.status, counterUsd: action.counterUsd ?? r.counterUsd }
            : r,
        ),
      };
    case "publish": {
      const exists = state.userListings.some((l) => l.id === action.listing.id);
      return {
        ...state,
        userListings: exists
          ? state.userListings.map((l) => (l.id === action.listing.id ? action.listing : l))
          : [action.listing, ...state.userListings],
      };
    }
    case "removeListing":
      return {
        ...state,
        userListings: state.userListings.filter((l) => l.id !== action.id),
        favorites: state.favorites.filter((f) => f !== action.id),
      };
  }
}

function load(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      userListings: Array.isArray(parsed.userListings) ? parsed.userListings : [],
    };
  } catch {
    return EMPTY;
  }
}

/** Simulated seller decision for a request. */
function sellerResponse(req: MarketRequest, listing: Listing | undefined) {
  if (req.kind === "reserve") return { status: "confirmed" as const };
  if (!listing) return { status: "declined" as const };
  const ratio = req.amountUsd / listing.priceUsd;
  if (ratio >= 0.93) return { status: "accepted" as const };
  if (ratio >= 0.8)
    return {
      status: "countered" as const,
      counterUsd: Math.round((listing.priceUsd * (1 + ratio)) / 2 / 1000) * 1000,
    };
  return { status: "declined" as const };
}

interface MarketplaceApi extends State {
  listings: Listing[];
  getListing: (id: string) => Listing | undefined;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  sendRequest: (r: Omit<MarketRequest, "id" | "createdAt" | "status">) => void;
  cancelRequest: (id: string) => void;
  acceptCounter: (id: string) => void;
  publishListing: (l: Listing) => void;
  removeListing: (id: string) => void;
}

const Ctx = createContext<MarketplaceApi | null>(null);

export function MarketplaceStoreProvider({ children }: { children: ReactNode }) {
  /* Lazy init reads storage synchronously (client-only SPA), so the persist
   * effect below can never overwrite saved data with the empty default. */
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — state stays in memory */
    }
  }, [state]);

  const listings = useMemo(() => [...state.userListings, ...SEED_LISTINGS], [state.userListings]);
  const byId = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);

  /* Sellers answer pending requests ~3.5s after they are sent. */
  useEffect(() => {
    const pending = state.requests.filter((r) => r.status === "pending");
    const timers = pending.map((r) =>
      window.setTimeout(
        () => {
          const res = sellerResponse(r, byId.get(r.listingId));
          dispatch({ type: "setStatus", id: r.id, ...res });
        },
        Math.max(400, 3500 - (Date.now() - r.createdAt)),
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [state.requests, byId]);

  const toggleFavorite = useCallback((id: string) => dispatch({ type: "toggleFavorite", id }), []);
  const sendRequest = useCallback(
    (r: Omit<MarketRequest, "id" | "createdAt" | "status">) =>
      dispatch({
        type: "addRequest",
        request: {
          ...r,
          id: `req-${Date.now().toString(36)}`,
          createdAt: Date.now(),
          status: "pending",
        },
      }),
    [],
  );
  const cancelRequest = useCallback(
    (id: string) => dispatch({ type: "setStatus", id, status: "cancelled" }),
    [],
  );
  const acceptCounter = useCallback(
    (id: string) => dispatch({ type: "setStatus", id, status: "accepted" }),
    [],
  );
  const publishListing = useCallback(
    (listing: Listing) => dispatch({ type: "publish", listing }),
    [],
  );
  const removeListing = useCallback((id: string) => dispatch({ type: "removeListing", id }), []);

  const api = useMemo<MarketplaceApi>(
    () => ({
      ...state,
      listings,
      getListing: (id) => byId.get(id),
      isFavorite: (id) => state.favorites.includes(id),
      toggleFavorite,
      sendRequest,
      cancelRequest,
      acceptCounter,
      publishListing,
      removeListing,
    }),
    [
      state,
      listings,
      byId,
      toggleFavorite,
      sendRequest,
      cancelRequest,
      acceptCounter,
      publishListing,
      removeListing,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useMarketplace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMarketplace must be used inside <MarketplaceStoreProvider>");
  return ctx;
}
