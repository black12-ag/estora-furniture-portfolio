import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plane, DollarSign, Headphones, Gift, ArrowRight, ChevronLeft, ChevronRight, Instagram, Mail, CheckCircle2, Eye } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { CollectionQuickView, type QuickViewItem } from "@/components/CollectionQuickView";

import aboutSofa from "@/assets/about-sofa.jpg";
import slideChair from "@/assets/hero-slide-chair.png";
import slideChairAvif from "@/assets/hero-slide-chair.png?format=avif&quality=70";
import slideChairWebp from "@/assets/hero-slide-chair.png?format=webp&quality=80";
import slideChairAvifSet from "@/assets/hero-slide-chair.png?w=400;600;900;1200&format=avif&quality=70&as=srcset";
import slideChairWebpSet from "@/assets/hero-slide-chair.png?w=400;600;900;1200&format=webp&quality=80&as=srcset";
import slideBlackChair from "@/assets/hero-slide-blackchair.png";
import slideBlackChairAvif from "@/assets/hero-slide-blackchair.png?format=avif&quality=70";
import slideBlackChairWebp from "@/assets/hero-slide-blackchair.png?format=webp&quality=80";
import slideBlackChairAvifSet from "@/assets/hero-slide-blackchair.png?w=400;600;900;1200&format=avif&quality=70&as=srcset";
import slideBlackChairWebpSet from "@/assets/hero-slide-blackchair.png?w=400;600;900;1200&format=webp&quality=80&as=srcset";
import slideLamp from "@/assets/hero-slide-lamp.png";
import slideLampAvif from "@/assets/hero-slide-lamp.png?format=avif&quality=70";
import slideLampWebp from "@/assets/hero-slide-lamp.png?format=webp&quality=80";
import slideLampAvifSet from "@/assets/hero-slide-lamp.png?w=400;600;900;1200&format=avif&quality=70&as=srcset";
import slideLampWebpSet from "@/assets/hero-slide-lamp.png?w=400;600;900;1200&format=webp&quality=80&as=srcset";
import insta1 from "@/assets/insta-1.jpg";
import insta2 from "@/assets/insta-2.jpg";
import insta3 from "@/assets/insta-3.jpg";
import insta4 from "@/assets/insta-4.jpg";
import promoArmchair from "@/assets/promo-armchair.jpg";
import promoCeramic from "@/assets/promo-ceramic.jpg";
import promoLamp from "@/assets/promo-lamp.jpg";
import collectionBookcases from "@/assets/collection-bookcases.jpg";
import collectionArmchairs from "@/assets/collection-armchairs.jpg";
import promoStocktake from "@/assets/promo-stocktake.jpg";
import promoInspiration from "@/assets/promo-inspiration.jpg";
import catArmchairs from "@/assets/cat-armchairs.jpg";
import catBedroom from "@/assets/cat-bedroom.jpg";
import catCoffeeTables from "@/assets/cat-coffee-tables.jpg";
import catCabinets from "@/assets/cat-cabinets.jpg";
import catFloorLamps from "@/assets/cat-floor-lamps.jpg";
import catAccessories from "@/assets/cat-accessories.jpg";
import collectionDecor from "@/assets/collection-decor.jpg";
import collectionLamps from "@/assets/collection-lamps.jpg";
import collectionHeroPoster from "@/assets/collection-hero.jpg";
import collectionHeroVideo from "@/assets/collection-hero.mp4.asset.json";
import { products as catalog, type Product } from "@/lib/products";
import { track } from "@/lib/analytics";


const bestSelling = catalog.slice(0, 5);
const hotPrice = catalog.filter(p => p.compareAt).slice(0, 5);
const exploreProducts = catalog.slice(5, 10);
const topTrending = catalog.slice(10, 15);
const newArrival = catalog.slice(15, 20);
const brands = ["Basket", "Roostout", "Old Style", "LUXN", "AdvenTURES", "Wisp", "Circle"];

// Hero image sizes: ~600px slot on desktop, ~400px on mobile (rendered at
// h-[380px]/h-44 with w-auto). Kept in one place so preload and <picture>
// sources stay in sync.
export const HERO_IMAGE_SIZES = "(min-width: 768px) 600px, 400px";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Estora — Awesome Furniture for Modern Homes" },
      { name: "description", content: "Discover premium furniture, lighting and décor. Free delivery on orders over $200." },
      { property: "og:title", content: "Estora — Awesome Furniture for Modern Homes" },
      { property: "og:description", content: "Discover premium furniture, lighting and décor. Free delivery on orders over $200." },
    ],
    links: [
      // Responsive preloads: browser downloads the smallest AVIF (or WebP fallback)
      // that satisfies the current viewport. PNG stays reachable via <picture>.
      { rel: "preload", as: "image", href: slideChairAvif, imagesrcset: slideChairAvifSet, imagesizes: HERO_IMAGE_SIZES, type: "image/avif", fetchpriority: "high" } as unknown as { rel: string; as: string; href: string },
      { rel: "preload", as: "image", href: slideChairWebp, imagesrcset: slideChairWebpSet, imagesizes: HERO_IMAGE_SIZES, type: "image/webp", fetchpriority: "high" } as unknown as { rel: string; as: string; href: string },
      // Preload the Featured Collections hero video so it starts near-instantly when the section scrolls into view.
      { rel: "preload", as: "video", href: (collectionHeroVideo as { url: string }).url, type: "video/mp4" } as unknown as { rel: string; as: string; href: string },
    ],
  }),
});


const categories: { name: string; image: string; cat: string }[] = [
  { name: "Armchairs", image: catArmchairs, cat: "Armchairs" },
  { name: "Bedroom", image: catBedroom, cat: "Bedroom" },
  { name: "Coffee Tables", image: catCoffeeTables, cat: "Coffee tables" },
  { name: "Cabinets", image: catCabinets, cat: "Cabinets" },
  { name: "Floor Lamps", image: catFloorLamps, cat: "Floor Lamps" },
  { name: "Accessories", image: catAccessories, cat: "Accessories" },
];

const collections: { name: string; image: string; cat: string; count: number; tag: string }[] = [
  { name: "Bookcases", image: collectionBookcases, cat: "Bookcases", count: 24, tag: "Storage" },
  { name: "Armchairs", image: collectionArmchairs, cat: "Armchairs", count: 38, tag: "Seating" },
  { name: "Decor", image: collectionDecor, cat: "Decor", count: 52, tag: "Accents" },
  { name: "Floor Lamps", image: collectionLamps, cat: "Floor Lamps", count: 19, tag: "Lighting" },
];





type Slide = {
  bg: string;
  kicker: React.ReactNode;
  kickerColor: string;
  title: React.ReactNode;
  subtitle: string;
  titleColor: string;
  subColor: string;
  cta: string;
  ctaVariant: "primary" | "dark";
  image: string;
  imageAvif?: string;
  imageWebp?: string;
  imageAvifSet?: string;
  imageWebpSet?: string;
  imageAlt: string;
  badge?: { text: React.ReactNode; bg: string; color: string; position: "left" | "right" };
};


const slides: Slide[] = [
  {
    bg: "oklch(0.28 0.05 165)",
    kicker: "MAKE REAL WITH WOOD",
    kickerColor: "#c9d84a",
    title: <>Great Design<br/>Affordable Prices</>,
    subtitle: "We design your home more beautiful",
    titleColor: "#ffffff",
    subColor: "rgba(255,255,255,0.85)",
    cta: "Explore Now",
    ctaVariant: "primary",
    image: slideChair,
    imageAvif: slideChairAvif,
    imageWebp: slideChairWebp,
    imageAvifSet: slideChairAvifSet,
    imageWebpSet: slideChairWebpSet,
    imageAlt: "Terracotta armchair with pink cushion",
    badge: { text: <><span className="text-xs">up to</span><br/><span className="text-2xl font-extrabold leading-none">60%</span><span className="text-[10px]">off</span></>, bg: "#111", color: "#fff", position: "left" },
  },
  {
    bg: "oklch(0.93 0.005 60)",
    kicker: <><span style={{ color: "#e53935" }}>up to </span><span className="text-3xl font-extrabold" style={{ color: "#111" }}>-50</span><span style={{ color: "#e53935" }}>%off</span></>,
    kickerColor: "#e53935",
    title: <>Holiday <span style={{ color: "#e53935" }}>Sale</span></>,
    subtitle: "Interior design and decor for your home",
    titleColor: "oklch(0.15 0.01 60)",
    subColor: "oklch(0.4 0.02 60)",
    cta: "Explore Now",
    ctaVariant: "dark",
    image: slideBlackChair,
    imageAvif: slideBlackChairAvif,
    imageWebp: slideBlackChairWebp,
    imageAvifSet: slideBlackChairAvifSet,
    imageWebpSet: slideBlackChairWebpSet,
    imageAlt: "Modern black chair with wooden legs",
  },
  {
    bg: "oklch(0.95 0.03 55)",
    kicker: "2020's NEW COLLECTION",
    kickerColor: "oklch(0.6 0.09 45)",
    title: <span style={{ color: "oklch(0.5 0.08 45)" }}>Long Neck<br/>Table Lamp</span>,
    subtitle: "A midcentury modern statement piece with a tailored profile",
    titleColor: "oklch(0.5 0.08 45)",
    subColor: "oklch(0.4 0.02 60)",
    cta: "Explore Now",
    ctaVariant: "dark",
    image: slideLamp,
    imageAvif: slideLampAvif,
    imageWebp: slideLampWebp,
    imageAvifSet: slideLampAvifSet,
    imageWebpSet: slideLampWebpSet,
    imageAlt: "Black midcentury floor lamp with long neck",
    badge: { text: <span className="text-lg font-extrabold">-30%</span>, bg: "#e53935", color: "#fff", position: "right" },
  },
];

function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const total = slides.length;
  const next = () => setI((v) => (v + 1) % total);
  const prev = () => setI((v) => (v - 1 + total) % total);

  useEffect(() => {
    // Respect prefers-reduced-motion: no autoplay for users who opt out.
    if (paused || reducedMotion) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [paused, reducedMotion]);

  // Touch/pointer swipe — the live translate follow is animation; skip it
  // for reduced-motion users but still allow the swipe gesture to advance.
  const dragRef = useRef<{ x: number; active: boolean }>({ x: 0, active: false });
  const [dx, setDx] = useState(0);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = { x: e.clientX, active: true };
    setPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    if (reducedMotion) return;
    setDx(e.clientX - dragRef.current.x);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.x;
    dragRef.current.active = false;
    setDx(0);
    setPaused(false);
    if (Math.abs(delta) > 50) (delta < 0 ? next : prev)();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (e.key === "Home") { e.preventDefault(); setI(0); }
    else if (e.key === "End") { e.preventDefault(); setI(total - 1); }
  };

  const s = slides[i];
  const heroPicture = (extra: { alt: string; ariaHidden?: boolean; loading?: "eager" | "lazy"; className: string; style?: React.CSSProperties; width: number; height: number }) => (
    <picture>
      {s.imageAvif && <source srcSet={s.imageAvifSet ?? s.imageAvif} sizes={HERO_IMAGE_SIZES} type="image/avif" />}
      {s.imageWebp && <source srcSet={s.imageWebpSet ?? s.imageWebp} sizes={HERO_IMAGE_SIZES} type="image/webp" />}
      <img
        src={s.image}
        alt={extra.alt}
        aria-hidden={extra.ariaHidden || undefined}
        width={extra.width}
        height={extra.height}
        loading={extra.loading ?? "eager"}
        fetchPriority={extra.loading === "lazy" ? undefined : "high"}
        decoding="async"
        draggable={false}
        className={extra.className}
        style={extra.style}
      />
    </picture>
  );

  return (
    <section
      aria-label="Featured promotions"
      aria-roledescription="carousel"
      className="container-x pt-4 md:pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={`relative overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:rounded-3xl ${reducedMotion ? "" : "transition-colors duration-500"}`}
        style={{ background: s.bg }}
        tabIndex={0}
        role="region"
        aria-label="Hero slides — use left and right arrow keys to navigate"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div aria-hidden className="pointer-events-none absolute -left-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.10), transparent 60%)" }} />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.10), transparent 60%)" }} />

        <div
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${i + 1} of ${total}`}
          className="relative grid min-h-[440px] touch-pan-y select-none items-center gap-6 px-4 py-10 md:min-h-[520px] md:grid-cols-[1fr_1.1fr_1fr] md:px-16 md:py-16"
          style={{
            transform: reducedMotion ? undefined : `translate3d(${dx * 0.25}px,0,0)`,
            transition: reducedMotion ? "none" : (dragRef.current.active ? "none" : "transform 250ms ease-out"),
          }}
        >
          <div className="relative hidden md:block">
            {heroPicture({ alt: s.imageAlt, width: 600, height: 600, className: "mx-auto h-[380px] w-auto object-contain drop-shadow-2xl" })}
            {s.badge?.position === "left" && (
              <div className="absolute right-4 top-8 grid h-24 w-24 place-items-center rounded-full text-center leading-tight" style={{ background: s.badge.bg, color: s.badge.color }}>
                <div>{s.badge.text}</div>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-widest md:text-xs" style={{ color: s.kickerColor }}>
              {s.kicker as React.ReactNode}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl md:text-6xl" style={{ color: s.titleColor }}>
              {s.title}
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm md:text-base" style={{ color: s.subColor }}>{s.subtitle}</p>
            <div className="mt-6 md:mt-8">
              <Link to="/shop" onClick={() => track("home_hero_cta_click", { slide: i + 1, cta: s.cta })} className={s.ctaVariant === "primary" ? "btn-primary" : "btn-dark"}>{s.cta}</Link>
            </div>
          </div>

          <div className="relative hidden md:block">
            {heroPicture({ alt: "", ariaHidden: true, loading: "lazy", width: 600, height: 600, className: "mx-auto h-[380px] w-auto object-contain opacity-95 drop-shadow-2xl", style: { transform: "scaleX(-1)" } })}
            {s.badge?.position === "right" && (
              <div className="absolute left-4 bottom-10 grid h-20 w-20 place-items-center rounded-full text-center" style={{ background: s.badge.bg, color: s.badge.color }}>
                {s.badge.text}
              </div>
            )}
          </div>

          <div className="md:hidden">
            {heroPicture({ alt: s.imageAlt, width: 400, height: 400, className: "mx-auto h-44 w-auto object-contain sm:h-56" })}
          </div>
        </div>


        <button aria-label="Previous slide" aria-controls="hero-carousel" onClick={prev} onPointerDown={(e) => e.stopPropagation()}
          className="absolute left-2 top-1/2 z-10 grid h-11 w-11 min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground md:left-4">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button aria-label="Next slide" aria-controls="hero-carousel" onClick={next} onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-2 top-1/2 z-10 grid h-11 w-11 min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground md:right-4">
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Choose slide">
          {slides.map((_, k) => (
            <button key={k} role="tab" aria-label={`Go to slide ${k+1} of ${total}`} aria-selected={k===i} aria-current={k===i ? "true" : undefined} onClick={() => setI(k)} onPointerDown={(e) => e.stopPropagation()}
              className={`min-h-11 min-w-11 grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground`}>
              <span aria-hidden className={`block h-2 rounded-full transition-all ${k===i?"w-8 bg-primary":"w-2 bg-foreground/30"}`} />
            </button>
          ))}
        </div>

        <div className="sr-only" role="status" aria-live="polite">Slide {i + 1} of {total}: {s.imageAlt}</div>
      </div>
    </section>
  );
}



function ProductCard({ p }: { p: Product }) {
  const pct = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  return (
    <Link to="/product/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-2xl bg-card p-3 transition-shadow hover:shadow-lg sm:p-4">
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-surface">
        {p.compareAt && <span className="absolute left-3 top-3 z-10 rounded-full bg-sale px-2.5 py-1 text-[10px] font-bold text-white">-{pct}%</span>}
        <SmartImage src={p.image} alt={p.name} loading="lazy" width={500} height={500} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      </div>
      <div className="mb-2 flex gap-1">
        {p.colors.slice(0,5).map((c) => (
          <span key={c.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-border" style={{ background: c.value }} />
        ))}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className={`font-bold ${p.compareAt ? "text-sale" : "text-foreground"}`}>${p.price.toFixed(2)}</span>
        {p.compareAt && <span className="text-xs text-muted-foreground line-through">${p.compareAt.toFixed(2)}</span>}
        {p.compareAt && <span className="text-[10px] font-bold text-sale">Save ${(p.compareAt - p.price).toFixed(0)}</span>}
      </div>
    </Link>
  );
}

function HomePage() {
  const [quickView, setQuickView] = useState<QuickViewItem | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<string>("All");
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const pauseHero = () => heroVideoRef.current?.pause();
  const playHero = () => {
    if (reducedMotion) return;
    heroVideoRef.current?.play().catch(() => {});
  };

  const heroCollection: QuickViewItem = {
    name: "The Living Room, reimagined",
    tag: "New Edit",
    count: 42,
    cat: "Armchairs",
    image: collectionHeroPoster,
    video: (collectionHeroVideo as { url: string }).url,
    poster: collectionHeroPoster,
    description: "A warm, layered look — sculptural seating, mood lighting, and quiet details that make a living room feel truly lived-in.",
    chips: ["Seating", "Lighting", "Décor", "Free Shipping"],
  };

  return (
    <div>
      <h1 className="sr-only">Estora — Modern furniture, lighting and home décor</h1>
      <HeroSlider />



      {/* CATEGORIES */}
      <section aria-labelledby="cats-heading" data-nav-section="/shop" className="container-x py-12 md:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Shop by room</p>
            <h2 id="cats-heading" className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">Browse categories</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Find your next favorite piece — curated across every corner of the home.</p>
          </div>
          <Link to="/shop" className="min-h-11 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              to="/shop"
              search={{ cat: c.cat }}
              key={c.name}
              onClick={() => track("home_category_click", { name: c.name, cat: c.cat })}
              className="group relative overflow-hidden rounded-2xl bg-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  width={800}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 sm:p-4">
                <span className="block text-sm font-semibold text-white sm:text-base">{c.name}</span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/85">
                  Shop now
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED COLLECTIONS — bento layout with looping video hero */}
      <section aria-labelledby="collections-heading" data-nav-section="/shop" className="container-x pb-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Curated by Estora</p>
            <h2 id="collections-heading" className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">Featured Collections</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Hand-picked pieces to build rooms you'll love coming home to.</p>
          </div>
          <Link to="/shop" className="min-h-11 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">Browse all →</Link>
        </div>

        {/* Tag filter chips */}
        <div role="tablist" aria-label="Filter collections by tag" className="mb-5 flex flex-wrap gap-2">
          {["All", ...Array.from(new Set(collections.map((c) => c.tag)))].map((tag) => {
            const active = collectionFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setCollectionFilter(tag);
                  track("home_collection_filter", { tag });
                }}
                className={`min-h-9 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface text-foreground hover:bg-accent"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>



        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:grid-rows-2">
          {/* Video hero tile — spans 2 cols x 2 rows on desktop, pauses on hover/focus */}
          <div
            className="group relative col-span-1 row-span-1 overflow-hidden rounded-2xl lg:col-span-2 lg:row-span-2 lg:min-h-[520px]"
            onMouseEnter={pauseHero}
            onMouseLeave={playHero}
            onFocus={pauseHero}
            onBlur={playHero}
          >
            {!heroVideoReady && !reducedMotion && (
              <div
                aria-hidden
                className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface to-accent"
              />
            )}
            {!reducedMotion && (
              <video
                ref={heroVideoRef}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={(collectionHeroVideo as { url: string }).url}
                poster={collectionHeroPoster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onCanPlay={() => setHeroVideoReady(true)}
                aria-hidden
              />
            )}
            {reducedMotion && (
              <img
                src={collectionHeroPoster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                width={1280}
                height={720}
              />
            )}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
            <div className="relative flex h-full min-h-[280px] flex-col justify-end p-6 sm:p-8 lg:min-h-[520px]">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-sale" aria-hidden />
                New Edit
              </span>
              <h3 className="mt-3 max-w-md text-3xl font-extrabold leading-tight text-white sm:text-4xl">The Living Room, reimagined</h3>
              <p className="mt-2 max-w-md text-sm text-white/85">A warm, layered look — sculptural seating, mood lighting, and quiet details.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  onClick={() => track("home_collection_click", { name: "Living Room Edit", cat: "all" })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-foreground hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Shop the edit <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    track("home_collection_quickview", { name: "Living Room Edit" });
                    setQuickView(heroCollection);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Eye className="h-4 w-4" /> Quick view
                </button>
              </div>
            </div>
          </div>

          {/* 4 collection tiles — filtered by selected tag */}
          {collections
            .filter((c) => collectionFilter === "All" || c.tag === collectionFilter)
            .map((c) => (
            <div
              key={c.name}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[3/4] lg:aspect-auto lg:min-h-[250px]"
            >
              <Link
                to="/shop"
                search={{ cat: c.cat }}
                onClick={() => track("home_collection_click", { name: c.name, cat: c.cat })}
                className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Shop ${c.name} collection`}
              >
                <img
                  src={c.image}
                  alt={`${c.name} collection`}
                  loading="lazy"
                  decoding="async"
                  width={1024}
                  height={1024}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </Link>
              <div className="pointer-events-none relative flex h-full flex-col justify-between p-4 sm:p-5">
                <span className="w-fit rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground">{c.tag}</span>
                <div className="text-white">
                  <h3 className="text-lg font-extrabold sm:text-xl">{c.name}</h3>
                  <p className="mt-0.5 text-xs text-white/80">{c.count} pieces</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  track("home_collection_quickview", { name: c.name, cat: c.cat });
                  setQuickView({
                    name: c.name,
                    tag: c.tag,
                    count: c.count,
                    cat: c.cat,
                    image: c.image,
                  });
                }}
                className="absolute right-3 top-3 z-10 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-foreground opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Quick view ${c.name} collection`}
              >
                <Eye className="h-3.5 w-3.5" /> Quick view
              </button>
            </div>
          ))}

        </div>
      </section>


      {/* PROMO */}
      <section aria-label="Promotions" className="container-x grid gap-4 pb-16 sm:gap-6 md:grid-cols-3">
        <Link
          to="/sale"
          onClick={() => track("home_promo_click", { tile: "stocktake" })}
          className="group relative isolate flex min-h-[280px] items-end overflow-hidden rounded-2xl bg-surface p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-[340px] sm:p-8 md:col-span-2"
        >
          <img
            src={promoStocktake}
            alt=""
            aria-hidden
            width={1400}
            height={1000}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
          <span className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-sale px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white sm:left-8 sm:top-8">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Stocktake sale
          </span>
          <div className="max-w-md">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Limited time</p>
            <h3 className="mt-2 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
              Up to <span className="text-sale">60% off</span>
              <br />storewide favorites
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Hundreds of pieces at their best-ever prices — while stocks last.</p>
            <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition group-hover:translate-x-1">
              Shop the sale <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        <Link
          to="/blog"
          onClick={() => track("home_promo_click", { tile: "blog_inspiration" })}
          className="group relative isolate flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl p-6 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-[340px] sm:p-8"
        >
          <img
            src={promoInspiration}
            alt=""
            aria-hidden
            width={900}
            height={1000}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">Estora Journal</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">Find inspiration for your home</h3>
          <p className="mt-2 max-w-xs text-sm text-white/80">Styling tips, room tours and the pieces our designers can't stop talking about.</p>
          <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-white group-hover:underline">
            Explore the journal <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>

      {/* BEST SELLING */}
      <section className="container-x pb-16">
        <div className="rounded-3xl border-2 border-sale/40 p-4 sm:p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-foreground"><span className="text-sale">Flash</span> Sale</h2>
            <div className="flex gap-1.5 sm:gap-2">
              {["08", "12", "32", "16"].map((n) => (
                <div key={n} className="flex h-9 w-10 flex-col items-center justify-center rounded-full bg-sale text-xs font-bold text-white sm:h-10 sm:w-12">{n}</div>
              ))}
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-extrabold">Best Selling</h3>
            <Link to="/shop" className="min-h-11 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">View All →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
            {bestSelling.map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>

          <div className="mb-6 mt-10 flex items-center justify-between">
            <h3 className="text-xl font-extrabold">Hot Price</h3>
            <Link to="/sale" className="min-h-11 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">View All →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
            {hotPrice.map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>
        </div>
      </section>

      {/* BANNER STRIP */}
      <section className="container-x pb-16">
        <div className="flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-[oklch(0.28_0.02_170)] p-8 text-white md:flex-row md:p-12">
          <img src={slideChair} alt="" aria-hidden width={200} height={200} loading="lazy" decoding="async" className="h-24 w-auto object-contain" />
          <div className="text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">Just save with the code</p>
            <h3 className="mt-1 text-2xl font-extrabold md:text-3xl">Create Design, Affordable Prices</h3>
          </div>
          <Link to="/shop" onClick={() => track("home_cta_click", { cta: "banner_order_now" })} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Order Now</Link>
        </div>
      </section>

      {/* EXPLORE OUR PRODUCTS */}
      <section className="container-x pb-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold">Explore Our Products</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {exploreProducts.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* HOLIDAY SALE BANNER */}
      <section className="container-x pb-16">
        <div className="relative flex items-center justify-between overflow-hidden rounded-3xl bg-[oklch(0.88_0.01_60)] px-8 py-12 md:px-16">
          <img src={slideBlackChair} alt="" aria-hidden width={400} height={400} loading="lazy" decoding="async" className="hidden h-64 w-auto object-contain md:block" />
          <div className="mx-auto text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-sale">up to -50%off</p>
            <h3 className="mt-2 text-4xl font-extrabold md:text-5xl">Holiday <span className="text-sale">Sale</span></h3>
            <p className="mt-3 text-sm text-muted-foreground">Interior design and decor for your home</p>
            <Link to="/sale" onClick={() => track("home_cta_click", { cta: "holiday_explore_now" })} className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background hover:opacity-90">Explore Now</Link>
          </div>
          <img src={slideBlackChair} alt="" aria-hidden width={400} height={400} loading="lazy" decoding="async" className="hidden h-64 w-auto object-contain md:block" style={{ transform: "scaleX(-1)" }} />

        </div>
      </section>

      {/* TOP TRENDING */}
      <section className="container-x pb-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold">Top Trending Products</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {topTrending.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* 3 PROMO TILES */}
      <section className="container-x grid gap-5 pb-16 md:grid-cols-3">
        <Link to="/shop" search={{ cat: "Armchairs" }} onClick={() => track("home_promo_tile_click", { tile: "arm_chair", cat: "Armchairs" })} className="group relative flex items-center overflow-hidden rounded-2xl bg-sale p-6 text-white">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Accent</p>
            <h3 className="text-2xl font-extrabold">Arm Chair</h3>
            <p className="mt-1 text-3xl font-extrabold">-30%</p>
            <span className="mt-4 inline-block rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-sale">Shop Now</span>
          </div>
          <img src={promoArmchair} alt="" aria-hidden width={400} height={400} loading="lazy" decoding="async" className="absolute right-0 top-0 h-full w-1/2 object-cover object-left transition-transform group-hover:scale-105" />
        </Link>
        <Link to="/shop" search={{ cat: "Accessories" }} onClick={() => track("home_promo_tile_click", { tile: "ceramic_planter", cat: "Accessories" })} className="group relative overflow-hidden rounded-2xl bg-[oklch(0.9_0.005_60)] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rivet Geometric</p>
          <h3 className="text-xl font-extrabold">Ceramic Planter</h3>
          <img src={promoCeramic} alt="" aria-hidden width={300} height={300} loading="lazy" decoding="async" className="mx-auto mt-3 h-40 w-auto object-contain transition-transform group-hover:scale-105" />
        </Link>
        <Link to="/shop" search={{ cat: "Floor Lamps" }} onClick={() => track("home_promo_tile_click", { tile: "japanese_lamp", cat: "Floor Lamps" })} className="group relative flex items-center overflow-hidden rounded-2xl bg-[oklch(0.88_0.09_120)] p-6">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">Ceramic</p>
            <h3 className="text-2xl font-extrabold">Japanese Lamp</h3>
            <p className="mt-1 text-3xl font-extrabold text-sale">-50%</p>
            <span className="mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background">Shop Now</span>
          </div>
          <img src={promoLamp} alt="" aria-hidden width={400} height={400} loading="lazy" decoding="async" className="absolute right-0 top-0 h-full w-1/2 object-cover object-left transition-transform group-hover:scale-105" />
        </Link>

      </section>

      {/* NEW ARRIVAL */}
      <section className="container-x pb-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold">New Arrival</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {newArrival.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="container-x pb-16">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:text-primary">
          <Instagram className="h-4 w-4" /> Follow us on Instagram
        </a>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[insta1, insta2, insta3, insta4].map((src, k) => (
            <a key={k} href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label={`Estora Instagram photo ${k+1}`} className="group relative aspect-square overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <SmartImage src={src} alt={`Estora interior inspiration ${k+1}`} loading="lazy" width={800} height={800} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <Instagram className="h-8 w-8 text-white" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* BRAND LOGOS */}
      <section className="container-x pb-16">
        <div className="grid grid-cols-3 items-center gap-6 border-y border-border py-8 md:grid-cols-7">
          {brands.map((b) => (
            <div key={b} className="text-center font-serif text-lg italic text-muted-foreground/70 transition hover:text-foreground">{b}</div>
          ))}
        </div>
      </section>

      {/* ABOUT PREVIEW */}
      <section className="container-x grid gap-10 pb-16 md:grid-cols-2 md:items-center">
        <div className="aspect-square w-full overflow-hidden rounded-3xl bg-surface">
          <SmartImage src={aboutSofa} alt="Terracotta sofa in a bright living room" loading="lazy" width={1200} height={1200} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">About Us</p>
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">Just Stay Home & Enjoy<br />Your Shopping Time</h2>
          <p className="mt-4 text-muted-foreground">We design and curate premium furniture that turns every room into a place you love coming back to. Thoughtful materials, honest prices, delivered to your door.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Plane, title: "Free World Delivery", sub: "Orders over $200" },
              { icon: DollarSign, title: "Money Back Guarantee", sub: "Within 30 days" },
              { icon: Headphones, title: "Online Support", sub: "24/7 free support" },
              { icon: Gift, title: "Member Gift", sub: "Coupon at weekend" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{f.title}</h4>
                  <p className="text-xs text-muted-foreground">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSection />
      <CollectionQuickView item={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: value, source: "home" });
    if (error && error.code !== "23505") {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("success");
    setMessage(`Thanks! ${value} is now subscribed to Estora updates.`);
    setEmail("");
  }

  return (
    <section aria-labelledby="newsletter-heading" className="container-x pb-20">
      <div className="overflow-hidden rounded-3xl bg-foreground px-6 py-12 text-background sm:px-10 md:px-16 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div aria-hidden className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/20 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <h2 id="newsletter-heading" className="text-2xl font-extrabold sm:text-3xl md:text-4xl">Join the Estora list</h2>
          <p className="mt-3 text-sm text-background/70 sm:text-base">
            Get early access to new drops, exclusive discounts and interior inspiration — straight to your inbox.
          </p>

          {status === "success" ? (
            <div role="status" aria-live="polite" className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 rounded-full bg-primary/15 px-5 py-4 text-sm font-semibold text-background">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" aria-describedby="newsletter-help">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "newsletter-error" : "newsletter-help"}
                placeholder="you@example.com"
                className="min-h-11 flex-1 rounded-full bg-background/10 px-5 py-3 text-sm text-background placeholder:text-background/50 outline-none ring-1 ring-background/20 focus:ring-primary"
              />
              <button
                type="submit"
                className="min-h-11 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
              >
                Subscribe
              </button>
            </form>
          )}
          <p id="newsletter-help" className="mt-3 text-xs text-background/50">We respect your inbox — unsubscribe anytime.</p>
          {status === "error" && (
            <p id="newsletter-error" role="alert" className="mt-2 text-sm font-medium text-sale">{message}</p>
          )}
        </div>
      </div>
    </section>
  );
}

