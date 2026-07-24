import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { can, usePermissions } from "@/lib/permissions";

type AdjRow = {
  id: string;
  product_id: string;
  variant: string | null;
  actor_email: string | null;
  delta: number;
  stock_before: number;
  stock_after: number;
  reason: string;
  source: string;
  created_at: string;
};
type ProductLite = { id: string; name: string; image: string };

export const Route = createFileRoute("/_authenticated/admin/inventory-log")({
  component: InventoryLogPage,
});

function InventoryLogPage() {
  const perms = usePermissions();
  const allowed = can(perms, "inventory");
  const [rows, setRows] = useState<AdjRow[] | null>(null);
  const [products, setProducts] = useState<Record<string, ProductLite>>({});
  const [q, setQ] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [direction, setDirection] = useState<"all" | "increase" | "decrease">("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  async function load() {
    const [{ data: adj, error: e1 }, { data: ps, error: e2 }] = await Promise.all([
      supabase.from("inventory_adjustments").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("products").select("id, name, image").order("name"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setRows((adj ?? []) as AdjRow[]);
    const map: Record<string, ProductLite> = {};
    for (const p of (ps ?? []) as ProductLite[]) map[p.id] = p;
    setProducts(map);
  }
  useEffect(() => { if (allowed) load(); }, [allowed]);

  const sources = useMemo(() => {
    if (!rows) return [] as string[];
    return Array.from(new Set(rows.map((r) => r.source))).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    let out = rows;
    if (productFilter !== "all") out = out.filter((r) => r.product_id === productFilter);
    if (sourceFilter !== "all") out = out.filter((r) => r.source === sourceFilter);
    if (direction === "increase") out = out.filter((r) => r.delta > 0);
    if (direction === "decrease") out = out.filter((r) => r.delta < 0);
    if (from) { const t = new Date(from).getTime(); out = out.filter((r) => new Date(r.created_at).getTime() >= t); }
    if (to) { const t = new Date(to).getTime() + 86_400_000; out = out.filter((r) => new Date(r.created_at).getTime() <= t); }
    const s = q.trim().toLowerCase();
    if (s) {
      out = out.filter((r) => {
        const p = products[r.product_id];
        return (
          (p?.name ?? "").toLowerCase().includes(s) ||
          (r.variant ?? "").toLowerCase().includes(s) ||
          (r.actor_email ?? "").toLowerCase().includes(s) ||
          r.reason.toLowerCase().includes(s)
        );
      });
    }
    return out;
  }, [rows, q, productFilter, sourceFilter, direction, from, to, products]);

  const totals = useMemo(() => {
    if (!filtered) return null;
    let inc = 0, dec = 0;
    for (const r of filtered) { if (r.delta > 0) inc += r.delta; else dec += r.delta; }
    return { events: filtered.length, inc, dec, net: inc + dec };
  }, [filtered]);


  function exportCsv() {
    if (!filtered) return;
    const header = ["Date", "Product", "Variant", "Actor", "Delta", "Before", "After", "Source", "Reason"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      const p = products[r.product_id];
      lines.push([
        new Date(r.created_at).toISOString(),
        csv(p?.name ?? r.product_id),
        csv(r.variant ?? ""),
        csv(r.actor_email ?? ""),
        String(r.delta),
        String(r.stock_before),
        String(r.stock_after),
        csv(r.source),
        csv(r.reason),
      ].join(","));
    }
    download("inventory-adjustments.csv", lines.join("\n"));
  }

  if (!perms.loading && !allowed) return <p className="text-sm text-muted-foreground">You don't have permission to view inventory.</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, variant, actor, reason" className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm" />
        </div>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
          <option value="all">All products</option>
          {Object.values(products).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
          <option value="all">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={direction} onChange={(e) => setDirection(e.target.value as never)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
          <option value="all">Any change</option>
          <option value="increase">Increases only</option>
          <option value="decrease">Decreases only</option>
        </select>
        <div className="flex items-center gap-1">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-full border border-border bg-background px-3 py-2 text-xs" />
          <span className="text-xs text-muted-foreground">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-full border border-border bg-background px-3 py-2 text-xs" />
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Kpi label="Events" value={totals.events.toString()} />
          <Kpi label="Units added" value={`+${totals.inc}`} tone="good" />
          <Kpi label="Units removed" value={totals.dec.toString()} tone={totals.dec < 0 ? "bad" : undefined} />
          <Kpi label="Net change" value={`${totals.net > 0 ? "+" : ""}${totals.net}`} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Showing {filtered?.length ?? 0} of {rows?.length ?? 0}</p>
        <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {!filtered && <p className="text-sm text-muted-foreground">Loading…</p>}
      {filtered && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No adjustments match your filters.</p>
      )}
      {filtered && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Product / variant</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Before → After</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const p = products[r.product_id];
                const up = r.delta > 0;
                return (
                  <tr key={r.id} className="border-t border-border align-middle">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p?.image && <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                        <span className="font-semibold">{p?.name ?? r.product_id.slice(0, 8)}</span>
                        {r.variant && <span className="text-xs text-muted-foreground">/ {r.variant}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${up ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}>
                        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {up ? "+" : ""}{r.delta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums">
                      <span className="text-muted-foreground">{r.stock_before}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <b className="text-foreground">{r.stock_after}</b>
                    </td>
                    <td className="px-4 py-3 text-xs">{r.actor_email ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.source}</td>
                    <td className="px-4 py-3 text-xs">{r.reason || <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const cls = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-black ${cls}`}>{value}</p>
    </div>
  );
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
