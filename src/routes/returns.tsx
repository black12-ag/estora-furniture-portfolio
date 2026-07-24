import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw, ShieldCheck, Clock, Truck, PackageX, AlertTriangle, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/returns")({
  component: ReturnsPage,
  head: () => ({
    meta: [
      { title: "Returns & Refunds — Estora" },
      { name: "description", content: "Estora's 30-day return window, refund timing, and how to start a return or exchange." },
      { property: "og:title", content: "Returns & Refunds — Estora" },
      { property: "og:description", content: "Estora's 30-day return window, refund timing, and how to start a return or exchange." },
      { property: "og:url", content: "/returns" },
    ],
    links: [{ rel: "canonical", href: "/returns" }],
  }),
});

function ReturnsPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary"><RotateCcw className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Support</p>
            <h1 className="text-3xl font-black sm:text-4xl">Returns & Refunds</h1>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card icon={<Clock className="h-5 w-5" />} title="30-day window" body="Return most items within 30 days of delivery" />
          <Card icon={<ShieldCheck className="h-5 w-5" />} title="Free collection" body="We arrange courier pickup for large furniture" />
          <Card icon={<Truck className="h-5 w-5" />} title="Refund in 5–7 days" body="Once we've received & checked your item" />
          <Card icon={<PackageX className="h-5 w-5" />} title="Damaged on arrival?" body="Contact us within 48 hours for a full replacement" />
        </div>

        {/* How to return */}
        <h2 className="mt-12 text-xl font-extrabold">How to start a return</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          <Step n={1} title="Open your order" body={<>Go to <Link to="/account/orders" className="text-primary underline">My orders</Link> and pick the item.</>} />
          <Step n={2} title="Request a return" body={<>Tap "Request a refund" and pick a reason. We'll confirm by email within 1 business day.</>} />
          <Step n={3} title="Send it back" body={<>Keep the original packaging where possible. We'll arrange free collection for furniture.</>} />
        </ol>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed">
          <Block title="What can be returned">
            Most items in original condition — unused, with tags and packaging. Small assembly is fine.
          </Block>
          <Block title="Non-returnable">
            Custom or made-to-order pieces, mattresses that have been slept on, and gift cards are non-returnable unless faulty.
          </Block>
          <Block title="Refund timing & method">
            Because Estora currently doesn't collect online payment, refunds are processed as an order cancellation on your account within 24 hours of us receiving the item. If you paid on delivery, we'll refund the same way (bank transfer or cash) within 5–7 business days.
          </Block>
          <Block title="Exchanges">
            Prefer a different colour or size? Start a return, then place a fresh order — it's usually faster than swapping.
          </Block>
          <Block title="Damaged or defective">
            Message us within 48 hours of delivery with photos. We'll send a replacement at our cost — no need to return the damaged piece first.
          </Block>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-primary/10 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <p className="font-bold">Need help with a specific order?</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/account/orders" className="btn-dark">My orders</Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold hover:bg-accent">
              <MessageSquare className="h-4 w-4" /> Message support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">{icon}</span>
        <p className="font-extrabold">{title}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">{n}</span>
      <p className="mt-3 font-extrabold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </li>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </section>
  );
}
