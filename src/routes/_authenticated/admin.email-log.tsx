import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, MinusCircle, Search, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { can, usePermissions } from "@/lib/permissions";

type Row = {
  id: string;
  user_id: string | null;
  kind: string;
  channel: "inapp" | "email";
  status: "queued" | "sent" | "failed" | "skipped";
  subject: string | null;
  from_addr: string | null;
  to_addr: string | null;
  body_preview: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  ref_table: string | null;
  ref_id: string | null;
};

const PAGE_SIZE = 25;

export const Route = createFileRoute("/_authenticated/admin/email-log")({
  component: EmailLog,
});

function EmailLog() {
  const perms = usePermissions();
  const allowed = can(perms, "refunds");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [orderMap, setOrderMap] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"all" | Row["status"]>("all");
  const [q, setQ] = useState("");
  const [orderQ, setOrderQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [resending, setResending] = useState<string | null>(null);

  const load = async () => {
    if (!allowed) return;
    const { data, error } = await supabase
      .from("notification_events")
      .select("*")
      .eq("channel", "email")
      .in("kind", ["refund_pending", "refund_approved", "refund_rejected", "cancellation_pending", "cancellation_approved", "cancellation_rejected"])
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) { toast.error(error.message); return; }
    const list = (data ?? []) as Row[];
    setRows(list);

    // Resolve refund_request ref_id -> order number
    const refIds = Array.from(new Set(list.map((r) => r.ref_id).filter(Boolean))) as string[];
    if (refIds.length) {
      const { data: rrs } = await supabase
        .from("refund_requests")
        .select("id, orders(order_number)")
        .in("id", refIds);
      const map: Record<string, string> = {};
      (rrs ?? []).forEach((r: any) => {
        if (r.orders?.order_number) map[r.id] = r.orders.order_number;
      });
      setOrderMap(map);
    }
  };

  useEffect(() => { load(); }, [allowed]);
  useEffect(() => { setPage(0); }, [status, q, orderQ, from, to]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const s = q.trim().toLowerCase();
    const oq = orderQ.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 24 * 3600 * 1000 : null;
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (s && !(r.subject ?? "").toLowerCase().includes(s) && !(r.to_addr ?? "").toLowerCase().includes(s)) return false;
      if (oq) {
        const ord = (r.ref_id && orderMap[r.ref_id]) || "";
        if (!ord.toLowerCase().includes(oq)) return false;
      }
      const ts = new Date(r.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      return true;
    });
  }, [rows, status, q, orderQ, from, to, orderMap]);

  const pageCount = filtered ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)) : 1;
  const pageRows = filtered ? filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : null;

  const resend = async (r: Row) => {
    setResending(r.id);
    const { error } = await supabase.from("notification_events").insert({
      user_id: r.user_id,
      kind: r.kind,
      ref_table: r.ref_table,
      ref_id: r.ref_id,
      channel: "email",
      status: "queued",
      subject: r.subject,
      from_addr: r.from_addr,
      to_addr: r.to_addr,
      body_preview: r.body_preview,
    });
    setResending(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Queued for resend");
    load();
  };

  if (!perms.loading && !allowed) {
    return <p className="text-sm text-muted-foreground">You don't have access to email delivery logs.</p>;
  }

  const counts = rows ? {
    sent: rows.filter((r) => r.status === "sent").length,
    queued: rows.filter((r) => r.status === "queued").length,
    failed: rows.filter((r) => r.status === "failed").length,
    skipped: rows.filter((r) => r.status === "skipped").length,
  } : null;

  const hasFilters = status !== "all" || q || orderQ || from || to;

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Refund & cancellation emails</h2>
        {counts && (
          <div className="ml-auto flex flex-wrap gap-2 text-xs">
            <Kpi label="Sent" value={counts.sent} />
            <Kpi label="Queued" value={counts.queued} />
            <Kpi label="Failed" value={counts.failed} tone="danger" />
            <Kpi label="Skipped" value={counts.skipped} tone="muted" />
          </div>
        )}
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Subject or recipient"
            className="rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm"
          />
        </div>
        <input
          value={orderQ}
          onChange={(e) => setOrderQ(e.target.value)}
          placeholder="Order number"
          className="rounded-full border border-border bg-background px-4 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | Row["status"])}
          className="rounded-full border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="queued">Queued</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
        <label className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent text-sm outline-none" />
        </label>
        <label className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-sm outline-none" />
        </label>
        {hasFilters && (
          <button
            onClick={() => { setStatus("all"); setQ(""); setOrderQ(""); setFrom(""); setTo(""); }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {!filtered && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {filtered && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                {rows && rows.length === 0
                  ? "No email events yet. Refund/cancellation activity will appear here."
                  : "No email events match these filters."}
              </td></tr>
            )}
            {pageRows?.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.subject ?? "(no subject)"}</div>
                  {r.error && <div className="mt-1 text-xs text-red-600">{r.error}</div>}
                  {r.body_preview && (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.body_preview}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-mono">
                  {(r.ref_id && orderMap[r.ref_id]) || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="text-muted-foreground text-xs">{r.from_addr ?? "—"}</div>
                  <div className="font-mono text-xs">{r.to_addr ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs">{r.kind}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div>{new Date(r.created_at).toLocaleString()}</div>
                  {r.sent_at && <div>sent {new Date(r.sent_at).toLocaleTimeString()}</div>}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "failed" ? (
                    <button
                      disabled={resending === r.id}
                      onClick={() => resend(r)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-surface disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${resending === r.id ? "animate-spin" : ""}`} />
                      Resend
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered && filtered.length > PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <span>Page {page + 1} of {pageCount}</span>
            <button
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "danger" | "muted" }) {
  const cls = tone === "danger" ? "bg-red-50 text-red-700 border-red-200"
    : tone === "muted" ? "bg-surface text-muted-foreground border-border"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return <span className={`rounded-full border px-2.5 py-1 font-semibold ${cls}`}>{label}: {value}</span>;
}

function StatusPill({ status }: { status: Row["status"] }) {
  const map = {
    sent: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700", label: "Sent" },
    queued: { icon: Clock, cls: "bg-amber-50 text-amber-700", label: "Queued" },
    failed: { icon: XCircle, cls: "bg-red-50 text-red-700", label: "Failed" },
    skipped: { icon: MinusCircle, cls: "bg-surface text-muted-foreground", label: "Skipped" },
  }[status];
  const Icon = map.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${map.cls}`}><Icon className="h-3 w-3" />{map.label}</span>;
}
