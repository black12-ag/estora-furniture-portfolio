import { createFileRoute, Link } from "@tanstack/react-router";
import { X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { products } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Shopping Cart — Estora" },
      { name: "description", content: "Review the items in your Estora shopping cart and proceed to checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const otherProducts = products.slice(0, 5);

function CartPage() {
  const { items, remove, setQty, subtotal, add } = useCart();

  return (
    <div className="container-x py-10">
      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <h1 className="mb-8 text-3xl font-extrabold">
            Shopping Cart <sup className="text-base text-muted-foreground">({items.length})</sup>
          </h1>

          <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="rounded-2xl border border-border">
              <div className="hidden grid-cols-[1fr_140px_120px] items-center border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground sm:grid">
                <span>Products</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Total</span>
              </div>

              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-[auto_1fr] items-start gap-3 border-b border-border px-4 py-4 sm:grid-cols-[auto_1fr_140px_120px] sm:items-center sm:gap-4 sm:px-6 sm:py-5">
                  <button onClick={() => { remove(it.id); toast.success("Removed from cart"); }} aria-label="Remove"
                    className="mt-1 text-muted-foreground hover:text-foreground sm:mt-0"><X className="h-5 w-5" /></button>
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <Link to="/product/$slug" params={{ slug: it.slug }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                      {it.image ? <img src={it.image} alt={it.name} loading="lazy" width={200} height={200} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-3xl">🪑</div>}
                    </Link>
                    <div className="min-w-0">
                      <Link to="/product/$slug" params={{ slug: it.slug }} className="line-clamp-2 font-semibold hover:text-primary">{it.name}</Link>
                      {it.color && <p className="text-xs text-muted-foreground">Color: {it.color}</p>}
                      {it.dim && <p className="text-xs text-muted-foreground">Dimension: {it.dim}</p>}
                      <p className="mt-1 text-sm font-bold sm:hidden">${(it.price * it.qty).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="col-start-2 justify-self-start sm:col-start-auto sm:justify-self-center">
                    <select value={it.qty} onChange={(e) => setQty(it.id, Number(e.target.value))}
                      aria-label="Quantity"
                      className="rounded-full border border-border bg-background px-4 py-2 text-sm">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (<option key={n} value={n}>{String(n).padStart(2,"0")}</option>))}
                    </select>
                  </div>
                  <span className="hidden text-right font-bold sm:block">${(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}

              <div className="px-6 py-5">
                <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Continue Shopping
                </Link>
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold">Summary</h2>
              <div className="mt-4 flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">${subtotal.toFixed(2)}</span></div>
              <div className="mt-2 flex justify-between text-sm"><span>Shipping</span><span className="font-bold">{subtotal >= 200 ? "Free" : "$15.00"}</span></div>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm font-semibold">Discount Code</p>
                <div className="mt-2 flex gap-2">
                  <input placeholder="Enter coupon" className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm" />
                  <button onClick={() => toast.info("No active coupon codes right now.")} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Apply</button>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="font-bold">Total</span>
                <span className="text-xl font-extrabold">${(subtotal + (subtotal >= 200 ? 0 : 15)).toFixed(2)}</span>
              </div>
              <Link to="/checkout" className="btn-dark mt-5 block w-full text-center">Proceed to Checkout</Link>
              <div className="mt-4 flex justify-center gap-2 text-xs text-muted-foreground">
                <span>No online payment required</span>·<span>Admin confirmation</span>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* Other Products */}
      <section className="mt-20">
        <h2 className="text-center text-2xl font-extrabold">Other Products You'll Love</h2>
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
          {otherProducts.map((p) => (
            <div key={p.slug} className="group">
              <Link to="/product/$slug" params={{ slug: p.slug }}>
                <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-surface">
                  {p.compareAt && <span className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-lime-300 text-[10px] font-bold">-{Math.round((1 - p.price / p.compareAt) * 100)}%</span>}
                  <img src={p.image} alt={p.name} loading="lazy" width={600} height={600} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="mb-1 flex gap-1">
                  {p.colors.slice(0,5).map((c) => <span key={c.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-border" style={{background:c.value}} />)}
                </div>
                <h3 className="text-sm font-semibold">{p.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`font-bold ${p.compareAt?"text-sale":""}`}>${p.price.toFixed(2)}</span>
                  {p.compareAt && <span className="text-xs text-muted-foreground line-through">${p.compareAt.toFixed(2)}</span>}
                </div>
              </Link>
              <button
                onClick={() => { add({ id: p.slug, slug: p.slug, name: p.name, price: p.price, image: p.image }); toast.success(`${p.name} added to cart`); }}
                className="mt-1 text-xs font-semibold text-primary underline hover:no-underline"
              >Add to Cart</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="grid h-56 w-56 place-items-center rounded-full bg-surface text-8xl">🛒</div>
      <h1 className="mt-8 text-2xl font-extrabold">Your shopping cart is empty</h1>
      <Link to="/shop" className="btn-primary mt-6">Continue Shopping</Link>
    </div>
  );
}
