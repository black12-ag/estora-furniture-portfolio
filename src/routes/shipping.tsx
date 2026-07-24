import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, Package, Globe2, Clock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — Estora" },
      { name: "description", content: "Delivery times, rates, and international shipping information for Estora orders." },
      { property: "og:title", content: "Shipping & Delivery — Estora" },
      { property: "og:description", content: "Delivery times, rates, and international shipping information for Estora orders." },
    ],
  }),
});

function ShippingPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary"><Truck className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Support</p>
            <h1 className="text-3xl font-black sm:text-4xl">Shipping & Delivery</h1>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card icon={<Package className="h-5 w-5" />} title="Standard delivery" body="3–5 business days · $12 flat · Free over $200" />
          <Card icon={<Clock className="h-5 w-5" />} title="Express delivery" body="1–2 business days · $28 · Order by 2pm" />
          <Card icon={<Globe2 className="h-5 w-5" />} title="International" body="7–14 business days · Rate calculated at checkout" />
          <Card icon={<RefreshCw className="h-5 w-5" />} title="Returns" body="30-day free returns on furniture · Contact us to arrange collection" />
        </div>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed">
          <Block title="Processing time">
            Orders are prepared within 24 hours of confirmation. Large furniture pieces may take up to 3 business days for careful packing.
          </Block>
          <Block title="Tracking">
            You'll receive a tracking link by email as soon as your order leaves our workshop. Signed-in customers can also track from <Link to="/account/orders" className="text-primary underline">My orders</Link>.
          </Block>
          <Block title="White-glove delivery">
            Included on all seating, bedroom and cabinetry orders — our team will unpack, assemble, and remove packaging on arrival.
          </Block>
          <Block title="Questions?">
            Reach out via <Link to="/contact" className="text-primary underline">Contact</Link> or check the <Link to="/faqs" className="text-primary underline">FAQs</Link>.
          </Block>
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

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </section>
  );
}
