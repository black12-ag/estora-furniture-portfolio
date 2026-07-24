import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/faqs")({
  component: FAQsPage,
  head: () => ({
    meta: [
      { title: "FAQs — Estora" },
      { name: "description", content: "Frequently asked questions about ordering, shipping and returns at Estora." },
    ],
  }),
});

const faqs = [
  {
    q: "What Shipping Methods Are Available?",
    a: "We offer standard, express and white-glove delivery. Standard ships in 3–5 business days, express in 1–2, and white-glove includes room-of-choice placement and assembly. Free shipping on orders over $200.",
  },
  { q: "Do You Ship Internationally?", a: "Yes — we ship to over 40 countries. Duties are calculated at checkout." },
  { q: "How to Track My Order?", a: "You'll receive a tracking link by email as soon as your order ships." },
  { q: "How Long Will It Take To Get My Package?", a: "Most orders arrive within 3–7 business days depending on your region." },
  { q: "What Payment Methods Are Accepted?", a: "Online payment is not required at checkout right now. Place your order and our team will confirm the next step with you." },
  { q: "What Happens If There Is A Pricing Error?", a: "We'll contact you before confirming the order and let you decide whether to proceed at the correct price." },
  { q: "How do I place an Order?", a: "Add items to your cart, proceed to checkout, and follow the prompts." },
  { q: "Who Should I Contact If I Have Any Queries?", a: "Reach us anytime at info@estora.com — we reply within one business day." },
];

function FAQsPage() {
  const [open, setOpen] = useState(0);
  return (
    <div className="container-x py-16">
      <h1 className="text-4xl font-extrabold text-foreground md:text-5xl">How Can We Help You?</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Below are answers to our most commonly asked questions. If you cannot find an answer here, please contact us.</p>

      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="overflow-hidden rounded-xl bg-surface">
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center gap-4 p-5 text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question</span>
                <span className="flex-1 font-bold text-foreground">{f.q}</span>
                {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
              {isOpen && <div className="px-5 pb-6 pl-24 pr-8 text-sm text-muted-foreground">{f.a}</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">Unable to find satisfactory answers?</p>
        <a href="/contact" className="btn-primary">Contact Us</a>
      </div>
    </div>
  );
}
