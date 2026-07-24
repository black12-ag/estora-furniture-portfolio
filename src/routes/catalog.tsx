import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at: number | null;
  image: string;
  category: string;
  type: string;
  description: string;
  stock: number;
  is_published: boolean;
};

export const Route = createFileRoute("/catalog")({
  component: CatalogPage,
  head: () => ({
    meta: [
      { title: "Catalog — Estora | Published Furniture Collection" },
      { name: "description", content: "Browse Estora's live catalog of published furniture, updated straight from our workshop database." },
      { property: "og:title", content: "Estora Catalog" },
      { property: "og:description", content: "Browse our live, always up-to-date furniture catalog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Sort = "newest" | "price-asc" | "price-desc" | "name";

function CatalogPage() {
  const [rows, setRows] = useState<CatalogProduct[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<Sort>("newest");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, price, compare_at, image, category, type, description, stock, is_published")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) setErr(error.message);
      else setRows((data ?? []) as CatalogProduct[]);
    })();
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set((rows ?? []).map((r) => r.category).filter(Boolean)))],
    [rows]
  );

  const filtered = useMemo(() => {
    const list = (rows ?? []).filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return r.name.toLowerCase().includes(needle) || (r.description ?? "").toLowerCase().includes(needle) || (r.type ?? "").toLowerCase().includes(needle);
    });
    switch (sort) {
      case "price-asc": return [...list].sort((a, b) => a.price - b.price);
      case "price-desc": return [...list].sort((a, b) => b.price - a.price);
      case "name": return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default: return list;
    }
  }, [rows, q, cat, sort]);

  return (
    <div className="bg-background">
      <header className="border-b border-border/60 bg-accent/40">
        <div className="container-x flex flex-col gap-3 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Live Catalog</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight md:text-5xl">Every piece, straight from our workshop.</h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Our full published catalog — updated in real time. Prices, stock and details reflect what's available today.
            </p>
          </div>
          <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">Catalog</span>
          </nav>
        </div>
      </header>

      <div className="container-x py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search catalog…"
              aria-label="Search catalog"
              className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full border border-border bg-background px-3 py-2 text-sm">
              {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-border bg-background px-3 py-2 text-sm">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
            Couldn't load catalog: {err}
          </div>
        ) : rows === null ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No products have been published yet. Check back soon." : "No products match your filters."}
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted-foreground">{filtered.length} product{filtered.length === 1 ? "" : "s"}</p>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <article key={p.id} className="group">
                  <Link to="/product/$slug" params={{ slug: p.slug }} className="block overflow-hidden rounded-2xl bg-surface">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      {p.compare_at && p.compare_at > p.price && (
                        <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                          Sale
                        </span>
                      )}
                      {p.stock <= 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-[10px] font-extrabold uppercase text-background">
                          Sold out
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="mt-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{p.category}</p>
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="mt-1 block">
                      <h3 className="line-clamp-1 text-sm font-extrabold hover:text-primary">{p.name}</h3>
                    </Link>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold">${p.price.toFixed(2)}</span>
                      {p.compare_at && p.compare_at > p.price && (
                        <span className="text-xs text-muted-foreground line-through">${p.compare_at.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
