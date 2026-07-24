import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, XCircle, CheckCircle2, Ban, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { can, usePermissions } from "@/lib/permissions";

type RefundRow = {
  id: string;
  order_id: string;
  user_id: string | null;
  request_type: "refund" | "cancellation";
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_by_admin: boolean;
  created_at: string;
};

type OrderLite = { id: string; order_number: string; total: number; email: string; status: string };

export const Route = createFileRoute("/_authenticated/admin/refunds")({
  component: RefundsAdmin,
});

function RefundsAdmin() {
  const perms = usePermissions();
  const allowed = can(perms, "refunds");
  const [rows, setRows] = useState<RefundRow[] | null>(null);
  const [orders, setOrders] = useState<Record<string, OrderLite>>({});
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [openNew, setOpenNew] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("refund_requests")
      .select("id, order_id, user_id, request_type, reason, status, admin_note, created_by_admin, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const list = (data ?? []) as RefundRow[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.order_id)));
    if (ids.length > 0) {
      const { data: os } = await supabase
        .from("orders")
        .select("id, order_number, total, email, status")
        .in("id", ids);
      const map: Record<string, OrderLite> = {};
      for (const o of (os ?? []) as OrderLite[]) map[o.id] = o;
      setOrders(map);
    }
  }
  useEffect(() => { if (allowed) load(); }, [allowed]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    let out = rows;
    if (statusFilter !== "all") out = out.filter((r) => r.status === statusFilter);
    const s = q.trim().toLowerCase();
    if (s) {
      out = out.filter((r) => {
        const o = orders[r.order_id];
        return (
          r.reason.toLowerCase().includes(s) ||
          (o?.order_number ?? "").toLowerCase().includes(s) ||
          (o?.email ?? "").toLowerCase().includes(s)
        );
      });
    }
    return out;
  }, [rows, statusFilter, q, orders]);

  async function decide(id: string, status: "approved" | "rejected", orderId: string, type: RefundRow["request_type"]) {
    const note = prompt(`Add a note for the customer (optional):`) ?? "";
    const { error } = await supabase.from("refund_requests").update({ status, admin_note: note }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (status === "approved") {
      const newStatus = type === "cancellation" ? "cancelled" : "refunded";
      await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    }
    toast.success(`Request ${status}`);
    load();
  }

  if (!perms.loading && !allowed) {
    return <p className="text-sm text-muted-foreground">You don't have permission to view refunds.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order # or reason" className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as never)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => setOpenNew(true)} className="ml-auto inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
          <Plus className="h-4 w-4" /> New request
        </button>
      </div>

      {!filtered && <p className="text-sm text-muted-foreground">Loading…</p>}
      {filtered && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No refund or cancellation requests match.
        </div>
      )}
      {filtered && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const o = orders[r.order_id];
                return (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{o?.order_number ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{o?.email ?? ""}</p>
                      {o && <p className="text-xs text-muted-foreground">${Number(o.total).toFixed(2)} · {o.status}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold capitalize">
                        {r.request_type === "cancellation" ? <XCircle className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
                        {r.request_type}
                      </span>
                      {r.created_by_admin && <p className="mt-1 text-[10px] uppercase text-muted-foreground">by admin</p>}
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="whitespace-pre-wrap">{r.reason || <span className="text-muted-foreground">—</span>}</p>
                      {r.admin_note && <p className="mt-1 rounded-lg bg-surface p-2 text-xs"><b>Note:</b> {r.admin_note}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "pending" ? "bg-yellow-100 text-yellow-900" :
                        r.status === "approved" ? "bg-emerald-100 text-emerald-900" :
                        "bg-red-100 text-red-900"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" && (
                        <div className="inline-flex gap-1">
                          <button onClick={() => decide(r.id, "approved", r.order_id, r.request_type)} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => decide(r.id, "rejected", r.order_id, r.request_type)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface">
                            <Ban className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {openNew && <NewRequestDialog onClose={() => setOpenNew(false)} onSaved={() => { setOpenNew(false); load(); }} />}
    </div>
  );
}

function NewRequestDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [type, setType] = useState<"refund" | "cancellation">("refund");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!orderNumber.trim()) { toast.error("Order number required"); return; }
    setSaving(true);
    const { data: o, error: oe } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("order_number", orderNumber.trim().toUpperCase())
      .maybeSingle();
    if (oe || !o) { toast.error("Order not found"); setSaving(false); return; }
    const { error } = await supabase.from("refund_requests").insert({
      order_id: o.id, user_id: o.user_id, request_type: type, reason, created_by_admin: true,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request created");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-black">New request</h2>
        <p className="text-sm text-muted-foreground">Open a refund or cancellation on behalf of a customer.</p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold">Order number</span>
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="EST-XXXXXXXXXX" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as never)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="refund">Refund</option>
              <option value="cancellation">Cancellation</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Reason</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50">
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
