import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia, bulkDeleteMediaPaths, findOrphanMediaPaths } from "@/lib/media-upload";
import { toast } from "sonner";
import { Loader2, Upload, Copy, Trash2, Search, CheckSquare, Square, Ghost, Maximize2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: AdminMedia,
});

const FOLDERS = ["products", "blog", "misc"] as const;
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

type Item = { name: string; path: string; url: string; size: number; created_at: string; isVideo: boolean };

function AdminMedia() {
  const [folder, setFolder] = useState<(typeof FOLDERS)[number]>("products");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orphans, setOrphans] = useState<string[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<Item | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setSelected(new Set());
    const { data, error } = await supabase.storage.from("media").list(folder, {
      limit: 500, sortBy: { column: "created_at", order: "desc" },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const files = (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
    const paths = files.map((f) => `${folder}/${f.name}`);
    const signed = paths.length
      ? await supabase.storage.from("media").createSignedUrls(paths, TEN_YEARS)
      : { data: [] as any[], error: null };
    const map = new Map<string, string>();
    signed.data?.forEach((s: any) => map.set(s.path, s.signedUrl));
    setItems(files.map((f) => {
      const p = `${folder}/${f.name}`;
      return {
        name: f.name, path: p, url: map.get(p) || "",
        size: (f.metadata as any)?.size ?? 0,
        created_at: (f as any).created_at ?? "",
        isVideo: /\.(mp4|webm|mov|m4v|ogv)$/i.test(f.name),
      };
    }));
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [folder]);

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  async function handleFiles(files: FileList) {
    setBusy(true);
    for (const f of Array.from(files)) {
      try { await uploadMedia(f, folder); } catch (e: any) { toast.error(e?.message || "Upload failed"); }
    }
    setBusy(false);
    toast.success("Uploaded");
    load();
  }

  function toggle(path: string) {
    setSelected((s) => { const n = new Set(s); n.has(path) ? n.delete(path) : n.add(path); return n; });
  }
  function toggleAll() {
    setSelected((s) => s.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.path)));
  }

  async function bulkDelete() {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} file(s)? Product/blog rows that still reference them will show broken images.`)) return;
    setBusy(true);
    try { await bulkDeleteMediaPaths(Array.from(selected)); toast.success(`Deleted ${selected.size}`); }
    catch (e: any) { toast.error(e?.message || "Delete failed"); }
    finally { setBusy(false); load(); }
  }

  async function scanOrphans() {
    setScanning(true);
    try { setOrphans(await findOrphanMediaPaths()); }
    catch (e: any) { toast.error(e?.message || "Scan failed"); }
    finally { setScanning(false); }
  }

  async function deleteOrphans() {
    if (!orphans?.length) return;
    if (!confirm(`Permanently delete ${orphans.length} unreferenced file(s)?`)) return;
    setBusy(true);
    try {
      await bulkDeleteMediaPaths(orphans);
      toast.success(`Cleaned up ${orphans.length} orphan(s)`);
      setOrphans(null);
      load();
    } catch (e: any) { toast.error(e?.message || "Cleanup failed"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Media library</h2>
          <p className="text-sm text-muted-foreground">Upload, preview, bulk delete, and clean up unused files.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={scanning} onClick={scanOrphans}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-60">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ghost className="h-4 w-4" />} Find orphans
          </button>
          <button disabled={busy} onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload files
          </button>
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {orphans !== null && (
        <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black">
                {orphans.length === 0 ? "🎉 No orphaned files" : `Found ${orphans.length} unreferenced file(s)`}
              </p>
              <p className="text-xs text-muted-foreground">
                {orphans.length > 0 && "These aren't linked from any product or blog post. Safe to remove."}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOrphans(null)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">Dismiss</button>
              {orphans.length > 0 && (
                <button onClick={deleteOrphans} disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all orphans
                </button>
              )}
            </div>
          </div>
          {orphans.length > 0 && (
            <ul className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-background/60 p-2 text-xs font-mono">
              {orphans.slice(0, 100).map((p) => <li key={p} className="truncate">{p}</li>)}
              {orphans.length > 100 && <li className="text-muted-foreground">…and {orphans.length - 100} more</li>}
            </ul>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {FOLDERS.map((f) => (
            <button key={f} onClick={() => setFolder(f)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${folder === f ? "bg-foreground text-background" : "bg-surface hover:bg-accent"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filename…"
            className="w-full rounded-full border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary" />
        </div>
        {filtered.length > 0 && (
          <button onClick={toggleAll} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
            {selected.size === filtered.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            {selected.size === filtered.length ? "Deselect all" : "Select all"}
          </button>
        )}
        {selected.size > 0 && (
          <button onClick={bulkDelete} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">
            <Trash2 className="h-3.5 w-3.5" /> Delete {selected.size}
          </button>
        )}
      </div>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No files in <b>{folder}</b> yet. Drop images or videos in.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((it) => {
            const isSel = selected.has(it.path);
            return (
              <div key={it.path} className={`group overflow-hidden rounded-2xl border transition ${isSel ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
                <div className="relative aspect-square bg-muted">
                  {it.isVideo
                    ? <video src={it.url} muted playsInline className="h-full w-full object-cover" />
                    : <img src={it.url} alt={it.name} loading="lazy" className="h-full w-full object-cover" />}
                  <button onClick={() => toggle(it.path)}
                    className={`absolute left-2 top-2 rounded-md p-1 shadow ${isSel ? "bg-primary text-primary-foreground" : "bg-white/90 text-foreground hover:bg-white"}`}
                    aria-label={isSel ? "Deselect" : "Select"}>
                    {isSel ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setPreview(it)}
                    className="absolute right-2 top-2 hidden rounded-md bg-black/60 p-1 text-white group-hover:block"
                    aria-label="Preview">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-semibold" title={it.name}>{it.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(it.size / 1024).toFixed(0)} KB</p>
                  <div className="mt-2 flex gap-1">
                    <button onClick={() => { navigator.clipboard.writeText(it.url); toast.success("URL copied"); }}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-border px-2 py-1 text-[10px] font-semibold hover:bg-accent">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ${it.name}?`)) return;
                        await bulkDeleteMediaPaths([it.path]);
                        toast.success("Deleted"); load();
                      }}
                      className="rounded-full border border-border p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          {preview.isVideo
            ? <video src={preview.url} controls className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(e) => e.stopPropagation()} />
            : <img src={preview.url} alt={preview.name} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />}
        </div>
      )}
    </div>
  );
}
