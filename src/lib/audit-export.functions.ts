// Server functions for async CSV export of audit_logs.
// Keeps this module thin (only server fn declarations at top level) so
// the route/component graph can safely import it. Heavy admin imports
// load inside handlers.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ExportFilters = {
  table?: string | null;
  action?: "all" | "create" | "update" | "delete" | null;
  search?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
  ]);
  if (!isAdmin && !isSuper) throw new Error("Forbidden");
}


export const startAuditExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ExportFilters): ExportFilters => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actorEmail = (context.claims as { email?: string })?.email ?? null;

    const { data: job, error: jErr } = await supabaseAdmin
      .from("audit_export_jobs")
      .insert({
        requested_by: context.userId,
        requested_by_email: actorEmail,
        filters: data as never,
        status: "running",
      })
      .select("id")
      .single();
    if (jErr || !job) throw jErr ?? new Error("Failed to create export job");

    try {
      const pageSize = 1000;
      const maxPages = 50; // safety cap: 50k rows
      const rows: Array<{
        created_at: string;
        table_name: string;
        record_id: string | null;
        action: string;
        actor_email: string | null;
        old_data: unknown;
        new_data: unknown;
      }> = [];

      for (let page = 0; page < maxPages; page++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = supabaseAdmin.from("audit_logs").select("*").order("created_at", { ascending: false });
        if (data.table && data.table !== "all") q = q.eq("table_name", data.table);
        if (data.action && data.action !== "all") q = q.eq("action", data.action);
        if (data.dateFrom) q = q.gte("created_at", new Date(data.dateFrom).toISOString());
        if (data.dateTo) {
          const end = new Date(data.dateTo); end.setHours(23, 59, 59, 999);
          q = q.lte("created_at", end.toISOString());
        }
        const s = (data.search ?? "").trim();
        if (s) q = q.or(`actor_email.ilike.%${s}%,record_id.ilike.%${s}%`);
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data: chunk, error } = await q.range(from, to);
        if (error) throw error;
        if (!chunk || chunk.length === 0) break;
        rows.push(...chunk);
        if (chunk.length < pageSize) break;
      }

      const lines = ["Date,Table,Record,Action,Actor,Before,After"];
      for (const r of rows) {
        lines.push([
          new Date(r.created_at).toISOString(),
          csvCell(r.table_name),
          csvCell(r.record_id ?? ""),
          r.action,
          csvCell(r.actor_email ?? ""),
          csvCell(r.old_data ? JSON.stringify(r.old_data) : ""),
          csvCell(r.new_data ? JSON.stringify(r.new_data) : ""),
        ].join(","));
      }
      const body = lines.join("\n");
      const path = `audit/${job.id}.csv`;
      const bytes = new TextEncoder().encode(body);
      const { error: upErr } = await supabaseAdmin.storage.from("exports").upload(path, bytes, {
        upsert: true,
        contentType: "text/csv",
      });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabaseAdmin.storage
        .from("exports")
        .createSignedUrl(path, 7 * 24 * 3600);
      if (sErr) throw sErr;

      await supabaseAdmin.from("audit_export_jobs").update({
        status: "completed",
        row_count: rows.length,
        file_path: path,
        file_url: signed.signedUrl,
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);

      return { jobId: job.id, rows: rows.length, fileUrl: signed.signedUrl };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await supabaseAdmin.from("audit_export_jobs").update({
        status: "failed",
        error: message,
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);
      throw new Error(message);
    }
  });

export const listAuditExports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = context.supabase as any;
    const { data, error } = await supabase
      .from("audit_export_jobs")
      .select("id,requested_by_email,filters,status,row_count,file_url,error,created_at,completed_at")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw error;
    return data as Array<{
      id: string;
      requested_by_email: string | null;
      filters: ExportFilters;
      status: "pending" | "running" | "completed" | "failed";
      row_count: number | null;
      file_url: string | null;
      error: string | null;
      created_at: string;
      completed_at: string | null;
    }>;
  });

export const refreshExportUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job, error } = await supabaseAdmin
      .from("audit_export_jobs")
      .select("file_path,status")
      .eq("id", data.jobId)
      .maybeSingle();
    if (error || !job || job.status !== "completed" || !job.file_path) {
      throw new Error("Export not ready");
    }
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("exports")
      .createSignedUrl(job.file_path, 60 * 60);
    if (sErr) throw sErr;
    await supabaseAdmin.from("audit_export_jobs").update({ file_url: signed.signedUrl }).eq("id", data.jobId);
    return { fileUrl: signed.signedUrl };
  });
