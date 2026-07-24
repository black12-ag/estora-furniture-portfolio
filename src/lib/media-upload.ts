import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadMedia(file: File, folder: "products" | "blog" | "misc" = "misc"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw e2 ?? new Error("Could not sign URL");
  return data.signedUrl;
}

export function pathFromSignedUrl(url: string): string | null {
  const m = url.match(/\/object\/sign\/media\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function deleteMediaByUrl(url: string): Promise<void> {
  const path = pathFromSignedUrl(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function listMedia(folder?: string) {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder ?? "", {
    limit: 1000, sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return data ?? [];
}

// ---------- Published-flag convention (URL fragment) ----------
// Signed URLs never use the fragment, so we piggy-back "#unpublished" on stored
// strings to mark them as hidden from customers without a schema migration.
const UNPUB = "#unpublished";
export const isPublished = (url: string): boolean => !url.endsWith(UNPUB);
export const stripFlag = (url: string): string => url.replace(/#unpublished$/, "");
export const withPublished = (url: string, published: boolean): string => {
  const clean = stripFlag(url);
  return published ? clean : clean + UNPUB;
};
/** Filter a stored list down to what customers should see. */
export const publishedOnly = (urls: string[] | null | undefined): string[] =>
  (urls ?? []).filter(isPublished).map(stripFlag);

// ---------- Bulk + orphan cleanup ----------
export async function bulkDeleteMediaPaths(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

/**
 * Scan products/blog for every referenced media path and return the storage
 * files that no row points at. Only searches inside `media/` bucket paths.
 */
export async function findOrphanMediaPaths(): Promise<string[]> {
  const referenced = new Set<string>();
  const collect = (v: unknown) => {
    if (!v) return;
    if (typeof v === "string") {
      const p = pathFromSignedUrl(stripFlag(v));
      if (p) referenced.add(p);
    } else if (Array.isArray(v)) v.forEach(collect);
  };

  const [products, blog] = await Promise.all([
    supabase.from("products").select("image, images, video_url"),
    supabase.from("blog_posts").select("cover"),
  ]);
  (products.data ?? []).forEach((r: any) => { collect(r.image); collect(r.images); collect(r.video_url); });
  (blog.data ?? []).forEach((r: any) => collect(r.cover));

  const orphans: string[] = [];
  for (const folder of ["products", "blog", "misc"]) {
    const { data } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
    (data ?? []).forEach((f) => {
      if (!f.name || f.name.startsWith(".")) return;
      const p = `${folder}/${f.name}`;
      if (!referenced.has(p)) orphans.push(p);
    });
  }
  return orphans;
}

