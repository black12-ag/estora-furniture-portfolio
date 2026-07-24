import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, MailCheck, Check } from "lucide-react";
import { checkRateLimit, recordAttempt, formatWait } from "@/lib/rate-limit";
import { useSession } from "@/lib/session-store";

const LIMIT = { key: "rl:verify-resend", max: 3, windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000 };

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Resend verification email — Estora" },
      { name: "description", content: "Resend your Estora account verification email." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    if (session?.email) setEmail(session.email);
    void supabase.auth.getUser().then(({ data }) => {
      setAlreadyVerified(!!data.user?.email_confirmed_at);
    });
  }, [session?.email]);


  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    const gate = checkRateLimit(LIMIT);
    if (!gate.ok) {
      toast.error(`Too many attempts. Try again in ${formatWait(gate.retryAfterMs)}.`);
      return;
    }
    setLoading(true);
    recordAttempt(LIMIT);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: addr,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    // Show a neutral success to avoid leaking account existence, unless it's
    // a hard error unrelated to enumeration.
    if (error && !/already|confirmed|not.?found/i.test(error.message)) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <MailCheck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-black">Verify your email</h1>
          <p className="text-center text-sm text-muted-foreground">
            Didn't get the email? Enter your address and we'll send a fresh verification link.
          </p>
        </div>

        {alreadyVerified ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-900">
            <Check className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm font-semibold">Your email is already verified.</p>
            <div className="mt-3">
              <Link to="/" className="font-bold underline">Back to store</Link>
            </div>
          </div>
        ) : sent ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-900">
            <Check className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm font-semibold">Check your inbox</p>
            <p className="mt-1 text-xs">If an account exists for that email, a new verification link is on its way. Check spam if you don't see it in a couple of minutes.</p>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="text-xs font-semibold">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send verification email
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              For your security we limit resends. If nothing arrives, wait a few minutes and try again.
            </p>
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
