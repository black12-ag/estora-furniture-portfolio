import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { loadPromo, savePromo, validatePromo, type Promo, type PromoValidation } from "@/lib/promo";
import { getSession } from "@/lib/session-store";
import { ArrowLeft, Tag, Check, AlertCircle, Loader2, ShieldCheck, Truck, CreditCard, Wallet, User, Mail, Phone, MapPin, Building2, Globe, Hash, PackageCheck, Lock } from "lucide-react";
import { MockPaymentDialog } from "@/components/MockPaymentDialog";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — Estora" },
      { name: "description", content: "Complete your Estora order — shipping, payment (mock), and review in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Ship = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal: string;
  country: string;
};

type FieldErrors = Partial<Record<keyof Ship, string>>;
function validateFields(s: Ship): FieldErrors {
  const e: FieldErrors = {};
  if (!s.name.trim()) e.name = "Please enter your full name.";
  else if (s.name.trim().length > 100) e.name = "Name is too long (max 100 characters).";
  if (!s.email.trim()) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s.email.trim())) e.email = "Enter a valid email like name@example.com.";
  const digits = s.phone.replace(/\D/g, "");
  if (!s.phone.trim()) e.phone = "Phone number is required.";
  else if (digits.length < 7 || digits.length > 15) e.phone = "Enter a valid phone number (7–15 digits).";
  if (!s.address.trim()) e.address = "Please enter your street address.";
  if (!s.city.trim()) e.city = "Please enter your city.";
  if (!s.postal.trim()) e.postal = "Postal code is required.";
  else if (!/^[A-Za-z0-9 \-]{3,10}$/.test(s.postal.trim())) e.postal = "Enter a valid postal / ZIP code.";
  return e;
}



function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [ship, setShip] = useState<Ship>(() => {
    const s = getSession();
    return { name: s?.name ?? "", email: s?.email ?? "", phone: "", address: "", city: "", postal: "", country: "United States" };
  });
  const [submitting, setSubmitting] = useState(false);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<PromoValidation>({ status: "idle" });
  const [payMethod, setPayMethod] = useState<"card" | "cod">("card");
  const [showPay, setShowPay] = useState(false);

  // Load any promo the shopper applied in the cart drawer.
  useEffect(() => { setPromo(loadPromo()); }, []);

  // Real-time validation for the on-page promo input.
  useEffect(() => {
    if (!promoInput.trim()) { setPromoStatus({ status: "idle" }); return; }
    setPromoStatus({ status: "validating" });
    const t = setTimeout(() => setPromoStatus(validatePromo(promoInput)), 220);
    return () => clearTimeout(t);
  }, [promoInput]);

  const freeShipPromo = promo?.code === "FREESHIP";
  const shipping = subtotal >= 200 || subtotal === 0 || freeShipPromo ? 0 : 15;
  const discount = promo && !freeShipPromo ? subtotal * promo.pct : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * 0.08;
  const total = taxable + shipping + tax;

  function applyPromo() {
    const v = validatePromo(promoInput);
    if (v.status === "valid") {
      setPromo(v.promo);
      savePromo(v.promo);
      setPromoInput("");
      setPromoStatus({ status: "idle" });
    }
  }
  function removePromo() { setPromo(null); savePromo(null); }

  if (items.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add items to your cart before checking out.</p>
        <Link to="/shop" className="btn-primary mt-6 inline-block">Continue Shopping</Link>
      </div>
    );
  }

  const fieldErrors = validateFields(ship);
  const [touched, setTouched] = useState<Partial<Record<keyof Ship, boolean>>>({});
  const markTouched = (k: keyof Ship) => setTouched((t) => ({ ...t, [k]: true }));

  function next() {
    setTouched({ name: true, email: true, phone: true, address: true, city: true, postal: true, country: true });
    const firstErr = Object.values(fieldErrors).find(Boolean);
    if (firstErr) { toast.error(firstErr as string); return; }
    setStep(2);
  }


  async function placeOrder(payment?: { last4: string; brand: string }) {
    setSubmitting(true);
    const orderNumber = `EST-${Date.now().toString(36).toUpperCase()}`;
    const method = payment ? `card_${payment.brand.toLowerCase()}_${payment.last4}` : payMethod === "cod" ? "cash_on_delivery" : "pay_later";
    const order = {
      id: orderNumber,
      items, subtotal, discount, promo: promo?.code ?? null, shipping, tax, total, ship, method,
      payment: payment ?? null,
      createdAt: Date.now(),
    };
    try { localStorage.setItem("estora.lastOrder", JSON.stringify(order)); } catch { /* ignore */ }
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sess } = await supabase.auth.getSession();
      const { error } = await supabase.from("orders").insert({
        user_id: sess.session?.user.id ?? null,
        email: sess.session?.user.email ?? ship.email,
        order_number: orderNumber,
        items: items as never,
        subtotal, discount, shipping, tax, total,
        promo: promo?.code ?? null,
        ship: ship as never,
        method,
        status: "pending",
      });
      if (error) throw error;
    } catch (e) {
      console.error("order save failed", e);
      toast.error("We couldn't save the order yet. Please try again in a moment.");
      setSubmitting(false);
      setShowPay(false);
      return;
    }
    clear();
    savePromo(null);
    setSubmitting(false);
    setShowPay(false);
    navigate({ to: "/checkout/success" });
  }

  function onConfirm() {
    if (payMethod === "card") setShowPay(true);
    else placeOrder();
  }




  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Checkout</h1>
            <p className="mt-1 text-sm text-muted-foreground">Just a couple of steps and your order is on its way.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Lock className="h-3.5 w-3.5" /> Secure checkout
          </span>
        </div>

        <ol className="mt-6 flex items-center gap-3 text-sm">
          <Step n={1} label="Shipping" active={step === 1} done={step > 1} />
          <span className={`h-0.5 flex-1 max-w-32 rounded-full ${step > 1 ? "bg-primary" : "bg-border"}`} />
          <Step n={2} label="Review & Pay" active={step === 2} done={false} />
        </ol>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {step === 1 ? (
            <div className="animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">Shipping information</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Where should we send your order?</p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-surface p-2 sm:inline-flex"><Truck className="h-5 w-5 text-primary" /></span>
              </div>

              <section className="mt-6">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Contact</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Full name" value={ship.name} onChange={(v) => setShip({ ...ship, name: v })} onBlur={() => markTouched("name")} error={touched.name ? fieldErrors.name : undefined} placeholder="Jane Appleseed" autoComplete="name" icon={<User className="h-4 w-4 text-muted-foreground" />} />
                  <Field label="Email" type="email" value={ship.email} onChange={(v) => setShip({ ...ship, email: v })} onBlur={() => markTouched("email")} error={touched.email ? fieldErrors.email : undefined} placeholder="you@example.com" autoComplete="email" inputMode="email" icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
                  <div className="sm:col-span-2">
                    <Field label="Phone" value={ship.phone} onChange={(v) => setShip({ ...ship, phone: v })} onBlur={() => markTouched("phone")} error={touched.phone ? fieldErrors.phone : undefined} placeholder="+1 555 000 0000" autoComplete="tel" inputMode="tel" icon={<Phone className="h-4 w-4 text-muted-foreground" />} />
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Shipping address</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold">Country</label>
                    <div className="relative mt-1">
                      <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        aria-label="Country"
                        value={ship.country}
                        onChange={(e) => setShip({ ...ship, country: e.target.value })}
                        className="w-full appearance-none rounded-full border border-border bg-background px-4 py-2.5 pl-9 text-sm outline-none focus:border-primary"
                      >
                        {["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Netherlands", "Sweden", "Japan", "Singapore", "United Arab Emirates", "Saudi Arabia", "Egypt", "Other"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Street address" value={ship.address} onChange={(v) => setShip({ ...ship, address: v })} onBlur={() => markTouched("address")} error={touched.address ? fieldErrors.address : undefined} placeholder="123 Willow Lane, Apt 4B" autoComplete="street-address" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} />
                  </div>
                  <Field label="City" value={ship.city} onChange={(v) => setShip({ ...ship, city: v })} onBlur={() => markTouched("city")} error={touched.city ? fieldErrors.city : undefined} placeholder="Brooklyn" autoComplete="address-level2" icon={<Building2 className="h-4 w-4 text-muted-foreground" />} />
                  <Field label="Postal code" value={ship.postal} onChange={(v) => setShip({ ...ship, postal: v })} onBlur={() => markTouched("postal")} error={touched.postal ? fieldErrors.postal : undefined} placeholder="11201" autoComplete="postal-code" icon={<Hash className="h-4 w-4 text-muted-foreground" />} />
                </div>
              </section>


              <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-surface/50 px-4 py-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5 text-primary" /> Free delivery on orders over $200</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> 30-day easy returns</span>
              </div>

              <button onClick={next} className="btn-dark mt-6 flex w-full items-center justify-center gap-2">
                Continue to Review <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">Review your order</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Confirm your details, then place the order.</p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-surface p-2 sm:inline-flex"><PackageCheck className="h-5 w-5 text-primary" /></span>
              </div>

              {/* Shipping confirmation */}
              <div className="mt-6 rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Shipping to</h3>
                    <p className="mt-2 font-bold">{ship.name}</p>
                    <p className="text-sm text-muted-foreground">{ship.address}</p>
                    <p className="text-sm text-muted-foreground">{[ship.city, ship.postal].filter(Boolean).join(" ")}, {ship.country}</p>
                    <p className="mt-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {ship.email}</span></p>
                    {ship.phone && <p className="text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {ship.phone}</span></p>}
                  </div>
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" aria-label="Edit shipping information">
                    <ArrowLeft className="h-3.5 w-3.5" /> Edit shipping
                  </button>
                </div>
              </div>

              {/* Items summary */}
              <div className="mt-4 rounded-2xl border border-border p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Items ({items.reduce((n, i) => n + i.qty, 0)})</h3>
                <ul className="mt-3 divide-y divide-border">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
                        {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center">🪑</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold">{it.name}</p>
                        <p className="text-xs text-muted-foreground">Qty {it.qty}{(it.color || it.dim) ? ` · ${[it.color, it.dim].filter(Boolean).join(" · ")}` : ""}</p>
                      </div>
                      <span className="font-bold">${(it.price * it.qty).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment method */}
              <h3 className="mt-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment method</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PayOption
                  active={payMethod === "card"}
                  onClick={() => setPayMethod("card")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Credit / Debit Card"
                  subtitle="Simulated secure gateway (test)"
                  badge="Test mode"
                />
                <PayOption
                  active={payMethod === "cod"}
                  onClick={() => setPayMethod("cod")}
                  icon={<Wallet className="h-5 w-5" />}
                  title="Cash on delivery"
                  subtitle="Pay when your order arrives"
                />
              </div>

              <div className="mt-4 rounded-2xl bg-surface/50 p-4 text-xs text-muted-foreground">
                {payMethod === "card" ? (
                  <p>You'll enter test card details in a secure dialog. No real charge is made — we save your order as <b className="text-foreground">pending</b> for admin confirmation.</p>
                ) : (
                  <p>Your order will be saved as <b className="text-foreground">pending</b>. Pay in cash when it's delivered.</p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-foreground/95 px-5 py-4 text-background">
                <div>
                  <p className="text-[11px] uppercase tracking-wider opacity-70">Final total</p>
                  <p className="text-2xl font-extrabold">${total.toFixed(2)}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] opacity-80"><ShieldCheck className="h-3.5 w-3.5" /> Secure checkout</span>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => setStep(1)} disabled={submitting} className="rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-accent disabled:opacity-60">Back</button>
                <button onClick={onConfirm} disabled={submitting} className="btn-dark flex-1 disabled:opacity-60" aria-busy={submitting}>
                  {submitting ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Placing your order…</span>
                  ) : payMethod === "card" ? (
                    <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pay ${total.toFixed(2)}</span>
                  ) : (
                    `Place Order — $${total.toFixed(2)}`
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {showPay && (
          <MockPaymentDialog
            amount={total}
            defaultName={ship.name}
            onCancel={() => setShowPay(false)}
            onSuccess={(info) => placeOrder(info)}
          />
        )}

        <aside className="h-fit rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
                  {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center">🪑</div>}
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">{it.qty}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{it.name}</p>
                  {(it.color || it.dim) && <p className="text-xs text-muted-foreground">{[it.color, it.dim].filter(Boolean).join(" · ")}</p>}
                </div>
                <span className="font-bold">${(it.price * it.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          {/* Promo on checkout */}
          {promo ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
              <span className="inline-flex items-center gap-2 font-semibold text-primary">
                <Tag className="h-3.5 w-3.5" /><span className="font-mono">{promo.code}</span>
                <span className="text-foreground/70">· {promo.label}</span>
              </span>
              <button onClick={removePromo} className="text-muted-foreground hover:text-sale" aria-label="Remove promo code">Remove</button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                    placeholder="Promo code"
                    aria-label="Promo code"
                    aria-invalid={promoStatus.status === "invalid"}
                    className={`w-full rounded-full border bg-background py-2 pl-8 pr-9 text-xs font-mono uppercase outline-none ${
                      promoStatus.status === "valid" ? "border-primary/60" :
                      promoStatus.status === "invalid" ? "border-sale/60" : "border-border"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {promoStatus.status === "validating" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    {promoStatus.status === "valid" && <Check className="h-3.5 w-3.5 text-primary" />}
                    {promoStatus.status === "invalid" && <AlertCircle className="h-3.5 w-3.5 text-sale" />}
                  </span>
                </div>
                <button
                  onClick={applyPromo}
                  disabled={promoStatus.status !== "valid"}
                  className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background transition hover:opacity-90 disabled:opacity-40"
                >Apply</button>
              </div>
              <p role="status" aria-live="polite" className="mt-1.5 min-h-4 text-[11px]">
                {promoStatus.status === "valid" && <span className="font-semibold text-primary">✓ {promoStatus.promo.label}</span>}
                {promoStatus.status === "invalid" && <span className="font-semibold text-sale">{promoStatus.message}</span>}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            {discount > 0 && <Row label={`Discount (${promo!.code})`} value={`−$${discount.toFixed(2)}`} accent />}
            <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`} />
            <Row label="Tax (est.)" value={`$${tax.toFixed(2)}`} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="font-bold">Total</span>
            <span className="text-xl font-extrabold">${total.toFixed(2)}</span>
          </div>
        </aside>

      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between"><span>{label}</span><span className={`font-semibold ${accent ? "text-primary" : ""}`}>{value}</span></div>
  );
}

function PayOption({ active, onClick, icon, title, subtitle, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; badge?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-foreground/40"}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-surface"}`}>{icon}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-bold">{title}</span>
          {badge && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">{badge}</span>}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`} />
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, icon, error, onBlur, autoComplete, inputMode }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: React.ReactNode; error?: string; onBlur?: () => void; autoComplete?: string; inputMode?: "text" | "email" | "tel" | "numeric" }) {
  const invalid = Boolean(error);
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <div className="relative mt-1">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <input
          type={type}
          aria-label={label}
          aria-invalid={invalid}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`w-full rounded-full border bg-background py-2.5 text-sm outline-none transition focus:ring-2 ${
            invalid ? "border-sale/70 focus:border-sale focus:ring-sale/20" : "border-border focus:border-primary focus:ring-primary/15"
          } ${icon ? "pl-9 pr-4" : "px-4"}`}
        />
      </div>
      <p aria-live="polite" className="mt-1 min-h-4 px-3 text-[11px] font-semibold text-sale">{error ?? ""}</p>
    </div>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition ${
          done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-surface text-muted-foreground"
        }`}
        aria-current={active ? "step" : undefined}
      >
        {done ? <Check className="h-4 w-4" /> : n}
      </span>
      <span className={`text-sm ${active || done ? "font-bold text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </li>
  );
}

