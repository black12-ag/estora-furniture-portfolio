import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { signInEmail, signUpEmail, signInGoogle, useSession, consumePostAuthRedirect, enableDemoMode } from "@/lib/session-store";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Estora" },
      { name: "description", content: "Sign in or create an Estora account to track orders and save favourites." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const session = useSession();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });

  useEffect(() => {
    if (session) {
      const stored = consumePostAuthRedirect();
      const target = stored || (redirect && redirect.startsWith("/") ? redirect : "/");
      navigate({ to: target, replace: true });
    }
  }, [session, redirect, navigate]);

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-black">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground">Track orders, save favourites, faster checkout.</p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const res = await signInGoogle(redirect && redirect.startsWith("/") ? redirect : undefined);
            if (res?.error) toast.error(res.error.message || "Google sign-in failed");
          }}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-2.5 text-sm font-semibold hover:bg-accent"
        >
          Continue with Google
        </button>


        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get("email") || "").trim();
            const password = String(fd.get("password") || "");
            const name = String(fd.get("name") || "").trim() || undefined;
            if (!email || !password) return;
            setLoading(true);
            const { error } = mode === "signup"
              ? await signUpEmail(email, password, name)
              : await signInEmail(email, password);
            setLoading(false);
            if (error) { toast.error(error.message); return; }
            toast.success(mode === "signup" ? "Account created — welcome!" : "Signed in — welcome back!");
          }}
        >
          {mode === "signup" && (
            <div>
              <label className="text-xs font-semibold">Full name</label>
              <input name="name" required className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold">Email</label>
            <input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold">Password</label>
            <input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} className="mt-1 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 disabled:opacity-70">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground/80">
          <span className="h-px flex-1 bg-border" /> PORTFOLIO DEMO <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={() => {
            enableDemoMode();
            toast.success("Welcome! Entered portfolio demo mode.");
            navigate({ to: "/admin" });
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 py-3 text-sm font-bold shadow-sm hover:opacity-90 transition-transform active:scale-95"
        >
          Explore Admin Dashboard (Demo)
        </button>

        <p className="mt-5 text-center text-xs">
          {mode === "signup" ? "Already have an account?" : "New to Estora?"}{" "}
          <button className="font-bold text-primary hover:underline" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </p>

        {mode === "signin" && (
          <p className="mt-2 text-center text-xs">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
              Forgot your password?
            </Link>
          </p>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}
