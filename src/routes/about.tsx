import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, DollarSign, Headphones, Gift, Leaf, HeartHandshake, Sparkles, ShieldCheck, ArrowRight, Quote } from "lucide-react";
import sofa from "@/assets/about-sofa.jpg";
import studio from "@/assets/about-studio.jpg";
import craft from "@/assets/about-craft.jpg";
import ws1 from "@/assets/workspace-1.jpg";
import ws2 from "@/assets/workspace-2.jpg";
import t1 from "@/assets/team-1.jpg";
import t2 from "@/assets/team-2.jpg";
import t3 from "@/assets/team-3.jpg";
import t4 from "@/assets/team-4.jpg";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Estora — Our Story, Craft & People" },
      { name: "description", content: "Estora designs premium, honestly priced home furniture — made with independent workshops, sustainable materials, and a lifelong warranty." },
      { property: "og:title", content: "About Estora — Our Story, Craft & People" },
      { property: "og:description", content: "Meet the people, workshops and values behind every Estora piece." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const stats = [
  { k: "12+", v: "Years designing" },
  { k: "38", v: "Partner workshops" },
  { k: "120k", v: "Happy homes" },
  { k: "4.9/5", v: "Customer rating" },
];

const values = [
  { icon: Leaf, title: "Sustainable by default", copy: "FSC-certified timber, recycled fabrics and low-VOC finishes across every collection." },
  { icon: HeartHandshake, title: "Fair to makers", copy: "We buy direct and pay above market — because good design starts with people." },
  { icon: Sparkles, title: "Designed for real life", copy: "Sit-on-it, spill-on-it, live-on-it pieces built to look better with time." },
  { icon: ShieldCheck, title: "Backed for a decade", copy: "Every frame, joint and spring is protected by our 10-year quality promise." },
];

const team = [
  { img: t1, name: "Amelia Hart", role: "Design Director" },
  { img: t2, name: "Owen Marsh", role: "Head of Craft" },
  { img: t3, name: "Mei Tanaka", role: "Materials Lead" },
  { img: t4, name: "Jordan Blake", role: "Customer Care" },
];

const timeline = [
  { year: "2013", title: "A workshop in Lisbon", copy: "Two friends, one lathe, and a stubborn belief that great furniture shouldn't cost a house." },
  { year: "2016", title: "First online collection", copy: "We skipped the showroom and shipped straight from the makers to your door." },
  { year: "2019", title: "The maker network", copy: "Grew to 20 independent workshops across Portugal, Poland and Vietnam." },
  { year: "2023", title: "Circular by design", copy: "Launched take-back, repair and reupholstery for every sofa we've ever sold." },
  { year: "2026", title: "You, right now", copy: "120,000 homes furnished — and a whole lot more still to come." },
];

const perks = [
  { icon: Plane, title: "Free Delivery", sub: "On orders over $200" },
  { icon: DollarSign, title: "Money Back", sub: "Within 30 days" },
  { icon: Headphones, title: "Support 24/7", sub: "Real humans, always" },
  { icon: Gift, title: "Member Perks", sub: "Weekend gifts & drops" },
];

function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="container-x pt-16 pb-8">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">About Us</p>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-6xl">Furniture with a soul — and a story.</h1>
            <p className="mt-6 max-w-lg text-muted-foreground">Estora is a home for beautifully designed, honestly priced furniture. We work directly with independent makers to bring you modern, durable pieces without the showroom markup.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-dark inline-flex items-center gap-2">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/contact" className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface">Talk to us</Link>
            </div>
          </div>
          <img src={sofa} alt="Terracotta sofa in a bright living room" loading="eager" width={1200} height={1200} className="aspect-[4/3] w-full rounded-3xl object-cover" />
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-6 rounded-3xl bg-surface p-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v} className="text-center">
              <div className="text-3xl font-extrabold text-primary md:text-4xl">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="container-x py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <img src={studio} alt="Estora design studio" loading="lazy" width={1600} height={1000} className="aspect-[4/3] w-full rounded-3xl object-cover" />
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Our Story</p>
            <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">It started in a small Lisbon workshop.</h2>
            <p className="mt-5 text-muted-foreground">In 2013 we set out to prove that thoughtful furniture doesn't have to cost the earth — literally or financially. A decade later, Estora is a network of 38 independent workshops crafting pieces designed to be loved for generations, not seasons.</p>
            <p className="mt-4 text-muted-foreground">Every sofa is stitched by hand, every joint pinned with wood, every fabric chosen for how well it wears — because the best furniture is the kind you never have to replace.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface">
        <div className="container-x py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">What we stand for</p>
            <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">Four values, zero compromises.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-background p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><v.icon className="h-6 w-6" /></div>
                <h3 className="mt-5 text-lg font-extrabold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Craft */}
      <section className="container-x py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">The Craft</p>
            <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">Slow-made in independent workshops.</h2>
            <p className="mt-5 text-muted-foreground">We don't do factory lines. Every Estora piece is built by a small team of makers who know their material — from the grain of the oak to the weave of the linen — and sign their work when it's done.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Kiln-dried FSC hardwood frames","Hand-tied springs & feather-wrapped cushions","OEKO-TEX certified upholstery","10-year quality guarantee, no fine print"].map((l) => (
                <li key={l} className="flex items-start gap-3"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />{l}</li>
              ))}
            </ul>
          </div>
          <img src={craft} alt="Craftsman finishing a wooden chair leg" loading="lazy" width={1200} height={1400} className="order-1 aspect-[4/5] w-full rounded-3xl object-cover md:order-2" />
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-surface">
        <div className="container-x py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">The Journey</p>
            <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">A short history of Estora.</h2>
          </div>
          <ol className="relative mx-auto mt-12 max-w-3xl border-l-2 border-primary/20 pl-8">
            {timeline.map((t) => (
              <li key={t.year} className="mb-10 last:mb-0">
                <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-surface" />
                <div className="text-xs font-bold uppercase tracking-widest text-primary">{t.year}</div>
                <h3 className="mt-1 text-xl font-extrabold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team */}
      <section className="container-x py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">The People</p>
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">Say hi to the humans behind Estora.</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((p) => (
            <div key={p.name} className="group">
              <div className="overflow-hidden rounded-2xl bg-surface">
                <img src={p.img} alt={p.name} loading="lazy" width={800} height={1000} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-surface">
        <div className="container-x py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-10 w-10 text-primary" />
            <blockquote className="mt-6 text-2xl font-semibold leading-snug text-foreground md:text-3xl">
              "Three years in, our Estora sofa still looks like the day it arrived. The team even sent replacement feet when we moved. That's rare."
            </blockquote>
            <div className="mt-6 text-sm font-bold">Priya S. — verified customer, London</div>
          </div>
        </div>
      </section>

      {/* Workspaces + perks */}
      <section className="container-x py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <img src={ws1} alt="Workspace with wooden desk" loading="lazy" width={1000} height={1200} className="aspect-[4/5] w-full rounded-3xl object-cover" />
          <img src={ws2} alt="Bright white workspace" loading="lazy" width={1000} height={1200} className="aspect-[4/5] w-full rounded-3xl object-cover" />
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-border p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
              <div>
                <h4 className="text-sm font-bold">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-24">
        <div className="rounded-3xl bg-foreground px-8 py-16 text-center text-background md:px-16">
          <h2 className="text-3xl font-extrabold md:text-5xl">Ready to make it feel like home?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-80">Explore the new season, or drop us a line — we'll help you find the piece that fits.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90">Shop now</Link>
            <Link to="/contact" className="rounded-full border border-background/40 px-8 py-3 text-sm font-bold text-background transition hover:bg-background/10">Contact us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
