import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube, Send, MapPin, Phone, Mail, Truck, ShieldCheck, RefreshCw, Headphones, ArrowUp, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Please enter a valid email.");
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.toLowerCase(), source: "footer" });
    setBusy(false);
    if (error) {
      if (error.code === "23505") { toast.info("You're already subscribed."); setEmail(""); return; }
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Welcome to Estora — check your inbox for a 10% off code.");
    setEmail("");
    setTimeout(() => setDone(false), 3200);
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="mt-24 bg-footer text-footer-foreground">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 gap-4 py-8 sm:gap-6 lg:grid-cols-4">
          <Trust icon={<Truck className="h-5 w-5" />} title="Free shipping" subtitle="On orders over $200" />
          <Trust icon={<RefreshCw className="h-5 w-5" />} title="30-day returns" subtitle="Hassle-free refunds" />
          <Trust icon={<ShieldCheck className="h-5 w-5" />} title="Secure checkout" subtitle="Encrypted end-to-end" />
          <Trust icon={<Headphones className="h-5 w-5" />} title="Concierge support" subtitle="Mon–Sat · 9am–7pm" />
        </div>
      </div>


      {/* Main grid */}
      <div className="container-x grid gap-12 py-16 lg:grid-cols-12">
        {/* Brand */}
        <div className="space-y-6 lg:col-span-4">
          <Logo variant="light" />
          <p className="max-w-sm text-sm leading-relaxed text-footer-foreground/70">
            Estora crafts warm, considered furniture for calm modern homes — designed in London, delivered worldwide.
          </p>
          <ul className="space-y-2.5 text-sm text-footer-foreground/80">
            <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> 17 Princess Road, London NW1 8JR, UK</li>
            <li className="flex items-start gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> +44 (800) 8001 8588</li>
            <li className="flex items-start gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <a href="mailto:hello@estora.com" className="hover:text-footer-foreground">hello@estora.com</a></li>
          </ul>
          <div className="flex gap-2">
            {[
              { icon: Facebook, label: "Facebook", href: "#" },
              { icon: Instagram, label: "Instagram", href: "#" },
              { icon: Twitter, label: "Twitter", href: "#" },
              { icon: Youtube, label: "YouTube", href: "#" },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-footer-foreground/80 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
          <LinkCol title="Shop" links={[
            { to: "/shop", label: "All products" },
            { to: "/sale", label: "Flash sale" },
            { to: "/catalog", label: "New arrivals" },
            { to: "/wishlist", label: "Wishlist" },
            { to: "/cart", label: "Cart" },
          ]} />
          <LinkCol title="Company" links={[
            { to: "/about", label: "About us" },
            { to: "/blog", label: "Journal" },
            { to: "/contact", label: "Contact" },
            { to: "/sitemap", label: "Site map" },
          ]} />
          <LinkCol title="Support" links={[
            { to: "/help", label: "Help & FAQ" },
            { to: "/faqs", label: "All FAQs" },
            { to: "/shipping", label: "Shipping" },
            { to: "/returns", label: "Returns & refunds" },
            { to: "/account/orders", label: "Track order" },
            { to: "/account/notifications", label: "Notifications" },
          ]} />

        </div>

        {/* Newsletter */}
        <div className="lg:col-span-3">
          <h4 className="text-base font-extrabold">Join the list</h4>
          <p className="mt-2 text-sm text-footer-foreground/70">Sign up for exclusive drops, journal stories, and <span className="font-bold text-primary">10% off</span> your first order.</p>
          <form onSubmit={subscribe} className="relative mt-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              maxLength={255}
              aria-label="Email address"
              placeholder="you@example.com"
              className="w-full rounded-full bg-white/10 py-3 pl-5 pr-14 text-sm text-footer-foreground placeholder:text-footer-foreground/50 outline-none ring-1 ring-white/10 transition focus:ring-primary"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label={done ? "Subscribed" : "Subscribe"}
              className={`absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-primary-foreground transition-colors ${done ? "bg-emerald-500" : "bg-primary hover:opacity-90"} disabled:opacity-60`}
            >
              {done ? <Check className="h-4 w-4 animate-scale-in" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <p className="mt-3 text-[11px] text-footer-foreground/50">By subscribing you agree to our <Link to="/privacy" className="underline hover:text-footer-foreground">privacy policy</Link>. Unsubscribe anytime.</p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Estora app</p>
            <p className="mt-1 text-xs text-footer-foreground/70">Coming soon on iOS & Android — early-access members get first drops.</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-x grid grid-cols-1 items-center gap-4 py-6 text-xs text-footer-foreground/60 md:grid-cols-[auto_1fr_auto]">
          <p className="text-center md:text-left">© {new Date().getFullYear()} Estora Home Ltd. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-center">
            <Link to="/privacy" className="hover:text-footer-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-footer-foreground">Terms</Link>
            <Link to="/returns" className="hover:text-footer-foreground">Returns</Link>
            <Link to="/shipping" className="hover:text-footer-foreground">Shipping</Link>
            <Link to="/help" className="hover:text-footer-foreground">Help &amp; FAQ</Link>
            <Link to="/sitemap" className="hover:text-footer-foreground">Site map</Link>
            <Link to="/contact" className="hover:text-footer-foreground">Contact</Link>
          </nav>
          <div className="flex items-center justify-center gap-3 md:justify-end">
            <span className="hidden sm:inline">No online payment required</span>
            <button
              onClick={scrollTop}
              aria-label="Back to top"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-footer-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

    </footer>
  );
}

function Trust({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">{icon}</span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-footer-foreground/60">{subtitle}</p>
      </div>
    </div>
  );
}

function LinkCol({ title, links }: { title: string; links: Array<{ to: string; label: string }> }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-footer-foreground">{title}</h4>
      <ul className="space-y-2.5 text-sm text-footer-foreground/70">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="inline-flex items-center gap-1 transition hover:translate-x-0.5 hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
