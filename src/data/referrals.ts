import { brand } from "@/src/lib/brand";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { Share } from "react-native";

export async function ensureReferralCode(): Promise<string | null> {
  if (!isSupabaseConfigured) return "RASHMAT";
  const { data, error } = await supabase.rpc("ensure_referral_code");
  if (error) {
    if (__DEV__) console.warn("[RASHMAT] ensure_referral_code", error.message);
    return null;
  }
  return data ?? null;
}

export async function applyReferralCode(code: string) {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await supabase.rpc("apply_referral_code", {
    p_code: code.trim(),
  });
  if (error) return { ok: false, error: error.message };
  const row = data as { ok?: boolean; error?: string } | null;
  return { ok: !!row?.ok, error: row?.error ?? null };
}

export function referralShareMessage(code: string) {
  return `Train with me on ${brand.name}. Use my invite code ${code} — ${brand.url}`;
}

export async function shareReferralInvite(code: string) {
  await Share.share({ message: referralShareMessage(code) });
}
