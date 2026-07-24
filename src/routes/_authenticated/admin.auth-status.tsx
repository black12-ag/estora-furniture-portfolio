import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Shield, RefreshCw, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/auth-status")({
  head: () => ({ meta: [{ title: "Auth & RLS status — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuthStatusPage,
});

type Check = { name: string; ok: boolean; detail?: string; policyHint?: string };

const POLICY_HINTS: Record<string, string> = {
  "products (public read)": "products: SELECT allowed to anon+authenticated for is_published rows.",
  "blog_posts (public read)": "blog_posts: SELECT allowed to anon+authenticated for published rows.",
  "orders (admin/self read)": "orders: SELECT allowed to owning user_id, and to admin/super_admin via has_role().",
  "profiles (self read)": "profiles: SELECT allowed to auth.uid() = id.",
  "contact_messages (admin only)": "contact_messages: SELECT restricted to admin/super_admin via has_role().",
  "notifications (self read)": "notifications: SELECT allowed to auth.uid() = user_id.",
  "user_roles (self read)": "user_roles: SELECT allowed to auth.uid() = user_id (own rows only).",
  "audit_logs (admin only)": "audit_logs: SELECT restricted to admin/super_admin via has_role().",
};

function Row({ c }: { c: Check }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      {c.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 text-red-600" />}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{c.name}</div>
        {c.detail && <div className="mt-0.5 text-xs text-muted-foreground break-words">{c.detail}</div>}
        {c.policyHint && <div className="mt-1 text-[11px] text-muted-foreground/80">Policy: {c.policyHint}</div>}
      </div>
    </div>
  );
}

function AuthStatusPage() {
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<Check[]>([]);
  const [rls, setRls] = useState<Check[]>([]);
  const [userInfo, setUserInfo] = useState<{ email?: string; id?: string } | null>(null);

  const run = async () => {
    setLoading(true);
    const identityChecks: Check[] = [];
    const rlsChecks: Check[] = [];

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData.user;
    setUserInfo(user ? { email: user.email ?? undefined, id: user.id } : null);
    identityChecks.push({
      name: "Signed-in user",
      ok: !!user && !userErr,
      detail: user ? `${user.email} · id ${user.id.slice(0, 8)}…` : userErr?.message ?? "Not signed in",
    });
    identityChecks.push({
      name: "Email verified",
      ok: !!user?.email_confirmed_at,
      detail: user?.email_confirmed_at ? `Confirmed ${new Date(user.email_confirmed_at).toLocaleString()}` : "Not verified — verify to unlock orders.",
    });

    if (user) {
      const [{ data: isAdmin }, { data: isSuper }, { data: roles }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" }),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      identityChecks.push({ name: "has_role(admin)", ok: !!isAdmin, detail: String(!!isAdmin) });
      identityChecks.push({ name: "has_role(super_admin)", ok: !!isSuper, detail: String(!!isSuper) });
      identityChecks.push({
        name: "user_roles rows",
        ok: (roles?.length ?? 0) > 0,
        detail: roles?.map((r) => r.role).join(", ") || "none",
      });

      const probe = async (fn: () => Promise<{ error: unknown; count: number | null }>) => {
        try { return await fn(); } catch (error) { return { error, count: null }; }
      };
      const probes: Array<[string, () => Promise<{ error: unknown; count: number | null }>]> = [
        ["products (public read)", async () => { const r = await supabase.from("products").select("id", { head: true, count: "exact" }); return { error: r.error, count: r.count }; }],
        ["blog_posts (public read)", async () => { const r = await supabase.from("blog_posts").select("id", { head: true, count: "exact" }); return { error: r.error, count: r.count }; }],
        ["orders (admin/self read)", async () => { const r = await supabase.from("orders").select("id", { head: true, count: "exact" }); return { error: r.error, count: r.count }; }],
        ["profiles (self read)", async () => { const r = await supabase.from("profiles").select("id", { head: true, count: "exact" }).eq("id", user.id); return { error: r.error, count: r.count }; }],
        ["contact_messages (admin only)", async () => { const r = await supabase.from("contact_messages").select("id", { head: true, count: "exact" }); return { error: r.error, count: r.count }; }],
        ["notifications (self read)", async () => { const r = await supabase.from("notifications").select("id", { head: true, count: "exact" }).eq("user_id", user.id); return { error: r.error, count: r.count }; }],
        ["user_roles (self read)", async () => { const r = await supabase.from("user_roles").select("id", { head: true, count: "exact" }).eq("user_id", user.id); return { error: r.error, count: r.count }; }],
        ["audit_logs (admin only)", async () => { const r = await supabase.from("audit_logs").select("id", { head: true, count: "exact" }); return { error: r.error, count: r.count }; }],
      ];
      const results = await Promise.all(probes.map(([, fn]) => probe(fn)));
      probes.forEach(([name], i) => {
        const { error, count } = results[i]!;
        rlsChecks.push({
          name,
          ok: !error,
          detail: error ? (error as { message?: string }).message ?? "blocked by RLS" : `${count ?? 0} row(s) visible`,
          policyHint: POLICY_HINTS[name],
        });
      });
    }

    setIdentity(identityChecks);
    setRls(rlsChecks);
    setLoading(false);
  };

  useEffect(() => { void run(); }, []);

  function downloadReport(format: "csv" | "json") {
    const generatedAt = new Date().toISOString();
    if (format === "json") {
      const payload = { generatedAt, user: userInfo, identity, rls };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      trigger(blob, `rls-probe-report-${generatedAt.slice(0, 10)}.json`);
      return;
    }
    const csv = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const lines = ["Section,Check,Status,Detail,Policy"];
    for (const c of identity) lines.push(["Identity", csv(c.name), c.ok ? "OK" : "FAIL", csv(c.detail ?? ""), ""].join(","));
    for (const c of rls) lines.push(["RLS", csv(c.name), c.ok ? "ALLOWED" : "BLOCKED", csv(c.detail ?? ""), csv(c.policyHint ?? "")].join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    trigger(blob, `rls-probe-report-${generatedAt.slice(0, 10)}.csv`);
  }
  function trigger(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-black">Auth &amp; RLS status</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={run} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
            <RefreshCw className="h-3 w-3" /> Re-run
          </button>
          <button onClick={() => downloadReport("csv")} disabled={loading} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:opacity-50">
            <Download className="h-3 w-3" /> CSV
          </button>
          <button onClick={() => downloadReport("json")} disabled={loading} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:opacity-50">
            <Download className="h-3 w-3" /> JSON
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Verifies your identity, role grants, and that Row Level Security is behaving as expected for key tables. Download a report to share with your team.
      </p>

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Running checks…</div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Identity &amp; roles</h3>
            <div className="space-y-2">{identity.map((c, i) => <Row key={i} c={c} />)}</div>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">RLS probes</h3>
            <div className="space-y-2">{rls.map((c, i) => <Row key={i} c={c} />)}</div>
            <p className="mt-3 text-xs text-muted-foreground">
              Green = policy allowed the read (0 rows is fine — it means RLS filtered). Red = query rejected by RLS or misconfiguration.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
