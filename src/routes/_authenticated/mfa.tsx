import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { challengeAndVerify, getAal, listTotpFactors, type TotpFactor } from "@/lib/mfa";
import { signOut } from "@/lib/session-store";
import { checkRateLimit, recordAttempt, formatWait, clearAttempts } from "@/lib/rate-limit";

const LIMIT = { key: "rl:mfa-challenge", max: 5, windowMs: 10 * 60 * 1000, lockMs: 10 * 60 * 1000 };

export const Route = createFileRoute("/_authenticated/mfa")({
  head: () => ({ meta: [{ title: "Two-factor authentication — Estora" }, { name: "robots", content: "noindex" }] }),
  component: MfaPage,
});

function MfaPage() {
  const navigate = useNavigate();
  const [factor, setFactor] = useState<TotpFactor | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void (async () => {
      const aal = await getAal();
      if (aal.current === "aal2") {
        navigate({ to: "/admin" as never, replace: true });
        return;
      }
      const factors = await listTotpFactors();
      const verified = factors.find((f) => f.status === "verified") ?? null;
      if (!verified) {
        navigate({ to: "/account/mfa-setup" as never, replace: true });
        return;
      }
      setFactor(verified);
      setChecking(false);
    })().catch((e) => {
      toast.error(e?.message ?? "Failed to load MFA status.");
      setChecking(false);
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!factor || code.trim().length < 6) return;
    const gate = checkRateLimit(LIMIT);
    if (!gate.ok) {
      toast.error(`Too many attempts. Try again in ${formatWait(gate.retryAfterMs)}.`);
      return;
    }
    setLoading(true);
    recordAttempt(LIMIT);
    try {
      await challengeAndVerify(factor.id, code.trim());
      clearAttempts(LIMIT.key);
      toast.success("Two-factor verified.");
      navigate({ to: "/admin" as never, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      toast.error(/invalid|code/i.test(msg) ? "That code didn't match. Try again with a fresh code from your app." : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-black">Two-factor authentication</h1>
          <p className="text-center text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app to continue to the admin area.
          </p>
        </div>

        {checking ? (
          <p className="text-center text-sm text-muted-foreground">Checking your MFA status…</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Authentication code</label>
              <input
                autoFocus inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-center text-lg font-mono tracking-[0.5em] outline-none focus:border-primary"
              />
            </div>
            <button type="submit" disabled={loading || code.length < 6}
              className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify
            </button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <Link to="/" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to store
          </Link>
          <button
            onClick={async () => { await signOut(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}
            className="hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
