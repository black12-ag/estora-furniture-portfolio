import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, Truck, Tag, Check, Sparkles, X, Loader2, AlertCircle } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { PROMOS, loadPromo, savePromo, validatePromo, type Promo, type PromoValidation } from "@/lib/promo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const FREE_SHIP_THRESHOLD = 200;

export function CartDrawer() {
  const { items, subtotal, isOpen, closeDrawer, openDrawer, setQty, remove, count } = useCart();
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState<Promo | null>(null);
  const [validation, setValidation] = useState<PromoValidation>({ status: "idle" });

  // Hydrate any previously applied promo from shared store.
  useEffect(() => { setApplied(loadPromo()); }, []);

  // Real-time debounced validation as the user types.
  useEffect(() => {
    if (!promo.trim()) { setValidation({ status: "idle" }); return; }
    setValidation({ status: "validating" });
    const t = setTimeout(() => setValidation(validatePromo(promo)), 220);
    return () => clearTimeout(t);
  }, [promo]);

  const shipRemaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const shipProgress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);
  const freeShipPromo = applied?.code === "FREESHIP";
  const discount = applied && !freeShipPromo ? subtotal * applied.pct : 0;
  const total = Math.max(0, subtotal - discount);

  const suggestions = useMemo(() => Object.values(PROMOS).slice(0, 2), []);

  function applyPromo() {
    const v = validatePromo(promo);
    if (v.status === "valid") {
      setApplied(v.promo);
      savePromo(v.promo);
      setPromo("");
      setValidation({ status: "idle" });
    }
  }

  function removePromo() {
    setApplied(null);
    savePromo(null);
  }


  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? openDrawer() : closeDrawer())}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        aria-label="Shopping cart"
      >
        <SheetHeader className="space-y-1 border-b border-border p-4 text-left">
          <SheetTitle className="inline-flex items-center gap-2 text-lg font-extrabold">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Your Cart
            <span
              className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground"
              aria-label={`${count} items in cart`}
            >
              {count}
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review, update quantities, or remove items before checkout.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="h-14 w-14 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul
              className="flex-1 divide-y divide-border overflow-y-auto p-4"
              aria-label="Cart items"
            >
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
                    {item.image && (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/product/$slug"
                        params={{ slug: item.slug }}
                        onClick={closeDrawer}
                        className="line-clamp-2 text-sm font-semibold hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-sale focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    {(item.color || item.dim) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[item.color, item.dim].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div
                        className="inline-flex items-center rounded-full border border-border"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span
                          className="min-w-[2ch] text-center text-sm font-bold"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="text-sm font-bold" aria-label={`Line total ${(item.price * item.qty).toFixed(2)} dollars`}>
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border bg-surface/50 p-4">
              {/* Free shipping progress */}
              <div className="mb-4 rounded-2xl bg-background p-3">
                <div className="flex items-center gap-2 text-xs">
                  <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                  {shipRemaining > 0 ? (
                    <span>Add <span className="font-bold text-foreground">${shipRemaining.toFixed(2)}</span> more for <span className="font-bold text-primary">free shipping</span></span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-primary"><Check className="h-3.5 w-3.5" /> You've unlocked free shipping!</span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${shipProgress}%` }} />
                </div>
              </div>

              {/* Promo code */}
              {applied ? (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-2 font-semibold text-primary">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-mono">{applied.code}</span>
                    <span className="text-foreground/70">· {applied.label}</span>
                  </span>
                  <button
                    onClick={removePromo}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-sale"
                    aria-label="Remove promo code"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <input
                        value={promo}
                        onChange={(e) => setPromo(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                        placeholder="Promo code"
                        aria-label="Promo code"
                        aria-invalid={validation.status === "invalid"}
                        aria-describedby="promo-feedback"
                        className={`w-full rounded-full border bg-background py-2 pl-8 pr-9 text-xs font-mono uppercase outline-none transition ${
                          validation.status === "valid" ? "border-primary/60 focus:border-primary" :
                          validation.status === "invalid" ? "border-sale/60 focus:border-sale" :
                          "border-border focus:border-primary"
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                        {validation.status === "validating" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                        {validation.status === "valid" && <Check className="h-3.5 w-3.5 text-primary" />}
                        {validation.status === "invalid" && <AlertCircle className="h-3.5 w-3.5 text-sale" />}
                      </span>
                    </div>
                    <button
                      onClick={applyPromo}
                      disabled={validation.status !== "valid"}
                      className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </div>
                  <div id="promo-feedback" role="status" aria-live="polite" className="mt-1.5 min-h-4 px-1 text-[11px]">
                    {validation.status === "valid" && (
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <Check className="h-3 w-3" /> {validation.promo.label} — press Apply
                      </span>
                    )}
                    {validation.status === "invalid" && (
                      <span className="inline-flex items-center gap-1 font-semibold text-sale">
                        <AlertCircle className="h-3 w-3" /> {validation.message}
                      </span>
                    )}
                    {validation.status === "idle" && (
                      <span className="text-muted-foreground">
                        Try{" "}
                        {suggestions.map((s, i) => (
                          <button
                            key={s.code}
                            type="button"
                            onClick={() => setPromo(s.code)}
                            className="font-mono font-bold text-foreground hover:underline"
                          >
                            {s.code}{i < suggestions.length - 1 ? ", " : ""}
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {applied && !freeShipPromo && (
                  <div className="flex items-center justify-between text-primary">
                    <span>Discount ({applied.code})</span>
                    <span>−${discount.toFixed(2)}</span>
                  </div>
                )}
                {freeShipPromo && (
                  <div className="flex items-center justify-between text-primary">
                    <span>Shipping ({applied.code})</span>
                    <span>Free</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-extrabold" aria-live="polite">${total.toFixed(2)}</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Shipping and taxes calculated at checkout.</p>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/checkout"
                  onClick={closeDrawer}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-center text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> Secure Checkout — ${total.toFixed(2)}
                </Link>
                <Link
                  to="/cart"
                  onClick={closeDrawer}
                  className="w-full rounded-full border border-border py-2.5 text-center text-xs font-bold hover:bg-background"
                >
                  View full cart
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
