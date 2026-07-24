import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DollarSign, ShoppingBag, Users, MessageSquare, Star, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OrderLite = { id: string; order_number: string; email: string; total: number; status: string; created_at: string; items: unknown };
type ProductLite = { id: string; name: string; slug: string; stock: number; price: number; image: string };

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

function Overview() {
  const [orders, setOrders] = useState<OrderLite[] | null>(null);
  const [products, setProducts] = useState<ProductLite[] | null>(null);
  const [counts, setCounts] = useState<{ subs: number; msgs: number; reviews: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [o, p, s, m, r] = await Promise.all([
        supabase.from("orders").select("id,order_number,email,total,status,created_at,items").order("created_at", { ascending: false }).limit(200),
        supabase.from("products").select("id,name,slug,stock,price,image").order("stock", { ascending: true }).limit(200),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }),
      ]);
      setOrders((o.data ?? []) as OrderLite[]);
      setProducts((p.data ?? []) as ProductLite[]);
      setCounts({ subs: s.count ?? 0, msgs: m.count ?? 0, reviews: r.count ?? 0 });
    })();
  }, []);

  const stats = useMemo(() => {
    if (!orders) return null;
    const now = Date.now();
    const day = 86_400_000;
    const rev = orders.reduce((a, o) => a + Number(o.total || 0), 0);
    const rev30 = orders.filter((o) => now - new Date(o.created_at).getTime() < 30 * day).reduce((a, o) => a + Number(o.total || 0), 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    return { rev, rev30, pending, aov: orders.length ? rev / orders.length : 0 };
  }, [orders]);

  const topProducts = useMemo(() => {
    if (!orders) return [];
    const map = new Map<string, { name: string; qty: number; revenue: number; slug?: string }>();
    for (const o of orders) {
      const items = Array.isArray(o.items) ? (o.items as Array<Record<string, unknown>>) : [];
      for (const it of items) {
        const key = String(it.slug ?? it.id ?? it.name ?? "?");
        const name = String(it.name ?? key);
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const price = Number(it.price ?? 0);
        const cur = map.get(key) ?? { name, qty: 0, revenue: 0, slug: it.slug as string | undefined };
        cur.qty += qty;
        cur.revenue += qty * price;
        map.set(key, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const lowStock = useMemo(() => (products ?? []).filter((p) => p.stock <= 5).slice(0, 6), [products]);

  const cards = [
    { label: "Revenue (all time)", value: stats ? `$${stats.rev.toFixed(0)}` : "—", icon: DollarSign },
    { label: "Revenue (30d)", value: stats ? `$${stats.rev30.toFixed(0)}` : "—", icon: TrendingUp },
    { label: "Orders", value: orders?.length ?? "—", icon: ShoppingBag },
    { label: "Avg. order", value: stats ? `$${stats.aov.toFixed(0)}` : "—", icon: DollarSign },
    { label: "Pending orders", value: stats?.pending ?? "—", icon: AlertTriangle },
    { label: "Subscribers", value: counts?.subs ?? "—", icon: Users },
    { label: "Messages", value: counts?.msgs ?? "—", icon: MessageSquare },
    { label: "Reviews", value: counts?.reviews ?? "—", icon: Star },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-black">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-muted-foreground hover:text-foreground">View all →</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="pb-2">Order</th><th className="pb-2">Email</th><th className="pb-2">Total</th><th className="pb-2">Status</th></tr>
              </thead>
              <tbody>
                {(orders ?? []).slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="py-2 font-mono text-xs">{o.order_number}</td>
                    <td className="py-2">{o.email}</td>
                    <td className="py-2 font-bold">${Number(o.total).toFixed(0)}</td>
                    <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(o.status)}`}>{o.status}</span></td>
                  </tr>
                ))}
                {orders && orders.length === 0 && <tr><td className="py-4 text-muted-foreground" colSpan={4}>No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Low stock</h2>
            <Link to="/admin/products" className="text-xs font-semibold text-muted-foreground hover:text-foreground">Manage →</Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {lowStock.length === 0 && <li className="py-3 text-sm text-muted-foreground">All products well stocked ✨</li>}
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                {p.image && <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">${Number(p.price).toFixed(0)}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200"}`}>{p.stock}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-black">Top sellers</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="pb-2">Product</th><th className="pb-2">Units sold</th><th className="pb-2">Revenue</th></tr>
            </thead>
            <tbody>
              {topProducts.length === 0 && <tr><td className="py-4 text-muted-foreground" colSpan={3}>No sales data yet.</td></tr>}
              {topProducts.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="py-2 font-semibold">{p.slug ? <Link to="/product/$slug" params={{ slug: p.slug }} className="hover:underline">{p.name}</Link> : p.name}</td>
                  <td className="py-2">{p.qty}</td>
                  <td className="py-2 font-bold">${p.revenue.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function statusClasses(s: string) {
  switch (s) {
    case "paid": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200";
    case "shipped": return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200";
    case "delivered": return "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200";
    case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200";
    default: return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200";
  }
}
