import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Info } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Estora" },
      { name: "description", content: "The terms and conditions that apply when you shop with Estora." },
      { property: "og:title", content: "Terms of Service — Estora" },
      { property: "og:description", content: "The terms and conditions that apply when you shop with Estora." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function TermsPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary"><FileText className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Legal</p>
            <h1 className="text-3xl font-black sm:text-4xl">Terms of Service</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Last updated {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-6 rounded-2xl border border-border bg-surface/50 p-4 text-xs text-muted-foreground">
          <p className="inline-flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>This page is maintained by the Estora team as editable customer-facing content and should be reviewed with your own legal counsel before launch. It is not legal advice.</span>
          </p>
        </div>

        <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-[15px] leading-relaxed">
          <Section title="1. Introduction">
            These Terms govern your use of Estora's website, apps and any orders placed with us. By browsing or ordering you agree to them.
          </Section>
          <Section title="2. Eligibility">
            You must be at least 18 years old (or the age of majority where you live) to place an order.
          </Section>
          <Section title="3. Accounts">
            You're responsible for keeping your login details safe and for activity on your account. Let us know immediately if you suspect unauthorised use.
          </Section>
          <Section title="4. Orders & pricing">
            All orders are subject to acceptance and stock availability. Prices and promotions can change without notice; the price shown at checkout is the price you pay.
          </Section>
          <Section title="5. Payments">
            Estora currently operates on a "confirm later" model — we don't collect online card payments. Any card entry in checkout is a simulated test flow; no charge is made. Once our team confirms your order, we'll arrange payment (cash on delivery or invoice).
          </Section>
          <Section title="6. Shipping">
            Delivery times, costs and options are described on our <Link to="/shipping" className="text-primary underline">Shipping page</Link>. Estimates aren't guarantees — carriers occasionally delay.
          </Section>
          <Section title="7. Returns & refunds">
            You can return most items within 30 days. Full terms live on our <Link to="/returns" className="text-primary underline">Returns & Refunds page</Link>.
          </Section>
          <Section title="8. Intellectual property">
            All content on estora.com — photos, copy, logos, code — belongs to Estora or its licensors. Please don't reuse it without permission.
          </Section>
          <Section title="9. Acceptable use">
            Don't attempt to disrupt the site, scrape it at scale, or use it to break the law or harass others.
          </Section>
          <Section title="10. Disclaimers">
            The site is provided "as is". Product colours may vary slightly from screen to reality. We do our best to keep information accurate but don't warrant it's error-free.
          </Section>
          <Section title="11. Limitation of liability">
            To the extent permitted by law, Estora isn't liable for indirect or consequential losses arising from your use of the site or products.
          </Section>
          <Section title="12. Governing law">
            These Terms are governed by the laws of England & Wales. Disputes are subject to the exclusive jurisdiction of the courts of London.
          </Section>
          <Section title="13. Contact">
            Questions? <Link to="/contact" className="text-primary underline">Get in touch</Link> — we usually reply within one business day.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </section>
  );
}
