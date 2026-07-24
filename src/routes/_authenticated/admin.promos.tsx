import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  code: string;
  label: string;
  pct: number;
  free_shipping: boolean;
  active: boolean;
  expires_at: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/promos")({
  component: PromosAdmin,
});

function PromosAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [draft, setDraft] = useState({ code: "", label: "", pct: 0, free_shipping: false });

  async function load() {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id,code,label,pct,free_shipping,active,expires_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.code.trim()) return toast.error("Code required");
    const { error } = await supabase.from("promo_codes").insert({
      code: draft.code.trim().toUpperCase(),
      label: draft.label.trim() || draft.code.trim().toUpperCase(),
      pct: Number(draft.pct) || 0,
      free_shipping: draft.free_shipping,
    });
    if (error) return toast.error(error.message);
    setDraft({ code: "", label: "", pct: 0, free_shipping: false });
    toast.success("Promo added");
    load();
  }

  async function update(id: string, patch: Partial<Row>) {
    const { error } = await supabase.from("promo_codes").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); load(); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this promo code?")) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-black">Add promo code</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="rounded-full border border-border bg-background px-4 py-2 text-sm" placeholder="CODE" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
          <input className="rounded-full border border-border bg-background px-4 py-2 text-sm sm:col-span-2" placeholder="Label shown to customer" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <input type="number" min={0} max={100} step={1} className="rounded-full border border-border bg-background px-4 py-2 text-sm" placeholder="% off" value={Math.round(draft.pct * 100)} onChange={(e) => setDraft({ ...draft, pct: Number(e.target.value) / 100 })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.free_shipping} onChange={(e) => setDraft({ ...draft, free_shipping: e.target.checked })} /> Free shipping</label>
        </div>
        <button onClick={create} className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background">
          <Plus className="h-4 w-4" /> Add code
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">% off</th>
              <th className="px-4 py-3">Free ship</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows === null && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={7}>Loading…</td></tr>}
            {rows?.length === 0 && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={7}>No promo codes yet.</td></tr>}
            {rows?.map((r) => (
              <PromoRow key={r.id} row={r} onSave={(patch) => update(r.id, patch)} onDelete={() => remove(r.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PromoRow({ row, onSave, onDelete }: { row: Row; onSave: (p: Partial<Row>) => void; onDelete: () => void }) {
  const [local, setLocal] = useState(row);
  useEffect(() => setLocal(row), [row]);
  const dirty = JSON.stringify(local) !== JSON.stringify(row);
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 font-mono text-xs font-bold">{row.code}</td>
      <td className="px-4 py-3"><input className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" value={local.label} onChange={(e) => setLocal({ ...local, label: e.target.value })} /></td>
      <td className="px-4 py-3"><input type="number" min={0} max={100} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm" value={Math.round(local.pct * 100)} onChange={(e) => setLocal({ ...local, pct: Number(e.target.value) / 100 })} /></td>
      <td className="px-4 py-3"><input type="checkbox" checked={local.free_shipping} onChange={(e) => setLocal({ ...local, free_shipping: e.target.checked })} /></td>
      <td className="px-4 py-3"><input type="checkbox" checked={local.active} onChange={(e) => setLocal({ ...local, active: e.target.checked })} /></td>
      <td className="px-4 py-3"><input type="date" className="rounded-md border border-border bg-background px-2 py-1 text-sm" value={local.expires_at ? local.expires_at.slice(0, 10) : ""} onChange={(e) => setLocal({ ...local, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {dirty && <button onClick={() => onSave({ label: local.label, pct: local.pct, free_shipping: local.free_shipping, active: local.active, expires_at: local.expires_at })} className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"><Save className="h-3 w-3" /> Save</button>}
          <button onClick={onDelete} className="rounded-full border border-border p-1.5 text-muted-foreground hover:bg-surface" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </td>
    </tr>
  );
}
