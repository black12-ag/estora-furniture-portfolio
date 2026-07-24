import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Flame, Facebook, Twitter, Minus, Plus, Star, Expand, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { useProductReviews } from "@/lib/reviews-store";
import { getProduct, getRelated } from "@/lib/products";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  notFoundComponent: ProductNotFound,
  errorComponent: ProductError,
  head: ({ params }) => {
    const p = getProduct(params.slug);
    const name = p?.name ?? prettify(params.slug);
    const desc = p?.description ?? `Shop the ${name} at Estora. Premium furniture with free shipping over $200.`;
    const price = (p?.price ?? 88).toFixed(2);
    const image = p?.image;
    if (!p) {
      return {
        meta: [
          { title: "Product not found — Estora" },
          { name: "robots", content: "noindex" },
          { name: "description", content: "This product isn't available. Browse our shop for similar items." },
        ],
      };
    }
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description: desc,
      image: image ? [image] : undefined,
      brand: { "@type": "Brand", name: "Estora" },
      aggregateRating: p ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews } : undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price,
        availability: (p?.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    };
    return {
      meta: [
        { title: `${name} — Estora` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} — Estora` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLd) },
      ],
    };
  },
});

function ProductNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="container-x py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Product not found</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        We couldn't find <span className="font-semibold text-foreground">"{prettify(slug)}"</span>. It may have been removed or the link is incorrect.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/shop" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          ← Back to shop
        </Link>
        <Link to="/" className="rounded-full border border-border px-6 py-3 text-sm font-bold text-foreground hover:bg-surface">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ProductError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{error.message || "We couldn't load this product."}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">Try again</button>
        <Link to="/shop" className="rounded-full border border-border px-6 py-3 text-sm font-bold text-foreground hover:bg-surface">← Back to shop</Link>
      </div>
    </div>
  );
}


function prettify(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}


function ProductPage() {
  const { slug } = Route.useParams();
  const maybeProduct = getProduct(slug);
  const navigate = useNavigate();
  const { add } = useCart();
  const { avg, count } = useProductReviews(slug);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(0);
  const [gallery, setGallery] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [tab, setTab] = useState<"description"|"specs"|"reviews">("description");
  const [tl, setTl] = useState({ d: 6, h: 12, m: 50, s: 48 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [dragStatus, setDragStatus] = useState("");
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  if (!maybeProduct) throw notFound();
  const product = maybeProduct;

  const discount = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const rating = avg || product.rating;
  const reviewCount = count || product.reviews;
  const related = getRelated(slug, 5);
  const colorChoices = product.imagesByColor
    ? product.colors.filter((choice) => Boolean(product.imagesByColor?.[choice.name]))
    : product.colors.slice(0, 1);
  const currentColor = colorChoices[color]?.name ?? colorChoices[0]?.name ?? product.colors[0]?.name ?? "Brown";
  const currentSize = product.sizes[size] ?? product.sizes[0] ?? "Standard";
  const selectedImage = product.imagesByColor?.[currentColor] ?? product.image;
  const lineTotal = product.price * qty;
  const compareTotal = product.compareAt ? product.compareAt * qty : undefined;

  const cartId = `${slug}-${currentColor}-${currentSize}`;
  const addToCart = () => {
    add({ id: cartId, slug, name: product.name, price: product.price, image: selectedImage, color: currentColor, dim: currentSize, qty });
    toast.success(`${product.name} added to cart`);
  };
  const buyNow = () => {
    addToCart();
    navigate({ to: "/checkout" });
  };
  const addToWishlist = () => {
    try {
      const raw = localStorage.getItem("estora.wishlist.v1");
      const list = raw ? JSON.parse(raw) : [];
      if (!list.find((x: { id: string }) => x.id === slug)) {
        list.push({ id: slug, name: product.name, color: currentColor, dim: currentSize, total: product.price, stock: product.stock > 0, image: selectedImage });
        localStorage.setItem("estora.wishlist.v1", JSON.stringify(list));
      }
      toast.success("Added to wishlist");
    } catch { /* ignore */ }
  };
  const share = (network: "facebook" | "twitter") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const u = network === "facebook"
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      : `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(product.name)}`;
    if (typeof window !== "undefined") window.open(u, "_blank", "noopener");
  };

  useEffect(() => {
    const t = setInterval(() => {
      setTl(({ d, h, m, s }) => {
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 23; d = Math.max(0, d - 1); }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setGallery(0);
  }, [selectedImage]);

  // Preload all color variants so swaps are instant
  useEffect(() => {
    if (!product.imagesByColor) return;
    Object.values(product.imagesByColor).forEach((src) => {
      if (!src) return;
      const img = new Image();
      img.src = src as string;
    });
  }, [product]);

  useEffect(() => {
    if (color >= colorChoices.length) setColor(0);
  }, [color, colorChoices.length]);

  return (
    <div className="bg-background">
      <div className="border-b border-border/60 bg-surface">
        <div className="container-x py-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/shop" className="hover:text-foreground">{product.category}</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="container-x py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          {(() => {
            const views = [
              { label: "Full view", scale: 1, x: "50%", y: "50%" },
              { label: "Top detail", scale: 1.9, x: "50%", y: "18%" },
              { label: "Seat detail", scale: 2.1, x: "50%", y: "62%" },
              { label: "Base detail", scale: 2.3, x: "50%", y: "92%" },
            ];
            const v = views[gallery] ?? views[0];
            const totalScale = v.scale * (1 + size * 0.06);
            const transitionStyle = prefersReducedMotion
              ? "none"
              : "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), transform-origin 500ms cubic-bezier(0.22, 1, 0.36, 1)";
            const onThumbKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
              const last = views.length - 1;
              let next: number | null = null;
              if (e.key === "ArrowDown" || e.key === "ArrowRight") next = i === last ? 0 : i + 1;
              else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = i === 0 ? last : i - 1;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = last;
              else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setGallery(i); return; }
              if (next !== null) {
                e.preventDefault();
                setGallery(next);
                thumbRefs.current[next]?.focus();
              }
            };
            return (
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div className="flex flex-col gap-3" role="tablist" aria-label="Product view thumbnails" aria-orientation="vertical">
              {views.map((view, i) => (
                <button key={i}
                  ref={(el) => { thumbRefs.current[i] = el; }}
                  onClick={() => setGallery(i)}
                  onKeyDown={(e) => onThumbKey(e, i)}
                  role="tab"
                  aria-selected={gallery === i}
                  tabIndex={gallery === i ? 0 : -1}
                  className={`aspect-square overflow-hidden rounded-xl border-2 bg-surface outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${gallery===i?"border-primary":"border-transparent"}`}
                  aria-label={`Show ${currentColor} ${product.name} — ${view.label}`}>
                  <img
                    src={selectedImage}
                    alt={`${product.name} ${currentColor} — ${view.label}`}
                    loading="eager"
                    decoding="sync"
                    width={200}
                    height={200}
                    className="h-full w-full object-contain p-2"
                    style={{ transform: `scale(${view.scale})`, transformOrigin: `${view.x} ${view.y}` }}
                  />
                </button>
              ))}
            </div>
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {dragStatus || `${v.label} selected, ${gallery + 1} of ${views.length}`}
            </div>
            <div
              className="relative aspect-square overflow-hidden rounded-2xl bg-surface touch-none select-none"
              onPointerDown={(e) => {
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
              }}
              onPointerMove={(e) => {
                const d = dragRef.current;
                if (!d) return;
                if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
                  d.moved = true;
                  setDragStatus("Panning image. Release to change crop area.");
                }
              }}
              onPointerUp={(e) => {
                const d = dragRef.current;
                dragRef.current = null;
                if (!d) return;
                const dx = e.clientX - d.x;
                const dy = e.clientY - d.y;
                const absX = Math.abs(dx), absY = Math.abs(dy);
                const threshold = 24;
                if (Math.max(absX, absY) < threshold) {
                  if (d.moved) setDragStatus("Pan cancelled.");
                  return;
                }
                const last = 3;
                const dir = (absX > absY ? -Math.sign(dx) : -Math.sign(dy));
                const next = Math.min(last, Math.max(0, gallery + dir));
                // Clear drag status so the crop-selected message re-announces.
                setDragStatus("");
                if (next !== gallery) setGallery(next);
              }}
              onPointerCancel={() => { dragRef.current = null; setDragStatus("Pan cancelled."); }}
            >
              {discount > 0 && <span className="absolute left-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-lime-300 text-xs font-bold">-{discount}%</span>}
              <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-background/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm">
                {currentColor} · {currentSize}
              </span>
              <button
                type="button"
                onClick={(e) => { if (dragRef.current?.moved) { e.preventDefault(); return; } setZoomOpen(true); }}
                className="group h-full w-full cursor-grab active:cursor-grabbing"
                aria-label={`Zoom ${product.name} in ${currentColor}. Drag to change crop area.`}
              >
                <img
                  id="product-main-image"
                  src={selectedImage}
                  alt={`${product.name} in ${currentColor}, size ${currentSize}`}
                  width={1024}
                  height={1024}
                  decoding="sync"
                  fetchPriority="high"
                  draggable={false}
                  className="relative z-0 h-full w-full object-contain p-8 will-change-transform group-hover:scale-[1.02] pointer-events-none"
                  style={{
                    transform: `scale(${totalScale})`,
                    transformOrigin: `${v.x} ${v.y}`,
                    transition: transitionStyle,
                  }}
                />
                <span className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-xs font-bold shadow-sm">
                  <Expand className="h-3.5 w-3.5" /> Zoom
                </span>
              </button>
              <button
                type="button"
                onClick={() => setGallery((g) => (g === 0 ? views.length - 1 : g - 1))}
                aria-label={`Previous crop area. Current: ${v.label}, ${gallery + 1} of ${views.length}`}
                aria-controls="product-main-image"
                className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-md outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setGallery((g) => (g === views.length - 1 ? 0 : g + 1))}
                aria-label={`Next crop area. Current: ${v.label}, ${gallery + 1} of ${views.length}`}
                aria-controls="product-main-image"
                className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-md outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
            );
          })()}



          {/* Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h1 className="text-3xl font-extrabold">{product.name}</h1>
                  {discount > 0 && <span className="rounded-full bg-lime-300 px-2 py-0.5 text-xs font-bold text-foreground">-{discount}%</span>}
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <div className="flex">
                    {Array.from({length:5}).map((_,i)=>(<Star key={i} className={`h-4 w-4 ${i<Math.round(rating)?"fill-primary":""}`} />))}
                  </div>
                  <span className="text-xs text-muted-foreground">({reviewCount} reviews)</span>
                </div>
              </div>
              <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${product.stock > 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                <Flame className="h-3.5 w-3.5" /> {product.stock > 0 ? `IN STOCK: ${product.stock}` : "OUT OF STOCK"}
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className={`text-3xl font-extrabold ${product.compareAt?"text-sale":""}`}>${lineTotal.toFixed(2)}</span>
              {compareTotal && <span className="text-lg text-muted-foreground line-through">${compareTotal.toFixed(2)}</span>}
              <span className="text-xs font-bold uppercase text-muted-foreground">Total for {qty}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">${product.price.toFixed(2)} each</p>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-6 flex gap-3">
              {[{l:"Days",v:tl.d},{l:"Hours",v:tl.h},{l:"Mins",v:tl.m},{l:"Secs",v:tl.s}].map((t) => (
                <div key={t.l} className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-foreground text-background">
                  <span className="text-sm font-bold leading-none">{String(t.v).padStart(2,"0")}</span>
                  <span className="mt-0.5 text-[9px] uppercase opacity-70">{t.l}</span>
                </div>
              ))}
            </div>

            {/* Color */}
            <div className="mt-6 flex items-center gap-4">
              <span className="w-24 text-sm font-semibold">Color</span>
              <div className="flex flex-wrap gap-2">
                {colorChoices.map((c, i) => (
                  <button key={c.name} onClick={()=>setColor(i)} aria-label={c.name} title={c.name}
                    className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-background ${color===i?"ring-foreground":"ring-transparent"}`}
                    style={{ background: c.value }} />
                ))}
              </div>
              {!product.imagesByColor && <span className="text-xs text-muted-foreground">Original finish</span>}
            </div>

            {/* Size / Dimension */}
            <div className="mt-4 flex items-center gap-4">
              <span className="w-24 text-sm font-semibold">Size</span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, i) => (
                  <button key={s} onClick={()=>setSize(i)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${size===i?"border-foreground bg-foreground text-background":"border-border hover:border-foreground"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Add */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="w-24 text-sm font-semibold">Quantity</span>
              <div className="inline-flex items-center rounded-full border border-border">
                <button type="button" aria-label="Decrease quantity" onClick={()=>setQty(Math.max(1,qty-1))} className="p-2"><Minus className="h-4 w-4" /></button>
                <span className="min-w-10 text-center font-semibold">{String(qty).padStart(2,"0")}</span>
                <button type="button" aria-label="Increase quantity" onClick={()=>setQty(Math.min(product.stock || 1, qty+1))} className="p-2"><Plus className="h-4 w-4" /></button>
              </div>
              <span className="rounded-full bg-surface px-4 py-2 text-sm font-bold">Total: ${lineTotal.toFixed(2)}</span>
              <button onClick={addToCart} disabled={product.stock === 0} className="btn-primary flex-1 disabled:opacity-50">Add to Cart</button>
              <button onClick={addToWishlist} aria-label="Add to wishlist" className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-accent">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <button onClick={buyNow} disabled={product.stock === 0} className="btn-dark mt-3 w-full disabled:opacity-50">Buy It Now!</button>

            <div className="mt-5 rounded-xl bg-surface p-4 text-sm">
              <p className="flex items-start gap-2"><Flame className="mt-0.5 h-4 w-4 shrink-0 text-sale" /><span><span className="font-bold">Other people want this.</span> 138 people have this in their carts right now.</span></p>
              <p className="mt-2 text-muted-foreground">Free shipping on orders over <b className="text-foreground">$200</b>.</p>
            </div>


            <div className="mt-5 flex items-center gap-2 text-sm">
              <span className="mr-2 font-semibold">Share</span>
              <button onClick={() => share("facebook")} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"><Facebook className="h-3.5 w-3.5" /> Facebook</button>
              <button onClick={() => { if (typeof navigator !== "undefined") { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); } }} className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">Copy link</button>
              <button onClick={() => share("twitter")} className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white"><Twitter className="h-3.5 w-3.5" /> Twitter</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-border">
            {(["description","specs","reviews"] as const).map((t) => (
              <button key={t} onClick={()=>setTab(t)}
                className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize transition ${tab===t?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "specs" ? "Specifications" : t}
              </button>
            ))}
          </div>

          {tab === "description" && (
            <div className="grid gap-8 pt-6 lg:grid-cols-[1fr_320px]">
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {product.longDescription.map((p, i) => (
                  <p key={i} className={i > 0 ? "mt-4" : undefined}>{p}</p>
                ))}
                <p className="mt-4">Made in small batches from responsibly sourced materials, every piece is inspected by hand before it leaves our workshop. Includes a 5-year structural warranty and free returns within 30 days.</p>
              </div>
              <aside className="rounded-2xl bg-surface p-6">
                <h4 className="text-sm font-bold uppercase tracking-wide">What's inside</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  {product.features.map((f) => (
                    <li key={f} className="flex gap-2 text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          )}

          {tab === "specs" && (
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between border-b border-border py-2 text-sm">
                  <dt className="font-semibold">{s.label}</dt>
                  <dd className="text-muted-foreground">{s.value}</dd>
                </div>
              ))}
              <div className="flex justify-between border-b border-border py-2 text-sm">
                <dt className="font-semibold">Category</dt><dd className="text-muted-foreground">{product.category}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-2 text-sm">
                <dt className="font-semibold">Type</dt><dd className="text-muted-foreground">{product.type}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-2 text-sm">
                <dt className="font-semibold">Available sizes</dt><dd className="text-muted-foreground">{product.sizes.join(", ")}</dd>
              </div>
            </dl>
          )}

          {tab === "reviews" && (
            <ReviewsPanel slug={slug} name={product.name} seed={product.seedReviews} />
          )}
        </div>

        {/* Related */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-extrabold">Related Products</h2>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <Link to="/product/$slug" params={{ slug: p.slug }} key={p.slug} className="group">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-surface">
                  {p.compareAt && <span className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-lime-300 text-[10px] font-bold">-{Math.round((1 - p.price / p.compareAt) * 100)}%</span>}
                  <img src={p.image} alt={p.name} loading="lazy" width={600} height={600} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="mb-1 flex gap-1">
                  {p.colors.slice(0,5).map((c) => <span key={c.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-border" style={{background:c.value}} />)}
                </div>
                <h3 className="text-sm font-semibold">{p.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`font-bold ${p.compareAt?"text-sale":""}`}>${p.price.toFixed(2)}</span>
                  {p.compareAt && <span className="text-xs text-muted-foreground line-through">${p.compareAt.toFixed(2)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {zoomOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4" role="dialog" aria-modal="true" aria-label={`${product.name} image zoom`}>
          <button type="button" onClick={() => setZoomOpen(false)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-background text-foreground shadow-lg" aria-label="Close image zoom">
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-full max-h-[86vh] w-full max-w-5xl rounded-2xl bg-background p-4">
            <img src={selectedImage} alt={`${product.name} in ${currentColor}, size ${currentSize} zoom view`} className="h-full w-full object-contain" width={1400} height={1400} />
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-xs font-bold uppercase shadow-sm">
              {currentColor} · {currentSize} · Qty {qty} · ${lineTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsPanel({ slug, name, seed }: { slug: string; name: string; seed: { name: string; rating: number; body: string; daysAgo: number }[] }) {
  const { reviews, addReview } = useProductReviews(slug);
  const [form, setForm] = useState({ name: "", email: "", rating: 5, body: "" });
  const seedItems = seed.map((s, i) => ({
    id: `seed-${slug}-${i}`,
    name: s.name,
    rating: s.rating,
    body: s.body,
    createdAt: Date.now() - s.daysAgo * 86400000,
  }));
  const all = [...reviews, ...seedItems];
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
      <div>
        <h3 className="text-xl font-extrabold">What people say about<br/>{name}</h3>
        <ul className="mt-6 space-y-6">
          {all.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>}
          {all.map((r) => (
            <li key={r.id} className="border-b border-border pb-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-surface font-bold">{r.name[0]?.toUpperCase()}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex text-primary">
                      {Array.from({length:5}).map((_,i)=>(<Star key={i} className={`h-3.5 w-3.5 ${i<r.rating?"fill-primary":""}`} />))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="rounded-2xl bg-surface p-6">
        <h4 className="text-center text-lg font-bold">Write a review</h4>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!form.name || !form.body) { toast.error("Please fill in your name and review"); return; }
          try {
            await addReview({ name: form.name, email: form.email, rating: form.rating, body: form.body });
            setForm({ name: "", email: "", rating: 5, body: "" });
            toast.success("Thanks for your review!");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not submit review");
          }
        }} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold">Your name</label>
            <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="ex: Julie Sample" className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold">Your email</label>
            <input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="ex: julie@gmail.com" className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold">Rating</label>
            <select value={form.rating} onChange={(e)=>setForm({...form,rating:Number(e.target.value)})} className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm">
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star{n>1?"s":""}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Reviews</label>
            <textarea value={form.body} onChange={(e)=>setForm({...form,body:e.target.value})} rows={4} placeholder="Write your review here." className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          </div>
          <button type="submit" className="btn-dark w-full">Submit a review</button>
        </form>
      </aside>
    </div>
  );
}
