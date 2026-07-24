import { Clock, CheckCircle2, XCircle, Package } from "lucide-react";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "rejected" | "cancelled" | "refunded";

export function statusMeta(status: string) {
  const s = (status || "pending").toLowerCase();
  if (s === "confirmed" || s === "processing" || s === "shipped" || s === "delivered")
    return { label: s, tone: "bg-emerald-100 text-emerald-900 border-emerald-200", Icon: CheckCircle2 };
  if (s === "rejected" || s === "cancelled") return { label: s, tone: "bg-red-100 text-red-900 border-red-200", Icon: XCircle };
  if (s === "refunded") return { label: s, tone: "bg-blue-100 text-blue-900 border-blue-200", Icon: Package };
  return { label: "pending", tone: "bg-amber-100 text-amber-900 border-amber-200", Icon: Clock };
}

export function StatusBadge({ status }: { status: string }) {
  const { label, tone, Icon } = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${tone}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export function OrderStatusTimeline({
  status,
  createdAt,
  updatedAt,
}: {
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}) {
  const s = (status || "pending").toLowerCase();
  const isRejected = s === "rejected" || s === "cancelled";
  const isConfirmed = ["confirmed", "processing", "shipped", "delivered"].includes(s);
  const changedAt = updatedAt && updatedAt !== createdAt ? updatedAt : null;

  const steps = [
    {
      key: "placed",
      title: "Order placed",
      hint: "We received your order and it's queued for review.",
      time: createdAt,
      state: "done" as const,
      Icon: Package,
    },
    {
      key: "review",
      title: isRejected ? "Rejected by our team" : isConfirmed ? "Confirmed by our team" : "Awaiting confirmation",
      hint: isRejected
        ? "Contact support if you believe this was a mistake."
        : isConfirmed
        ? "We've confirmed your order and it's being prepared."
        : "An admin will review and confirm your order shortly.",
      time: isRejected || isConfirmed ? changedAt : null,
      state: isRejected ? ("error" as const) : isConfirmed ? ("done" as const) : ("current" as const),
      Icon: isRejected ? XCircle : isConfirmed ? CheckCircle2 : Clock,
    },
  ];

  return (
    <ol className="relative space-y-5 pl-8">
      <span aria-hidden="true" className="absolute left-3 top-2 bottom-2 w-px bg-border" />
      {steps.map((step) => {
        const dotTone =
          step.state === "done"
            ? "bg-emerald-500 text-white"
            : step.state === "error"
            ? "bg-red-500 text-white"
            : "bg-amber-500 text-white animate-pulse";
        return (
          <li key={step.key} className="relative">
            <span className={`absolute -left-8 grid h-6 w-6 place-items-center rounded-full ${dotTone}`}>
              <step.Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-bold capitalize">{step.title}</p>
              {step.time && (
                <time className="text-[11px] text-muted-foreground">{new Date(step.time).toLocaleString()}</time>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>
          </li>
        );
      })}
    </ol>
  );
}
