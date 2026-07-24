import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { loadSettings, saveSetting, type SettingsMap } from "@/lib/settings-store";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const [s, setS] = useState<SettingsMap | null>(null);
  useEffect(() => { loadSettings().then(setS); }, []);
  if (!s) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function save<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]) {
    try {
      await saveSetting(key, value);
      setS((prev) => (prev ? { ...prev, [key]: value } : prev));
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Announcement bar */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-black">Announcement bar</h2>
        <p className="mt-1 text-sm text-muted-foreground">Shown at the very top of every page.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Text</span>
            <input className="rounded-full border border-border bg-background px-4 py-2 text-sm" value={s.announcement.text} onChange={(e) => setS({ ...s, announcement: { ...s.announcement, text: e.target.value } })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link URL</span>
            <input className="rounded-full border border-border bg-background px-4 py-2 text-sm" value={s.announcement.href} onChange={(e) => setS({ ...s, announcement: { ...s.announcement, href: e.target.value } })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.announcement.enabled} onChange={(e) => setS({ ...s, announcement: { ...s.announcement, enabled: e.target.checked } })} />
            Show announcement bar
          </label>
        </div>
        <button onClick={() => save("announcement", s.announcement)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"><Save className="h-4 w-4" /> Save</button>
      </section>

      {/* Hero */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-black">Home hero copy</h2>
        <div className="mt-4 grid gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
            <input className="rounded-full border border-border bg-background px-4 py-2 text-sm" value={s.hero.title} onChange={(e) => setS({ ...s, hero: { ...s.hero, title: e.target.value } })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subtitle</span>
            <textarea className="rounded-2xl border border-border bg-background px-4 py-2 text-sm" rows={2} value={s.hero.subtitle} onChange={(e) => setS({ ...s, hero: { ...s.hero, subtitle: e.target.value } })} />
          </label>
        </div>
        <button onClick={() => save("hero", s.hero)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"><Save className="h-4 w-4" /> Save</button>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-black">Contact info</h2>
        <p className="mt-1 text-sm text-muted-foreground">Used on the Contact page and in the footer.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
            <input type="email" className="rounded-full border border-border bg-background px-4 py-2 text-sm" value={s.contact.email} onChange={(e) => setS({ ...s, contact: { ...s.contact, email: e.target.value } })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</span>
            <input className="rounded-full border border-border bg-background px-4 py-2 text-sm" value={s.contact.phone} onChange={(e) => setS({ ...s, contact: { ...s.contact, phone: e.target.value } })} />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</span>
            <input className="rounded-full border border-border bg-background px-4 py-2 text-sm" value={s.contact.address} onChange={(e) => setS({ ...s, contact: { ...s.contact, address: e.target.value } })} />
          </label>
        </div>
        <button onClick={() => save("contact", s.contact)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"><Save className="h-4 w-4" /> Save</button>
      </section>
    </div>
  );
}
