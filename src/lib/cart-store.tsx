import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getSession, userBucket } from "./session-store";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  color?: string;
  dim?: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const keyFor = (bucket: string) => `estora.cart.v2.${bucket}`;
const LEGACY_KEY = "estora.cart.v1";

function readBucket(bucket: string): CartItem[] {
  try {
    const raw = localStorage.getItem(keyFor(bucket));
    if (raw) return JSON.parse(raw) as CartItem[];
    // one-time migration from v1 guest cart
    if (bucket === "guest") {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as CartItem[];
        localStorage.setItem(keyFor("guest"), legacy);
        localStorage.removeItem(LEGACY_KEY);
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return [];
}

function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const it of [...a, ...b]) {
    const existing = map.get(it.id);
    map.set(it.id, existing ? { ...existing, qty: existing.qty + it.qty } : { ...it });
  }
  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bucketRef = useRef<string>("guest");

  useEffect(() => {
    const s = getSession();
    bucketRef.current = userBucket(s);
    setItems(readBucket(bucketRef.current));
    setHydrated(true);

    const onSession = (e: Event) => {
      const detail = (e as CustomEvent).detail as import("./session-store").Session;
      const newBucket = userBucket(detail);

      if (newBucket === bucketRef.current) return;
      // Sign-in: merge current (guest) items into user bucket.
      const prevItems = items;
      const userItems = readBucket(newBucket);
      const merged = mergeCarts(userItems, prevItems);
      bucketRef.current = newBucket;
      setItems(merged);
    };
    window.addEventListener("estora:session", onSession);
    return () => window.removeEventListener("estora:session", onSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(keyFor(bucketRef.current), JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, hydrated]);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const add: CartContextValue["add"] = (item) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + (item.qty ?? 1) } : p));
      return [...prev, { ...item, qty: item.qty ?? 1 }];
    });
    setIsOpen(true);
  };

  const remove = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, qty } : p))
    );
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, add, remove, setQty, clear, isOpen, openDrawer, closeDrawer }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
