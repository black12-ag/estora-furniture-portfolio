import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Shield, ShieldOff, Crown, UserRound, UserCheck, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session-store";
import { usePermissions, ADMIN_RESOURCES, PERMISSION_TEMPLATES, type AdminResource } from "@/lib/permissions";
import { impersonateUser } from "@/lib/impersonation.functions";

type Profile = { id: string; name: string | null; email: string | null; created_at: string };
type RoleRow = { user_id: string; role: "admin" | "customer" | "super_admin" };
type PermRow = { user_id: string; resource: string };


const ROLES: RoleRow["role"][] = ["customer", "admin", "super_admin"];

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({ meta: [{ title: "Roles & permissions — Admin" }, { name: "robots", content: "noindex" }] }),
  component: RolesPage,
});

function RolesPage() {
  const perms = usePermissions();
  const session = useSession();
  const impersonate = useServerFn(impersonateUser);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermRow[]>([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);


  async function load() {
    const [{ data: ps, error: pe }, { data: rs, error: re }, { data: prs, error: pre }] = await Promise.all([
      supabase.from("profiles").select("id,name,email,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("admin_permissions").select("user_id,resource"),
    ]);
    if (pe) toast.error(pe.message);
    if (re) toast.error(re.message);
    if (pre) toast.error(pre.message);
    setProfiles((ps ?? []) as Profile[]);
    setRoles((rs ?? []) as RoleRow[]);
    setPermissions((prs ?? []) as PermRow[]);
  }
  useEffect(() => { if (perms.isSuperAdmin || perms.isAdmin) void load(); }, [perms.isSuperAdmin, perms.isAdmin]);

  const rolesByUser = useMemo(() => {
    const m = new Map<string, Set<RoleRow["role"]>>();
    for (const r of roles) {
      const s = m.get(r.user_id) ?? new Set();
      s.add(r.role);
      m.set(r.user_id, s);
    }
    return m;
  }, [roles]);
  const permsByUser = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const p of permissions) {
      const s = m.get(p.user_id) ?? new Set();
      s.add(p.resource);
      m.set(p.user_id, s);
    }
    return m;
  }, [permissions]);

  const filtered = useMemo(() => {
    if (!profiles) return null;
    const s = q.trim().toLowerCase();
    if (!s) return profiles;
    return profiles.filter((p) => (p.email ?? "").toLowerCase().includes(s) || (p.name ?? "").toLowerCase().includes(s));
  }, [profiles, q]);

  const selected = useMemo(() => filtered?.find((p) => p.id === selectedId) ?? null, [filtered, selectedId]);

  async function toggleRole(uid: string, role: RoleRow["role"], on: boolean) {
    if (uid === session?.id && role !== "customer" && !on) {
      if (!confirm(`Revoke YOUR OWN ${role} role? You may lose access to this page.`)) return;
    }
    if (on) {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
      toast.success(`Granted ${role}`);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
      toast.success(`Revoked ${role}`);
    }
    load();
  }

  async function togglePerm(uid: string, resource: AdminResource, on: boolean) {
    if (on) {
      const { error } = await supabase.from("admin_permissions").insert({ user_id: uid, resource });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("admin_permissions").delete().eq("user_id", uid).eq("resource", resource);
      if (error) return toast.error(error.message);
    }
    load();
  }

  async function grantFullAccess(uid: string) {
    const { error } = await supabase.from("admin_permissions").delete().eq("user_id", uid);
    if (error) return toast.error(error.message);
    toast.success("Full access restored");
    load();
  }
  async function applyTemplate(uid: string, templateId: string) {
    if (!templateId) return;
    const tpl = PERMISSION_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    await supabase.from("admin_permissions").delete().eq("user_id", uid);
    const rows = tpl.resources.map((r) => ({ user_id: uid, resource: r }));
    const { error } = await supabase.from("admin_permissions").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Applied template: ${tpl.name}`);
    load();
  }

  async function startImpersonation(uid: string, email: string | null) {
    if (!perms.isSuperAdmin) return toast.error("Only super admins can impersonate.");
    if (uid === session?.id) return toast.error("You cannot impersonate yourself.");
    const reason = window.prompt(
      `Impersonate ${email ?? uid}?\n\nThis will open a NEW TAB signed in as this user and record the event to the impersonation audit log.\n\nPlease enter a short reason (visible to admins):`,
      "Support investigation",
    );
    if (reason === null) return;
    setImpersonating(uid);
    try {
      const res = await impersonate({
        data: {
          targetUserId: uid,
          reason: reason.trim() || undefined,
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      const w = window.open(res.actionLink, "_blank", "noopener,noreferrer");
      if (!w) toast.error("Pop-up blocked. Allow pop-ups and try again.");
      else toast.success(`Impersonating ${res.targetEmail} in a new tab.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impersonation failed.");
    } finally {
      setImpersonating(null);
    }
  }


  if (perms.loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!perms.isAdmin && !perms.isSuperAdmin) return <p className="text-sm text-muted-foreground">Admins only.</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      {/* User list */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <ul className="max-h-[70vh] divide-y divide-border overflow-auto">
            {filtered?.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">No users match.</li>}
            {filtered?.map((p) => {
              const rs = rolesByUser.get(p.id) ?? new Set();
              const isSel = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface ${isSel ? "bg-surface" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name ?? p.email ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {rs.has("super_admin") && <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">SUPER</span>}
                      {rs.has("admin") && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">ADMIN</span>}
                      {!rs.has("admin") && !rs.has("super_admin") && <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold">customer</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Detail */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {!selected ? (
          <div className="grid h-full min-h-[300px] place-items-center text-sm text-muted-foreground">
            <div className="text-center">
              <UserRound className="mx-auto mb-2 h-8 w-8 opacity-50" />
              Select a user to manage their roles and permissions.
            </div>
          </div>
        ) : (
          <UserDetail
            profile={selected}
            userRoles={rolesByUser.get(selected.id) ?? new Set()}
            userPerms={permsByUser.get(selected.id) ?? new Set()}
            canEditSuper={perms.isSuperAdmin}
            canImpersonate={perms.isSuperAdmin && selected.id !== session?.id}
            impersonating={impersonating === selected.id}
            currentUserId={session?.id ?? null}
            onToggleRole={(role, on) => toggleRole(selected.id, role, on)}
            onTogglePerm={(res, on) => togglePerm(selected.id, res, on)}
            onGrantFull={() => grantFullAccess(selected.id)}
            onApplyTemplate={(id) => applyTemplate(selected.id, id)}
            onImpersonate={() => startImpersonation(selected.id, selected.email)}
          />

        )}
      </div>
    </div>
  );
}

function UserDetail(props: {
  profile: Profile;
  userRoles: Set<RoleRow["role"]>;
  userPerms: Set<string>;
  canEditSuper: boolean;
  canImpersonate: boolean;
  impersonating: boolean;
  currentUserId: string | null;
  onToggleRole: (role: RoleRow["role"], on: boolean) => void;
  onTogglePerm: (res: AdminResource, on: boolean) => void;
  onGrantFull: () => void;
  onApplyTemplate: (id: string) => void;
  onImpersonate: () => void;
}) {
  const { profile, userRoles, userPerms, canEditSuper, canImpersonate, impersonating,
    onToggleRole, onTogglePerm, onGrantFull, onApplyTemplate, onImpersonate } = props;
  const isAdmin = userRoles.has("admin") || userRoles.has("super_admin");
  const restricted = userPerms.size > 0 && !userRoles.has("super_admin");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">User</p>
          <p className="text-lg font-black">{profile.name ?? profile.email}</p>
          <p className="text-xs text-muted-foreground">{profile.email} · joined {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
        {canImpersonate && (
          <button
            onClick={onImpersonate}
            disabled={impersonating}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface disabled:opacity-60"
            title="Sign in as this user in a new tab (audited)"
          >
            <UserCheck className="h-3.5 w-3.5" />
            {impersonating ? "Preparing…" : "Impersonate"}
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>
        )}
      </div>


      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Roles</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((role) => {
            const on = userRoles.has(role);
            const disabled = role === "super_admin" && !canEditSuper;
            const Icon = role === "super_admin" ? Crown : role === "admin" ? Shield : UserRound;
            return (
              <button
                key={role}
                disabled={disabled}
                onClick={() => onToggleRole(role, !on)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition ${
                  on ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-surface"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-semibold capitalize">{role.replace("_", " ")}</p>
                  <p className={`text-[10px] ${on ? "opacity-80" : "text-muted-foreground"}`}>
                    {on ? "Granted" : "Not granted"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {!canEditSuper && <p className="mt-2 text-[11px] text-muted-foreground">Only super admins can grant or revoke the super admin role.</p>}
      </div>

      {isAdmin && !userRoles.has("super_admin") && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Admin permissions {restricted ? `— restricted (${userPerms.size})` : "— full access"}
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                defaultValue=""
                onChange={(e) => { onApplyTemplate(e.target.value); e.currentTarget.value = ""; }}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold"
              >
                <option value="">Apply template…</option>
                {PERMISSION_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {restricted && (
                <button onClick={onGrantFull} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface">
                  <ShieldOff className="h-3 w-3" /> Full access
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {ADMIN_RESOURCES.map((r) => {
              const on = userPerms.has(r.key);
              const effective = !restricted || on;
              return (
                <label
                  key={r.key}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-xs ${effective ? "border-border" : "border-dashed border-border/50 opacity-60"}`}
                >
                  <input type="checkbox" checked={on} onChange={(e) => onTogglePerm(r.key, e.target.checked)} />
                  <span>{r.label}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            With no boxes ticked, the admin has full access to all areas. Tick to restrict them to only those areas.
          </p>
        </div>
      )}

      {!isAdmin && (
        <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          Grant the <b>admin</b> role above to unlock area-level permissions for this user.
        </div>
      )}
    </div>
  );
}
