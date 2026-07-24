import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MailWarning, X, Loader2 } from "lucide-react";

const DISMISS_KEY = "estora:emailVerifyDismissed";

export function EmailVerificationBanner() {
  const [email, setEmail] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    }
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) { setNeedsVerify(false); return; }
      setEmail(u.email ?? null);
      // App identity provider: only email/password users need to verify.
      const isEmailProvider = (u.app_metadata?.providers ?? []).includes("email") || u.app_metadata?.provider === "email";
      setNeedsVerify(Boolean(isEmailProvider && !u.email_confirmed_at));
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void check(); });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  if (!needsVerify || dismissed || !email) return null;

  return (
    <div className="w-full bg-amber-50 text-amber-900 border-b border-amber-200">
      <div className="container-x flex flex-wrap items-center gap-3 py-2 text-sm">
        <MailWarning className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 min-w-0">
          Please verify <b className="break-all">{email}</b> to unlock orders and account features.
        </span>
        <button
          disabled={sending}
          onClick={async () => {
            setSending(true);
            const { error } = await supabase.auth.resend({
              type: "signup",
              email,
              options: { emailRedirectTo: `${window.location.origin}/auth` },
            });
            setSending(false);
            if (error) toast.error(error.message);
            else toast.success("Verification email sent — check your inbox.");
          }}
          className="inline-flex items-center gap-1 rounded-full bg-amber-900 px-3 py-1 text-xs font-bold text-amber-50 hover:bg-amber-800 disabled:opacity-60"
        >
          {sending && <Loader2 className="h-3 w-3 animate-spin" />}
          Resend email
        </button>
        <button
          aria-label="Dismiss"
          onClick={() => { sessionStorage.setItem(DISMISS_KEY, "1"); setDismissed(true); }}
          className="rounded-full p-1 hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
