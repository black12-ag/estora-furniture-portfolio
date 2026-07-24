import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Download, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  order_number: string;
  email: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  method: string;
  promo: string | null;
  ship: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  created_at: string;
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

function OrdersAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from("orders")
      .select("id,order_number,email,subtotal,discount,shipping,tax,total,status,method,promo,ship,items,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const s = q.trim().toLowerCase();
    return rows.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!s) return true;
      return o.order_number.toLowerCase().includes(s) || o.email.toLowerCase().includes(s);
    });
  }, [rows, q, status]);

  async function setStatusFor(id: string, next: string) {
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); load(); }
  }

  function exportCsv() {
    if (!filtered) return;
    const header = ["order_number", "email", "created_at", "status", "method", "subtotal", "discount", "shipping", "tax", "total", "promo"];
    const lines = [header.join(",")];
    for (const o of filtered) {
      lines.push(header.map((k) => JSON.stringify((o as unknown as Record<string, unknown>)[k] ?? "")).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order # or email" className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered?.length ?? 0} of {rows.length} orders</p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.length === 0 && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No orders match.</td></tr>}
            {filtered?.map((o) => (
              <>
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="rounded p-1 hover:bg-surface" aria-label="Expand">
                      {openId === o.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">{o.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold">${Number(o.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => setStatusFor(o.id, e.target.value)} className="rounded-full border border-border bg-background px-3 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
                {openId === o.id && (
                  <tr key={o.id + "-d"} className="border-t border-border bg-surface/30">
                    <td></td>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Items</h4>
                          <ul className="mt-2 space-y-1">
                            {(o.items ?? []).map((it, i) => (
                              <li key={i} className="flex justify-between gap-4 text-sm">
                                <span>{String(it.name ?? "Item")} × {Number(it.quantity ?? it.qty ?? 1)}</span>
                                <span className="font-mono">${(Number(it.price ?? 0) * Number(it.quantity ?? it.qty ?? 1)).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>${Number(o.subtotal).toFixed(2)}</dd></div>
                            {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount {o.promo && `(${o.promo})`}</dt><dd>−${Number(o.discount).toFixed(2)}</dd></div>}
                            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>${Number(o.shipping).toFixed(2)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>${Number(o.tax).toFixed(2)}</dd></div>
                            <div className="flex justify-between font-bold"><dt>Total</dt><dd>${Number(o.total).toFixed(2)}</dd></div>
                            <div className="flex justify-between text-xs text-muted-foreground pt-1"><dt>Order handling</dt><dd>{o.method === "pay_later" ? "No online payment" : o.method}</dd></div>
                          </dl>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Shipping to</h4>
                          <address className="mt-2 not-italic text-sm">
                            {Object.entries(o.ship ?? {}).map(([k, v]) => (
                              <div key={k}><span className="text-muted-foreground">{k}:</span> {String(v)}</div>
                            ))}
                          </address>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
