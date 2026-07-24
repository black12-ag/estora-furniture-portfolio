import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy, MessageCircle, Package, CreditCard, RotateCcw, User, ChevronRight, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/help")({
  component: HelpPage,
  head: () => ({
    meta: [
      { title: "Help Center — Estora" },
      { name: "description", content: "Get answers about orders, returns, delivery, and your Estora account." },
      { property: "og:title", content: "Help Center — Estora" },
      { property: "og:description", content: "Get answers about orders, returns, delivery, and your Estora account." },
      { property: "og:url", content: "/help" },
    ],
    links: [{ rel: "canonical", href: "/help" }],
  }),
});

const topics = [
  { icon: Package, title: "Orders & delivery", body: "Track, edit, or cancel an order", to: "/account/orders" as const },
  { icon: RotateCcw, title: "Returns & refunds", body: "Start a return or exchange", to: "/returns" as const },
  { icon: CreditCard, title: "Payments", body: "Accepted methods and receipts", to: "/faqs" as const },
  { icon: User, title: "My account", body: "Password, notifications, addresses", to: "/account/notifications" as const },
  { icon: MessageCircle, title: "Contact us", body: "Message our support team", to: "/contact" as const },
  { icon: LifeBuoy, title: "FAQs", body: "Quick answers to common questions", to: "/faqs" as const },
];

const faqs = [
  { q: "How do I check my order status?", a: <>Sign in and open <Link to="/account/orders" className="text-primary underline">My orders</Link> — you'll see a live status timeline (pending, confirmed, shipped, delivered) for every order.</> },
  { q: "How long does delivery take?", a: <>Standard delivery is 3–5 business days in the UK. Express is 1–2 days. International orders take 7–14 days. Full details on our <Link to="/shipping" className="text-primary underline">Shipping page</Link>.</> },
  { q: "What's your return window?", a: <>You have 30 days from delivery to request a return. See the <Link to="/returns" className="text-primary underline">Returns & Refunds page</Link> for full steps.</> },
  { q: "Do you charge my card at checkout?", a: <>No — Estora runs on a "confirm later" model. The card form on checkout is a simulated test flow; no real charge is made. Our team confirms the order and payment method afterwards.</> },
  { q: "Can I cancel or edit an order?", a: <>Yes, while the order is still <b>pending</b>. Open it from <Link to="/account/orders" className="text-primary underline">My orders</Link> and tap "Request cancellation".</> },
  { q: "How do I reset my password?", a: <>Use the <Link to="/forgot-password" className="text-primary underline">Forgot password</Link> link on the sign-in screen. You'll get a reset email within a minute.</> },
  { q: "Where do I enter a promo code?", a: <>Apply codes in the cart drawer or on the checkout page — we validate them in real time and show the discount immediately.</> },
  { q: "When can I reach support?", a: <>Our team is available Monday–Saturday, 9am–7pm GMT. Message us via <Link to="/contact" className="text-primary underline">Contact</Link> and we usually reply within a business day.</> },
];

function HelpPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-surface to-transparent p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Help center</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">How can we help?</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Browse popular topics or reach our concierge team — we usually reply within one business day.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-primary">Contact support</Link>
            <a href="#faq" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold hover:bg-accent">Jump to FAQ</a>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <Link key={t.title} to={t.to} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><t.icon className="h-5 w-5" /></span>
                <p className="font-extrabold">{t.title}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                Open <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>

        {/* FAQ */}
        <section id="faq" className="mt-14 scroll-mt-24">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><HelpCircle className="h-5 w-5" /></span>
            <div>
              <h2 className="text-2xl font-black">Frequently asked questions</h2>
              <p className="text-sm text-muted-foreground">Quick answers to the questions we hear most often.</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-card p-4 sm:p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-bold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface/50 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Still need help?</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/faqs" className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-bold hover:bg-accent">See all FAQs</Link>
              <Link to="/contact" className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90">Message support</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
