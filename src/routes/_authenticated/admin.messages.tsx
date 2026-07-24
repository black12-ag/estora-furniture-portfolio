import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; name: string; email: string; phone: string | null; topic: string | null; message: string; status: string; created_at: string };

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: Msgs,
});

const STATUSES = ["new", "in-progress", "resolved"];
const PAGE_SIZE = 10;

function Msgs() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  async function load() {
    const { data, error } = await supabase.from("contact_messages")
      .select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle) ||
        (r.topic ?? "").toLowerCase().includes(needle) ||
        r.message.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, statusFilter]);

  useEffect(() => { setPage(1); }, [q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows?.length ?? 0 };
    STATUSES.forEach((s) => (c[s] = (rows ?? []).filter((r) => r.status === s).length));
    return c;
  }, [rows]);

  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <Toolbar
        q={q} setQ={setQ}
        placeholder="Search by name, email, topic, or message…"
        right={
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  statusFilter === s ? "bg-foreground text-background" : "bg-surface hover:bg-accent"
                }`}
              >
                {s} <span className="opacity-60">({counts[s] ?? 0})</span>
              </button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState label="No messages match your filters." />
      ) : (
        <>
          <ul className="space-y-3">
            {pageRows.map((m) => (
              <li key={m.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{m.name} <span className="ml-2 text-xs font-normal text-muted-foreground">{m.email}{m.phone ? ` · ${m.phone}` : ""}</span></p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.topic ?? "General"} · {new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <select value={m.status} onChange={(e) => setStatus(m.id, e.target.value)} className="rounded-full border border-border bg-background px-3 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} />
        </>
      )}
    </div>
  );
}

export function Toolbar({
  q, setQ, placeholder, right,
}: { q: string; setQ: (v: string) => void; placeholder: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {q && (
          <button aria-label="Clear" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {right}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange, total }: { page: number; totalPages: number; onChange: (n: number) => void; total: number }) {
  if (totalPages <= 1) return <p className="mt-4 text-xs text-muted-foreground">{total} result{total === 1 ? "" : "s"}</p>;
  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <p className="text-xs text-muted-foreground">{total} results · Page {page} of {totalPages}</p>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold disabled:opacity-40"
        >Previous</button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold disabled:opacity-40"
        >Next</button>
      </div>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{label}</div>
  );
}
