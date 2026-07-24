import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search, Heart, User, ShoppingBag, Plane, DollarSign, Tag,
  ChevronDown, X, Menu, Package, LogIn, UserPlus, Sparkles, Loader2,
  ArrowRight, Armchair, BedDouble, Lamp, Boxes, Sofa,
  Truck, RotateCcw, CreditCard, Gift, TrendingUp, Star, Home as HomeIcon,
  Utensils, Briefcase, Trees, Baby, Layers,
} from "lucide-react";
import catArmchairs from "@/assets/cat-armchairs.jpg";
import catBedroom from "@/assets/cat-bedroom.jpg";
import catLamps from "@/assets/cat-floor-lamps.jpg";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { useSession, signOut } from "@/lib/session-store";
import { NotificationBell } from "@/components/NotificationBell";
import { useSettings } from "@/lib/settings-store";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Bell } from "lucide-react";


import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { getSuggestions } from "@/lib/search-cache";
import { Highlight } from "@/lib/highlight";
import { track } from "@/lib/analytics";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

/* ------------------------------------------------------------ */
/*  Nav config                                                  */
/* ------------------------------------------------------------ */

const nav: { to: string; label: string; hasMega?: boolean }[] = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop", hasMega: true },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
  { to: "/about", label: "About Us" },
];

type MegaLink = { label: string; cat?: string; type?: string; to?: string; badge?: string };
type MegaCol = { title: string; icon: React.ComponentType<{ className?: string }>; items: MegaLink[] };

const megaRooms: MegaCol = {
  title: "Shop by Room", icon: HomeIcon, items: [
    { label: "Living Room", cat: "Armchairs" },
    { label: "Bedroom", cat: "Bedroom" },
    { label: "Dining", cat: "Coffee tables" },
    { label: "Home Office", cat: "Cabinets" },
    { label: "Outdoor", cat: "Accessories" },
    { label: "Kids Room", cat: "Decor" },
  ],
};

const megaCategory: MegaCol = {
  title: "Shop by Category", icon: Sofa, items: [
    { label: "Armchairs", cat: "Armchairs" },
    { label: "Coffee Tables", cat: "Coffee tables" },
    { label: "Bookcases", cat: "Bookcases" },
    { label: "Cabinets", cat: "Cabinets" },
    { label: "Floor Lamps", cat: "Floor Lamps" },
    { label: "Decor", cat: "Decor" },
    { label: "Accessories", cat: "Accessories" },
  ],
};

const megaMaterial: MegaCol = {
  title: "By Material", icon: Layers, items: [
    { label: "Wooden", type: "Wooden" },
    { label: "Iron", type: "Iron" },
    { label: "Glass", type: "Glass" },
    { label: "Ceramic", type: "Ceramic" },
    { label: "Marble", type: "Marble" },
    { label: "Fabric", type: "Fabric" },
  ],
};

const megaQuick: MegaCol = {
  title: "Quick Links", icon: Sparkles, items: [
    { label: "New Arrivals", to: "/shop", badge: "New" },
    { label: "Best Sellers", to: "/shop" },
    { label: "Trending Now", to: "/shop" },
    { label: "Gift Cards", to: "/contact" },
    { label: "Track Order", to: "/contact" },
    { label: "Help & Contact", to: "/contact" },
  ],
};

const megaCols: MegaCol[] = [megaRooms, megaCategory, megaMaterial, megaQuick];



const defaultAnnouncements: { text: string; to: string; search?: Record<string, string> }[] = [
  { text: "Free delivery on orders over $200 · Ends this week", to: "/sale" },
  { text: "New arrivals just dropped · Discover the Autumn collection", to: "/shop", search: { sort: "newest" } },
  { text: "Extra 20% off Sale styles with code ESTORA20", to: "/sale" },
];

type LocaleOpt = { code: string; label: string; flag: string; name: string };
type CurrencyOpt = { code: string; symbol: string; name: string };

const LOCALES: LocaleOpt[] = [
  { code: "ENG", label: "EN", flag: "🇬🇧", name: "English" },
  { code: "FRA", label: "FR", flag: "🇫🇷", name: "Français" },
  { code: "DEU", label: "DE", flag: "🇩🇪", name: "Deutsch" },
  { code: "ESP", label: "ES", flag: "🇪🇸", name: "Español" },
  { code: "JPN", label: "JP", flag: "🇯🇵", name: "日本語" },
];

const CURRENCIES: CurrencyOpt[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

/* ------------------------------------------------------------ */
/*  Header                                                      */
/* ------------------------------------------------------------ */

export function Header() {
  const [openMega, setOpenMega] = useState(false);
  const [showAuth, setShowAuth] = useState<"signup" | "signin" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [barDismissed, setBarDismissed] = useState(false);
  const [barIdx, setBarIdx] = useState(0);
  const [locale, setLocale] = useState<string>("ENG");
  const [currency, setCurrency] = useState<string>("USD");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { count, openDrawer } = useCart();
  const wishlist = useWishlist();
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const settings = useSettings();
  const announcements = useMemo(() => {
    const dyn = settings.announcement?.text
      ? [{ text: settings.announcement.text, to: settings.announcement.href || "/sale" }]
      : [];
    return [...dyn, ...defaultAnnouncements];
  }, [settings.announcement]);
  const showBar = settings.announcement?.enabled !== false;
  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: session.id, _role: "admin" }).then(({ data }) => setIsAdmin(Boolean(data)));
  }, [session]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reducedMotion = usePrefersReducedMotion();
  const anim = (cls: string) => (reducedMotion ? "" : cls);

  /* debounced open/close to prevent flicker between trigger + panel */
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleMega = (next: boolean, delay = next ? 60 : 260) => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setOpenMega(next), delay);
  };
  const cancelMega = () => { if (megaTimer.current) { clearTimeout(megaTimer.current); megaTimer.current = null; } };


  /* hydrate persisted prefs / bar state */
  useEffect(() => {
    try {
      const b = localStorage.getItem("estora.bar.dismissed.v1") === "1";
      setBarDismissed(b);
      const l = localStorage.getItem("estora.locale"); if (l) setLocale(l);
      const c = localStorage.getItem("estora.currency"); if (c) setCurrency(c);
    } catch { /* ignore */ }
  }, []);

  /* rotate announcement (respects reduced motion) */
  useEffect(() => {
    if (barDismissed || reducedMotion) return;
    const t = setInterval(() => setBarIdx((i) => (i + 1) % announcements.length), 5000);
    return () => clearInterval(t);
  }, [barDismissed, reducedMotion]);

  /* subtle shadow on scroll */
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  /* Scroll-spy: highlight the nav link matching the section currently in
     view on long pages. Sections opt in via [data-nav-section="/route"]. */
  const [activeSection, setActiveSection] = useState<string | null>(null);
  useEffect(() => {
    setActiveSection(null);
    if (typeof IntersectionObserver === "undefined") return;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-nav-section]"),
    );
    if (els.length === 0) return;
    const visible = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target, e.intersectionRatio);
          else visible.delete(e.target);
        }
        let best: Element | null = null;
        let bestRatio = 0;
        for (const [el, r] of visible) {
          if (r > bestRatio) { best = el; bestRatio = r; }
        }
        setActiveSection(
          best ? (best as HTMLElement).dataset.navSection ?? null : null,
        );
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);


  /* close menus on route change */
  useEffect(() => { setOpenMega(false); setMobileOpen(false); }, [pathname]);

  /* Esc closes mega + outside-click */
  useEffect(() => {
    if (!openMega) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMega(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest("#mega-menu") || t.closest('[aria-controls="mega-menu"]')) return;
      setOpenMega(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [openMega]);

  const dismissBar = () => {
    setBarDismissed(true);
    try { localStorage.setItem("estora.bar.dismissed.v1", "1"); } catch { /* ignore */ }
  };
  const persistLocale = (v: string) => { setLocale(v); try { localStorage.setItem("estora.locale", v); } catch { /* ignore */ } };
  const persistCurrency = (v: string) => { setCurrency(v); try { localStorage.setItem("estora.currency", v); } catch { /* ignore */ } };

  return (
    <>
      {/* Announcement bar */}
      {showBar && !barDismissed && (
        <div className="relative bg-foreground text-background">
          <div className="container-x flex h-9 items-center justify-center gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <Link
              key={barIdx}
              to={announcements[barIdx].to}
              search={(announcements[barIdx] as { search?: Record<string, string> }).search as never}
              className={anim("animate-in fade-in slide-in-from-bottom-1 duration-300 rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/60")}
              aria-live="polite"
            >
              {announcements[barIdx].text}
            </Link>
          </div>
          <button
            onClick={dismissBar}
            aria-label="Dismiss announcement"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full hover:bg-background/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Utility bar */}
      <div className="hidden bg-accent/60 md:block">
        <div className="container-x flex h-10 items-center justify-between text-xs text-foreground/80">
          <div className="flex items-center gap-6">
            <Link to="/sale" className="inline-flex items-center gap-1.5 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Plane className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Free delivery over $200</Link>
            <Link to="/faqs" className="inline-flex items-center gap-1.5 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><DollarSign className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Money back guarantee</Link>
            <Link to="/shop" search={{ sort: "newest" } as never} className="inline-flex items-center gap-1.5 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Tag className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Weekly new arrivals</Link>
          </div>
          <div className="flex items-center gap-2">
            <LocalePicker value={locale} onChange={persistLocale} />
            <span className="text-foreground/30">·</span>
            <CurrencyPicker value={currency} onChange={persistCurrency} />
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur ${anim("transition-all duration-300")} ${scrolled ? "shadow-md" : ""}`}
      >
        <div className="container-x flex h-20 items-center justify-between gap-4 md:gap-6">
          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" aria-label="Estora — home" className="shrink-0"><Logo /></Link>

          {/* Desktop search */}
          <div className="hidden max-w-xl flex-1 md:block">
            <SearchBox />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 text-foreground/80 sm:gap-2">
            <Link
              to="/wishlist"
              aria-label={`Wishlist, ${wishlist.slugs.length} items`}
              className="relative grid h-10 w-10 place-items-center rounded-full transition-all duration-200 hover:bg-accent hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Heart className={`h-5 w-5 transition-transform ${wishlist.slugs.length > 0 ? "fill-sale text-sale" : ""}`} aria-hidden="true" />
              {wishlist.slugs.length > 0 && (
                <span className={`absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-white shadow-sm ${anim("animate-in zoom-in-50")}`} aria-hidden="true">
                  {wishlist.slugs.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Cart, ${count} items`}
              className="relative grid h-10 w-10 place-items-center rounded-full transition-all duration-200 hover:bg-accent hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {count > 0 && (
                <span
                  key={count}
                  className={`absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm ${anim("animate-in zoom-in-50")}`}
                  aria-hidden="true"
                >
                  {count}
                </span>
              )}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-all duration-200 hover:bg-accent"
                  aria-label="Account menu"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline">Account</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180 lg:inline" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {session ? (
                  <>
                    <DropdownMenuLabel className="truncate">Hi, {session.name || session.email}</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to="/account/orders"><Package className="mr-2 h-4 w-4" /> My orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist"><Heart className="mr-2 h-4 w-4" /> Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cart"><ShoppingBag className="mr-2 h-4 w-4" /> Cart</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={"/account/notifications" as never}><Bell className="mr-2 h-4 w-4" /> Notifications</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to={"/admin" as never}><Shield className="mr-2 h-4 w-4" /> Admin</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => { void signOut().then(() => toast.success("Signed out")); }}>
                      <LogIn className="mr-2 h-4 w-4 rotate-180" /> Sign out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>Welcome to Estora</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setShowAuth("signin")}>
                      <LogIn className="mr-2 h-4 w-4" /> Sign in
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowAuth("signup")}>
                      <UserPlus className="mr-2 h-4 w-4" /> Create account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist"><Heart className="mr-2 h-4 w-4" /> Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cart"><ShoppingBag className="mr-2 h-4 w-4" /> Cart</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>

            </DropdownMenu>
          </div>
        </div>

        {/* Mobile search below top row */}
        <div className="container-x pb-3 md:hidden">
          <SearchBox />
        </div>

        {/* Bottom nav (desktop) */}
        <div className="relative hidden border-t border-border/60 md:block">
          <div className="container-x flex h-12 items-center justify-between gap-6">
            <nav className="flex items-center gap-1" aria-label="Primary">
              {nav.map((n) => (
                <div
                  key={n.to}
                  onMouseEnter={() => n.hasMega && scheduleMega(true)}
                  onMouseLeave={() => n.hasMega && scheduleMega(false)}
                  className="relative"
                >
                  <Link
                    to={n.to}
                    activeOptions={{ exact: n.to === "/" }}
                    className={`group relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[status=active]:text-foreground ${activeSection === n.to ? "text-foreground" : ""}`}
                    activeProps={{ "aria-current": "page" } as never}
                    data-section-active={activeSection === n.to ? "true" : undefined}
                    onFocus={() => n.hasMega && scheduleMega(true, 0)}
                    onClick={(e) => {
                      if (n.hasMega) { e.preventDefault(); cancelMega(); setOpenMega((v) => !v); }
                    }}
                    aria-haspopup={n.hasMega ? "menu" : undefined}
                    aria-expanded={n.hasMega ? openMega : undefined}
                    aria-controls={n.hasMega ? "mega-menu" : undefined}
                  >
                    {n.label}
                    {n.hasMega && (
                      <ChevronDown className={`h-3.5 w-3.5 ${anim("transition-transform duration-200")} ${openMega && n.hasMega ? "rotate-180" : ""}`} aria-hidden="true" />
                    )}
                    <span className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-primary group-hover:scale-x-100 group-data-[status=active]:scale-x-100 group-data-[section-active=true]:scale-x-100 ${anim("transition-transform duration-300")}`} />
                  </Link>

                </div>
              ))}

              <Link to="/sale" className={`group ml-2 inline-flex items-center gap-1.5 rounded-full bg-sale/10 px-3 py-1.5 text-sm font-bold text-sale hover:bg-sale/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sale/40 ${anim("transition-all hover:scale-105")}`}>
                <span className={`grid h-1.5 w-1.5 rounded-full bg-sale ${anim("animate-pulse")}`} aria-hidden="true" />
                Sale
              </Link>
            </nav>
            <p className="hidden text-xs text-foreground/70 lg:block">
              Extra 20% off Sale styles · Free shipping over $200
            </p>
          </div>

          {/* Soft backdrop dims the rest of the page behind the panel */}
          <div
            aria-hidden="true"
            onClick={() => setOpenMega(false)}
            className={`pointer-events-none fixed inset-0 z-30 bg-foreground/25 backdrop-blur-[1px] ${anim("transition-opacity duration-200")} ${openMega ? "opacity-100" : "opacity-0"}`}
          />


          {/* Invisible hover bridge — keeps mouse "inside" mega hover graph
              while traveling from the nav row down to the panel. */}
          <div
            aria-hidden="true"
            onMouseEnter={() => { cancelMega(); setOpenMega(true); }}
            onMouseLeave={() => scheduleMega(false)}
            className={`absolute inset-x-0 top-full z-40 h-3 ${openMega ? "pointer-events-auto" : "pointer-events-none"}`}
          />

          <div
            id="mega-menu"
            role="menu"
            aria-label="Shop categories"
            aria-hidden={!openMega}
            onMouseEnter={() => { cancelMega(); setOpenMega(true); }}
            onMouseLeave={() => scheduleMega(false)}
            className={[
              "absolute inset-x-0 top-full z-50 origin-top border-t-2 border-primary/70 bg-background shadow-[0_24px_60px_-20px_rgba(0,0,0,0.28)]",
              anim("transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]"),
              openMega
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0",
            ].join(" ")}
          >
            {/* Header row inside panel */}
            <div className="container-x flex items-center justify-between border-b border-border/60 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                Explore the collection
              </p>
              <Link
                to="/shop"
                tabIndex={openMega ? 0 : -1}
                onClick={() => setOpenMega(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                View all Shop <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="container-x grid grid-cols-[repeat(4,minmax(0,1fr))_320px] gap-8 py-7">
              {megaCols.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title}>
                    <p className="mb-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {c.title}
                    </p>
                    <ul className="space-y-2 text-sm">
                      {c.items.map((it) => (
                        <li key={it.label}>
                          <Link
                            to={it.to ?? "/shop"}
                            search={it.to ? undefined : ({ cat: it.cat, type: it.type } as never)}
                            role="menuitem"
                            tabIndex={openMega ? 0 : -1}
                            onClick={() => setOpenMega(false)}
                            className="group inline-flex items-center gap-1.5 rounded font-medium text-foreground/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            {it.label}
                            {it.badge && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">{it.badge}</span>
                            )}
                            <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Featured tiles */}
              <div className="flex flex-col gap-3">
                <Link
                  to="/sale"
                  tabIndex={openMega ? 0 : -1}
                  onClick={() => setOpenMega(false)}
                  className="group relative flex-1 overflow-hidden rounded-2xl"
                >
                  <img src={catArmchairs} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" aria-hidden="true" />
                  <div className="relative flex h-full flex-col justify-end p-4 text-background">
                    <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-sale px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Save 60%</span>
                    <p className="text-lg font-extrabold leading-tight">Seasonal Sale</p>
                    <p className="mt-0.5 text-xs text-background/80">On seating &amp; storage</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold underline">
                      Shop the Sale <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/shop"
                    search={{ cat: "Bedroom" } as never}
                    tabIndex={openMega ? 0 : -1}
                    onClick={() => setOpenMega(false)}
                    className="group relative aspect-square overflow-hidden rounded-xl"
                  >
                    <img src={catBedroom} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2.5 text-background">
                      <span className="text-xs font-bold">Bedroom</span>
                      <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                  </Link>
                  <Link
                    to="/shop"
                    search={{ cat: "Floor Lamps" } as never}
                    tabIndex={openMega ? 0 : -1}
                    onClick={() => setOpenMega(false)}
                    className="group relative aspect-square overflow-hidden rounded-xl"
                  >
                    <img src={catLamps} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2.5 text-background">
                      <span className="text-xs font-bold">Lighting</span>
                      <Lamp className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom perks strip */}
            <div className="border-t border-border/60 bg-accent/40">
              <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-foreground/75">
                <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-primary" aria-hidden="true" /> Free shipping over $200</span>
                <span className="inline-flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" aria-hidden="true" /> 30-day free returns</span>
                <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" aria-hidden="true" /> Order now, confirm later</span>
                <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-primary" aria-hidden="true" /> 4.9/5 from 12k+ reviews</span>
              </div>
            </div>
          </div>


        </div>
      </header>


      {/* Mobile menu */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onSignIn={() => { setMobileOpen(false); setShowAuth("signin"); }}
        onSignUp={() => { setMobileOpen(false); setShowAuth("signup"); }}
        goto={(to, search) => { setMobileOpen(false); navigate({ to, search } as never); }}
        wishlistCount={wishlist.slugs.length}
        cartCount={count}
      />

      {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} />}
    </>
  );
}

/* ------------------------------------------------------------ */
/*  Search box with live suggestions                            */
/* ------------------------------------------------------------ */

function SearchBox() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const anim = (cls: string) => (reducedMotion ? "" : cls);

  useEffect(() => {
    try {
      const r = localStorage.getItem("estora.recent-search.v1");
      if (r) setRecent(JSON.parse(r));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* Global keyboard shortcut: "/" focuses the search box.
     Skip when the user is already typing in a field. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (
        t?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      )
        return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
      setFocused(true);
      track("search_shortcut_focus", {});
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Debounce the query — keeps typing smooth on slow devices */
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed === debouncedQ) return;
    if (trimmed.length === 0) {
      setDebouncedQ("");
      setPending(false);
      return;
    }
    setPending(true);
    const t = setTimeout(() => {
      setDebouncedQ(trimmed);
      setPending(false);
    }, 180);
    return () => clearTimeout(t);
  }, [q, debouncedQ]);

  const suggestions = useMemo(
    () => getSuggestions(debouncedQ, 6),
    [debouncedQ],
  );

  /* Fire an analytics event once per settled query (post-debounce). */
  useEffect(() => {
    if (!debouncedQ) return;
    track("search_input", {
      query: debouncedQ,
      length: debouncedQ.length,
      results: suggestions.length,
    });
  }, [debouncedQ, suggestions.length]);

  const noResults = !pending && debouncedQ.length > 0 && suggestions.length === 0;

  const submit = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem("estora.recent-search.v1", JSON.stringify(next)); } catch { /* ignore */ }
    setFocused(false);
    track("search_submit", { query: trimmed, results: suggestions.length });
    navigate({ to: "/shop", search: { q: trimmed } as never });
  };


  // Reset active on new suggestions
  useEffect(() => { setActive(-1); }, [suggestions]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused(true);
      setActive((i) => (suggestions.length ? Math.min(i + 1, suggestions.length - 1) : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Home") {
      if (suggestions.length) { e.preventDefault(); setActive(0); }
    } else if (e.key === "End") {
      if (suggestions.length) { e.preventDefault(); setActive(suggestions.length - 1); }
    } else if (e.key === "Enter") {
      if (active >= 0 && suggestions[active]) {
        e.preventDefault();
        const picked = suggestions[active];
        track("search_suggestion_select", { query: debouncedQ, slug: picked.slug, position: active, via: "keyboard" });
        setFocused(false);
        navigate({ to: "/product/$slug", params: { slug: picked.slug } });
      }
      // else: form submit runs full search
    
    } else if (e.key === "Escape") {
      if (q) { setQ(""); setActive(-1); }
      else { setFocused(false); inputRef.current?.blur(); }
    }
  };

  const showPanel = focused && (
    pending ||
    suggestions.length > 0 ||
    noResults ||
    (q === "" && recent.length > 0)
  );
  const activeId = active >= 0 && suggestions[active] ? `sug-${suggestions[active].slug}` : undefined;

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={(e) => { e.preventDefault(); submit(q); }} role="search" className="group relative">
        <label htmlFor="site-search" className="sr-only">Search products</label>
        <Search
          className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${anim("transition-all duration-300")} ${focused ? `text-primary ${anim("scale-110")}` : "text-muted-foreground"}`}
          aria-hidden="true"
        />
        <input
          id="site-search"
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKey}
          placeholder="Search sofas, lamps, decor…"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls="search-suggestions"
          aria-activedescendant={activeId}
          aria-label="Search products"
          className={`w-full rounded-full bg-surface py-2.5 pl-11 pr-24 text-sm outline-none placeholder:text-muted-foreground/70 focus:bg-background focus:shadow-md focus:ring-2 focus:ring-primary/40 ${anim("transition-all duration-300")} ${focused ? "ring-2 ring-primary/20" : ""}`}
        />
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {pending
            ? "Searching…"
            : debouncedQ && suggestions.length > 0
              ? `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"} available`
              : noResults
                ? `No products match ${debouncedQ}`
                : ""}
        </span>
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); setActive(-1); inputRef.current?.focus(); }}
            aria-label="Clear search"
            className={`absolute right-11 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${anim("animate-in fade-in zoom-in-75")}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Search"
          className={`absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground hover:shadow-md active:opacity-90 ${anim("transition-all duration-200 hover:scale-105 active:scale-95")}`}
        >
          {pending ? <Loader2 className={`h-4 w-4 ${anim("animate-spin")}`} aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>

      {showPanel && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-[26rem] origin-top overflow-auto rounded-2xl border border-border bg-background p-2 shadow-xl ${anim("animate-in fade-in slide-in-from-top-2 duration-200")}`}
        >
          {/* Recent (empty query) */}
          {q === "" && recent.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Recent searches
                <button
                  onClick={() => { setRecent([]); try { localStorage.removeItem("estora.recent-search.v1"); } catch { /* ignore */ } }}
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => submit(r)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {r}
                </button>
              ))}
            </>
          )}

          {/* Loading skeleton */}
          {pending && (
            <div className="p-2" aria-hidden="true">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Searching…</div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  <div className={`h-9 w-9 rounded-md bg-muted ${anim("animate-pulse")}`} />
                  <div className="flex-1 space-y-1.5">
                    <div className={`h-3 w-3/4 rounded bg-muted ${anim("animate-pulse")}`} />
                    <div className={`h-2.5 w-1/2 rounded bg-muted ${anim("animate-pulse")}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {!pending && suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Products</span>
                <span className="normal-case tracking-normal text-muted-foreground/70">{suggestions.length} match{suggestions.length === 1 ? "" : "es"}</span>
              </div>
              <ul className="space-y-0.5">
                {suggestions.map((p, i) => (
                  <li key={p.slug}>
                    <Link
                      id={`sug-${p.slug}`}
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      onClick={() => {
                        track("search_suggestion_select", { query: debouncedQ, slug: p.slug, position: i });
                        setFocused(false);
                      }}
                      onMouseEnter={() => setActive(i)}
                      role="option"
                      aria-selected={i === active}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 focus-visible:outline-none ${i === active ? "bg-accent" : "hover:bg-accent/60"}`}
                    >
                      <img
                        src={p.image}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-md bg-muted object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          <Highlight text={p.name} match={debouncedQ} />
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {p.category} · {p.type}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">${p.price.toFixed(0)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-1 border-t border-border pt-1">
                <button
                  onClick={() => submit(q)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold text-primary hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span>See all results for “{debouncedQ}”</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </>
          )}

          {/* Empty state */}
          {noResults && (
            <div className="px-3 py-6 text-center">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-accent">
                <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-foreground">No matches for “{debouncedQ}”</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different keyword, or browse the full catalog.</p>
              <button
                onClick={() => submit(q)}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                Search anyway →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



/* ------------------------------------------------------------ */
/*  Language / Currency dropdown                                */
/* ------------------------------------------------------------ */

function LocalePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const current = LOCALES.find((l) => l.code === value) ?? LOCALES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Language: ${current.name}`}
          className="group inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-all hover:bg-background/50"
        >
          <span className="text-sm leading-none" aria-hidden="true">{current.flag}</span>
          <span className="font-semibold">{current.label}</span>
          <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Language</DropdownMenuLabel>
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l.code} onSelect={() => onChange(l.code)} className="gap-2">
            <span aria-hidden="true" className="text-base">{l.flag}</span>
            <span className="flex-1">{l.name}</span>
            {l.code === value && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CurrencyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const current = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Currency: ${current.name}`}
          className="group inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-all hover:bg-background/50"
        >
          <span className="grid h-4 w-4 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary" aria-hidden="true">
            {current.symbol}
          </span>
          <span className="font-semibold">{current.code}</span>
          <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Currency</DropdownMenuLabel>
        {CURRENCIES.map((c) => (
          <DropdownMenuItem key={c.code} onSelect={() => onChange(c.code)} className="gap-2">
            <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-accent text-xs font-bold">{c.symbol}</span>
            <span className="flex-1">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.code}</span>
            {c.code === value && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------------------------------------ */
/*  Mobile menu                                                 */
/* ------------------------------------------------------------ */

function MobileMenu({
  open, onClose, onSignIn, onSignUp, goto, wishlistCount, cartCount,
}: {
  open: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  goto: (to: string, search?: Record<string, unknown>) => void;
  wishlistCount: number;
  cartCount: number;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>("Shop");
  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <SheetContent side="left" className="flex w-[85vw] flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle><Logo /></SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button onClick={onSignIn} className="rounded-full border border-border py-2 text-sm font-semibold hover:bg-accent">
              <LogIn className="mr-1 inline h-4 w-4" /> Sign in
            </button>
            <button onClick={onSignUp} className="rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <UserPlus className="mr-1 inline h-4 w-4" /> Join
            </button>
          </div>

          <nav className="space-y-1" aria-label="Mobile primary">
            <button onClick={() => goto("/")} className="block w-full rounded-lg px-3 py-3 text-left text-base font-bold hover:bg-accent">Home</button>

            <div>
              <button
                onClick={() => setOpenGroup(openGroup === "Shop" ? null : "Shop")}
                aria-expanded={openGroup === "Shop"}
                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base font-bold hover:bg-accent"
              >
                Shop <ChevronDown className={`h-4 w-4 transition-transform ${openGroup === "Shop" ? "rotate-180" : ""}`} />
              </button>
              {openGroup === "Shop" && (
                <div className="ml-3 space-y-3 border-l border-border pl-3 pb-2">
                  <button onClick={() => goto("/shop")} className="block w-full rounded px-2 py-1.5 text-left text-sm font-semibold hover:bg-accent">All products</button>
                  {megaCols.map((c) => (
                    <div key={c.title}>
                      <p className="px-2 py-1 text-xs font-bold uppercase text-muted-foreground">{c.title}</p>
                      {c.items.map((it) => (
                        <button
                          key={it.label}
                          onClick={() => goto("/shop", { cat: it.cat, type: it.type })}
                          className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          {it.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => goto("/sale")} className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-base font-bold text-sale hover:bg-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sale" /> Sale
            </button>
            <button onClick={() => goto("/blog")} className="block w-full rounded-lg px-3 py-3 text-left text-base font-bold hover:bg-accent">Blog</button>
            <button onClick={() => goto("/contact")} className="block w-full rounded-lg px-3 py-3 text-left text-base font-bold hover:bg-accent">Contact</button>
            <button onClick={() => goto("/about")} className="block w-full rounded-lg px-3 py-3 text-left text-base font-bold hover:bg-accent">About us</button>
            <button onClick={() => goto("/faqs")} className="block w-full rounded-lg px-3 py-3 text-left text-base font-bold hover:bg-accent">FAQs</button>
          </nav>

          {/* Perks — mirror the desktop utility bar */}
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Why shop with us</p>
            <button onClick={() => goto("/sale")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <Plane className="h-4 w-4 text-primary" aria-hidden="true" /> Free delivery over $200
            </button>
            <button onClick={() => goto("/faqs")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" /> Money back guarantee
            </button>
            <button onClick={() => goto("/shop", { sort: "newest" })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <Tag className="h-4 w-4 text-primary" aria-hidden="true" /> Weekly new arrivals
            </button>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button onClick={() => goto("/wishlist")} className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-2 font-semibold hover:bg-accent">
              <Heart className="h-4 w-4" /> Wishlist {wishlistCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{wishlistCount}</span>}
            </button>
            <button onClick={() => goto("/cart")} className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-2 font-semibold hover:bg-accent">
              <ShoppingBag className="h-4 w-4" /> Cart {cartCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{cartCount}</span>}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------ */
/*  Auth modal                                                  */
/* ------------------------------------------------------------ */

function AuthModal({ mode: initial, onClose }: { mode: "signup" | "signin"; onClose: () => void }) {
  const [mode, setMode] = useState<"signup" | "signin">(initial);
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const strength = pwStrength(pw);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "signup" ? "Create account" : "Sign in"}
      onClick={onClose}
    >
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-3xl bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-sm hover:bg-accent">
          <X className="h-4 w-4" />
        </button>

        {/* Brand side */}
        <div className="relative hidden w-1/2 overflow-hidden md:block">
          <img src={catArmchairs} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/40 to-primary/50" />
          <div className="relative flex h-full flex-col justify-between p-10 text-background">
            <Logo />
            <div>
              <h3 className="text-3xl font-extrabold leading-tight">Design that feels like home.</h3>
              <p className="mt-3 text-sm opacity-90">Join 120,000 members — early access to drops, exclusive prices, and free shipping over $200.</p>
              <div className="mt-6 flex items-center gap-2 text-xs">
                <div className="flex -space-x-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/80 text-[10px] font-bold ring-2 ring-background">JS</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sale/80 text-[10px] font-bold ring-2 ring-background">MK</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-background/80 text-[10px] font-bold text-foreground ring-2 ring-background">+</span>
                </div>
                <span className="opacity-90">4.9/5 from 12k reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="w-full p-8 md:w-1/2 md:p-10">
          <div className="mb-1 flex md:hidden"><Logo /></div>
          <h2 className="text-2xl font-extrabold md:text-3xl">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signup" ? "It only takes a minute." : "Sign in to continue shopping."}</p>

          <div className="mt-6 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={async () => {
                const { signInGoogle } = await import("@/lib/session-store");
                const res = await signInGoogle();
                if (res?.error) toast.error(res.error.message || "Google sign-in failed");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <GoogleIcon /> Continue with Google
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or continue with email <span className="h-px flex-1 bg-border" />
          </div>

          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const email = String(fd.get("email") || "").trim();
              const password = String(fd.get("password") || "");
              const name = String(fd.get("name") || "").trim() || undefined;
              if (!email || !password) return;
              setLoading(true);
              const { signInEmail, signUpEmail } = await import("@/lib/session-store");
              const { error } = mode === "signup"
                ? await signUpEmail(email, password, name)
                : await signInEmail(email, password);
              setLoading(false);
              if (error) { toast.error(error.message); return; }
              toast.success(mode === "signup" ? "Account created — welcome!" : "Signed in — welcome back!");
              onClose();
            }}
          >
            {mode === "signup" && <Input label="Full name" name="name" placeholder="ex: Julie Sample" required />}
            <Input label="Email address" name="email" placeholder="you@example.com" type="email" required autoComplete="email" />


            <div>
              <label className="text-xs font-semibold">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="6+ characters"
                  className="w-full rounded-full border border-border bg-background px-4 py-2.5 pr-12 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              {mode === "signup" && pw && (
                <div className="mt-2">
                  <div className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-border"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Password strength: <span className="font-semibold">{strength.label}</span></p>
                </div>
              )}
            </div>

            {mode === "signup" ? (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" required className="mt-0.5 accent-primary" />
                I agree to the <a href="#" className="font-semibold text-primary hover:underline">Terms</a> and <a href="#" className="font-semibold text-primary hover:underline">Privacy Policy</a>.
              </label>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="accent-primary" /> Remember me
                </label>
                <button type="button" onClick={() => toast.info("Password reset link sent")} className="font-semibold text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs">
            {mode === "signup" ? "Already have an account?" : "New to Estora?"}{" "}
            <button className="font-bold text-primary hover:underline" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function pwStrength(pw: string) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const colors = ["bg-sale", "bg-sale", "bg-yellow-500", "bg-primary"];
  const labels = ["Too weak", "Weak", "Good", "Strong"];
  const idx = Math.max(0, s - 1);
  return { score: s, color: colors[idx], label: labels[idx] };
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function Input({ label, placeholder, type = "text", required, autoComplete, name }: { label: string; placeholder: string; type?: string; required?: boolean; autoComplete?: string; name?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

