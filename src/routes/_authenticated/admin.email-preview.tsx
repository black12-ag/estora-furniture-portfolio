import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Mail, Eye, Info } from "lucide-react";
import { can, usePermissions } from "@/lib/permissions";
import {
  DEFAULT_SAMPLE,
  TEMPLATE_LIST,
  renderRefundEmail,
  type RefundTemplateKey,
  type SampleContext,
} from "@/lib/refund-email-templates";

export const Route = createFileRoute("/_authenticated/admin/email-preview")({
  component: EmailPreview,
});

type VarDoc = { key: keyof SampleContext | "orderLink"; label: string; example: string; usedIn: string };

const VARIABLES: VarDoc[] = [
  { key: "brand", label: "{{brand}}", example: DEFAULT_SAMPLE.brand, usedIn: "Signature line on every template" },
  { key: "fromName", label: "{{fromName}}", example: DEFAULT_SAMPLE.fromName, usedIn: "From display name in the email header" },
  { key: "fromEmail", label: "{{fromEmail}}", example: DEFAULT_SAMPLE.fromEmail, usedIn: "From address (must be on your verified sender domain)" },
  { key: "toName", label: "{{toName}}", example: DEFAULT_SAMPLE.toName, usedIn: "Greeting: “Hi {{toName}},”" },
  { key: "toEmail", label: "{{toEmail}}", example: DEFAULT_SAMPLE.toEmail, usedIn: "Recipient address — pulled from the customer's account" },
  { key: "orderNumber", label: "{{orderNumber}}", example: DEFAULT_SAMPLE.orderNumber, usedIn: "Subject line + body — comes from orders.order_number" },
  { key: "amount", label: "{{amount}}", example: DEFAULT_SAMPLE.amount, usedIn: "Displayed with the order in Pending / Approved templates" },
  { key: "adminNote", label: "{{adminNote}}", example: DEFAULT_SAMPLE.adminNote, usedIn: "Approved & Declined templates — optional note from refund_requests.admin_note" },
  { key: "orderLink", label: "{{orderLink}}", example: "/account/orders/<order id>", usedIn: "Deep link back to the order in the customer's account (auto-generated)" },
];

function EmailPreview() {
  const perms = usePermissions();
  const allowed = can(perms, "refunds");
  const [key, setKey] = useState<RefundTemplateKey>("refund_pending");
  const [ctx, setCtx] = useState<SampleContext>(DEFAULT_SAMPLE);
  const rendered = useMemo(() => renderRefundEmail(key, ctx), [key, ctx]);

  if (!perms.loading && !allowed) {
    return <p className="text-sm text-muted-foreground">You don't have access to email templates.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Template</h2>
          <div className="space-y-1.5">
            {TEMPLATE_LIST.map((t) => (
              <button
                key={t.key}
                onClick={() => setKey(t.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                  key === t.key ? "bg-foreground text-background font-semibold" : "hover:bg-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Sample data</h2>
          <div className="space-y-3">
            <Field label="From name" value={ctx.fromName} onChange={(v) => setCtx({ ...ctx, fromName: v })} />
            <Field label="From email" value={ctx.fromEmail} onChange={(v) => setCtx({ ...ctx, fromEmail: v })} />
            <Field label="Recipient name" value={ctx.toName} onChange={(v) => setCtx({ ...ctx, toName: v })} />
            <Field label="Recipient email" value={ctx.toEmail} onChange={(v) => setCtx({ ...ctx, toEmail: v })} />
            <Field label="Order number" value={ctx.orderNumber} onChange={(v) => setCtx({ ...ctx, orderNumber: v })} />
            <Field label="Amount" value={ctx.amount} onChange={(v) => setCtx({ ...ctx, amount: v })} />
            <Field label="Admin note" value={ctx.adminNote} onChange={(v) => setCtx({ ...ctx, adminNote: v })} />
          </div>
          <button
            onClick={() => setCtx(DEFAULT_SAMPLE)}
            className="mt-3 w-full rounded-full border border-border py-1.5 text-xs font-semibold hover:bg-surface"
          >
            Reset to sample order
          </button>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-3xl border border-border bg-background shadow-sm">
          <header className="flex items-center gap-3 border-b border-border px-6 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface"><Mail className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Subject</p>
              <p className="truncate font-semibold">{rendered.subject}</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs">
              <Eye className="h-3 w-3" /> Preview
            </span>
          </header>
          <div className="grid gap-1 border-b border-border px-6 py-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div><span className="font-semibold text-foreground">From:</span> {ctx.fromName} &lt;{ctx.fromEmail}&gt;</div>
            <div><span className="font-semibold text-foreground">To:</span> {ctx.toName} &lt;{ctx.toEmail}&gt;</div>
          </div>
          <pre className="whitespace-pre-wrap px-6 py-6 font-sans text-sm leading-relaxed">{rendered.body}</pre>
        </div>

        <div className="rounded-3xl border border-border bg-card">
          <header className="flex items-center gap-2 border-b border-border px-6 py-4">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Available template variables</h2>
          </header>
          <div className="px-6 py-2">
            <p className="pt-3 text-xs text-muted-foreground">
              These are the fields we merge into each email at send time. Example values come from a sample order —
              in production they're populated from the refund request, the customer's profile, and the linked order.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Variable</th>
                    <th className="py-2 pr-4">Example</th>
                    <th className="py-2">Where it's used</th>
                  </tr>
                </thead>
                <tbody>
                  {VARIABLES.map((v) => (
                    <tr key={v.key} className="border-t border-border align-top">
                      <td className="py-2 pr-4 font-mono text-xs">{v.label}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{v.example}</td>
                      <td className="py-2 text-xs text-muted-foreground">{v.usedIn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="py-4 text-xs text-muted-foreground">
              Tip: edit any sample field on the left to preview how a specific customer or order will render.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
      />
    </label>
  );
}
