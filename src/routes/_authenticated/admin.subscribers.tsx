import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; email: string; source: string | null; created_at: string };

export const Route = createFileRoute("/_authenticated/admin/subscribers")({
  component: Subs,
});

function Subs() {
  const [rows, setRows] = useState<Row[] | null>(null);
  async function load() {
    const { data, error } = await supabase.from("newsletter_subscribers")
      .select("id, email, source, created_at").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);
  async function del(id: string) {
    if (!confirm("Remove this subscriber?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  }
  function exportCsv() {
    if (!rows) return;
    const csv = ["email,source,created_at", ...rows.map(r => `${r.email},${r.source ?? ""},${r.created_at}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click(); URL.revokeObjectURL(url);
  }
  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} subscriber{rows.length === 1 ? "" : "s"}</p>
        <button onClick={exportCsv} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-surface">Export CSV</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.source ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(r.id)} aria-label="Delete" className="rounded-full p-2 text-muted-foreground hover:bg-sale/10 hover:text-sale"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
