import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { X, ArrowRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export type QuickViewItem = {
  name: string;
  tag: string;
  count: number;
  cat: string;
  image: string;
  video?: string;
  poster?: string;
  description?: string;
  chips?: string[];
};

type Props = {
  item: QuickViewItem | null;
  onClose: () => void;
};

export function CollectionQuickView({ item, onClose }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} quick view`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      <button
        aria-label="Close quick view"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl bg-background shadow-2xl md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px]">
          {item.video && !reducedMotion ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={item.video}
              poster={item.poster || item.image}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={item.image}
              alt={`${item.name} collection`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-primary">{item.tag}</p>
              <h3 className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">{item.name}</h3>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 place-items-center rounded-full bg-surface text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {item.description ||
              `A curated selection of ${item.name.toLowerCase()} to elevate your space with warmth and character.`}
          </p>
          <div className="flex flex-wrap gap-2">
            {(item.chips || [item.tag, "New Season", "Free Shipping"]).map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-surface p-4">
            <div>
              <p className="text-2xl font-extrabold text-foreground">{item.count}</p>
              <p className="text-xs text-muted-foreground">pieces in collection</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Category</p>
              <p className="text-sm font-bold text-foreground">{item.cat}</p>
            </div>
          </div>
          <Link
            to="/shop"
            search={{ cat: item.cat }}
            onClick={onClose}
            className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
