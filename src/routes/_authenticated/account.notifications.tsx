import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Mail, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Prefs = {
  refunds_inapp: boolean;
  refunds_email: boolean;
  cancellations_inapp: boolean;
  cancellations_email: boolean;
  marketing_email: boolean;
};

const DEFAULTS: Prefs = {
  refunds_inapp: true,
  refunds_email: true,
  cancellations_inapp: true,
  cancellations_email: true,
  marketing_email: false,
};

export const Route = createFileRoute("/_authenticated/account/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notification preferences · estora" },
      { name: "description", content: "Choose how you get updates on refunds and cancellations." },
    ],
  }),
});

function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [emailDomainReady, setEmailDomainReady] = useState<boolean | null>(null);
  const [emailFailing, setEmailFailing] = useState(false);
  const [autoFellBack, setAutoFellBack] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return;
      const { data } = await supabase
        .from("notification_preferences")
        .select("refunds_inapp,refunds_email,cancellations_inapp,cancellations_email,marketing_email")
        .eq("user_id", uid)
        .maybeSingle();
      let loaded = (data as Prefs | null) ?? DEFAULTS;

      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "email_sending_active")
        .maybeSingle();
      const ready = Boolean(setting?.value);
      setEmailDomainReady(ready);

      // Detect recent email failures for this user (last 30 days).
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("notification_events")
        .select("status")
        .eq("user_id", uid)
        .eq("channel", "email")
        .gte("created_at", since)
        .limit(50);
      const events = recent ?? [];
      const failed = events.filter((e) => e.status === "failed").length;
      const sent = events.filter((e) => e.status === "sent").length;
      const failing = failed > 0 && failed >= sent;
      setEmailFailing(failing);

      // Auto-fallback: if email can't be delivered, make sure in-app is on so
      // the user still hears about important updates.
      if ((!ready || failing) && (!loaded.refunds_inapp || !loaded.cancellations_inapp)) {
        loaded = { ...loaded, refunds_inapp: true, cancellations_inapp: true };
        setAutoFellBack(true);
        void supabase
          .from("notification_preferences")
          .upsert({ user_id: uid, ...loaded }, { onConflict: "user_id" });
      }
      setPrefs(loaded);
    })();
  }, []);


  async function save() {
    if (!prefs) return;
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) { setSaving(false); return; }
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: uid, ...prefs }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Preferences saved");
  }

  function set<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    setPrefs((p) => (p ? { ...p, [k]: v } : p));
  }

  if (!prefs) return <div className="container-x py-12"><p className="text-sm text-muted-foreground">Loading…</p></div>;

  return (
    <div className="container-x py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
          <h1 className="text-3xl font-black">Notification preferences</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose how we reach you about your orders.</p>
        </div>
        <div className="flex gap-2">
          <Link to={"/account/activity" as never} className="rounded-full border border-border px-4 py-2 text-sm">Activity log</Link>
          <Link to="/account/orders" className="rounded-full border border-border px-4 py-2 text-sm">Back to orders</Link>
        </div>
      </div>

      {emailDomainReady === false && (
        <div className="mb-4 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm">
          <p className="font-bold text-yellow-900">Email delivery is being set up</p>
          <p className="mt-1 text-yellow-900/80">
            Email updates are turned off automatically. We'll keep sending in‑app notifications so you don't miss anything, and email will switch on as soon as our sender domain finishes verification.
          </p>
        </div>
      )}
      {emailDomainReady && emailFailing && (
        <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm">
          <p className="font-bold text-red-900">Emails to you are bouncing</p>
          <p className="mt-1 text-red-900/80">
            Recent refund/cancellation emails to your address failed to deliver. We've kept in‑app notifications on as a backup. Please check your email address on file or contact support.
          </p>
        </div>
      )}
      {autoFellBack && (
        <div className="mb-6 rounded-2xl border border-border bg-surface p-3 text-xs text-muted-foreground">
          In‑app notifications were automatically switched on for you as a fallback.
        </div>
      )}


      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Refunds</h2>
        <p className="text-sm text-muted-foreground">Updates when you request a refund or its status changes.</p>
        <div className="mt-4 space-y-2">
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label="Show in‑app notifications"
            checked={prefs.refunds_inapp}
            onChange={(v) => set("refunds_inapp", v)}
          />
          <Toggle
            icon={<Mail className="h-4 w-4" />}
            label="Send email updates"
            checked={prefs.refunds_email}
            onChange={(v) => set("refunds_email", v)}
            disabled={emailDomainReady === false || emailFailing}
            help={emailDomainReady === false ? "Available once email sending is active." : emailFailing ? "Paused — recent emails to you failed." : undefined}
          />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Cancellations</h2>
        <p className="text-sm text-muted-foreground">Updates when you request an order cancellation.</p>
        <div className="mt-4 space-y-2">
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label="Show in‑app notifications"
            checked={prefs.cancellations_inapp}
            onChange={(v) => set("cancellations_inapp", v)}
          />
          <Toggle
            icon={<Mail className="h-4 w-4" />}
            label="Send email updates"
            checked={prefs.cancellations_email}
            onChange={(v) => set("cancellations_email", v)}
            disabled={emailDomainReady === false || emailFailing}
            help={emailDomainReady === false ? "Available once email sending is active." : emailFailing ? "Paused — recent emails to you failed." : undefined}
          />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Marketing</h2>
        <p className="text-sm text-muted-foreground">Occasional news about new collections and sales.</p>
        <div className="mt-4">
          <Toggle
            icon={<Mail className="h-4 w-4" />}
            label="Send marketing emails"
            checked={prefs.marketing_email}
            onChange={(v) => set("marketing_email", v)}
            disabled={emailDomainReady === false || emailFailing}
            help={emailDomainReady === false ? "Available once email sending is active." : emailFailing ? "Paused — recent emails to you failed." : undefined}
          />
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  icon, label, checked, onChange, disabled, help,
}: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; help?: string }) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-2xl border border-border p-3 ${disabled ? "opacity-60" : "hover:bg-surface"}`}>
      <span className="flex items-center gap-3 text-sm">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface">{icon}</span>
        <span>
          <span className="block font-semibold">{label}</span>
          {help && <span className="block text-xs text-muted-foreground">{help}</span>}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-border transition-colors checked:bg-foreground relative after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform checked:after:translate-x-4"
      />
    </label>
  );
}
