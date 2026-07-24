import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, ExternalLink, Lock } from "lucide-react";

export const Route = createFileRoute("/sitemap")({
  component: SitemapPage,
  head: () => ({
    meta: [
      { title: "Site Map — Estora" },
      { name: "description", content: "Every page on Estora with the main actions available on each." },
      { property: "og:title", content: "Site Map — Estora" },
      { property: "og:description", content: "Every page on Estora with the main actions available on each." },
      { property: "og:url", content: "/sitemap" },
    ],
    links: [{ rel: "canonical", href: "/sitemap" }],
  }),
});

type Page = { path: string; title: string; desc: string; ctas: string[] };
type Group = { name: string; pages: Page[] };

const groups: Group[] = [
  {
    name: "Shop",
    pages: [
      { path: "/", title: "Home", desc: "Landing page with hero slider, collections and featured products.", ctas: ["Shop now", "Explore collections", "Join newsletter"] },
      { path: "/shop", title: "All products", desc: "Filterable catalog with categories, price, colour and sort.", ctas: ["Add to cart", "Add to wishlist", "Quick view"] },
      { path: "/sale", title: "Flash sale", desc: "Discounted pieces with countdown urgency badges.", ctas: ["Shop the deal", "Add to cart"] },
      { path: "/catalog", title: "Catalog", desc: "Backend-driven product listing loaded from the database.", ctas: ["View details", "Add to cart"] },
      { path: "/product/$slug", title: "Product detail", desc: "Gallery, variants, quantity, reviews and specs.", ctas: ["Add to cart", "Add to wishlist", "Buy now"] },
      { path: "/cart", title: "Cart", desc: "Review items, apply promo codes and start checkout.", ctas: ["Update quantity", "Apply promo", "Checkout"] },
      { path: "/wishlist", title: "Wishlist", desc: "Saved items you can move into the cart.", ctas: ["Move to cart", "Remove"] },
      { path: "/checkout", title: "Checkout", desc: "Two-step shipping + review with mock payment.", ctas: ["Continue to review", "Edit shipping", "Place order"] },
      { path: "/checkout/success", title: "Order confirmed", desc: "Order receipt with mock payment status.", ctas: ["View my orders", "Continue shopping"] },
    ],
  },
  {
    name: "Content",
    pages: [
      { path: "/about", title: "About us", desc: "Our story, values and workshop.", ctas: ["Contact us", "Shop the range"] },
      { path: "/blog", title: "Journal", desc: "Editorial posts and buying guides.", ctas: ["Read post", "Subscribe"] },
      { path: "/blog/$slug", title: "Blog post", desc: "Long-form article view.", ctas: ["Share", "Back to journal"] },
      { path: "/contact", title: "Contact us", desc: "Send a message to the Estora team.", ctas: ["Send message", "Open live chat"] },
    ],
  },
  {
    name: "Account",
    pages: [
      { path: "/auth", title: "Sign in / Sign up", desc: "Email + Google authentication.", ctas: ["Sign in", "Create account", "Continue with Google"] },
      { path: "/account/orders", title: "My orders", desc: "Order history with status.", ctas: ["View order", "Request refund"] },
      { path: "/account/orders/$id", title: "Order detail", desc: "Timeline, items and refund/cancellation requests.", ctas: ["Request refund", "Request cancellation"] },
      { path: "/account/notifications", title: "Notifications", desc: "Email + in-app notification preferences.", ctas: ["Save preferences"] },
      { path: "/account/activity", title: "Activity log", desc: "Every message we've sent you, filterable.", ctas: ["Filter", "Open order"] },
      { path: "/account/mfa-setup", title: "Two-factor setup", desc: "Enroll TOTP for extra security.", ctas: ["Enable MFA", "Verify code"] },
      { path: "/mfa", title: "MFA challenge", desc: "Enter your one-time code to continue.", ctas: ["Verify"] },
      { path: "/forgot-password", title: "Forgot password", desc: "Request a password reset link.", ctas: ["Send reset link"] },
      { path: "/reset-password", title: "Reset password", desc: "Set a new password.", ctas: ["Save new password"] },
      { path: "/verify-email", title: "Verify email", desc: "Resend confirmation email.", ctas: ["Resend verification"] },
    ],
  },
  {
    name: "Support & Legal",
    pages: [
      { path: "/help", title: "Help center", desc: "Popular topics and inline FAQ.", ctas: ["Contact support", "Read FAQs"] },
      { path: "/faqs", title: "Full FAQs", desc: "Detailed answers by category.", ctas: ["Ask a question"] },
      { path: "/shipping", title: "Shipping", desc: "Delivery times, rates and tracking.", ctas: ["Track order", "Contact us"] },
      { path: "/returns", title: "Returns & refunds", desc: "30-day return window and refund timing.", ctas: ["Start a return", "Contact support"] },
      { path: "/privacy", title: "Privacy policy", desc: "How we handle your data.", ctas: ["Contact us"] },
      { path: "/terms", title: "Terms of service", desc: "The rules of using Estora.", ctas: ["Contact us"] },
      { path: "/sitemap", title: "Site map", desc: "You are here.", ctas: [] },
    ],
  },
];

const adminRoutes = [
  "/admin", "/admin/orders", "/admin/products", "/admin/blog", "/admin/messages",
  "/admin/subscribers", "/admin/reviews", "/admin/promos", "/admin/users",
  "/admin/roles", "/admin/roles-bulk", "/admin/permissions", "/admin/refunds",
  "/admin/audit", "/admin/inventory", "/admin/inventory-log", "/admin/media",
  "/admin/settings", "/admin/email-log", "/admin/email-preview", "/admin/auth-status",
];

function SitemapPage() {
  const totalPages = groups.reduce((n, g) => n + g.pages.length, 0);
  const totalCtas = groups.reduce((n, g) => n + g.pages.reduce((a, p) => a + p.ctas.length, 0), 0);

  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary"><Map className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Directory</p>
            <h1 className="text-3xl font-black sm:text-4xl">Site Map</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Sections" value={String(groups.length)} />
          <Stat label="Public pages" value={String(totalPages)} />
          <Stat label="Major CTAs" value={String(totalCtas)} />
          <Stat label="Admin routes" value={String(adminRoutes.length)} />
        </div>

        <div className="mt-10 space-y-10">
          {groups.map((g) => (
            <section key={g.name}>
              <div className="flex items-end justify-between border-b border-border pb-3">
                <h2 className="text-xl font-extrabold">{g.name}</h2>
                <span className="text-xs text-muted-foreground">{g.pages.length} pages · {g.pages.reduce((a, p) => a + p.ctas.length, 0)} CTAs</span>
              </div>
              <ul className="mt-4 grid gap-3">
                {g.pages.map((p) => (
                  <li key={p.path} className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="font-extrabold truncate">{p.title}</p>
                          <code className="rounded bg-surface px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">{p.path}</code>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                        {p.ctas.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {p.ctas.map((c) => (
                              <span key={c} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {!p.path.includes("$") && (
                        <Link to={p.path} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:bg-accent">
                          Open <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <details className="rounded-2xl border border-dashed border-border bg-surface/40 p-5">
            <summary className="cursor-pointer text-sm font-bold">
              <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-muted-foreground" /> Admin area ({adminRoutes.length} routes)</span>
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">Restricted to signed-in administrators. Listed for reference only.</p>
            <ul className="mt-3 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {adminRoutes.map((r) => (
                <li key={r} className="font-mono text-muted-foreground">{r}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
