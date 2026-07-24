import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Plus, X } from "lucide-react";
import { Toolbar, Pagination, EmptyState } from "./admin.messages";
import { MediaUploader } from "@/components/admin/MediaUploader";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlog,
});

const PAGE_SIZE = 12;

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: string;
  author: string;
  author_role: string;
  date: string;
  read_minutes: number;
  tags: string[];
  featured: boolean;
  body: { type: string; text?: string; items?: string[] }[];
  is_published: boolean;
};

const empty: Omit<Row, "id"> = {
  slug: "",
  title: "",
  excerpt: "",
  cover: "",
  category: "Interiors",
  author: "Estora Team",
  author_role: "Editor",
  date: new Date().toISOString().slice(0, 10),
  read_minutes: 5,
  tags: [],
  featured: false,
  body: [],
  is_published: true,
};

function AdminBlog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | (Omit<Row, "id"> & { id?: string }) | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as unknown as Row[]);
  }
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(rows.map((r) => r.category).filter(Boolean)))], [rows]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (status === "published" && !r.is_published) return false;
      if (status === "draft" && r.is_published) return false;
      if (!needle) return true;
      return r.title.toLowerCase().includes(needle) || r.slug.toLowerCase().includes(needle) || r.author.toLowerCase().includes(needle) || r.tags.some((t) => t.toLowerCase().includes(needle));
    });
  }, [rows, q, cat, status]);
  useEffect(() => { setPage(1); }, [q, cat, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  async function save(payload: Omit<Row, "id"> & { id?: string }) {
    if (!payload.slug || !payload.title || !payload.cover) return toast.error("Slug, title and cover image are required");
    const { id, ...rest } = payload;
    const { error } = id
      ? await supabase.from("blog_posts").update(rest).eq("id", id)
      : await supabase.from("blog_posts").insert(rest);
    if (error) return toast.error(error.message);
    toast.success(id ? "Updated" : "Created");
    setEditing(null);
    load();
  }


  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{rows.length} blog posts in database</p>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setEditing(empty as any)}>
          <Plus className="h-4 w-4" /> New post
        </button>
      </div>

      <Toolbar
        q={q} setQ={setQ}
        placeholder="Search title, slug, author, or tag…"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs">
              {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
            </select>
            <div className="flex gap-1">
              {(["all", "published", "draft"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${status === s ? "bg-foreground text-background" : "bg-surface hover:bg-accent"}`}>{s}</button>
              ))}
            </div>
          </div>
        }
      />

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      ) : rows.length === 0 ? (
        <EmptyState label="No posts yet — click New post to publish one." />
      ) : filtered.length === 0 ? (
        <EmptyState label="No posts match your filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Post</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={r.cover} alt="" className="h-10 w-14 rounded-lg object-cover" />
                        <div>
                          <p className="font-semibold">{r.title}</p>
                          <p className="text-xs text-muted-foreground">/{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3">{r.author}</td>
                    <td className="p-3">{r.date}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.is_published ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                        {r.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="mr-2 rounded-full p-2 hover:bg-accent" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></button>
                      <button className="rounded-full p-2 text-destructive hover:bg-destructive/10" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} />
        </>
      )}


      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <BlogForm initial={editing} onCancel={() => setEditing(null)} onSave={save} />
        </div>
      )}
    </div>
  );
}

function BlogForm({ initial, onCancel, onSave }: { initial: Row | (Omit<Row, "id"> & { id?: string }); onCancel: () => void; onSave: (p: Omit<Row, "id"> & { id?: string }) => void }) {
  const [cover, setCover] = useState(initial.cover || "");
  const editingId = "id" in initial ? initial.id : undefined;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const bodyText = String(fd.get("body_text") || "").trim();
    const paragraphs = bodyText.split(/\n\n+/).filter(Boolean).map((t) => ({ type: "p", text: t }));
    onSave({
      id: editingId,
      slug: String(fd.get("slug") || "").trim(),
      title: String(fd.get("title") || "").trim(),
      excerpt: String(fd.get("excerpt") || "").trim(),
      cover: cover.trim(),
      category: String(fd.get("category") || "").trim(),
      author: String(fd.get("author") || "").trim(),
      author_role: String(fd.get("author_role") || "").trim(),
      date: String(fd.get("date") || "").trim(),
      read_minutes: Number(fd.get("read_minutes") || 5),
      tags: String(fd.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean),
      featured: fd.get("featured") === "on",
      is_published: fd.get("is_published") === "on",
      body: paragraphs,
    });
  }

  return (
    <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-card p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">{editingId ? "Edit post" : "New post"}</h2>
        <button type="button" onClick={onCancel} className="rounded-full p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Slug" name="slug" defaultValue={initial.slug} required />
        <Field label="Title" name="title" defaultValue={initial.title} required />
        <Field label="Category" name="category" defaultValue={initial.category} required />
        <Field label="Date" name="date" defaultValue={initial.date} required />
        <Field label="Author" name="author" defaultValue={initial.author} required />
        <Field label="Author role" name="author_role" defaultValue={initial.author_role} />
        <Field label="Read minutes" name="read_minutes" type="number" defaultValue={initial.read_minutes} />
        <Field label="Tags (comma separated)" name="tags" defaultValue={initial.tags.join(", ")} />
        <div className="sm:col-span-2">
          <MediaUploader value={cover} onChange={setCover} folder="blog" label="Cover image *" showPublished />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold">Excerpt</label>
          <textarea name="excerpt" defaultValue={initial.excerpt} rows={2} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold">Body (separate paragraphs with a blank line)</label>
          <textarea
            name="body_text"
            defaultValue={initial.body.map((b) => b.text || (b.items || []).join(", ")).join("\n\n")}
            rows={8}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={initial.featured} /> Featured
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={initial.is_published} /> Published
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

function Field({ label, className = "", ...rest }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold">{label}</label>
      <input {...rest} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </div>
  );
}
