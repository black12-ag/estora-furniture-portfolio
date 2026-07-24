import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { checkRateLimit, recordAttempt, formatWait } from "@/lib/rate-limit";

const LIMIT = { key: "rl:forgot-pw", max: 3, windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000 };

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("rate") || m.includes("429")) return "Too many requests right now. Please wait a few minutes and try again.";
  if (m.includes("network") || m.includes("failed to fetch")) return "Network hiccup — check your connection and try again.";
  if (m.includes("invalid") && m.includes("email")) return "That doesn't look like a valid email address.";
  return "We couldn't send the reset link right now. Please try again in a moment.";
}

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Estora" },
      { name: "description", content: "Request a password reset link for your Estora account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    if (!email) return;

    const gate = checkRateLimit(LIMIT);
    if (!gate.ok) {
      toast.error(`Too many attempts. Try again in ${formatWait(gate.retryAfterMs)}.`);
      return;
    }

    setLoading(true);
    recordAttempt(LIMIT);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyError(error.message));
      return;
    }
    // Show neutral success even on unknown-email to avoid account enumeration.
    setSent(true);
  }

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-black">Reset your password</h1>
          <p className="text-center text-sm text-muted-foreground">
            Enter the email you use to sign in. We'll send a secure link to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-900">
            <Check className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm font-semibold">Check your inbox</p>
            <p className="mt-1 text-xs">If an account exists for that email, a reset link is on its way. Check spam if you don't see it.</p>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="text-xs font-semibold">Email</label>
              <input name="email" type="email" required autoComplete="email"
                className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              For your security we limit reset requests. Try again in 15 minutes if you hit the limit.
            </p>
          </form>
        )}

        <p className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <Link to="/auth" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
          <Link to="/verify-email" className="hover:underline">Resend verification email</Link>
        </p>
      </div>
    </div>
  );
}
