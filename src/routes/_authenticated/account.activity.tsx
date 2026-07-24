import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Mail, CheckCircle2, XCircle, Clock, MinusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  kind: string;
  channel: "inapp" | "email";
  status: "queued" | "sent" | "failed" | "skipped";
  subject: string | null;
  body_preview: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  ref_id: string | null;
};

type ChannelFilter = "all" | "inapp" | "email";
type ActionFilter = "all" | "refund" | "cancellation";

export const Route = createFileRoute("/_authenticated/account/activity")({
  component: ActivityPage,
  head: () => ({
    meta: [
      { title: "Notification activity · estora" },
      { name: "description", content: "See every refund and cancellation update sent to you." },
    ],
  }),
});

function ActivityPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [action, setAction] = useState<ActionFilter>("all");

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) { setRows([]); return; }
      const { data } = await supabase
        .from("notification_events")
        .select("id,kind,channel,status,subject,body_preview,error,sent_at,created_at,ref_id")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    return rows.filter((r) => {
      if (channel !== "all" && r.channel !== channel) return false;
      if (action === "refund" && !r.kind.startsWith("refund")) return false;
      if (action === "cancellation" && !r.kind.startsWith("cancellation")) return false;
      return true;
    });
  }, [rows, channel, action]);

  const counts = useMemo(() => {
    if (!rows) return null;
    return {
      total: rows.length,
      inapp: rows.filter((r) => r.channel === "inapp").length,
      email: rows.filter((r) => r.channel === "email").length,
      refund: rows.filter((r) => r.kind.startsWith("refund")).length,
      cancellation: rows.filter((r) => r.kind.startsWith("cancellation")).length,
    };
  }, [rows]);

  return (
    <div className="container-x py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
          <h1 className="text-3xl font-black">Notification activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every refund and cancellation update we sent, in-app or by email.
          </p>
        </div>
        <Link to={"/account/notifications" as never} className="rounded-full border border-border px-4 py-2 text-sm">
          Preferences
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
          {(["all", "inapp", "email"] as ChannelFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
                channel === c ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface"
              }`}
            >
              {c === "inapp" && <Bell className="h-3 w-3" />}
              {c === "email" && <Mail className="h-3 w-3" />}
              {c === "all" ? "All channels" : c === "inapp" ? "In-app" : "Email"}
              {counts && c !== "all" && (
                <span className="opacity-70">· {c === "inapp" ? counts.inapp : counts.email}</span>
              )}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
          {(["all", "refund", "cancellation"] as ActionFilter[]).map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`rounded-full px-3 py-1.5 ${
                action === a ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface"
              }`}
            >
              {a === "all" ? "All actions" : a === "refund" ? "Refunds" : "Cancellations"}
              {counts && a !== "all" && (
                <span className="opacity-70"> · {a === "refund" ? counts.refund : counts.cancellation}</span>
              )}
            </button>
          ))}
        </div>
        {(channel !== "all" || action !== "all") && (
          <button
            onClick={() => { setChannel("all"); setAction("all"); }}
            className="text-xs font-semibold text-muted-foreground underline"
          >
            Clear filters
          </button>
        )}
        {filtered && <span className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</span>}
      </div>

      {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
      {filtered && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {rows && rows.length === 0
            ? "No notifications yet. When there's an update on a refund or cancellation, you'll see it here."
            : "No notifications match these filters."}
        </div>
      )}

      <ul className="space-y-2">
        {filtered?.map((r) => (
          <li key={r.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface">
              {r.channel === "email" ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.subject ?? r.kind}</p>
                <StatusPill status={r.status} channel={r.channel} />
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              {r.body_preview && <p className="mt-1 text-sm text-muted-foreground">{r.body_preview}</p>}
              {r.error && <p className="mt-1 text-xs text-red-600">Delivery note: {r.error}</p>}
              {r.ref_id && (
                <Link to={"/account/orders/$id" as never} params={{ id: r.ref_id } as never} className="mt-2 inline-block text-xs font-semibold underline">
                  View order
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({ status, channel }: { status: Row["status"]; channel: Row["channel"] }) {
  const map = {
    sent: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700", label: channel === "email" ? "Email sent" : "Shown in app" },
    queued: { icon: Clock, cls: "bg-amber-50 text-amber-700", label: "Email queued" },
    failed: { icon: XCircle, cls: "bg-red-50 text-red-700", label: "Email failed" },
    skipped: { icon: MinusCircle, cls: "bg-surface text-muted-foreground", label: channel === "email" ? "Email skipped" : "In-app off" },
  }[status];
  const Icon = map.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${map.cls}`}><Icon className="h-3 w-3" />{map.label}</span>;
}
