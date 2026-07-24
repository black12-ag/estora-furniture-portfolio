// Shared promo catalog + persistence — DB backed with hardcoded fallback.
import { supabase } from "@/integrations/supabase/client";

export type Promo = { code: string; pct: number; label: string; freeShipping?: boolean };

const FALLBACK: Record<string, Promo> = {
  ESTORA20: { code: "ESTORA20", pct: 0.2, label: "20% off your order" },
  WELCOME10: { code: "WELCOME10", pct: 0.1, label: "10% welcome discount" },
  FREESHIP: { code: "FREESHIP", pct: 0, label: "Free shipping on any order", freeShipping: true },
};

let CACHE: Record<string, Promo> = { ...FALLBACK };
let loaded = false;
let loading: Promise<void> | null = null;

export async function loadPromoCatalog(): Promise<Record<string, Promo>> {
  if (loaded) return CACHE;
  if (!loading) {
    loading = (async () => {
      const { data } = await supabase
        .from("promo_codes")
        .select("code,label,pct,free_shipping,active,expires_at");
      if (data) {
        const now = Date.now();
        const next: Record<string, Promo> = {};
        for (const r of data) {
          if (!r.active) continue;
          if (r.expires_at && new Date(r.expires_at).getTime() < now) continue;
          next[r.code] = {
            code: r.code,
            pct: Number(r.pct) || 0,
            label: r.label || r.code,
            freeShipping: Boolean(r.free_shipping),
          };
        }
        if (Object.keys(next).length) CACHE = next;
      }
      loaded = true;
    })();
  }
  await loading;
  return CACHE;
}

// Kick off loading eagerly on client
if (typeof window !== "undefined") { void loadPromoCatalog(); }

export const PROMOS: Record<string, Promo> = new Proxy({} as Record<string, Promo>, {
  get: (_t, key: string) => CACHE[key],
  ownKeys: () => Reflect.ownKeys(CACHE),
  getOwnPropertyDescriptor: (_t, k) => Object.getOwnPropertyDescriptor(CACHE, k),
  has: (_t, k: string) => k in CACHE,
});

const KEY = "estora.promo.v1";

export function loadPromo(): Promo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return CACHE[p.code] ?? null;
  } catch { return null; }
}

export function savePromo(p: Promo | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("estora:promo", { detail: p }));
  } catch { /* ignore */ }
}

export type PromoValidation =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "valid"; promo: Promo }
  | { status: "invalid"; message: string };

export async function validatePromoAsync(raw: string): Promise<PromoValidation> {
  const code = raw.trim().toUpperCase();
  if (!code) return { status: "idle" };
  if (code.length < 3) return { status: "invalid", message: "Code is too short" };
  if (!/^[A-Z0-9]+$/.test(code)) return { status: "invalid", message: "Letters and numbers only" };
  const cat = await loadPromoCatalog();
  const promo = cat[code];
  if (!promo) return { status: "invalid", message: "Code not recognised" };
  return { status: "valid", promo };
}

// Sync variant (uses cached catalog) — kept for existing callers.
export function validatePromo(raw: string): PromoValidation {
  const code = raw.trim().toUpperCase();
  if (!code) return { status: "idle" };
  if (code.length < 3) return { status: "invalid", message: "Code is too short" };
  if (!/^[A-Z0-9]+$/.test(code)) return { status: "invalid", message: "Letters and numbers only" };
  const promo = CACHE[code];
  if (!promo) return { status: "invalid", message: "Code not recognised" };
  return { status: "valid", promo };
}
