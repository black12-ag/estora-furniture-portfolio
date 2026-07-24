import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, AlertTriangle, Plus, Minus, Save, PackagePlus, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { can, usePermissions } from "@/lib/permissions";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  image: string;
  category: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  is_published: boolean;
  sizes: string[];
  colors: Array<{ name?: string }> | null;
};

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const perms = usePermissions();
  const allowed = can(perms, "inventory");
  const [rows, setRows] = useState<ProductRow[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [drafts, setDrafts] = useState<Record<string, { stock?: number; threshold?: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, image, category, price, stock, low_stock_threshold, is_published, sizes, colors")
      .order("name");
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as ProductRow[]);
    setDrafts({});
    setSelected(new Set());
  }
  useEffect(() => { if (allowed) load(); }, [allowed]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    let out = rows;
    const s = q.trim().toLowerCase();
    if (s) out = out.filter((r) => r.name.toLowerCase().includes(s) || r.slug.toLowerCase().includes(s) || r.category.toLowerCase().includes(s));
    if (filter === "low") out = out.filter((r) => r.stock > 0 && r.stock <= r.low_stock_threshold);
    if (filter === "out") out = out.filter((r) => r.stock <= 0);
    return out;
  }, [rows, q, filter]);

  const stats = useMemo(() => {
    if (!rows) return null;
    const out = rows.filter((r) => r.stock <= 0).length;
    const low = rows.filter((r) => r.stock > 0 && r.stock <= r.low_stock_threshold).length;
    const totalUnits = rows.reduce((s, r) => s + r.stock, 0);
    return { out, low, totalUnits, count: rows.length };
  }, [rows]);

  async function logAdjustment(product: ProductRow, newStock: number, reason: string, source: string) {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return;
    await supabase.from("inventory_adjustments").insert({
      product_id: product.id,
      actor_id: uid,
      actor_email: sess.session?.user.email ?? null,
      delta: newStock - product.stock,
      stock_before: product.stock,
      stock_after: newStock,
      reason,
      source,
    });
  }

  function edit(id: string, patch: { stock?: number; threshold?: number }) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  }
  function bump(id: string, current: number, delta: number) {
    edit(id, { stock: Math.max(0, (drafts[id]?.stock ?? current) + delta) });
  }
  async function save(row: ProductRow) {
    const draft = drafts[row.id];
    if (!draft) return;
    setSavingId(row.id);
    const patch: { stock?: number; low_stock_threshold?: number } = {};
    if (draft.stock !== undefined && draft.stock !== row.stock) patch.stock = draft.stock;
    if (draft.threshold !== undefined && draft.threshold !== row.low_stock_threshold) patch.low_stock_threshold = draft.threshold;
    if (Object.keys(patch).length === 0) { setSavingId(null); return; }
    const { error } = await supabase.from("products").update(patch).eq("id", row.id);
    if (error) { setSavingId(null); toast.error(error.message); return; }
    if (patch.stock !== undefined) {
      const reason = prompt(`Reason for stock change on "${row.name}"? (optional)`) ?? "";
      await logAdjustment(row, patch.stock, reason, "manual");
    }
    setSavingId(null);
    toast.success(`Updated ${row.name}`);
    load();
  }

  async function quickRestock(row: ProductRow, amount: number) {
    setSavingId(row.id);
    const newStock = row.stock + amount;
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", row.id);
    if (error) { setSavingId(null); toast.error(error.message); return; }
    await logAdjustment(row, newStock, `Quick restock +${amount}`, "quick_restock");
    setSavingId(null);
    toast.success(`+${amount} to ${row.name}`);
    load();
  }

  function toggleSel(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function selectLowInView() {
    if (!filtered) return;
    setSelected(new Set(filtered.filter((r) => r.stock <= r.low_stock_threshold).map((r) => r.id)));
  }

  if (!perms.loading && !allowed) return <p className="text-sm text-muted-foreground">You don't have permission to view inventory.</p>;

  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Products" value={stats.count.toString()} />
          <Stat label="Units in stock" value={stats.totalUnits.toString()} />
          <Stat label="Low stock" value={stats.low.toString()} tone={stats.low > 0 ? "warn" : undefined} />
          <Stat label="Out of stock" value={stats.out.toString()} tone={stats.out > 0 ? "bad" : undefined} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm" />
        </div>
        <div className="flex gap-1">
          {(["all", "low", "out"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-foreground text-background" : "border border-border"}`}>
              {f === "all" ? "All" : f === "low" ? "Low stock" : "Out of stock"}
            </button>
          ))}
        </div>
        <Link to="/admin/inventory-log" className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface">
          <History className="h-3.5 w-3.5" /> Adjustment log
        </Link>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-foreground bg-foreground/5 p-3">
          <p className="text-sm font-semibold">{selected.size} selected</p>
          <button onClick={() => setBulkOpen(true)} className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background">
            <PackagePlus className="h-3.5 w-3.5" /> Bulk restock
          </button>
          <button onClick={selectLowInView} className="rounded-full border border-border px-3 py-1.5 text-xs">Select all low‑stock in view</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Clear selection</button>
        </div>
      )}
      {selected.size === 0 && filtered && filtered.length > 0 && (
        <button onClick={selectLowInView} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Select all low‑stock in current view →</button>
      )}

      {!filtered && <p className="text-sm text-muted-foreground">Loading…</p>}
      {filtered && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="w-8 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((r) => selected.has(r.id))}
                    onChange={(e) => {
                      const n = new Set(selected);
                      if (e.target.checked) filtered.forEach((r) => n.add(r.id));
                      else filtered.forEach((r) => n.delete(r.id));
                      setSelected(n);
                    }}
                  />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Low‑stock at</th>
                <th className="px-4 py-3">Quick restock</th>
                <th className="px-4 py-3 text-right">Save</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={7}>No products match.</td></tr>}
              {filtered.map((r) => {
                const stockVal = drafts[r.id]?.stock ?? r.stock;
                const threshVal = drafts[r.id]?.threshold ?? r.low_stock_threshold;
                const dirty = drafts[r.id] && ((drafts[r.id].stock ?? r.stock) !== r.stock || (drafts[r.id].threshold ?? r.low_stock_threshold) !== r.low_stock_threshold);
                const low = stockVal > 0 && stockVal <= threshVal;
                const out = stockVal <= 0;
                return (
                  <tr key={r.id} className="border-t border-border align-middle">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={r.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        <div>
                          <p className="font-semibold">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.category} · ${Number(r.price).toFixed(2)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {(r.sizes?.length ?? 0) > 0 && <p>Sizes: {r.sizes.join(", ")}</p>}
                      {(r.colors?.length ?? 0) > 0 && <p>Colors: {r.colors!.map((c) => c.name).filter(Boolean).join(", ")}</p>}
                      {(r.sizes?.length ?? 0) === 0 && (r.colors?.length ?? 0) === 0 && <span>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => bump(r.id, r.stock, -1)} className="grid h-7 w-7 place-items-center rounded-full border border-border"><Minus className="h-3 w-3" /></button>
                        <input type="number" value={stockVal} onChange={(e) => edit(r.id, { stock: Math.max(0, Number(e.target.value) || 0) })} className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-center text-sm" />
                        <button onClick={() => bump(r.id, r.stock, 1)} className="grid h-7 w-7 place-items-center rounded-full border border-border"><Plus className="h-3 w-3" /></button>
                        {out && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-900"><AlertTriangle className="h-3 w-3" /> Out</span>}
                        {low && !out && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-900"><AlertTriangle className="h-3 w-3" /> Low</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={threshVal} onChange={(e) => edit(r.id, { threshold: Math.max(0, Number(e.target.value) || 0) })} className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-center text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {[5, 10, 25, 50].map((n) => (
                          <button key={n} onClick={() => quickRestock(r, n)} className="rounded-full border border-border px-2 py-0.5 text-xs">+{n}</button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button disabled={!dirty || savingId === r.id} onClick={() => save(r)} className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background disabled:opacity-40">
                        <Save className="h-3 w-3" /> Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {bulkOpen && rows && (
        <BulkRestockDialog
          products={rows.filter((r) => selected.has(r.id))}
          onClose={() => setBulkOpen(false)}
          onDone={() => { setBulkOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "bad" }) {
  const cls = tone === "bad" ? "border-red-300 bg-red-50" : tone === "warn" ? "border-yellow-300 bg-yellow-50" : "border-border bg-card";
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function BulkRestockDialog({ products, onClose, onDone }: { products: ProductRow[]; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<"add" | "set">("add");
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  async function run() {
    if (running) return;
    setRunning(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    const email = sess.session?.user.email ?? null;
    let completed = 0;
    for (const p of products) {
      const newStock = mode === "add" ? p.stock + amount : amount;
      const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", p.id);
      if (error) { toast.error(`${p.name}: ${error.message}`); continue; }
      if (uid) {
        await supabase.from("inventory_adjustments").insert({
          product_id: p.id,
          actor_id: uid,
          actor_email: email,
          delta: newStock - p.stock,
          stock_before: p.stock,
          stock_after: newStock,
          reason: reason || (mode === "add" ? `Bulk restock +${amount}` : `Bulk set to ${amount}`),
          source: "bulk_restock",
        });
      }
      completed += 1;
      setDone(completed);
    }
    toast.success(`Updated ${completed} product${completed === 1 ? "" : "s"}`);
    setRunning(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-black">Bulk restock</h2>
        <p className="text-sm text-muted-foreground">Applying to {products.length} product{products.length === 1 ? "" : "s"}.</p>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setMode("add")} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${mode === "add" ? "bg-foreground text-background" : "border border-border"}`}>Add to stock</button>
            <button onClick={() => setMode("set")} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${mode === "set" ? "bg-foreground text-background" : "border border-border"}`}>Set stock to</button>
          </div>
          <label className="block">
            <span className="text-xs font-semibold">Quantity</span>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Reason (optional)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Received PO #4471" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <ul className="max-h-40 overflow-y-auto rounded-xl border border-border bg-surface p-2 text-xs">
            {products.map((p) => {
              const next = mode === "add" ? p.stock + amount : amount;
              return (
                <li key={p.id} className="flex items-center justify-between py-0.5">
                  <span className="truncate">{p.name}</span>
                  <span className="text-muted-foreground">{p.stock} → <b className="text-foreground">{next}</b></span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} disabled={running} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
          <button onClick={run} disabled={running} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50">
            {running ? `Restocking… ${done}/${products.length}` : "Restock"}
          </button>
        </div>
      </div>
    </div>
  );
}
