// Session bridge between Supabase auth and the app's per-user storage
// (cart, wishlist). Keeps the historical Session shape so existing code
// keeps working, but is now sourced from supabase.auth.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Session = { id: string; email: string; name?: string } | null;

const listeners = new Set<() => void>();
let cached: Session = null;
let initialized = false;

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("estora:demo_mode") === "true";
}

export function enableDemoMode() {
  if (typeof window === "undefined") return;
  localStorage.setItem("estora:demo_mode", "true");
  cached = { id: "demo-admin-id", email: "guest-admin@estora.com", name: "Guest Admin" };
  emit();
  window.dispatchEvent(new CustomEvent("estora:session", { detail: cached }));
}

export function disableDemoMode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("estora:demo_mode");
  void refresh();
}

function emit() {
  listeners.forEach((l) => l());
}

async function refresh() {
  if (typeof window === "undefined") return;
  if (isDemoMode()) {
    cached = { id: "demo-admin-id", email: "guest-admin@estora.com", name: "Guest Admin" };
    emit();
    window.dispatchEvent(new CustomEvent("estora:session", { detail: cached }));
    return;
  }
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  cached = u
    ? {
        id: u.id,
        email: (u.email ?? "").toLowerCase(),
        name:
          (u.user_metadata?.name as string | undefined) ??
          (u.user_metadata?.full_name as string | undefined) ??
          (u.email ? u.email.split("@")[0] : undefined),
      }
    : null;
  emit();
  window.dispatchEvent(new CustomEvent("estora:session", { detail: cached }));
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  void refresh();
  supabase.auth.onAuthStateChange(() => { void refresh(); });
}

export function getSession(): Session {
  ensureInit();
  return cached;
}

export async function signInEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signUpEmail(email: string, password: string, name?: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  return { error };
}

export async function signInGoogle(intendedPath?: string) {
  const { lovable } = await import("@/integrations/lovable");
  if (typeof window !== "undefined") {
    const safe = intendedPath && intendedPath.startsWith("/") ? intendedPath : "";
    if (safe) sessionStorage.setItem("estora:postAuthRedirect", safe);
  }
  const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
  return lovable.auth.signInWithOAuth("google", { redirect_uri: redirect });
}

export function consumePostAuthRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem("estora:postAuthRedirect");
  if (v) sessionStorage.removeItem("estora:postAuthRedirect");
  return v && v.startsWith("/") ? v : null;
}

export async function signOut() {
  if (isDemoMode()) {
    disableDemoMode();
    return;
  }
  await supabase.auth.signOut();
  cached = null;
  emit();
}

export function userBucket(s: Session): string {
  return s?.id ? `u_${s.id.slice(0, 12)}` : "guest";
}

function subscribe(cb: () => void) {
  ensureInit();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useSession(): Session {
  return useSyncExternalStore(subscribe, () => cached, () => null);
}
