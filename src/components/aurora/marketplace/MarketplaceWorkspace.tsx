/**
 * MarketplaceWorkspace — Ollympius Private Collection.
 *
 * Luxury marketplace to buy and sell cars, real estate, jewellery & watches,
 * fashion, exclusive events, yachts and private jets. Same chrome as every
 * other workspace: header → command bar → KPI strip → scrollable content.
 */
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowDownUp,
  Compass,
  Heart,
  Inbox,
  PackageOpen,
  Plus,
  SearchX,
  Store,
} from "lucide-react";
import type { Category, Listing } from "@/data/marketplaceData";
import { useMarketplace } from "@/data/marketplaceStore";
import {
  AccentBadge,
  EmptyState,
  FilterChip,
  SearchField,
  SegmentedTabs,
  StatTile,
  WorkspaceHeader,
  formatUsd,
} from "../primitives";
import { CategoryRail } from "./CategoryRail";
import { FeaturedShowcase } from "./FeaturedShowcase";
import { ListingCard } from "./ListingCard";
import { ListingDrawer } from "./ListingDrawer";
import { RequestsPanel } from "./RequestsPanel";
import { SellWizard } from "./SellWizard";

type TabId = "explore" | "favorites" | "mine" | "requests";
type SortId = "featured" | "priceAsc" | "priceDesc" | "recent" | "popular";

const PRICE_BANDS = [
  { id: "all", label: "Qualquer preço", min: 0, max: Infinity },
  { id: "lt100k", label: "< $100K", min: 0, max: 100_000 },
  { id: "100k-1m", label: "$100K – $1M", min: 100_000, max: 1_000_000 },
  { id: "1m-10m", label: "$1M – $10M", min: 1_000_000, max: 10_000_000 },
  { id: "gt10m", label: "> $10M", min: 10_000_000, max: Infinity },
] as const;
type BandId = (typeof PRICE_BANDS)[number]["id"];

const SORTS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Destaque" },
  { id: "priceDesc", label: "Preço ↓" },
  { id: "priceAsc", label: "Preço ↑" },
  { id: "recent", label: "Mais recentes" },
  { id: "popular", label: "Mais vistos" },
];

function sortListings(list: Listing[], sort: SortId) {
  const out = [...list];
  switch (sort) {
    case "priceAsc":
      return out.sort((a, b) => a.priceUsd - b.priceUsd);
    case "priceDesc":
      return out.sort((a, b) => b.priceUsd - a.priceUsd);
    case "recent":
      return out.sort((a, b) => b.listedAt.localeCompare(a.listedAt));
    case "popular":
      return out.sort((a, b) => b.views - a.views);
    default:
      return out.sort(
        (a, b) =>
          Number(!!b.mine) - Number(!!a.mine) ||
          Number(!!b.featured) - Number(!!a.featured) ||
          b.watchers - a.watchers,
      );
  }
}

export function MarketplaceWorkspace() {
  const store = useMarketplace();
  const [tab, setTab] = useState<TabId>("explore");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<BandId>("all");
  const [sort, setSort] = useState<SortId>("featured");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  const { listings } = store;

  /* Tab scope → text + price filters → category → sort. */
  const scoped = useMemo(() => {
    if (tab === "favorites") return listings.filter((l) => store.favorites.includes(l.id));
    if (tab === "mine") return listings.filter((l) => l.mine);
    return listings;
  }, [tab, listings, store.favorites]);

  const q = query.trim().toLowerCase();
  const priceBand = PRICE_BANDS.find((b) => b.id === band)!;
  const matched = useMemo(
    () =>
      scoped.filter(
        (l) =>
          (!q ||
            [l.title, l.brand, l.subtitle, l.location, ...l.tags]
              .join(" ")
              .toLowerCase()
              .includes(q)) &&
          l.priceUsd >= priceBand.min &&
          l.priceUsd < priceBand.max,
      ),
    [scoped, q, priceBand],
  );

  const counts = useMemo(() => {
    const c = {} as Record<Category, number>;
    for (const l of matched) c[l.category] = (c[l.category] ?? 0) + 1;
    return c;
  }, [matched]);

  const visible = useMemo(
    () =>
      sortListings(
        category === "all" ? matched : matched.filter((l) => l.category === category),
        sort,
      ),
    [matched, category, sort],
  );

  const featured =
    tab === "explore" && !q && band === "all" ? (visible.find((l) => l.featured) ?? null) : null;
  const grid = featured ? visible.filter((l) => l.id !== featured.id) : visible;

  /* KPI strip describes the current selection. */
  const kpi = useMemo(() => {
    const total = visible.reduce((a, l) => a + l.priceUsd * (l.stock ?? 1), 0);
    const verified = visible.filter((l) => l.seller.verified).length;
    return {
      total,
      count: visible.length,
      avg: visible.length ? visible.reduce((a, l) => a + l.priceUsd, 0) / visible.length : 0,
      verifiedPct: visible.length ? verified / visible.length : 0,
    };
  }, [visible]);

  const activeRequests = store.requests.filter(
    (r) => r.status === "pending" || r.status === "countered",
  ).length;
  const openListing = openId ? (store.getListing(openId) ?? null) : null;
  const closeDrawer = useCallback(() => setOpenId(null), []);

  const startSell = () => {
    setEditing(null);
    setSellOpen(true);
  };

  const resetFilters = () => {
    setQuery("");
    setBand("all");
    setCategory("all");
  };

  const emptyByTab: Record<TabId, { icon: React.ElementType; title: string; hint: string }> = {
    explore: {
      icon: SearchX,
      title: "Nada corresponde à pesquisa",
      hint: "Experimente outra categoria, faixa de preço ou termo.",
    },
    favorites: {
      icon: Heart,
      title: "Ainda sem favoritos",
      hint: "Toque no coração de qualquer ativo para o guardar aqui.",
    },
    mine: {
      icon: PackageOpen,
      title: "Ainda não anunciou nada",
      hint: "Publique o primeiro ativo em menos de um minuto.",
    },
    requests: { icon: Inbox, title: "", hint: "" },
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceHeader
        title="Marketplace"
        subtitle="Private Collection · carros, imobiliário, joias, moda, eventos, iates e jatos privados"
        badge={<AccentBadge>Private Collection</AccentBadge>}
        right={
          <button
            type="button"
            onClick={startSell}
            className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-bold text-[#0b1020] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform duration-150 hover:-translate-y-px active:scale-[0.97]"
          >
            <Plus size={14} strokeWidth={2.4} />{" "}
            <span className="hidden sm:inline">Anunciar ativo</span>
            <span className="sm:hidden">Vender</span>
          </button>
        }
      />

      {/* Command bar */}
      <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2">
        <SegmentedTabs
          active={tab}
          onSelect={(t) => setTab(t)}
          tabs={[
            { id: "explore", label: "Explorar", icon: Compass },
            { id: "favorites", label: "Favoritos", icon: Heart, count: store.favorites.length },
            {
              id: "mine",
              label: "Minhas vendas",
              shortLabel: "Vendas",
              icon: Store,
              count: store.userListings.length,
            },
            {
              id: "requests",
              label: "Pedidos & Ofertas",
              shortLabel: "Pedidos",
              icon: Inbox,
              count: activeRequests || undefined,
            },
          ]}
        />
        {tab !== "requests" ? (
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Pesquisar marca, modelo, cidade…"
            className="min-w-[200px] flex-1"
          />
        ) : null}
      </div>

      <div className="thin-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
        {tab === "requests" ? (
          <RequestsPanel onOpen={(l) => setOpenId(l.id)} />
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            <CategoryRail
              active={category}
              onSelect={setCategory}
              counts={counts}
              total={matched.length}
            />

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <StatTile
                accent
                label="Valor em coleção"
                value={formatUsd(kpi.total)}
                footnote="Soma dos ativos visíveis"
              />
              <StatTile
                label="Ativos"
                value={kpi.count}
                footnote={category === "all" ? "Todas as categorias" : "Na categoria"}
              />
              <StatTile
                label="Ticket médio"
                value={formatUsd(kpi.avg)}
                footnote="Preço pedido médio"
              />
              <StatTile
                label="Vendedores verificados"
                value={`${Math.round(kpi.verifiedPct * 100)}%`}
                deltaTone="up"
                footnote="KYC & proveniência"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
                {PRICE_BANDS.map((b) => (
                  <FilterChip key={b.id} active={band === b.id} onClick={() => setBand(b.id)}>
                    {b.label}
                  </FilterChip>
                ))}
              </div>
              <label
                className="glass-soft flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-white/60"
                style={{ borderRadius: 10 }}
              >
                <ArrowDownUp size={12} />
                <span className="sr-only">Ordenar</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortId)}
                  className="cursor-pointer bg-transparent font-semibold text-white outline-none [color-scheme:dark]"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#111827]">
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {featured ? (
              <FeaturedShowcase
                listing={featured}
                favorite={store.isFavorite(featured.id)}
                onToggleFavorite={() => store.toggleFavorite(featured.id)}
                onOpen={() => setOpenId(featured.id)}
              />
            ) : null}

            {grid.length === 0 && !featured ? (
              <EmptyState
                icon={emptyByTab[tab].icon}
                title={emptyByTab[tab].title}
                hint={emptyByTab[tab].hint}
                action={
                  tab === "mine" ? (
                    <button
                      type="button"
                      onClick={startSell}
                      className="mt-1 flex items-center gap-1.5 rounded-full bg-[var(--aurora-accent)] px-4 py-2 text-[12px] font-bold text-white"
                    >
                      <Plus size={13} /> Anunciar ativo
                    </button>
                  ) : q || band !== "all" || category !== "all" ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/16"
                    >
                      Limpar filtros
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {grid.map((l, i) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      index={i}
                      favorite={store.isFavorite(l.id)}
                      onToggleFavorite={() => store.toggleFavorite(l.id)}
                      onOpen={() => setOpenId(l.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      <ListingDrawer
        listing={openListing}
        onClose={closeDrawer}
        onEdit={(l) => {
          setOpenId(null);
          setEditing(l);
          setSellOpen(true);
        }}
      />
      <SellWizard
        open={sellOpen}
        editing={editing}
        onClose={() => setSellOpen(false)}
        onPublished={(l) => {
          setSellOpen(false);
          setTab("mine");
          setCategory("all");
          setOpenId(l.id);
        }}
      />
    </div>
  );
}
