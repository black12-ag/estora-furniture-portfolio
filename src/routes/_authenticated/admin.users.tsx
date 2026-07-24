import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldOff, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session-store";

type Profile = { id: string; name: string | null; email: string | null; avatar_url: string | null; created_at: string };
type RoleRow = { user_id: string; role: string };

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const session = useSession();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const [{ data: ps, error: pe }, { data: rs, error: re }] = await Promise.all([
      supabase.from("profiles").select("id,name,email,avatar_url,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    if (pe) toast.error(pe.message);
    if (re) toast.error(re.message);
    setProfiles((ps ?? []) as Profile[]);
    setRoles((rs ?? []) as RoleRow[]);
  }
  useEffect(() => { load(); }, []);

  const byUser = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of roles) {
      const arr = m.get(r.user_id) ?? [];
      arr.push(r.role);
      m.set(r.user_id, arr);
    }
    return m;
  }, [roles]);

  const filtered = useMemo(() => {
    if (!profiles) return null;
    const s = q.trim().toLowerCase();
    if (!s) return profiles;
    return profiles.filter((p) => (p.email ?? "").toLowerCase().includes(s) || (p.name ?? "").toLowerCase().includes(s));
  }, [profiles, q]);

  async function grantAdmin(uid: string) {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
    if (error) toast.error(error.message);
    else { toast.success("Admin granted"); load(); }
  }
  async function revokeAdmin(uid: string) {
    if (uid === session?.id && !confirm("Revoke YOUR OWN admin access? You will lose access to this panel.")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
    if (error) toast.error(error.message);
    else { toast.success("Admin revoked"); load(); }
  }

  if (!profiles) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name" className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered!.length === 0 && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={5}>No users match.</td></tr>}
            {filtered!.map((p) => {
              const userRoles = byUser.get(p.id) ?? [];
              const isAdmin = userRoles.includes("admin");
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                        : <div className="grid h-8 w-8 place-items-center rounded-full bg-surface text-xs font-bold">{(p.name ?? p.email ?? "?").slice(0, 1).toUpperCase()}</div>}
                      <span className="font-semibold">{p.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length === 0 && <span className="text-xs text-muted-foreground">customer</span>}
                      {userRoles.map((r) => (
                        <span key={r} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r === "admin" ? "bg-foreground text-background" : "bg-surface"}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin
                      ? <button onClick={() => revokeAdmin(p.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface"><ShieldOff className="h-3 w-3" /> Revoke admin</button>
                      : <button onClick={() => grantAdmin(p.id)} className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"><Shield className="h-3 w-3" /> Make admin</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
