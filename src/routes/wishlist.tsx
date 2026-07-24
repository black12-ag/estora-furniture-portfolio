import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { products, getProduct } from "@/lib/products";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "My Wishlist — Estora" },
      { name: "description", content: "Save your favorite Estora furniture and décor to your wishlist." },
    ],
  }),
});

type Item = { id: string; name: string; color: string; dim: string; total: number; stock: boolean; image?: string };

const seed: Item[] = [
  { id: products[1].slug, name: products[1].name, color: products[1].colors[0].name, dim: products[1].sizes[0], total: products[1].price, stock: products[1].stock > 0, image: products[1].image },
  { id: products[6].slug, name: products[6].name, color: products[6].colors[0].name, dim: products[6].sizes[0], total: products[6].price, stock: products[6].stock > 0, image: products[6].image },
];

const STORAGE = "estora.wishlist.v1";

const otherProducts = products.slice(5, 10);

function WishlistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const { add } = useCart();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      setItems(raw ? JSON.parse(raw) : seed);
    } catch { setItems(seed); }
  }, []);

  function persist(next: Item[]) {
    setItems(next);
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function removeItem(id: string) {
    persist(items.filter(i => i.id !== id));
    toast.success("Removed from wishlist");
  }

  function addToCart(it: Item) {
    const p = getProduct(it.id);
    add({ id: it.id, slug: it.id, name: it.name, price: it.total, image: it.image ?? p?.image, color: it.color, dim: it.dim, qty: qtys[it.id] ?? 1 });
    toast.success(`${it.name} added to cart`);
  }


  return (
    <div className="container-x py-8 sm:py-10">
      <h1 className="mb-6 text-2xl font-extrabold sm:mb-8 sm:text-3xl">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border py-16 text-center sm:py-20">
          <p className="text-lg font-semibold">Your wishlist is empty</p>
          <Link to="/shop" className="btn-primary mt-6 inline-block">Continue Shopping</Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
            <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto_auto] items-center border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
              <span></span><span>Products</span><span>Total</span><span>Available</span><span>Quantity</span><span></span><span></span>
            </div>
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto_auto] items-center gap-4 border-b border-border px-6 py-5">
                <button onClick={() => removeItem(it.id)} aria-label="Remove" className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
                <div className="flex min-w-0 items-center gap-4">
                  <Link to="/product/$slug" params={{ slug: it.id }} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                    {it.image ? <img src={it.image} alt={it.name} loading="lazy" width={160} height={160} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-2xl">🪑</div>}
                  </Link>
                  <div className="min-w-0">
                    <Link to="/product/$slug" params={{ slug: it.id }} className="font-semibold hover:text-primary">{it.name}</Link>
                    <p className="text-xs text-muted-foreground">Color: {it.color}</p>
                    <p className="text-xs text-muted-foreground">Dimension: {it.dim}</p>
                  </div>
                </div>
                <span className="font-bold">${it.total.toFixed(2)}</span>
                <span className={it.stock ? "text-sale font-semibold" : "text-muted-foreground"}>{it.stock ? "In Stock" : "Out of Stock"}</span>
                <select value={qtys[it.id] ?? 1} onChange={(e) => setQtys({ ...qtys, [it.id]: Number(e.target.value) })} className="w-24 rounded-full border border-border bg-background px-3 py-2 text-sm">
                  {[1,2,3,4,5].map(n=>(<option key={n} value={n}>{String(n).padStart(2,"0")}</option>))}
                </select>
                <Link to="/product/$slug" params={{ slug: it.id }} className="rounded-full border border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground">View Product</Link>
                <button onClick={() => addToCart(it)} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">Add to Cart</button>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <ul className="space-y-4 md:hidden">
            {items.map((it) => (
              <li key={it.id} className="rounded-2xl border border-border p-4">
                <div className="flex gap-4">
                  <Link to="/product/$slug" params={{ slug: it.id }} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface">
                    {it.image ? <img src={it.image} alt={it.name} loading="lazy" width={200} height={200} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-2xl">🪑</div>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to="/product/$slug" params={{ slug: it.id }} className="line-clamp-2 font-semibold hover:text-primary">{it.name}</Link>
                      <button onClick={() => removeItem(it.id)} aria-label="Remove" className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Color: {it.color}</p>
                    <p className="text-xs text-muted-foreground">Dimension: {it.dim}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold">${it.total.toFixed(2)}</span>
                      <span className={`text-xs font-semibold ${it.stock ? "text-sale" : "text-muted-foreground"}`}>{it.stock ? "In Stock" : "Out of Stock"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <select value={qtys[it.id] ?? 1} onChange={(e) => setQtys({ ...qtys, [it.id]: Number(e.target.value) })} className="w-20 shrink-0 rounded-full border border-border bg-background px-3 py-2 text-sm" aria-label="Quantity">
                    {[1,2,3,4,5].map(n=>(<option key={n} value={n}>{String(n).padStart(2,"0")}</option>))}
                  </select>
                  <button onClick={() => addToCart(it)} className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">Add to Cart</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

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
                  {p.colors.slice(0,5).map((c)=><span key={c.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-border" style={{background:c.value}} />)}
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

