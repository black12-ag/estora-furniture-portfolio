// Sample-data email templates for refund & cancellation admin previews and outbound copy.
// Keep body plain-text friendly; HTML wrapper is applied at render time in the preview.

export type RefundTemplateKey =
  | "refund_pending"
  | "refund_approved"
  | "refund_rejected"
  | "cancellation_pending"
  | "cancellation_approved"
  | "cancellation_rejected";

export type SampleContext = {
  brand: string;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  orderNumber: string;
  amount: string;
  adminNote: string;
};

export const DEFAULT_SAMPLE: SampleContext = {
  brand: "estora",
  fromName: "estora support",
  fromEmail: "notify@estora.shop",
  toName: "Alex Morgan",
  toEmail: "alex@example.com",
  orderNumber: "EST-10241",
  amount: "$248.00",
  adminNote: "Refund will land on your original card in 3–5 business days.",
};

export type RenderedEmail = { subject: string; body: string };

export function renderRefundEmail(key: RefundTemplateKey, ctx: SampleContext): RenderedEmail {
  const isCancel = key.startsWith("cancellation");
  const label = isCancel ? "cancellation" : "refund";
  switch (key) {
    case "refund_pending":
    case "cancellation_pending":
      return {
        subject: `We received your ${label} request · ${ctx.orderNumber}`,
        body:
`Hi ${ctx.toName},

Thanks — we received your ${label} request for order ${ctx.orderNumber} (${ctx.amount}).
A teammate will review it and follow up shortly. You'll get another email as soon as there's an update.

If you didn't request this, reply to this email and we'll look into it.

— ${ctx.brand}`,
      };
    case "refund_approved":
    case "cancellation_approved":
      return {
        subject: `Your ${label} was approved · ${ctx.orderNumber}`,
        body:
`Hi ${ctx.toName},

Good news — your ${label} request for order ${ctx.orderNumber} (${ctx.amount}) was approved.
${ctx.adminNote ? `\nNote from the team:\n${ctx.adminNote}\n` : ""}
You can view the order and updated status any time in your account.

— ${ctx.brand}`,
      };
    case "refund_rejected":
    case "cancellation_rejected":
      return {
        subject: `Update on your ${label} request · ${ctx.orderNumber}`,
        body:
`Hi ${ctx.toName},

We reviewed your ${label} request for order ${ctx.orderNumber} and unfortunately we can't approve it at this time.
${ctx.adminNote ? `\nReason:\n${ctx.adminNote}\n` : ""}
Reply to this email if you'd like us to take another look.

— ${ctx.brand}`,
      };
  }
}

export const TEMPLATE_LIST: { key: RefundTemplateKey; label: string }[] = [
  { key: "refund_pending", label: "Refund · request received" },
  { key: "refund_approved", label: "Refund · approved" },
  { key: "refund_rejected", label: "Refund · declined" },
  { key: "cancellation_pending", label: "Cancellation · request received" },
  { key: "cancellation_approved", label: "Cancellation · approved" },
  { key: "cancellation_rejected", label: "Cancellation · declined" },
];
