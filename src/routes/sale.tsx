import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingBag, Flame, Timer, Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";
import { toast } from "sonner";
import { products } from "@/lib/products";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/sale")({
  component: SalePage,
  head: () => ({
    meta: [
      { title: "Flash Sale — Up to 60% off Furniture & Décor | Estora" },
      { name: "description", content: "Shop the Estora flash sale — up to 60% off armchairs, lighting, cushions and more. Ends Sunday." },
      { property: "og:title", content: "Flash Sale — Up to 60% off | Estora" },
      { property: "og:description", content: "Our biggest sale of the season. Premium furniture at their best prices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const saleItems = products.filter((p) => p.compareAt);
const categories = ["All", ...Array.from(new Set(saleItems.map((p) => p.category)))];

type SortKey = "featured" | "discount" | "price-asc" | "price-desc" | "rating";

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, done: diff === 0 };
}

// Stable target: next Sunday 23:59 from page load week
function getSaleEnd() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun
  const daysUntil = (7 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  d.setHours(23, 59, 59, 0);
  return d.getTime();
}

function SalePage() {
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<SortKey>("discount");
  const [target] = useState(getSaleEnd);
  const t = useCountdown(target);
  const cart = useCart();
  const wl = useWishlist();

  const filtered = useMemo(() => {
    const list = cat === "All" ? saleItems : saleItems.filter((p) => p.category === cat);
    const withPct = list.map((p) => ({ ...p, _pct: Math.round((1 - p.price / (p.compareAt ?? p.price)) * 100) }));
    switch (sort) {
      case "discount": return withPct.sort((a, b) => b._pct - a._pct);
      case "price-asc": return withPct.sort((a, b) => a.price - b.price);
      case "price-desc": return withPct.sort((a, b) => b.price - a.price);
      case "rating": return withPct.sort((a, b) => b.rating - a.rating);
      default: return withPct;
    }
  }, [cat, sort]);

  const maxPct = Math.max(...saleItems.map((p) => Math.round((1 - p.price / (p.compareAt ?? p.price)) * 100)));
  const totalSaved = saleItems.reduce((s, p) => s + ((p.compareAt ?? 0) - p.price), 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sale/15 via-background to-primary/10">
        <div className="container-x py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-sale px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
            <Flame className="h-3.5 w-3.5" /> Flash sale · Limited time
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight text-foreground md:text-7xl">
            Up to <span className="text-sale">{maxPct}% off</span> everything you love.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Refresh your home with premium pieces at their best prices ever. New markdowns added — while stock lasts.
          </p>

          {/* Countdown */}
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2" aria-label="Sale ends in">
            <Timer className="mr-2 h-5 w-5 text-sale" aria-hidden />
            {[
              { label: "Days", v: t.days },
              { label: "Hrs", v: t.hours },
              { label: "Min", v: t.mins },
              { label: "Sec", v: t.secs },
            ].map((u) => (
              <div key={u.label} className="flex min-w-16 flex-col items-center rounded-2xl bg-foreground px-3 py-3 text-background">
                <span className="text-2xl font-extrabold tabular-nums md:text-3xl">{String(u.v).padStart(2, "0")}</span>
                <span className="mt-1 text-[10px] uppercase tracking-widest opacity-70">{u.label}</span>
              </div>
            ))}
          </div>

          {/* Perks */}
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Free shipping over $200</span>
            <span className="inline-flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 30-day returns</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 10-year guarantee</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="border-y border-border bg-background sticky top-16 z-30 backdrop-blur">
        <div className="container-x flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter sale by category">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => { setCat(c); track("sale_filter", { category: c }); }}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${cat === c ? "border-sale bg-sale text-white" : "border-border hover:border-sale hover:text-sale"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sale-sort" className="text-xs font-semibold text-muted-foreground">Sort by</label>
            <select
              id="sale-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="discount">Biggest discount</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </div>
      </section>

      {/* Deal of the day — auto rotates through the top 3 discounts */}
      <RotatingDealOfTheDay items={saleItems} onAdd={(p) => { cart.add({ id: `${p.slug}-default`, slug: p.slug, name: p.name, price: p.price, image: p.image }); toast.success(`${p.name} added to cart`); }} />


      {/* Grid */}
      <section className="container-x py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-extrabold"><span className="text-sale">Flash</span> Sale · {filtered.length} items</h2>
          <p className="hidden text-xs text-muted-foreground md:block">Total possible savings: <span className="font-bold text-foreground">${totalSaved.toFixed(0)}</span></p>
        </div>


        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-surface py-20 text-center">
            <p className="text-lg font-bold">No items in this category right now.</p>
            <button onClick={() => setCat("All")} className="mt-4 text-sm font-bold text-primary hover:underline">View all sale items →</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => {
              const pct = p._pct;
              const saved = (p.compareAt ?? p.price) - p.price;
              const liked = wl.has(p.slug);
              return (
                <article key={p.slug} className="group">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-surface">
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-sale px-2.5 py-1 text-[10px] font-bold text-white">-{pct}%</span>
                    {p.stock <= 10 && (
                      <span className="absolute left-3 top-11 z-10 rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-bold text-background">Only {p.stock} left</span>
                    )}
                    <button
                      type="button"
                      aria-label={liked ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                      aria-pressed={liked}
                      onClick={() => { wl.toggle(p.slug); track("wishlist_toggle", { slug: p.slug, source: "sale" }); }}
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition hover:bg-background"
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-sale text-sale" : ""}`} />
                    </button>
                    <Link to="/product/$slug" params={{ slug: p.slug }} aria-label={p.name}>
                      <img src={p.image} alt={p.name} loading="lazy" width={600} height={600} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        cart.add({ id: `${p.slug}-default`, slug: p.slug, name: p.name, price: p.price, image: p.image });
                        track("add_to_cart", { slug: p.slug, source: "sale" });
                        toast.success(`${p.name} added to cart`);
                      }}
                      className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-2 rounded-full bg-foreground py-2.5 text-xs font-bold text-background opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
                    >
                      <ShoppingBag className="h-4 w-4" /> Add to cart
                    </button>
                  </div>
                  <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{p.category}</p>
                    <h3 className="mt-0.5 text-sm font-semibold group-hover:text-primary">{p.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" aria-hidden /> {p.rating.toFixed(1)}
                      <span className="opacity-60">({p.reviews})</span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-bold text-sale">${p.price.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground line-through">${p.compareAt!.toFixed(2)}</span>
                      <span className="ml-auto text-[10px] font-bold text-sale">Save ${saved.toFixed(0)}</span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-x pb-24">
        <div className="rounded-3xl bg-foreground px-8 py-14 text-center text-background md:px-16">
          <h2 className="text-3xl font-extrabold md:text-4xl">Don't miss the drop.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm opacity-80">Get early access to the next flash sale — subscribers see prices 24 hours before anyone else.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90">Shop everything</Link>
            <Link to="/" className="rounded-full border border-background/40 px-8 py-3 text-sm font-bold text-background transition hover:bg-background/10">Back home</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

type SaleItem = (typeof products)[number];

function RotatingDealOfTheDay({ items, onAdd }: { items: SaleItem[]; onAdd: (p: SaleItem) => void }) {
  const deals = useMemo(
    () => [...items]
      .filter((p) => p.compareAt)
      .sort((a, b) => (b.compareAt! - b.price) - (a.compareAt! - a.price))
      .slice(0, 3),
    [items]
  );
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (deals.length < 2 || paused) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % deals.length), 6000);
    return () => clearInterval(id);
  }, [deals.length, paused]);

  if (deals.length === 0) return null;
  const dotd = deals[idx];
  const savePct = Math.round((1 - dotd.price / dotd.compareAt!) * 100);
  const saveAmt = dotd.compareAt! - dotd.price;

  return (
    <section
      className="container-x pt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative grid overflow-hidden rounded-3xl bg-foreground text-background md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sale px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            <Flame className="h-3 w-3" /> Deal of the day
          </span>
          <div key={dotd.slug} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">{dotd.name}</h2>
            <p className="mt-3 max-w-sm text-sm opacity-80">
              Save <span className="font-bold text-sale">${saveAmt.toFixed(0)}</span> — {savePct}% off, only while stock lasts.
            </p>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-sale">${dotd.price.toFixed(2)}</span>
              <span className="text-sm line-through opacity-60">${dotd.compareAt!.toFixed(2)}</span>
              <span className="rounded-full bg-sale px-2 py-0.5 text-[10px] font-bold text-white">−{savePct}%</span>
              <span className="rounded-full bg-background/10 px-2 py-0.5 text-[10px] font-bold">Save ${saveAmt.toFixed(0)}</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link to="/product/$slug" params={{ slug: dotd.slug }} className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">Shop this deal →</Link>
            <button onClick={() => onAdd(dotd)} className="rounded-full border border-background/40 px-6 py-3 text-sm font-bold hover:bg-background/10">Quick add</button>
          </div>
          {deals.length > 1 && (
            <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Deal of the day">
              {deals.map((d, i) => (
                <button
                  key={d.slug}
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Show deal ${i + 1}: ${d.name}`}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-sale" : "w-4 bg-background/30 hover:bg-background/50"}`}
                />
              ))}
              <span className="ml-2 text-[10px] uppercase tracking-widest opacity-60">
                {idx + 1} / {deals.length}{paused ? " · paused" : ""}
              </span>
            </div>
          )}
        </div>
        <div key={`img-${dotd.slug}`} className="relative aspect-square animate-in fade-in duration-500 md:aspect-auto">
          <img src={dotd.image} alt={dotd.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

