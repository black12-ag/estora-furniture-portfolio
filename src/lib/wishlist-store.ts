import { useEffect, useState, useSyncExternalStore } from "react";
import { getSession, userBucket } from "./session-store";

const keyFor = (bucket: string) => `estora.wishlist.v2.${bucket}`;
const LEGACY = "estora.wishlist.slugs.v1";

const listeners = new Set<() => void>();
let bucket = "guest";
let slugs: string[] = [];
let hydrated = false;

function read(b: string): string[] {
  try {
    const raw = localStorage.getItem(keyFor(b));
    if (raw) return JSON.parse(raw) as string[];
    if (b === "guest") {
      const legacy = localStorage.getItem(LEGACY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as string[];
        localStorage.setItem(keyFor("guest"), legacy);
        localStorage.removeItem(LEGACY);
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return [];
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  bucket = userBucket(getSession());
  slugs = read(bucket);
  hydrated = true;
  window.addEventListener("estora:session", (e: Event) => {
    const detail = (e as CustomEvent).detail as import("./session-store").Session;
    const newBucket = userBucket(detail);
    if (newBucket === bucket) return;
    // On sign-in from guest, merge favourites forward.
    const userSlugs = read(newBucket);
    const merged = Array.from(new Set([...userSlugs, ...slugs]));
    bucket = newBucket;
    slugs = merged;
    try { localStorage.setItem(keyFor(bucket), JSON.stringify(slugs)); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  });
}

function persist() {
  try { localStorage.setItem(keyFor(bucket), JSON.stringify(slugs)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function getSnapshot() { hydrate(); return slugs; }
function getServerSnapshot() { return [] as string[]; }

export function useWishlist() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return {
    slugs: mounted ? list : [],
    has: (slug: string) => mounted && list.includes(slug),
    toggle: (slug: string) => {
      hydrate();
      slugs = slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug];
      persist();
    },
    remove: (slug: string) => {
      hydrate();
      slugs = slugs.filter((s) => s !== slug);
      persist();
    },
  };
}
