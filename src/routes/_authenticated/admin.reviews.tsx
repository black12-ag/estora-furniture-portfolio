import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; product_slug: string; name: string; rating: number; body: string; approved: boolean; created_at: string };

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: ReviewsAdmin,
});

function ReviewsAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  async function load() {
    const { data, error } = await supabase.from("product_reviews")
      .select("id, product_slug, name, rating, body, approved, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);
  async function toggle(r: Row) {
    const { error } = await supabase.from("product_reviews").update({ approved: !r.approved }).eq("id", r.id);
    if (error) toast.error(error.message); else load();
  }
  async function del(id: string) {
    if (!confirm("Delete review?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!rows.length) return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className={`rounded-2xl border border-border bg-card p-5 ${!r.approved ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold">{r.name} <span className="ml-2 text-xs font-normal text-muted-foreground">on {r.product_slug}</span></p>
              <div className="mt-1 flex items-center gap-1 text-primary">
                {Array.from({length:5}).map((_,i)=>(<Star key={i} className={`h-3.5 w-3.5 ${i<r.rating?"fill-primary":""}`} />))}
                <span className="ml-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(r)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface">
                {r.approved ? "Unapprove" : "Approve"}
              </button>
              <button onClick={() => del(r.id)} aria-label="Delete" className="rounded-full p-2 text-muted-foreground hover:bg-sale/10 hover:text-sale"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <p className="mt-3 text-sm">{r.body}</p>
        </li>
      ))}
    </ul>
  );
}
