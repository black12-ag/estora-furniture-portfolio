import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminResource =
  | "overview"
  | "products"
  | "blog"
  | "media"
  | "orders"
  | "refunds"
  | "inventory"
  | "promos"
  | "subscribers"
  | "messages"
  | "reviews"
  | "users"
  | "permissions"
  | "audit"
  | "settings";

export type PermissionState = {
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  // If null → unrestricted (no rows in admin_permissions).
  // If a Set → user is restricted to just those resources.
  allowed: Set<AdminResource> | null;
};

export function can(state: PermissionState, resource: AdminResource): boolean {
  if (!state.isAdmin && !state.isSuperAdmin) return false;
  if (state.isSuperAdmin) return true;
  if (state.allowed === null) return true;
  return state.allowed.has(resource);
}

export function usePermissions(): PermissionState {
  const [state, setState] = useState<PermissionState>({
    loading: true,
    isAdmin: false,
    isSuperAdmin: false,
    allowed: null,
  });

  useEffect(() => {
    let cancelled = false;
    
    // Fast path for Demo Mode (Portfolio showcase)
    if (typeof window !== "undefined" && localStorage.getItem("estora:demo_mode") === "true") {
      setState({
        loading: false,
        isAdmin: true,
        isSuperAdmin: true,
        allowed: null,
      });
      return;
    }

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        if (!cancelled) setState({ loading: false, isAdmin: false, isSuperAdmin: false, allowed: null });
        return;
      }
      const [{ data: roles }, { data: perms }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("admin_permissions").select("resource").eq("user_id", uid),
      ]);
      const roleSet = new Set((roles ?? []).map((r) => r.role));
      const isSuper = roleSet.has("super_admin");
      const isAdmin = roleSet.has("admin") || isSuper;
      const permRows = perms ?? [];
      const allowed = isSuper
        ? null
        : permRows.length === 0
          ? null
          : new Set(permRows.map((r) => r.resource as AdminResource));
      if (!cancelled) setState({ loading: false, isAdmin, isSuperAdmin: isSuper, allowed });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export const ADMIN_RESOURCES: { key: AdminResource; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "products", label: "Products" },
  { key: "inventory", label: "Inventory" },
  { key: "blog", label: "Blog" },
  { key: "media", label: "Media Library" },
  { key: "orders", label: "Orders" },
  { key: "refunds", label: "Refunds & Cancellations" },
  { key: "promos", label: "Promos" },
  { key: "subscribers", label: "Subscribers" },
  { key: "messages", label: "Messages" },
  { key: "reviews", label: "Reviews" },
  { key: "users", label: "Users" },
  { key: "permissions", label: "Permissions" },
  { key: "audit", label: "Audit Log" },
  { key: "settings", label: "Settings" },
];

export type PermissionTemplate = {
  id: string;
  name: string;
  description: string;
  resources: AdminResource[];
};

export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: "orders_only",
    name: "Orders only",
    description: "Handle orders, refunds, and cancellations — nothing else.",
    resources: ["overview", "orders", "refunds"],
  },
  {
    id: "support",
    name: "Support",
    description: "Answer messages, moderate reviews, and manage refunds.",
    resources: ["overview", "messages", "reviews", "orders", "refunds"],
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Blog posts, promo codes, subscribers, and site settings.",
    resources: ["overview", "blog", "promos", "subscribers", "settings", "media"],
  },
  {
    id: "catalog",
    name: "Catalog manager",
    description: "Products, media, and inventory — no order or user access.",
    resources: ["overview", "products", "inventory", "media"],
  },
  {
    id: "fulfillment",
    name: "Fulfillment",
    description: "Warehouse ops: orders, refunds, and inventory.",
    resources: ["overview", "orders", "refunds", "inventory"],
  },
  {
    id: "read_only",
    name: "Read‑only",
    description: "Overview and audit log only — no changes allowed via UI.",
    resources: ["overview", "audit"],
  },
];

