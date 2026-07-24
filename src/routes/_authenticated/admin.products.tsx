import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Plus, X } from "lucide-react";
import { Toolbar, Pagination, EmptyState } from "./admin.messages";
import { MediaUploader, MediaGalleryUploader } from "@/components/admin/MediaUploader";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

const PAGE_SIZE = 12;

type Row = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at: number | null;
  image: string;
  images: string[];
  video_url: string | null;
  category: string;
  type: string;
  description: string;
  stock: number;
  is_published: boolean;
};

const empty: Omit<Row, "id"> = {
  slug: "",
  name: "",
  price: 0,
  compare_at: null,
  image: "",
  images: [],
  video_url: null,
  category: "Chairs",
  type: "Wooden",
  description: "",
  stock: 10,
  is_published: true,
};

function AdminProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | (Omit<Row, "id"> & { id?: string }) | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
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
      return r.name.toLowerCase().includes(needle) || r.slug.toLowerCase().includes(needle) || (r.type ?? "").toLowerCase().includes(needle);
    });
  }, [rows, q, cat, status]);
  useEffect(() => { setPage(1); }, [q, cat, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  async function save(payload: Omit<Row, "id"> & { id?: string }) {
    if (!payload.slug || !payload.name || !payload.image) return toast.error("Slug, name and main image are required");
    const { id, ...rest } = payload;
    const { error } = id
      ? await supabase.from("products").update(rest).eq("id", id)
      : await supabase.from("products").insert(rest);
    if (error) return toast.error(error.message);
    toast.success(id ? "Updated" : "Created");
    setEditing(null);
    load();
  }


  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{rows.length} products in database</p>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setEditing(empty as any)}>
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      <Toolbar
        q={q} setQ={setQ}
        placeholder="Search name, slug, or type…"
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
        <EmptyState label="No products yet — click New product to add one." />
      ) : filtered.length === 0 ? (
        <EmptyState label="No products match your filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={r.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-semibold">{r.name}</p>
                          <p className="text-xs text-muted-foreground">/{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3">${r.price}</td>
                    <td className="p-3">{r.stock}</td>
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
          <ProductForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={save}
          />
        </div>
      )}
    </div>
  );
}

function ProductForm({ initial, onCancel, onSave }: { initial: Row | (Omit<Row, "id"> & { id?: string }); onCancel: () => void; onSave: (p: Omit<Row, "id"> & { id?: string }) => void }) {
  const [image, setImage] = useState(initial.image || "");
  const [images, setImages] = useState<string[]>(initial.images || []);
  const [videoUrl, setVideoUrl] = useState(initial.video_url || "");
  const editingId = "id" in initial ? initial.id : undefined;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: editingId,
      slug: String(fd.get("slug") || "").trim(),
      name: String(fd.get("name") || "").trim(),
      price: Number(fd.get("price") || 0),
      compare_at: fd.get("compare_at") ? Number(fd.get("compare_at")) : null,
      image: image.trim(),
      images,
      video_url: videoUrl.trim() || null,
      category: String(fd.get("category") || "").trim(),
      type: String(fd.get("type") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      stock: Number(fd.get("stock") || 0),
      is_published: fd.get("is_published") === "on",
    });
  }

  return (
    <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-card p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">{editingId ? "Edit product" : "New product"}</h2>
        <button type="button" onClick={onCancel} className="rounded-full p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Slug" name="slug" defaultValue={initial.slug} required />
        <Field label="Name" name="name" defaultValue={initial.name} required />
        <Field label="Price" name="price" type="number" step="0.01" defaultValue={initial.price} required />
        <Field label="Compare-at price" name="compare_at" type="number" step="0.01" defaultValue={initial.compare_at ?? ""} />
        <Field label="Category" name="category" defaultValue={initial.category} required />
        <Field label="Type" name="type" defaultValue={initial.type} required />
        <Field label="Stock" name="stock" type="number" defaultValue={initial.stock} required />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={initial.is_published} /> Published
        </label>
        <div className="sm:col-span-2">
          <MediaUploader value={image} onChange={setImage} folder="products" label="Main image *" showPublished />
        </div>
        <div className="sm:col-span-2">
          <MediaGalleryUploader value={images} onChange={setImages} folder="products" label="Additional photos" />
        </div>
        <div className="sm:col-span-2">
          <MediaUploader value={videoUrl} onChange={setVideoUrl} folder="products" label="Product video (optional)" allowVideo showPublished />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold">Description</label>
          <textarea name="description" defaultValue={initial.description} rows={4} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
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
