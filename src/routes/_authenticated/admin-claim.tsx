import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin-claim")({
  component: ClaimAdmin,
});

function ClaimAdmin() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  async function claim() {
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data) { toast.success("You're now an admin."); nav({ to: "/admin" as never }); }
    else toast.info("An admin already exists — ask them to promote you.");
  }
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-black">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">If no admin exists yet, claim it now. Otherwise ask an existing admin to grant you access.</p>
        <button onClick={claim} disabled={busy} className="btn-primary mt-6">
          {busy ? "Claiming…" : "Claim first admin"}
        </button>
      </div>
    </div>
  );
}
