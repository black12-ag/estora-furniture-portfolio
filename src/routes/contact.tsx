import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Home, Phone, Mail, Facebook, Instagram, Twitter, Youtube, MessageCircle, Truck, RotateCcw, HelpCircle, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import showroom from "@/assets/contact-showroom.jpg";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact Estora — We're Here to Help" },
      { name: "description", content: "Chat with our design team, visit our London showroom, or get help with orders, delivery and returns. Real humans, 24/7." },
      { property: "og:title", content: "Contact Estora — We're Here to Help" },
      { property: "og:description", content: "Real humans, real answers — email, phone, chat or drop by." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const channels = [
  { icon: MessageCircle, title: "Live chat", sub: "Avg. reply in 2 min", action: "Start chat", href: "#chat" },
  { icon: Mail, title: "Email us", sub: "hello@estora.com", action: "Send email", href: "mailto:hello@estora.com" },
  { icon: Phone, title: "Call us", sub: "+1 (800) 800-1858", action: "Call now", href: "tel:+18008001858" },
  { icon: Truck, title: "Track order", sub: "Check delivery status", action: "Track", href: "/account" },
];

const topics = ["General question", "Order or delivery", "Returns & refunds", "Trade & interior designers", "Press & partnerships", "Something else"];

const faqs = [
  { q: "How long does delivery take?", a: "Most in-stock items ship within 2 business days and arrive in 5–10 days. Made-to-order sofas take 4–6 weeks." },
  { q: "Do you assemble the furniture?", a: "Our white-glove option (available at checkout) includes room-of-choice delivery and full assembly." },
  { q: "What's your return policy?", a: "You have 30 days to try any piece at home. If it isn't right, we'll pick it up — free." },
  { q: "Can I visit a showroom?", a: "Absolutely. Our London flagship is open 7 days a week. Booking recommended for design consultations." },
];

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState(topics[0]);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim() || null;
    const message = String(data.get("message") ?? "").trim();
    if (!name || !email || !message) { toast.error("Please fill name, email and message."); return; }
    setBusy(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("contact_messages").insert({ name, email: email.toLowerCase(), phone, topic, message });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    track("contact_submit", { topic, has_phone: !!phone });
    setSent(true);
    toast.success("Message sent — we'll be in touch within 24h.");
    form.reset();
  }

  return (
    <div>
      {/* Hero */}
      <section className="container-x pt-16 pb-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">Get in touch</p>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-6xl">We'd love to hear from you.</h1>
            <p className="mt-6 max-w-lg text-muted-foreground">Whether you need design advice, an order update or just want to say hello — our team is a message away. Real humans. Fast replies. Zero call trees.</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Mon–Fri 9:00–18:00 GMT</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> London flagship open daily</span>
            </div>
          </div>
          <img src={showroom} alt="Estora London showroom" loading="eager" width={1600} height={1100} className="aspect-[4/3] w-full rounded-3xl object-cover" />
        </div>
      </section>

      {/* Channels */}
      <section className="container-x py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => (
            <a key={c.title} href={c.href} className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-extrabold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:underline">{c.action} →</span>
            </a>
          ))}
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="container-x py-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-border bg-background p-6 md:p-10">
            <h2 className="text-2xl font-extrabold md:text-3xl">Send us a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">We reply within one business day — usually much sooner.</p>

            {sent ? (
              <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl bg-surface py-14 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-extrabold">Thanks — message received!</h3>
                <p className="max-w-md text-sm text-muted-foreground">A member of our team will get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="mt-2 text-sm font-bold text-primary hover:underline">Send another →</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* Topic chips */}
                <div>
                  <label className="mb-3 block text-sm font-semibold">What can we help with?</label>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((t) => (
                      <button key={t} type="button" onClick={() => setTopic(t)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${topic === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field name="name" label="Your name" placeholder="ex: Julie Sample" required />
                  <Field name="email" type="email" label="Your email" placeholder="ex: julie@gmail.com" required />
                  <Field name="phone" type="tel" label="Your phone (optional)" placeholder="ex: +1 234 455 5564" />
                  <Field name="order" label="Order # (optional)" placeholder="ex: EST-10238" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Message</label>
                  <textarea name="message" required rows={6} placeholder="Tell us a bit about what you need…" className="w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <label className="flex items-start gap-3 text-xs text-muted-foreground">
                  <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  <span>I agree to Estora's <Link to="/" className="underline">privacy policy</Link> and consent to being contacted about my message.</span>
                </label>
                <button type="submit" className="btn-dark inline-flex items-center gap-2"><Send className="h-4 w-4" /> Send message</button>
              </form>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-surface p-8">
              <h3 className="text-lg font-extrabold">Working hours</h3>
              <p className="mt-2 border-b border-border pb-6 text-sm text-muted-foreground">Monday – Friday, 9:00am – 6:00pm GMT.<br />Weekend live chat 10am – 4pm.</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li className="flex gap-3"><Home className="h-5 w-5 shrink-0 text-primary" /> 17 Princess Road, London, Greater London NW1 8JR, UK</li>
                <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-primary" /> (800) 8001-8588 · (0600) 874 548</li>
                <li className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-primary" /> hello@estora.com</li>
              </ul>
              <div className="mt-6">
                <h4 className="mb-3 font-bold">Follow along</h4>
                <div className="flex gap-3">
                  {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                    <a key={i} href="#" aria-label="Social link" className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"><Icon className="h-4 w-4" /></a>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border p-8">
              <h3 className="text-lg font-extrabold">Quick help</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link to="/faqs" className="flex items-center justify-between gap-2 hover:text-primary"><span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" /> Browse FAQs</span> →</Link></li>
                <li><a href="#" className="flex items-center justify-between gap-2 hover:text-primary"><span className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Shipping & delivery</span> →</a></li>
                <li><a href="#" className="flex items-center justify-between gap-2 hover:text-primary"><span className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> Returns & refunds</span> →</a></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Locations */}
      <section className="bg-surface">
        <div className="container-x py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Visit us</p>
            <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">Three showrooms. All coffee included.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { city: "London", addr: "17 Princess Road, NW1 8JR", hrs: "Mon–Sun · 10am – 7pm" },
              { city: "New York", addr: "142 Grand Street, SoHo, NY", hrs: "Mon–Sat · 11am – 8pm" },
              { city: "Berlin", addr: "Torstraße 88, 10119 Berlin", hrs: "Tue–Sun · 11am – 7pm" },
            ].map((s) => (
              <div key={s.city} className="rounded-2xl bg-background p-6">
                <h3 className="text-xl font-extrabold">{s.city}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.addr}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hrs}</p>
                <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Get directions →</a>
              </div>
            ))}
          </div>
          {/* Map placeholder */}
          <div className="mt-10 overflow-hidden rounded-3xl border border-border">
            <iframe
              title="Estora London showroom map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-0.166%2C51.535%2C-0.152%2C51.545&layer=mapnik"
              className="h-[360px] w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Common questions</p>
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">Before you write…</h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-background p-5 open:shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-bold">{f.q}<span className="text-primary transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/faqs" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface">See all FAQs →</Link>
        </div>
      </section>
    </div>
  );
}

function Field({ label, placeholder, name, type = "text", required }: { label: string; placeholder: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
}
