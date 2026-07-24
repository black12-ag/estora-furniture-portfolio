// Site settings — DB-backed key/value store with in-memory cache and live updates.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Announcement = { text: string; enabled: boolean; href: string };
export type HeroCopy = { title: string; subtitle: string };
export type ContactInfo = { email: string; phone: string; address: string };

export type SettingsMap = {
  announcement: Announcement;
  hero: HeroCopy;
  contact: ContactInfo;
};

const DEFAULTS: SettingsMap = {
  announcement: { text: "Free delivery on orders over $200 · Ends this week", enabled: true, href: "/sale" },
  hero: { title: "Modern living, made to last", subtitle: "Curated furniture that feels like home." },
  contact: { email: "muay01111@l.com", phone: "", address: "" },
};

let CACHE: SettingsMap = { ...DEFAULTS };
let loaded = false;
let inflight: Promise<SettingsMap> | null = null;
const listeners = new Set<() => void>();

export async function loadSettings(): Promise<SettingsMap> {
  if (loaded) return CACHE;
  if (!inflight) {
    inflight = (async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      if (data) {
        const next: SettingsMap = { ...DEFAULTS };
        for (const row of data) {
          if (row.key in next) (next as Record<string, unknown>)[row.key] = { ...(next as Record<string, unknown>)[row.key] as object, ...(row.value as object) };
        }
        CACHE = next;
      }
      loaded = true;
      listeners.forEach((fn) => fn());
      return CACHE;
    })();
  }
  return inflight;
}

export async function saveSetting<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]) {
  const { error } = await supabase.from("site_settings").upsert({ key, value: value as unknown as never });
  if (error) throw error;
  CACHE = { ...CACHE, [key]: value };
  listeners.forEach((fn) => fn());
}

export function useSettings(): SettingsMap {
  const [snap, setSnap] = useState<SettingsMap>(CACHE);
  useEffect(() => {
    const notify = () => setSnap({ ...CACHE });
    listeners.add(notify);
    if (!loaded) void loadSettings().then(notify);
    return () => { listeners.delete(notify); };
  }, []);
  return snap;
}

if (typeof window !== "undefined") { void loadSettings(); }
