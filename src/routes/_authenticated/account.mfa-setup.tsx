import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Copy, Trash2 } from "lucide-react";
import { challengeAndVerify, enrollTotp, listTotpFactors, unenrollFactor, type TotpFactor } from "@/lib/mfa";

export const Route = createFileRoute("/_authenticated/account/mfa-setup")({
  head: () => ({ meta: [{ title: "Set up two-factor authentication — Estora" }, { name: "robots", content: "noindex" }] }),
  component: MfaSetupPage,
});

function MfaSetupPage() {
  const navigate = useNavigate();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [pending, setPending] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function refresh() {
    setLoading(true);
    try { setFactors(await listTotpFactors()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load factors."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function startEnrollment() {
    setEnrolling(true);
    try {
      const res = await enrollTotp("Estora Admin");
      setPending({ factorId: res.factorId, qrCode: res.qrCode, secret: res.secret });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start enrollment.";
      if (/already/i.test(msg)) toast.error("You already have a factor pending. Remove it below and try again.");
      else toast.error(msg);
      await refresh();
    } finally {
      setEnrolling(false);
    }
  }

  async function verify() {
    if (!pending) return;
    setVerifying(true);
    try {
      await challengeAndVerify(pending.factorId, code.trim());
      toast.success("Two-factor authentication is now active.");
      setPending(null);
      setCode("");
      await refresh();
      navigate({ to: "/admin" as never, replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed.";
      toast.error(/invalid|code/i.test(msg) ? "That code didn't match. Try a fresh 6-digit code." : msg);
    } finally {
      setVerifying(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this authenticator? You'll be prompted to enroll a new one on next admin sign-in.")) return;
    try {
      await unenrollFactor(id);
      toast.success("Authenticator removed.");
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to remove factor."); }
  }

  const verified = factors.filter((f) => f.status === "verified");
  const unverified = factors.filter((f) => f.status === "unverified");

  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-black">Two-factor authentication</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account. Super admins are required to complete two-factor authentication before reaching the admin dashboard.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-8 space-y-6">
            {verified.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Active authenticators</h2>
                <ul className="divide-y divide-border">
                  {verified.map((f) => (
                    <li key={f.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold">{f.friendlyName ?? "TOTP authenticator"}</p>
                        <p className="text-xs text-emerald-700">Verified</p>
                      </div>
                      <button onClick={() => remove(f.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-surface">
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {pending ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Enroll a new authenticator</h2>
                <p className="mt-2 text-sm">Scan this QR code with Google Authenticator, 1Password, Authy, or a similar app.</p>
                <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-6">
                  {/* Supabase returns the QR as an SVG data URL */}
                  <img src={pending.qrCode} alt="TOTP QR code" className="h-48 w-48" />
                  <div className="w-full">
                    <p className="text-xs text-muted-foreground">Can't scan? Enter this secret manually:</p>
                    <div className="mt-1 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
                      <code className="flex-1 truncate font-mono text-xs">{pending.secret}</code>
                      <button onClick={() => { navigator.clipboard.writeText(pending.secret); toast.success("Copied"); }} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold">Enter the 6-digit code from your app to confirm</label>
                  <input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-center font-mono text-lg tracking-[0.5em] outline-none focus:border-primary" />
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={verify} disabled={verifying || code.length < 6} className="btn-primary inline-flex items-center gap-2 disabled:opacity-70">
                    {verifying && <Loader2 className="h-4 w-4 animate-spin" />} Activate
                  </button>
                  <button onClick={async () => { await unenrollFactor(pending.factorId).catch(() => undefined); setPending(null); setCode(""); refresh(); }} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">Cancel</button>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-border p-6 text-center">
                {verified.length === 0 && unverified.length === 0 && (
                  <p className="mb-3 text-sm">You haven't set up two-factor authentication yet.</p>
                )}
                <button onClick={startEnrollment} disabled={enrolling} className="btn-primary inline-flex items-center gap-2 disabled:opacity-70">
                  {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                  {verified.length === 0 ? "Set up authenticator" : "Add another authenticator"}
                </button>
                {unverified.length > 0 && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    Pending factor(s) — remove them if enrollment didn't finish:
                    <ul className="mt-2 space-y-1">
                      {unverified.map((f) => (
                        <li key={f.id} className="flex items-center justify-center gap-2">
                          <span>{f.friendlyName ?? f.id.slice(0, 8)}</span>
                          <button onClick={() => remove(f.id)} className="text-red-600 hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            <p className="text-xs text-muted-foreground">
              <Link to="/" className="hover:underline">← Back to store</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
