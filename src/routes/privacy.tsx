import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Estora" },
      { name: "description", content: "How Estora collects, uses, and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — Estora" },
      { property: "og:description", content: "How Estora collects, uses, and protects your personal information." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Legal</p>
            <h1 className="text-3xl font-black sm:text-4xl">Privacy Policy</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Last updated {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-[15px] leading-relaxed">
          <Section title="1. What we collect">
            When you shop with Estora we collect the details you give us — name, email, shipping address, phone, and order history. We also collect basic device data (browser, IP, pages viewed) to improve the store.
          </Section>
          <Section title="2. How we use it">
            To fulfil orders, send transactional emails, respond to support requests, prevent fraud, and — if you opt in — send occasional marketing.
          </Section>
          <Section title="3. Sharing">
            We share data only with delivery couriers, payment/analytics providers, and where required by law. We never sell personal data.
          </Section>
          <Section title="4. Your rights">
            You can request a copy of your data, correct it, or ask us to delete it at any time — email <a className="text-primary underline" href="mailto:privacy@estora.com">privacy@estora.com</a>.
          </Section>
          <Section title="5. Cookies">
            We use essential cookies to keep your cart working and analytics cookies to understand how the store is used. You can clear them anytime in your browser.
          </Section>
          <Section title="6. Contact">
            Questions? <Link to="/contact" className="text-primary underline">Get in touch</Link> and we'll answer within one business day.
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
