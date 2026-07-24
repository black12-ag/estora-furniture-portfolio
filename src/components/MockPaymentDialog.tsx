import { useEffect, useState } from "react";
import { CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

type Phase = "form" | "authorizing" | "processing" | "success";

function luhn(num: string) {
  const s = num.replace(/\D/g, "");
  if (s.length < 12) return false;
  let sum = 0, alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function formatExp(v: string) {
  const s = v.replace(/\D/g, "").slice(0, 4);
  return s.length > 2 ? `${s.slice(0, 2)}/${s.slice(2)}` : s;
}

export function MockPaymentDialog({
  amount,
  defaultName,
  onCancel,
  onSuccess,
}: {
  amount: number;
  defaultName?: string;
  onCancel: () => void;
  onSuccess: (info: { last4: string; brand: string }) => Promise<void> | void;
}) {
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState(defaultName ?? "");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [err, setErr] = useState<string | null>(null);

  // Lock body scroll while modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const digits = card.replace(/\s/g, "");
  const brand = /^4/.test(digits) ? "Visa" : /^5[1-5]/.test(digits) ? "Mastercard" : /^3[47]/.test(digits) ? "Amex" : "Card";
  const last4 = digits.slice(-4);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("Add the name on the card.");
    if (!luhn(digits)) return setErr("That card number doesn't look right.");
    if (!/^\d{2}\/\d{2}$/.test(exp)) return setErr("Enter expiry as MM/YY.");
    const [mm, yy] = exp.split("/").map((x) => parseInt(x, 10));
    if (mm < 1 || mm > 12) return setErr("Expiry month must be 01–12.");
    const now = new Date();
    const expDate = new Date(2000 + yy, mm, 0);
    if (expDate < now) return setErr("This card has expired.");
    if (!/^\d{3,4}$/.test(cvc)) return setErr("CVC must be 3–4 digits.");

    setPhase("authorizing");
    await new Promise((r) => setTimeout(r, 900));
    setPhase("processing");
    await new Promise((r) => setTimeout(r, 900));
    setPhase("success");
    await new Promise((r) => setTimeout(r, 700));
    await onSuccess({ last4, brand });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mock payment"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && phase === "form") onCancel(); }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl animate-scale-in">
        {/* Card visual */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-70">Test mode</span>
            <span className="text-sm font-bold">{brand}</span>
          </div>
          <p className="mt-6 font-mono text-lg tracking-widest">{card || "•••• •••• •••• ••••"}</p>
          <div className="mt-4 flex items-end justify-between text-xs">
            <div>
              <p className="opacity-60">Cardholder</p>
              <p className="font-semibold uppercase">{name || "YOUR NAME"}</p>
            </div>
            <div className="text-right">
              <p className="opacity-60">Expires</p>
              <p className="font-semibold">{exp || "MM/YY"}</p>
            </div>
          </div>
        </div>

        {phase === "form" && (
          <form onSubmit={submit} className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Pay ${amount.toFixed(2)}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" /> Simulated</span>
            </div>
            <Field label="Name on card" value={name} onChange={setName} placeholder="Jane Doe" />
            <Field label="Card number" value={card} onChange={(v) => setCard(formatCard(v))} placeholder="1234 1234 1234 1234" icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry (MM/YY)" value={exp} onChange={(v) => setExp(formatExp(v))} placeholder="MM/YY" />
              <Field label="CVC" value={cvc} onChange={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))} placeholder="123" />
            </div>
            {err && <p className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-900">{err}</p>}
            <div className="rounded-xl bg-surface p-2.5 text-[11px] text-muted-foreground">
              Try <span className="font-mono">4242 4242 4242 4242</span> · any future date · any CVC. No real charges.
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2.5 text-sm font-bold hover:bg-accent">Cancel</button>
              <button type="submit" className="btn-dark flex-1 inline-flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" /> Pay ${amount.toFixed(2)}
              </button>
            </div>
            <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Mock gateway — safe to test
            </p>
          </form>
        )}

        {phase !== "form" && (
          <div className="grid place-items-center gap-4 p-8 text-center">
            {phase === "success" ? (
              <>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 animate-scale-in">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <p className="text-lg font-black">Payment approved</p>
                <p className="text-sm text-muted-foreground">Placing your order…</p>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-black">{phase === "authorizing" ? "Authorizing card…" : "Processing payment…"}</p>
                <div className="w-full max-w-xs">
                  <ProgressSteps phase={phase} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressSteps({ phase }: { phase: Phase }) {
  const steps = ["authorizing", "processing", "success"];
  const active = steps.indexOf(phase);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= active ? "bg-primary" : "bg-border"}`} />
      ))}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{label}</span>
      <div className="relative mt-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-9 text-sm outline-none focus:border-primary"
        />
        {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</span>}
      </div>
    </label>
  );
}
