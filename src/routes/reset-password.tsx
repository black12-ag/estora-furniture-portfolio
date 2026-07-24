import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { checkRateLimit, recordAttempt, clearAttempts, formatWait } from "@/lib/rate-limit";

const LIMIT = { key: "rl:reset-pw-submit", max: 5, windowMs: 10 * 60 * 1000, lockMs: 10 * 60 * 1000 };

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("same") && m.includes("password")) return "That's your current password — pick a new one.";
  if (m.includes("weak") || m.includes("short")) return "Password is too weak. Use at least 8 characters, mixing letters, numbers, and symbols.";
  if (m.includes("expired") || m.includes("invalid")) return "This reset link is invalid or expired. Please request a new one.";
  if (m.includes("rate") || m.includes("429")) return "Too many attempts. Please wait a few minutes before trying again.";
  return "We couldn't update your password. Please try again.";
}

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Estora" },
      { name: "description", content: "Choose a new password for your Estora account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (data.session && (hash.includes("type=recovery") || ready)) setReady(true);
      else if (!hash.includes("type=recovery") && !data.session) {
        setReason("This reset link is invalid or has expired. Please request a new one.");
      } else if (data.session) setReady(true);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [ready]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }

    const gate = checkRateLimit(LIMIT);
    if (!gate.ok) {
      toast.error(`Too many attempts. Try again in ${formatWait(gate.retryAfterMs)}.`);
      return;
    }

    setLoading(true);
    recordAttempt(LIMIT);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(friendlyError(error.message)); return; }
    clearAttempts(LIMIT.key);
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-black">Set a new password</h1>
        </div>

        {reason && !ready ? (
          <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-800">
            {reason}
            <div className="mt-3">
              <Link to="/forgot-password" className="font-bold text-red-900 underline">Request a new link</Link>
            </div>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="text-xs font-semibold">New password</label>
              <input name="password" type="password" required minLength={8} autoComplete="new-password"
                className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold">Confirm new password</label>
              <input name="confirm" type="password" required minLength={8} autoComplete="new-password"
                className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" disabled={loading || (!ready && !reason)} className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
            {!ready && !reason && (
              <p className="text-center text-xs text-muted-foreground">Verifying reset link…</p>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/auth" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
