import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Wallet, Clock, Mail, Package } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  component: SuccessPage,
  head: () => ({
    meta: [
      { title: "Order Confirmed — Estora" },
      { name: "description", content: "Thanks for your order! Your Estora order is pending confirmation." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Order = {
  id: string;
  total: number;
  ship: { name: string; email: string };
  method?: string;
  payment?: { brand: string; last4: string } | null;
} | null;

function SuccessPage() {
  const [order, setOrder] = useState<Order>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("estora.lastOrder");
      if (raw) setOrder(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const isCard = order?.method?.startsWith("card_");
  const isCod = order?.method === "cash_on_delivery";

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="h-14 w-14" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">Order received!</h1>
        <p className="mt-3 text-muted-foreground">
          {order ? (
            <>Thanks{order.ship.name ? `, ${order.ship.name.split(" ")[0]}` : ""}! Your order is safe with us and pending confirmation.</>
          ) : (
            <>Your order was received and is pending confirmation.</>
          )}
        </p>

        {order && (
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-left shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order number</p>
                <p className="mt-0.5 text-lg font-extrabold">#{order.id}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                <Clock className="h-3.5 w-3.5" /> Pending review
              </span>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total</dt>
                <dd className="mt-1 text-xl font-extrabold">${order.total.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment</dt>
                <dd className="mt-1 inline-flex items-center gap-2 text-sm font-semibold">
                  {isCard ? (
                    <>
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="capitalize">{order.payment?.brand ?? "Card"}</span>
                      <span className="font-mono text-muted-foreground">•••• {order.payment?.last4 ?? "****"}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Test approved</span>
                    </>
                  ) : isCod ? (
                    <><Wallet className="h-4 w-4 text-primary" /> Cash on delivery</>
                  ) : (
                    <><Wallet className="h-4 w-4 text-primary" /> Pay later</>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Confirmation sent to</dt>
                <dd className="mt-1 inline-flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {order.ship.email}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl bg-surface/60 p-4 text-xs text-muted-foreground">
              <p className="inline-flex items-center gap-2 font-semibold text-foreground"><Package className="h-4 w-4 text-primary" /> What happens next?</p>
              <p className="mt-1">Our team will review and confirm your order shortly. You'll receive an update via email — and you can track progress anytime in your account.</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/account/orders" className="btn-dark">View my orders</Link>
          <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          <Link to="/" className="rounded-full border border-border px-6 py-3 font-bold hover:bg-accent">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
