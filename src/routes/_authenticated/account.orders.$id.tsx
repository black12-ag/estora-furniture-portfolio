import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, XCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrderStatusTimeline, StatusBadge } from "@/components/OrderStatusTimeline";

type OrderDetail = {
  id: string;
  order_number: string;
  email: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  status: string;
  method: string;
  created_at: string;
  updated_at: string;
  items: Array<{ name?: string; quantity?: number; qty?: number; price?: number; image?: string; size?: string; color?: string }>;
  ship: { name?: string; address?: string; city?: string; zip?: string; country?: string } | null;
};

type Refund = {
  id: string;
  request_type: "refund" | "cancellation";
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/account/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = useParams({ from: "/_authenticated/account/orders/$id" });
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<Refund[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [type, setType] = useState<"refund" | "cancellation">("refund");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, email, total, subtotal, discount, shipping, tax, status, method, created_at, updated_at, items, ship")
      .eq("id", id)
      .maybeSingle();
    if (error) { setError(error.message); return; }
    if (!data) { setError("Order not found."); return; }
    setOrder(data as OrderDetail);
    const { data: rr } = await supabase
      .from("refund_requests")
      .select("id, request_type, reason, status, admin_note, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false });
    setRequests((rr ?? []) as Refund[]);
  }
  useEffect(() => { load(); }, [id]);

  async function submit() {
    if (!order) return;
    if (!reason.trim()) { toast.error("Please tell us why."); return; }
    setSubmitting(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    const { error } = await supabase.from("refund_requests").insert({
      order_id: order.id, user_id: uid, request_type: type, reason,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request submitted — we'll get back to you shortly.");
    setOpenForm(false); setReason("");
    load();
  }

  if (error) {
    return (
      <div className="container-x py-10">
        <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="mt-6 rounded-2xl bg-sale/10 p-4 text-sm text-sale">{error}</p>
      </div>
    );
  }
  if (!order) return <div className="container-x py-10"><div className="h-40 animate-pulse rounded-2xl bg-muted" /></div>;

  const hasOpen = requests.some((r) => r.status === "pending");
  const canRequest = order.status !== "cancelled" && order.status !== "refunded" && !hasOpen;

  return (
    <div className="container-x py-10">
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{order.order_number}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</span>
          </div>
        </div>
        <p className="text-3xl font-black">${Number(order.total).toFixed(2)}</p>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 animate-fade-in">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Order status</h2>
        <div className="mt-4">
          <OrderStatusTimeline status={order.status} createdAt={order.created_at} updatedAt={order.updated_at} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Items</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center gap-4 p-4">
                {it.image && <img src={it.image} alt="" className="h-16 w-16 rounded-xl object-cover" />}
                <div className="flex-1">
                  <p className="font-semibold">{it.name ?? "Item"}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {it.quantity ?? it.qty ?? 1}{it.size ? ` · ${it.size}` : ""}{it.color ? ` · ${it.color}` : ""}
                  </p>
                </div>
                <p className="font-bold">${Number(it.price ?? 0).toFixed(2)}</p>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <Row k="Subtotal" v={order.subtotal} />
            {order.discount > 0 && <Row k="Discount" v={-order.discount} />}
            <Row k="Shipping" v={order.shipping} />
            <Row k="Tax" v={order.tax} />
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-black"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
          </div>
        </section>

        <aside className="space-y-4">
          {order.ship && (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              <h3 className="font-bold">Shipping</h3>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">
                {[order.ship.name, order.ship.address, [order.ship.city, order.ship.zip].filter(Boolean).join(" "), order.ship.country].filter(Boolean).join("\n")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Order handling: {order.method === "pay_later" ? "No online payment" : order.method}</p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-bold">Need help with this order?</h3>
            {canRequest ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">Request a refund or cancel this order and we'll review it.</p>
                {!openForm && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => { setType("refund"); setOpenForm(true); }} className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
                      <RotateCcw className="h-4 w-4" /> Request refund
                    </button>
                    <button onClick={() => { setType("cancellation"); setOpenForm(true); }} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">
                      <XCircle className="h-4 w-4" /> Cancel order
                    </button>
                  </div>
                )}
                {openForm && (
                  <div className="mt-3 space-y-2">
                    <select value={type} onChange={(e) => setType(e.target.value as never)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="refund">Refund</option>
                      <option value="cancellation">Cancellation</option>
                    </select>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Tell us what happened…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setOpenForm(false)} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
                      <button disabled={submitting} onClick={submit} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50">
                        {submitting ? "Submitting…" : "Submit request"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                {hasOpen ? "A request is already pending review." : "This order is closed and can't be changed."}
              </p>
            )}
          </div>

          {requests.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-bold">Your requests</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {requests.map((r) => (
                  <li key={r.id} className="rounded-xl bg-surface p-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize">
                        {r.request_type === "cancellation" ? <XCircle className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
                        {r.request_type}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === "pending" ? "bg-yellow-100 text-yellow-900" :
                        r.status === "approved" ? "bg-emerald-100 text-emerald-900" :
                        "bg-red-100 text-red-900"
                      }`}>
                        {r.status === "pending" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </div>
                    {r.reason && <p className="mt-1 text-xs text-muted-foreground">"{r.reason}"</p>}
                    {r.admin_note && <p className="mt-1 text-xs"><b>Reply:</b> {r.admin_note}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{k}</span>
      <span>${Number(v).toFixed(2)}</span>
    </div>
  );
}
