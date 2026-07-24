import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { can, usePermissions, type AdminResource } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    if (typeof window !== "undefined" && localStorage.getItem("estora:demo_mode") === "true") {
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) throw redirect({ to: "/auth" });
    const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: uid, _role: "super_admin" }),
    ]);
    if (!isAdmin && !isSuper) throw redirect({ to: "/admin-claim" as never });

    // Super admins are required to complete TOTP MFA to reach /admin.
    if (isSuper) {
      const [{ data: aal }, { data: factors }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      const verified = (factors?.totp ?? []).filter((f) => f.status === "verified");
      if (verified.length === 0) throw redirect({ to: "/account/mfa-setup" as never });
      if (aal?.currentLevel !== "aal2") throw redirect({ to: "/mfa" as never });
    }
  },
  component: AdminLayout,
});


type Tab = { to: string; label: string; resource: AdminResource };

function AdminLayout() {
  const perms = usePermissions();
  const tabs: Tab[] = [
    { to: "/admin", label: "Overview", resource: "overview" },
    { to: "/admin/products", label: "Products", resource: "products" },
    { to: "/admin/inventory", label: "Inventory", resource: "inventory" },
    { to: "/admin/inventory-log", label: "Stock log", resource: "inventory" },
    { to: "/admin/blog", label: "Blog", resource: "blog" },
    { to: "/admin/media", label: "Media", resource: "media" },
    { to: "/admin/orders", label: "Orders", resource: "orders" },
    { to: "/admin/refunds", label: "Refunds", resource: "refunds" },
    { to: "/admin/email-preview", label: "Email templates", resource: "refunds" },
    { to: "/admin/email-log", label: "Email log", resource: "refunds" },
    { to: "/admin/promos", label: "Promos", resource: "promos" },
    { to: "/admin/subscribers", label: "Subscribers", resource: "subscribers" },
    { to: "/admin/messages", label: "Messages", resource: "messages" },
    { to: "/admin/reviews", label: "Reviews", resource: "reviews" },
    { to: "/admin/users", label: "Users", resource: "users" },
    { to: "/admin/roles", label: "Roles & Permissions", resource: "permissions" },
    { to: "/admin/roles-bulk", label: "Bulk import", resource: "permissions" },
    { to: "/admin/permissions", label: "Permission Templates", resource: "permissions" },
    { to: "/admin/audit", label: "Audit Log", resource: "audit" },
    { to: "/admin/settings", label: "Settings", resource: "settings" },
    { to: "/admin/auth-status", label: "Auth status", resource: "settings" },
  ];
  const visible = perms.loading ? tabs : tabs.filter((t) => can(perms, t.resource));
  return (
    <div className="container-fluid py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black">Admin</h1>
        {perms.isSuperAdmin && (
          <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-bold text-background">SUPER ADMIN</span>
        )}
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 border-b border-border pb-2">
        {visible.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-surface"
            activeProps={{ className: "rounded-full px-4 py-1.5 text-sm font-semibold bg-foreground text-background" }}
            activeOptions={{ exact: true }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
