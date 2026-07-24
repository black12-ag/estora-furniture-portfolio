import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Filter, ChevronDown, ChevronRight, Download, Search, X, Cloud, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { can, usePermissions } from "@/lib/permissions";
import { startAuditExport, listAuditExports, refreshExportUrl } from "@/lib/audit-export.functions";

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  table_name: string;
  record_id: string | null;
  action: "create" | "update" | "delete";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

const TABLES = [
  "all", "products", "orders", "promo_codes", "site_settings", "blog_posts",
  "user_roles", "admin_permissions", "refund_requests", "notification_preferences",
] as const;
const PAGE_SIZE = 50;

type ExportJob = {
  id: string;
  requested_by_email: string | null;
  filters: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  row_count: number | null;
  file_url: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
});

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function diffKeys(o: Record<string, unknown> | null, n: Record<string, unknown> | null): string[] {
  const keys = new Set<string>([...Object.keys(o ?? {}), ...Object.keys(n ?? {})]);
  const out: string[] = [];
  for (const k of keys) if (JSON.stringify(o?.[k]) !== JSON.stringify(n?.[k])) out.push(k);
  return out;
}

function AuditPage() {
  const perms = usePermissions();
  const allowed = can(perms, "audit");
  const startExport = useServerFn(startAuditExport);
  const fetchJobs = useServerFn(listAuditExports);
  const reSign = useServerFn(refreshExportUrl);

  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [table, setTable] = useState<string>("all");
  const [customTable, setCustomTable] = useState("");
  const [action, setAction] = useState<"all" | "create" | "update" | "delete">("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [showJobs, setShowJobs] = useState(false);
  const [starting, setStarting] = useState(false);

  const effectiveTable = table === "custom" ? customTable.trim() : table;

  function baseQuery() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from("audit_logs").select("*", { count: "exact" });
    if (effectiveTable && effectiveTable !== "all") q = q.eq("table_name", effectiveTable);
    if (action !== "all") q = q.eq("action", action);
    if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    const s = search.trim();
    if (s) q = q.or(`actor_email.ilike.%${s}%,record_id.ilike.%${s}%`);
    return q;
  }

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await baseQuery().order("created_at", { ascending: false }).range(from, to);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as AuditRow[]);
    setTotal(count ?? 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, effectiveTable, action, dateFrom, dateTo, search]);

  useEffect(() => { if (allowed) void load(); }, [allowed, load]);
  useEffect(() => { setPage(0); }, [table, customTable, action, dateFrom, dateTo, search]);

  async function loadJobs() {
    try {
      const list = await fetchJobs({});
      setJobs(list);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load export jobs."); }
  }
  useEffect(() => { if (allowed) void loadJobs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [allowed]);

  // Poll while there's an in-progress job.
  useEffect(() => {
    const inflight = jobs.some((j) => j.status === "pending" || j.status === "running");
    if (!inflight) return;
    const t = setInterval(() => { void loadJobs(); }, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  const grouped = useMemo(() => {
    if (!rows) return null;
    const map = new Map<string, AuditRow[]>();
    for (const r of rows) {
      const day = new Date(r.created_at).toLocaleDateString();
      const arr = map.get(day) ?? [];
      arr.push(r);
      map.set(day, arr);
    }
    return Array.from(map.entries());
  }, [rows]);

  function toggle(id: string) {
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function exportCsvSync() {
    toast.message("Preparing CSV…");
    const { data, error } = await baseQuery().order("created_at", { ascending: false }).range(0, 4999);
    if (error) { toast.error(error.message); return; }
    const all = (data ?? []) as AuditRow[];
    const header = ["Date", "Table", "Record", "Action", "Actor", "Changed keys", "Before", "After"];
    const lines = [header.join(",")];
    for (const r of all) {
      const changed = r.action === "update" ? diffKeys(r.old_data, r.new_data).filter((k) => k !== "updated_at") : [];
      lines.push([
        new Date(r.created_at).toISOString(),
        csvCell(r.table_name),
        csvCell(r.record_id ?? ""),
        r.action,
        csvCell(r.actor_email ?? ""),
        csvCell(changed.join("|")),
        csvCell(r.old_data ? JSON.stringify(r.old_data) : ""),
        csvCell(r.new_data ? JSON.stringify(r.new_data) : ""),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    toast.success(`Exported ${all.length} row(s).`);
  }

  async function exportCsvAsync() {
    setStarting(true);
    setShowJobs(true);
    try {
      await startExport({
        data: {
          table: effectiveTable || "all",
          action,
          search: search.trim(),
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
        },
      });
      toast.success("Export started. It will appear in the jobs panel below.");
      loadJobs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start export.");
    } finally {
      setStarting(false);
    }
  }

  function clearFilters() {
    setSearch(""); setTable("all"); setCustomTable(""); setAction("all"); setDateFrom(""); setDateTo("");
  }

  async function download(job: ExportJob) {
    if (!job.file_url) return;
    // File URL may have expired; grab a fresh one server-side and open it.
    try {
      const { fileUrl } = await reSign({ data: { jobId: job.id } });
      window.open(fileUrl, "_blank", "noopener");
      loadJobs();
    } catch {
      window.open(job.file_url, "_blank", "noopener");
    }
  }

  if (!perms.loading && !allowed) {
    return <p className="text-sm text-muted-foreground">You don't have permission to view the audit log.</p>;
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!(search || (effectiveTable && effectiveTable !== "all") || action !== "all" || dateFrom || dateTo);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 md:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void load(); }}
            placeholder="Search by actor email or record id…"
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={table} onChange={(e) => setTable(e.target.value)} className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm">
            {TABLES.map((t) => <option key={t} value={t}>{t === "all" ? "All tables" : t}</option>)}
            <option value="custom">Other…</option>
          </select>
        </div>
        <select value={action} onChange={(e) => setAction(e.target.value as never)} className="rounded-full border border-border bg-background px-3 py-2 text-sm">
          <option value="all">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-full border border-border bg-background px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-full border border-border bg-background px-3 py-2 text-sm" />
        {table === "custom" && (
          <input
            value={customTable}
            onChange={(e) => setCustomTable(e.target.value)}
            placeholder="Custom table name (e.g. inventory_adjustments)"
            className="rounded-full border border-border bg-background px-3 py-2 text-sm md:col-span-3"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {loading ? "Loading…" : `${total.toLocaleString()} event${total === 1 ? "" : "s"} · page ${page + 1} of ${pageCount}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {hasFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
          <button onClick={() => void load()} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-surface">Apply</button>
          <button onClick={() => void exportCsvSync()} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-surface">
            <Download className="h-3.5 w-3.5" /> Quick CSV (5k rows)
          </button>
          <button onClick={() => void exportCsvAsync()} disabled={starting}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60">
            {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
            Async export (up to 50k)
          </button>
          <button onClick={() => setShowJobs((s) => !s)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface">
            {showJobs ? "Hide" : "Show"} jobs ({jobs.length})
          </button>
        </div>
      </div>

      {/* Jobs panel */}
      {showJobs && (
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">Export jobs</h3>
            <button onClick={() => void loadJobs()} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] hover:bg-surface">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No export jobs yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {jobs.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {new Date(j.created_at).toLocaleString()} · {j.requested_by_email ?? "—"}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        j.status === "completed" ? "bg-emerald-100 text-emerald-900" :
                        j.status === "failed" ? "bg-red-100 text-red-900" :
                        j.status === "running" ? "bg-yellow-100 text-yellow-900" :
                        "bg-surface"
                      }`}>{j.status}</span>
                    </p>
                    <p className="mt-0.5 text-muted-foreground truncate">
                      {j.row_count != null ? `${j.row_count.toLocaleString()} rows · ` : ""}
                      filters: {summarizeFilters(j.filters)}
                      {j.error && <> · <span className="text-red-700">{j.error}</span></>}
                    </p>
                  </div>
                  {j.status === "completed" && j.file_url && (
                    <button onClick={() => void download(j)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] font-semibold hover:bg-surface">
                      <Download className="h-3 w-3" /> Download
                    </button>
                  )}
                  {(j.status === "pending" || j.status === "running") && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {grouped && grouped.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No audit events match these filters.</p>
      )}

      {grouped?.map(([day, list]) => (
        <section key={day}>
          <h3 className="mb-2 text-sm font-bold text-muted-foreground">{day}</h3>
          <ol className="relative space-y-2 border-l border-border pl-4">
            {list.map((r) => {
              const open = expanded.has(r.id);
              const changed = r.action === "update" ? diffKeys(r.old_data, r.new_data).filter((k) => k !== "updated_at") : [];
              return (
                <li key={r.id} className="relative">
                  <span className="absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full bg-foreground" />
                  <button onClick={() => toggle(r.id)} className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:bg-surface">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                          r.action === "create" ? "bg-emerald-100 text-emerald-900" :
                          r.action === "update" ? "bg-yellow-100 text-yellow-900" :
                          "bg-red-100 text-red-900"
                        }`}>{r.action}</span>
                        <b>{r.table_name}</b>
                        <span className="text-muted-foreground"> · {r.record_id?.slice(0, 8) ?? "—"}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.actor_email ?? "system"} · {new Date(r.created_at).toLocaleTimeString()}
                        {changed.length > 0 && <> · changed: {changed.slice(0, 4).join(", ")}{changed.length > 4 ? "…" : ""}</>}
                      </p>
                    </div>
                    {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  </button>
                  {open && (
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {r.old_data && (
                        <div className="rounded-xl border border-border bg-surface p-3">
                          <p className="mb-1 text-xs font-bold text-muted-foreground">Before</p>
                          <pre className="max-h-80 overflow-auto text-[11px] leading-tight">{JSON.stringify(r.old_data, null, 2)}</pre>
                        </div>
                      )}
                      {r.new_data && (
                        <div className="rounded-xl border border-border bg-surface p-3">
                          <p className="mb-1 text-xs font-bold text-muted-foreground">After</p>
                          <pre className="max-h-80 overflow-auto text-[11px] leading-tight">{JSON.stringify(r.new_data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-surface disabled:opacity-40">← Previous</button>
        <span className="text-xs text-muted-foreground">Page {page + 1} of {pageCount}</span>
        <button disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-surface disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}

function summarizeFilters(f: Record<string, unknown>): string {
  const parts: string[] = [];
  const t = f.table as string | undefined; if (t && t !== "all") parts.push(`table=${t}`);
  const a = f.action as string | undefined; if (a && a !== "all") parts.push(`action=${a}`);
  const s = f.search as string | undefined; if (s) parts.push(`q="${s}"`);
  const df = f.dateFrom as string | undefined; if (df) parts.push(`from=${df}`);
  const dt = f.dateTo as string | undefined; if (dt) parts.push(`to=${dt}`);
  return parts.length ? parts.join(" · ") : "(no filters)";
}
