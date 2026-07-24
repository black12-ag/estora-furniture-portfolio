import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/coming-soon")({
  component: ComingSoon,
  head: () => ({
    meta: [
      { title: "Coming Soon — Estora November Lookbook" },
      { name: "description", content: "The Estora November Lookbook Vol. 1 is dropping soon. Subscribe to be the first to know." },
    ],
  }),
});

function ComingSoon() {
  const target = new Date("2026-11-01T00:00:00Z").getTime();
  const [t, setT] = useState(() => diff(target));
  const [email, setEmail] = useState("");

  useEffect(() => {
    const i = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Please enter a valid email.");
    try {
      const list = JSON.parse(localStorage.getItem("estora.newsletter") ?? "[]");
      if (!list.includes(email)) list.push(email);
      localStorage.setItem("estora.newsletter", JSON.stringify(list));
    } catch { /* ignore */ }
    toast.success("You're on the list — we'll email you when it drops.");
    setEmail("");
  }

  return (
    <div className="min-h-[70vh] bg-foreground text-background">
      <div className="container-x grid gap-12 py-20 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary">November Lookbook Vol.1</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl">Something<br />beautiful<br />is coming.</h1>
          <div className="mt-8 flex gap-3">
            {[
              { l: "Days", v: t.days },
              { l: "Hours", v: t.hours },
              { l: "Minutes", v: t.mins },
              { l: "Seconds", v: t.secs },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-background/10 px-4 py-3 text-center backdrop-blur">
                <div className="text-2xl font-extrabold">{String(x.v).padStart(2, "0")}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">{x.l}</div>
              </div>
            ))}
          </div>
          <form onSubmit={subscribe} className="mt-10 flex max-w-md gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full bg-background/10 px-5 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
            />
            <button className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Notify Me</button>
          </form>
        </div>
        <div className="grid aspect-square place-items-center rounded-3xl bg-background/5 text-9xl">🪑</div>
      </div>
    </div>
  );
}

function diff(target: number) {
  const now = Date.now();
  const s = Math.max(0, Math.floor((target - now) / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 };
}
