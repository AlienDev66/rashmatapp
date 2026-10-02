import { supabase } from "@/src/lib/supabase";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import type { EmailOtpType, Session } from "@supabase/supabase-js";

/**
 * Redirect after Google/Apple OAuth (or email confirm).
 *
 * - Expo Go → `exp://…/--/auth/callback` (must NOT use rashmat:// or iOS opens TestFlight)
 * - Dev client / TestFlight / App Store → `rashmat://auth/callback`
 *
 * Supabase Redirect URLs must include: rashmat://**, exp://**, https://rashmat.com/**
 */
export function getAuthRedirectUri() {
  // Expo Go is "StoreClient" — prefer Linking so we stay on exp://
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return Linking.createURL("auth/callback");
  }

  // Standalone / dev builds: explicit custom scheme
  return makeRedirectUri({
    scheme: "rashmat",
    path: "auth/callback",
  });
}

export type AuthLinkResult = {
  session: Session | null;
  type: string | null;
};

/** Exchange tokens / OTP / PKCE code from a deep-link URL into a Supabase session. */
export async function createSessionFromUrl(url: string): Promise<AuthLinkResult> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const oauthError = params.error as string | undefined;
  if (oauthError) {
    const desc = (params.error_description as string | undefined)?.replace(/\+/g, " ");
    throw new Error(desc || oauthError);
  }

  const type = (params.type as string | undefined) ?? null;

  // PKCE flow (OAuth + newer email templates)
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return { session: data.session, type };
  }

  // token_hash flow (verify link)
  if (params.token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: type as EmailOtpType,
    });
    if (error) throw error;
    return { session: data.session, type };
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;

  if (!access_token || !refresh_token) {
    return { session: null, type };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return { session: data.session, type };
}
