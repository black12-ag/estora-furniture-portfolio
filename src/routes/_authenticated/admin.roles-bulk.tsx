import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, Play, AlertTriangle, CheckCircle2, XCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, ADMIN_RESOURCES, type AdminResource } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/roles-bulk")({
  head: () => ({ meta: [{ title: "Bulk role import — Admin" }, { name: "robots", content: "noindex" }] }),
  component: BulkRolesPage,
});

type Action = "grant" | "revoke";
type ParsedRow = {
  line: number;
  email: string;
  role: "customer" | "admin" | "super_admin" | "";
  action: Action;
  permissions: AdminResource[];
  userId: string | null; // resolved after lookup
  error: string | null;
  applied?: "ok" | "failed";
  applyError?: string;
};

const RESOURCE_KEYS = new Set<string>(ADMIN_RESOURCES.map((r) => r.key));

function parseCsv(text: string): ParsedRow[] {
  // Very small CSV parser: supports "quoted, with commas". Assumes UTF-8.
  const rows: string[][] = [];
  let field = ""; let row: string[] = []; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some((v) => v.trim())) rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if (field || row.length) { row.push(field); if (row.some((v) => v.trim())) rows.push(row); }
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iEmail = header.indexOf("email");
  const iRole = header.indexOf("role");
  const iAction = header.indexOf("action");
  const iPerms = header.indexOf("permissions");
  if (iEmail === -1) return [{ line: 1, email: "", role: "", action: "grant", permissions: [], userId: null, error: "Missing 'email' column" }];

  const out: ParsedRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const raw = rows[r];
    const email = (raw[iEmail] ?? "").trim().toLowerCase();
    const role = ((raw[iRole] ?? "").trim().toLowerCase() || "") as ParsedRow["role"];
    const actionRaw = ((raw[iAction] ?? "grant").trim().toLowerCase() || "grant") as Action;
    const action: Action = actionRaw === "revoke" ? "revoke" : "grant";
    const permStr = iPerms >= 0 ? (raw[iPerms] ?? "").trim() : "";
    const permissions = permStr
      ? permStr.split(/[|;,]/).map((p) => p.trim()).filter((p) => RESOURCE_KEYS.has(p)) as AdminResource[]
      : [];
    const errs: string[] = [];
    if (!email || !/@/.test(email)) errs.push("invalid email");
    if (role && !["customer", "admin", "super_admin"].includes(role)) errs.push(`invalid role "${role}"`);
    if (permissions.length > 0 && role !== "admin") errs.push("permissions require role=admin");
    out.push({ line: r + 1, email, role, action, permissions, userId: null, error: errs.length ? errs.join(", ") : null });
  }
  return out;
}

function BulkRolesPage() {
  const perms = usePermissions();
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [resolved, setResolved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const summary = useMemo(() => {
    if (!rows) return null;
    const bad = rows.filter((r) => r.error || (resolved && !r.userId));
    const ok = rows.filter((r) => !r.error && (!resolved || r.userId));
    const grants = ok.filter((r) => r.action === "grant").length;
    const revokes = ok.filter((r) => r.action === "revoke").length;
    return { total: rows.length, ok: ok.length, bad: bad.length, grants, revokes };
  }, [rows, resolved]);

  async function onFile(file: File) {
    setApplied(false); setResolved(false);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) { toast.error("CSV is empty."); return; }
    setRows(parsed);
    // Resolve emails -> profile ids
    const emails = Array.from(new Set(parsed.filter((r) => !r.error).map((r) => r.email)));
    if (emails.length === 0) { setResolved(true); return; }
    const { data: profiles, error } = await supabase.from("profiles").select("id,email").in("email", emails);
    if (error) { toast.error(error.message); return; }
    const map = new Map<string, string>();
    for (const p of profiles ?? []) if (p.email) map.set(p.email.toLowerCase(), p.id);
    setRows((prev) => prev?.map((r) => ({ ...r, userId: map.get(r.email) ?? null, error: r.error ?? (!map.has(r.email) ? "no account with this email" : null) })) ?? null);
    setResolved(true);
  }

  async function apply() {
    if (!rows) return;
    if (!confirm(`Apply changes to ${summary?.ok ?? 0} user(s)? Rows with errors will be skipped.`)) return;
    setApplying(true);
    const updated: ParsedRow[] = [...rows];
    for (let i = 0; i < updated.length; i++) {
      const r = updated[i];
      if (r.error || !r.userId) continue;
      try {
        if (r.role) {
          if (r.action === "grant") {
            await supabase.from("user_roles").upsert(
              { user_id: r.userId, role: r.role },
              { onConflict: "user_id,role" },
            );
          } else {
            await supabase.from("user_roles").delete().eq("user_id", r.userId).eq("role", r.role);
          }
        }
        if (r.role === "admin" && r.permissions.length > 0 && r.action === "grant") {
          // Replace admin's permission set to exactly the given list.
          await supabase.from("admin_permissions").delete().eq("user_id", r.userId);
          await supabase.from("admin_permissions").insert(r.permissions.map((res) => ({ user_id: r.userId!, resource: res })));
        }
        updated[i] = { ...r, applied: "ok" };
      } catch (e) {
        updated[i] = { ...r, applied: "failed", applyError: e instanceof Error ? e.message : String(e) };
      }
      setRows([...updated]);
    }
    setApplying(false); setApplied(true);
    const okCount = updated.filter((r) => r.applied === "ok").length;
    const failCount = updated.filter((r) => r.applied === "failed").length;
    if (failCount) toast.error(`${okCount} applied, ${failCount} failed.`);
    else toast.success(`Applied ${okCount} change(s).`);
  }

  function downloadTemplate() {
    const csv = "email,role,action,permissions\nsomeone@example.com,admin,grant,orders|refunds\nhelper@example.com,admin,revoke,\ncustomer@example.com,customer,grant,\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roles-template.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  if (perms.loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!perms.isSuperAdmin) return <p className="text-sm text-muted-foreground">Only super admins can bulk-import roles.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-black">Bulk role import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV with columns: <code>email,role,action,permissions</code>. Action is <code>grant</code> or <code>revoke</code>.
          Permissions are pipe- or comma-separated resource keys and apply only when granting the admin role.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">
            <Upload className="h-4 w-4" /> Choose CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) void onFile(f); e.currentTarget.value = ""; }} />
          </label>
          <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">
            <FileText className="h-4 w-4" /> Download template
          </button>
        </div>
      </div>

      {rows && summary && (
        <>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <Metric label="Rows" value={summary.total} />
            <Metric label="Ready to apply" value={summary.ok} tone="ok" />
            <Metric label="Grants / revokes" value={`${summary.grants} / ${summary.revokes}`} />
            <Metric label="Skipped" value={summary.bad} tone={summary.bad ? "warn" : undefined} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-3 py-2">Line</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Permissions</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className={`border-t border-border ${r.error ? "bg-red-50/40" : ""}`}>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.line}</td>
                    <td className="px-3 py-2">{r.email || <em className="text-muted-foreground">—</em>}</td>
                    <td className="px-3 py-2">{r.role || <em className="text-muted-foreground">—</em>}</td>
                    <td className="px-3 py-2 capitalize">{r.action}</td>
                    <td className="px-3 py-2 text-xs">{r.permissions.join(", ") || <em className="text-muted-foreground">—</em>}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.applied === "ok" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Applied</span> :
                       r.applied === "failed" ? <span className="inline-flex items-center gap-1 text-red-700"><XCircle className="h-3.5 w-3.5" /> {r.applyError}</span> :
                       r.error ? <span className="inline-flex items-center gap-1 text-red-700"><AlertTriangle className="h-3.5 w-3.5" /> {r.error}</span> :
                       resolved ? <span className="text-emerald-700">Ready</span> :
                       <span className="text-muted-foreground">Resolving…</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Review carefully. Applying replaces the permission set for each admin row that includes permissions.
            </p>
            <button
              onClick={apply}
              disabled={applying || applied || !resolved || (summary?.ok ?? 0) === 0}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {applying ? "Applying…" : applied ? "Applied" : `Apply ${summary.ok} change(s)`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" }) {
  const cls = tone === "ok" ? "bg-emerald-50 text-emerald-900"
           : tone === "warn" ? "bg-yellow-50 text-yellow-900"
           : "bg-surface";
  return (
    <div className={`rounded-2xl border border-border p-3 ${cls}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
