import { supabase } from "@/src/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import type { EmailOtpType, Session } from "@supabase/supabase-js";

/**
 * Expo Go → exp://IP:PORT/--/auth/callback
 * Dev build / production → rashmat://auth/callback
 *
 * Add the printed value + wildcards to Supabase Auth → Redirect URLs:
 *   exp:// (wildcard) /--/auth/callback
 *   exp:// (wildcard)
 *   rashmat://auth/callback
 *   rashmat:// (wildcard)
 */
export function getAuthRedirectUri() {
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

  const type = (params.type as string | undefined) ?? null;

  // PKCE flow (newer Supabase email templates)
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
