// Impersonation server function: only super admins may run it. Emits an
// audit event and returns a Supabase magic link the caller opens in a new
// tab to assume the target user's session (in that tab only — the original
// admin session is preserved).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const impersonateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { targetUserId: string; reason?: string; redirectTo?: string }) => input)
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = context.supabase as any;
    const { data: isSuper } = await supabase.rpc("has_role", {
      _user_id: context.userId, _role: "super_admin",
    });
    if (!isSuper) throw new Error("Only super admins may impersonate users.");
    if (data.targetUserId === context.userId) {
      throw new Error("You cannot impersonate yourself.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: tErr } = await supabaseAdmin.auth.admin.getUserById(data.targetUserId);
    if (tErr || !target?.user?.email) {
      throw new Error("Target user not found or has no email address.");
    }
    const actorEmail = (context.claims as { email?: string })?.email ?? null;

    // Record the impersonation attempt BEFORE minting the link so we have
    // an audit trail even if link generation fails.
    await supabaseAdmin.from("impersonation_events").insert({
      actor_id: context.userId,
      actor_email: actorEmail,
      target_id: data.targetUserId,
      target_email: target.user.email,
      reason: (data.reason ?? "").slice(0, 500) || null,
    });

    const redirectTo = data.redirectTo && data.redirectTo.startsWith("http")
      ? data.redirectTo
      : undefined;

    const { data: link, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: target.user.email,
      options: { redirectTo },
    });
    if (lErr) throw lErr;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionLink = (link as any)?.properties?.action_link as string | undefined;
    if (!actionLink) throw new Error("Could not generate impersonation link.");

    return { actionLink, targetEmail: target.user.email };
  });
