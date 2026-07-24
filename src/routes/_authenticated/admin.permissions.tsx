import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Shield, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, ADMIN_RESOURCES, PERMISSION_TEMPLATES, type AdminResource } from "@/lib/permissions";

type Profile = { id: string; name: string | null; email: string | null };
type RoleRow = { user_id: string; role: string };
type PermRow = { user_id: string; resource: string };

export const Route = createFileRoute("/_authenticated/admin/permissions")({
  component: PermissionsPage,
});

function PermissionsPage() {
  const perms = usePermissions();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermRow[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const [{ data: rs }, { data: ps }, { data: prs }] = await Promise.all([
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("profiles").select("id,name,email"),
      supabase.from("admin_permissions").select("user_id,resource"),
    ]);
    setRoles((rs ?? []) as RoleRow[]);
    setProfiles((ps ?? []) as Profile[]);
    setPermissions((prs ?? []) as PermRow[]);
  }
  useEffect(() => { if (perms.isSuperAdmin) load(); }, [perms.isSuperAdmin]);

  const admins = useMemo(() => {
    if (!profiles) return null;
    const adminIds = new Set(roles.filter((r) => r.role === "admin" || r.role === "super_admin").map((r) => r.user_id));
    let list = profiles.filter((p) => adminIds.has(p.id));
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((p) => (p.email ?? "").toLowerCase().includes(s) || (p.name ?? "").toLowerCase().includes(s));
    return list;
  }, [profiles, roles, q]);

  function permsOf(uid: string): Set<string> {
    return new Set(permissions.filter((p) => p.user_id === uid).map((p) => p.resource));
  }
  function rolesOf(uid: string): Set<string> {
    return new Set(roles.filter((r) => r.user_id === uid).map((r) => r.role));
  }

  async function toggle(uid: string, resource: AdminResource, checked: boolean) {
    if (checked) {
      const { error } = await supabase.from("admin_permissions").insert({ user_id: uid, resource });
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("admin_permissions").delete().eq("user_id", uid).eq("resource", resource);
      if (error) { toast.error(error.message); return; }
    }
    load();
  }

  async function grantAll(uid: string) {
    await supabase.from("admin_permissions").delete().eq("user_id", uid);
    toast.success("Full access restored");
    load();
  }
  async function restrictOnly(uid: string) {
    await supabase.from("admin_permissions").upsert({ user_id: uid, resource: "overview" }, { onConflict: "user_id,resource" });
    toast.success("Now restricted — tick the areas this admin can access");
    load();
  }
  async function applyTemplate(uid: string, templateId: string) {
    if (!templateId) return;
    const tpl = PERMISSION_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    await supabase.from("admin_permissions").delete().eq("user_id", uid);
    const rows = tpl.resources.map((r) => ({ user_id: uid, resource: r }));
    const { error } = await supabase.from("admin_permissions").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`Applied template: ${tpl.name}`);
    load();
  }

  async function toggleSuper(uid: string, isSuper: boolean) {
    if (isSuper) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "super_admin");
      if (error) return toast.error(error.message);
      toast.success("Super admin revoked");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "super_admin" });
      if (error) return toast.error(error.message);
      toast.success("Super admin granted");
    }
    load();
  }

  if (perms.loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!perms.isSuperAdmin) return <p className="text-sm text-muted-foreground">Only super admins can edit permissions.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-semibold">How it works</p>
        <p className="mt-1 text-muted-foreground">
          Super admins have full access. Regular admins with <b>no ticked areas</b> also have full access. Apply a template for a
          one-click preset, or tick individual areas for fine control.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm font-semibold">Permission templates</p>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PERMISSION_TEMPLATES.map((t) => (
            <li key={t.id} className="rounded-xl border border-border p-3 text-xs">
              <p className="font-bold text-foreground">{t.name}</p>
              <p className="mt-0.5 text-muted-foreground">{t.description}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{t.resources.length} areas</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search admins" className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm" />
      </div>

      {!admins && <p className="text-sm text-muted-foreground">Loading…</p>}
      {admins && admins.length === 0 && <p className="text-sm text-muted-foreground">No admins found. Grant admin access in the Users tab.</p>}

      <div className="space-y-3">
        {admins?.map((p) => {
          const userPerms = permsOf(p.id);
          const userRoles = rolesOf(p.id);
          const isSuper = userRoles.has("super_admin");
          const restricted = userPerms.size > 0 && !isSuper;
          return (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{p.name ?? p.email}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                  <div className="mt-1 flex gap-1">
                    {isSuper && <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">SUPER ADMIN</span>}
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold">
                      {isSuper ? "Full access" : restricted ? `Restricted (${userPerms.size} areas)` : "Full access (unrestricted)"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isSuper && (
                    <select
                      defaultValue=""
                      onChange={(e) => { void applyTemplate(p.id, e.target.value); e.currentTarget.value = ""; }}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold"
                    >
                      <option value="">Apply template…</option>
                      {PERMISSION_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  <button onClick={() => toggleSuper(p.id, isSuper)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface">
                    <Shield className="h-3 w-3" /> {isSuper ? "Revoke super" : "Make super"}
                  </button>
                  {!isSuper && (
                    restricted ? (
                      <button onClick={() => grantAll(p.id)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface">Grant full access</button>
                    ) : (
                      <button onClick={() => restrictOnly(p.id)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface">Restrict access</button>
                    )
                  )}
                </div>
              </div>
              {!isSuper && restricted && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {ADMIN_RESOURCES.map((r) => {
                    const checked = userPerms.has(r.key);
                    return (
                      <label key={r.key} className="flex items-center gap-2 rounded-xl border border-border p-2 text-xs">
                        <input type="checkbox" checked={checked} onChange={(e) => toggle(p.id, r.key, e.target.checked)} />
                        <span>{r.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
