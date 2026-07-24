// Small MFA helper wrappers around supabase.auth.mfa. Keeps the UI thin
// and provides typed responses.
import { supabase } from "@/integrations/supabase/client";

export type TotpFactor = { id: string; friendlyName: string | null; status: "verified" | "unverified" };

export async function listTotpFactors(): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp ?? []).map((f) => ({
    id: f.id,
    friendlyName: f.friendly_name ?? null,
    status: (f.status as "verified" | "unverified"),
  }));
}

export async function getAal(): Promise<{ current: "aal1" | "aal2" | null; next: "aal1" | "aal2" | null }> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return {
    current: (data?.currentLevel as "aal1" | "aal2" | null) ?? null,
    next: (data?.nextLevel as "aal1" | "aal2" | null) ?? null,
  };
}

export async function enrollTotp(friendlyName?: string) {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });
  if (error) throw error;
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function challengeAndVerify(factorId: string, code: string) {
  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
  if (cErr) throw cErr;
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (error) throw error;
  return data;
}

export async function unenrollFactor(factorId: string) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
