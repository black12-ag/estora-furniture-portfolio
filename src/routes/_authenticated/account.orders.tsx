import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/OrderStatusTimeline";

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: Array<{ name?: string; quantity?: number; qty?: number }>;
};

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Estora" },
      { name: "description", content: "Review your Estora orders and delivery status." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, updated_at, items")
        .order("created_at", { ascending: false });
      if (error) { setError(error.message); return; }
      setOrders((data ?? []) as OrderRow[]);
    })();
  }, []);

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-black">My orders</h1>
      <p className="mt-1 text-muted-foreground">All the pieces you've brought home. Tap any order to request a refund or cancellation.</p>

      {error && <p className="mt-6 rounded-2xl bg-sale/10 p-4 text-sm text-sale">{error}</p>}

      {orders === null && !error && (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-10 grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-lg font-semibold">No orders yet</p>
          <p className="text-sm text-muted-foreground">When you place an order it will appear here.</p>
          <Link to="/shop" className="btn-primary mt-2">Start shopping</Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => {
            const itemCount = (o.items || []).reduce((n, it) => n + (Number(it.quantity ?? it.qty ?? 1) || 1), 0);
            return (
              <li key={o.id}>
                <Link
                  to="/account/orders/$id"
                  params={{ id: o.id }}
                  className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-foreground hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{o.order_number}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Placed {new Date(o.created_at).toLocaleString()} · {itemCount} item{itemCount === 1 ? "" : "s"}
                    </p>
                    {o.updated_at && o.updated_at !== o.created_at && (
                      <p className="text-[11px] text-muted-foreground">
                        Updated {new Date(o.updated_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-black">${Number(o.total).toFixed(2)}</p>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
