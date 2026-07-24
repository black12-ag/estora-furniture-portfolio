import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, LayoutGrid, List, ChevronDown, Check, Heart, ShoppingBag, Star, SlidersHorizontal, Eye, SearchX } from "lucide-react";
import { toast } from "sonner";
import { products } from "@/lib/products";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { Highlight } from "@/lib/highlight";
import { track } from "@/lib/analytics";

type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc" | "rating";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  validateSearch: (search: Record<string, unknown>) => ({
    cat: typeof search.cat === "string" ? search.cat : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
    color: typeof search.color === "string" ? search.color : undefined,
    sort: typeof search.sort === "string" ? (search.sort as SortKey) : undefined,
    min: typeof search.min === "number" ? search.min : undefined,
    max: typeof search.max === "number" ? search.max : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Furniture, Lighting & Décor — Estora" },
      { name: "description", content: "Browse Estora furniture, lighting and décor. Filter by category, type, color, price, and sort by best-sellers or price." },
      { property: "og:title", content: "Shop All — Estora" },
      { property: "og:description", content: "Filter by category, type, color, price, and sort by best-sellers or price." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
});

const categories = ["All", "Accessories", "Cabinets", "Armchairs", "Bookcases", "Coffee tables", "Decor", "Floor Lamps", "Bedroom"];
const types = ["Wooden", "Iron", "Ceramic", "Material", "Glass"] as const;
const swatches: { name: string; value: string }[] = [
  { name: "Charcoal", value: "#111" }, { name: "Grey", value: "#7a7a7a" },
  { name: "Navy", value: "#1a3a72" }, { name: "Red", value: "#e53935" },
  { name: "Amber", value: "#f39c12" }, { name: "Lime", value: "#c9d84a" },
  { name: "Green", value: "#4caf50" }, { name: "Teal", value: "#2f9c88" },
  { name: "Blue", value: "#2196f3" }, { name: "Sky", value: "#22c1e8" },
  { name: "Purple", value: "#7c4dff" }, { name: "Pink", value: "#e91e63" },
];

const PAGE_SIZE = 12;
const PRICE_MIN = 0;
const PRICE_MAX = 1500;
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });

  const [view, setView] = useState<"grid" | "list">("grid");
  const [cat, setCat] = useState<string>(search.cat && categories.includes(search.cat) ? search.cat : "All");
  const [type, setType] = useState<string | null>(search.type && (types as readonly string[]).includes(search.type) ? search.type : null);
  const [color, setColor] = useState<string | null>(search.color ?? null);
  const [minPrice, setMinPrice] = useState<number>(search.min ?? PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState<number>(search.max ?? PRICE_MAX);
  const [sort, setSort] = useState<SortKey>(search.sort ?? "featured");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const q = (search.q ?? "").trim();
  useEffect(() => { setHydrated(true); }, []);

  const { add } = useCart();
  const wishlist = useWishlist();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync state → URL
  useEffect(() => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        cat: cat !== "All" ? cat : undefined,
        type: type ?? undefined,
        color: color ?? undefined,
        min: minPrice > PRICE_MIN ? minPrice : undefined,
        max: maxPrice < PRICE_MAX ? maxPrice : undefined,
        sort: sort !== "featured" ? sort : undefined,
      }),
      replace: true,
    });
  }, [cat, type, color, minPrice, maxPrice, sort, navigate]);

  // Reset pagination when any filter or sort changes
  useEffect(() => { setVisible(PAGE_SIZE); }, [cat, type, color, minPrice, maxPrice, sort]);

  // Deep-link scroll
  useEffect(() => {
    if (!search.cat && !search.type && !search.color) return;
    const el = resultsRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const lo = Math.min(minPrice, maxPrice);
    const hi = Math.max(minPrice, maxPrice);
    const query = q.toLowerCase();
    const list = products.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (type && p.type !== type) return false;
      if (color && !p.colors.some((c) => norm(c.name) === norm(color))) return false;
      if (p.price < lo || p.price > hi) return false;
      if (query && !(`${p.name} ${p.category} ${p.type}`.toLowerCase().includes(query))) return false;
      return true;
    });
    const sorted = [...list];
    switch (sort) {
      case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
      case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
      case "name-asc": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "rating": sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      default: break;
    }
    return sorted;
  }, [cat, type, color, minPrice, maxPrice, sort, q]);

  const shown = filtered.slice(0, visible);
  const clearAll = () => { setCat("All"); setType(null); setColor(null); setMinPrice(PRICE_MIN); setMaxPrice(PRICE_MAX); setSort("featured"); };
  const activeCount = (cat !== "All" ? 1 : 0) + (type ? 1 : 0) + (color ? 1 : 0) + (minPrice > PRICE_MIN || maxPrice < PRICE_MAX ? 1 : 0);

  /* Analytics: report the outcome of every search query */
  useEffect(() => {
    if (!q) return;
    if (filtered.length === 0) {
      track("search_zero_results", { query: q });
    } else {
      track("search_results_shown", { query: q, results: filtered.length });
    }
  }, [q, filtered.length]);

  const filtersPanel = (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">
            Filters
            {activeCount > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{activeCount}</span>}
          </h3>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs font-semibold text-primary underline hover:no-underline">Clear all</button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cat !== "All" && <Chip label={cat} onClear={() => setCat("All")} />}
          {type && <Chip label={type} onClear={() => setType(null)} />}
          {color && <Chip label={color} onClear={() => setColor(null)} />}
          {(minPrice > PRICE_MIN || maxPrice < PRICE_MAX) && <Chip label={`$${minPrice} – $${maxPrice}`} onClear={() => { setMinPrice(PRICE_MIN); setMaxPrice(PRICE_MAX); }} />}
          {activeCount === 0 && <p className="text-xs text-muted-foreground">No filters applied.</p>}
        </div>
      </div>

      <Section title="Categories">
        <ul className="space-y-2 text-sm">
          {categories.map((c) => {
            const count = c === "All" ? products.length : products.filter((p) => p.category === c).length;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                  className={`flex w-full items-center justify-between text-left transition ${cat === c ? "font-bold text-primary" : "text-foreground/80 hover:text-foreground"}`}
                >
                  <span className="inline-flex items-center">
                    {cat === c && <span className="mr-2 inline-block h-0.5 w-3 bg-primary align-middle" />}
                    {c}
                  </span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Type">
        <ul className="space-y-2 text-sm">
          {types.map((t) => {
            const id = `type-${t}`;
            const count = products.filter((p) => p.type === t).length;
            return (
              <li key={t} className="flex items-center justify-between gap-2">
                <label htmlFor={id} className="flex flex-1 cursor-pointer items-center gap-2">
                  <input
                    id={id}
                    type="checkbox"
                    checked={type === t}
                    onChange={() => setType(type === t ? null : t)}
                    className="accent-primary"
                  />
                  <span className={type === t ? "font-bold text-primary" : ""}>{t}</span>
                </label>
                <span className="text-xs text-muted-foreground">{count}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Colors">
        <div className="grid grid-cols-6 gap-2" role="group" aria-label="Filter by color">
          {swatches.map((c) => {
            const active = color === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(active ? null : c.name)}
                aria-pressed={active}
                aria-label={`Filter by color ${c.name}`}
                title={c.name}
                className={`grid h-7 w-7 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-background transition ${active ? "ring-primary" : "ring-transparent hover:ring-foreground/60"}`}
                style={{ background: c.value }}
              >
                {active && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Price Range">
        {/* Dual range: min above, max below (overlaid track visualization) */}
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface" aria-hidden />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
            style={{
              left: `${(Math.min(minPrice, maxPrice) / PRICE_MAX) * 100}%`,
              right: `${100 - (Math.max(minPrice, maxPrice) / PRICE_MAX) * 100}%`,
            }}
            aria-hidden
          />
          <label htmlFor="price-min" className="sr-only">Minimum price</label>
          <input
            id="price-min"
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={10}
            value={minPrice}
            onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
            className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent accent-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
            aria-valuetext={`Minimum $${minPrice}`}
          />
          <label htmlFor="price-max" className="sr-only">Maximum price</label>
          <input
            id="price-max"
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
            className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent accent-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
            aria-valuetext={`Maximum $${maxPrice}`}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Min</span>
            <div className="flex items-center rounded-full border border-border px-3 focus-within:ring-2 focus-within:ring-primary">
              <span className="text-xs text-muted-foreground">$</span>
              <input
                type="number"
                inputMode="numeric"
                min={PRICE_MIN}
                max={PRICE_MAX}
                value={minPrice}
                onChange={(e) => {
                  const v = Math.max(PRICE_MIN, Math.min(PRICE_MAX, Number(e.target.value) || 0));
                  setMinPrice(Math.min(v, maxPrice));
                }}
                className="w-full bg-transparent py-1.5 text-sm font-semibold outline-none"
                aria-label="Minimum price"
              />
            </div>
          </label>
          <span className="mt-4 text-muted-foreground">–</span>
          <label className="flex-1">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Max</span>
            <div className="flex items-center rounded-full border border-border px-3 focus-within:ring-2 focus-within:ring-primary">
              <span className="text-xs text-muted-foreground">$</span>
              <input
                type="number"
                inputMode="numeric"
                min={PRICE_MIN}
                max={PRICE_MAX}
                value={maxPrice}
                onChange={(e) => {
                  const v = Math.max(PRICE_MIN, Math.min(PRICE_MAX, Number(e.target.value) || 0));
                  setMaxPrice(Math.max(v, minPrice));
                }}
                className="w-full bg-transparent py-1.5 text-sm font-semibold outline-none"
                aria-label="Maximum price"
              />
            </div>
          </label>
        </div>
      </Section>
    </div>
  );

  return (
    <div>
      <section className="relative flex h-40 items-center justify-center bg-surface md:h-48">
        <div className="text-center px-4">
          <p className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link> ›{" "}
            <span className="text-foreground">{cat === "All" ? "All" : cat}</span>
          </p>
          <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{cat === "All" ? "Shop All" : cat}</h1>
          <p className="mt-1.5 max-w-md text-xs text-muted-foreground md:text-sm">Shop our newest items, made with love by the world's best artisans.</p>
        </div>
      </section>


      <div className="container-x grid gap-6 py-8 lg:grid-cols-[240px_1fr] lg:gap-8">
        <aside className="hidden lg:block">{filtersPanel}</aside>

        <div ref={resultsRef} id="shop-results">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFilters(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeCount}</span>}
              </button>
              <p className="text-xs text-muted-foreground" data-testid="results-count">
                <span className="font-bold text-foreground" data-testid="results-shown">{shown.length}</span> of <span className="font-bold text-foreground" data-testid="results-total">{filtered.length}</span>
              </p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="hidden md:inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-bold text-primary hover:bg-surface"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="hidden text-xs text-muted-foreground sm:inline">Sort</label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="min-h-9 appearance-none rounded-full border border-border bg-background pl-3 pr-8 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="name-asc">A – Z</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="inline-flex overflow-hidden rounded-full border border-border" role="group" aria-label="Change view">
                <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`grid h-9 w-9 place-items-center transition ${view === "grid" ? "bg-foreground text-background" : "bg-transparent hover:bg-surface"}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={`grid h-9 w-9 place-items-center transition ${view === "list" ? "bg-foreground text-background" : "bg-transparent hover:bg-surface"}`}><List className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>


          {!hydrated ? (
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              role="status"
              aria-label="Loading products"
              data-testid="shop-skeleton"
            >
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
              <span className="sr-only">Loading products…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-4 py-20 text-center"
              role="status"
              data-testid="shop-empty"
            >
              <SearchX className="h-14 w-14 text-muted-foreground" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-extrabold">
                  {q ? <>No products match “<Highlight text={q} match={q} />”</> : "No products match your filters"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {q
                    ? "Try a different keyword, remove a filter, or expand your price range."
                    : "Try removing a filter or expanding your price range to see more options."}
                </p>
              </div>
              <button
                onClick={clearAll}
                className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                Clear all filters
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {shown.map((p) => {
                const inWishlist = wishlist.has(p.slug);
                const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
                return (
                  <article key={p.slug} className="group">
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-surface">
                      <Link to="/product/$slug" params={{ slug: p.slug }} className="block h-full w-full">
                        <img src={p.image} alt={p.name} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </Link>
                      {p.compareAt && (
                        <span className="absolute left-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-sale text-[11px] font-bold text-white">-{off}%</span>
                      )}
                      <button
                        type="button"
                        onClick={() => { wishlist.toggle(p.slug); toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist"); }}
                        aria-label={inWishlist ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                        aria-pressed={inWishlist}
                        className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-sm backdrop-blur transition hover:bg-background"
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? "fill-sale text-sale" : "text-foreground"}`} />
                      </button>
                      <Link
                        to="/product/$slug" params={{ slug: p.slug }}
                        className="absolute right-3 top-14 z-10 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-sm opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Quick view ${p.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => { add({ id: p.slug, slug: p.slug, name: p.name, price: p.price, image: p.image }); toast.success(`${p.name} added to cart`); }}
                        className="absolute inset-x-3 bottom-3 z-10 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-foreground py-2.5 text-xs font-bold text-background opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <ShoppingBag className="h-4 w-4" /> Add to Cart
                      </button>
                    </div>
                    <div className="mb-1 flex gap-1">
                      {p.colors.slice(0, 5).map((c) => <span key={c.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-border" style={{ background: c.value }} title={c.name} />)}
                    </div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      onClick={() => q && track("search_result_click", { query: q, slug: p.slug, position: shown.indexOf(p) })}
                      className="block"
                    >
                      <h3 className="text-sm font-semibold hover:text-primary"><Highlight text={p.name} match={q} /></h3>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className={`font-bold ${p.compareAt ? "text-sale" : ""}`}>${p.price.toFixed(2)}</span>
                      {p.compareAt && <span className="text-xs text-muted-foreground line-through">${p.compareAt.toFixed(2)}</span>}
                      {p.compareAt && <span className="text-[10px] font-bold text-sale">Save ${(p.compareAt - p.price).toFixed(0)}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Stars value={p.rating ?? 0} />
                      <span>({p.reviews ?? 0})</span>
                    </div>
                    {/* Mobile-visible Add to Cart (hover overlay hidden on touch) */}
                    <button
                      type="button"
                      onClick={() => { add({ id: p.slug, slug: p.slug, name: p.name, price: p.price, image: p.image }); toast.success(`${p.name} added to cart`); }}
                      className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground sm:hidden"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <ul className="space-y-6">
              {shown.map((p) => {
                const inWishlist = wishlist.has(p.slug);
                return (
                  <li key={p.slug} className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row">
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-surface">
                      <img src={p.image} alt={p.name} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover" />
                      {p.compareAt && <span className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-sale text-[10px] font-bold text-white">-{Math.round((1 - p.price / p.compareAt) * 100)}%</span>}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <Link to="/product/$slug" params={{ slug: p.slug }} onClick={() => q && track("search_result_click", { query: q, slug: p.slug, position: shown.indexOf(p), view: "list" })} className="font-semibold hover:text-primary"><Highlight text={p.name} match={q} /></Link>
                        <button
                          type="button"
                          onClick={() => { wishlist.toggle(p.slug); toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist"); }}
                          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                          aria-pressed={inWishlist}
                          className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-surface"
                        >
                          <Heart className={`h-4 w-4 ${inWishlist ? "fill-sale text-sale" : ""}`} />
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={`font-bold ${p.compareAt ? "text-sale" : ""}`}>${p.price.toFixed(2)}</span>
                        {p.compareAt && <span className="text-xs text-muted-foreground line-through">${p.compareAt.toFixed(2)}</span>}
                        {p.compareAt && <span className="text-[10px] font-bold text-sale">Save ${(p.compareAt - p.price).toFixed(0)}</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Stars value={p.rating ?? 0} /><span>({p.reviews ?? 0})</span>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {p.colors.slice(0, 5).map((c) => <span key={c.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-border" style={{ background: c.value }} />)}
                      </div>
                      <p className="mt-2 max-w-xl text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => { add({ id: p.slug, slug: p.slug, name: p.name, price: p.price, image: p.image }); toast.success(`${p.name} added to cart`); }}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                        </button>
                        <Link
                          to="/product/$slug" params={{ slug: p.slug }}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-5 py-2 text-xs font-bold hover:bg-surface"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {visible < filtered.length && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setVisible((v) => v + PAGE_SIZE);
                  if (q) track("search_load_more", { query: q, shown: visible, total: filtered.length });
                }}
                data-testid="load-more"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-foreground px-6 py-3 text-sm font-bold hover:bg-foreground hover:text-background"
              >
                Load more ({filtered.length - visible} left)
              </button>
              {q && (
                <p className="text-xs text-muted-foreground">
                  Loading more results for “<Highlight text={q} match={q} />”
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-extrabold">Filters</h2>
              <button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filtersPanel}</div>
            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="w-full min-h-11 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                Show {filtered.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const panelId = `section-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="border-t border-border pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="mb-3 flex w-full items-center justify-between focus-visible:outline-2 focus-visible:outline-primary"
      >
        <h4 className="font-extrabold">{title}</h4>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div id={panelId}>{children}</div>}
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Remove filter ${label}`}
      className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-semibold hover:bg-accent"
    >
      <X className="h-3 w-3" /> {label}
    </button>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3 w-3 ${i <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-3 aspect-square rounded-2xl bg-surface" />
      <div className="mb-2 flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-2.5 w-2.5 rounded-full bg-surface" />
        ))}
      </div>
      <div className="mb-1.5 h-4 w-4/5 rounded bg-surface" />
      <div className="h-4 w-1/3 rounded bg-surface" />
    </div>
  );
}
