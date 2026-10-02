import { createSessionFromUrl, getAuthRedirectUri } from "@/src/lib/auth";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { Profile } from "@/src/types/auth";

WebBrowser.maybeCompleteAuthSession();

export type OAuthResult = {
  error: string | null;
  profile: Profile | null;
  /** User closed the browser / Apple sheet without signing in */
  cancelled?: boolean;
};

type LoadProfile = (userId: string) => Promise<Profile | null>;

/**
 * Google → browser OAuth (Supabase).
 * Apple on iOS → native Sign in with Apple when available (dev client / TestFlight / App Store).
 * If native is unavailable (Expo Go, simulator quirks) → browser OAuth fallback.
 */
export async function signInWithOAuthProvider(
  provider: "google" | "apple",
  loadProfile: LoadProfile,
): Promise<OAuthResult> {
  if (!isSupabaseConfigured) {
    return {
      error: "Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to .env",
      profile: null,
    };
  }

  if (provider === "apple" && Platform.OS === "ios") {
    const available = await AppleAuthentication.isAvailableAsync();
    if (available) {
      return signInWithNativeApple(loadProfile);
    }
    // Expo Go / builds without Apple capability — use browser OAuth instead of hard-failing
    if (__DEV__) {
      console.warn(
        "[RASHMAT] Native Apple Sign In unavailable — falling back to browser OAuth. Use a TestFlight/dev build for native Apple.",
      );
    }
  }

  return signInWithBrowserOAuth(provider, loadProfile);
}

async function signInWithNativeApple(loadProfile: LoadProfile): Promise<OAuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { error: "Apple did not return an identity token.", profile: null };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    if (error) return { error: error.message, profile: null };

    const session = data.session;
    if (!session?.user) return { error: "No session after Apple sign-in.", profile: null };

    // Apple only sends name on first authorization — persist if present
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fullName) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", session.user.id);
    }

    const profile = await loadProfile(session.user.id);
    return { error: null, profile };
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "ERR_REQUEST_CANCELED") {
      return { error: null, profile: null, cancelled: true };
    }
    return {
      error: e instanceof Error ? e.message : "Apple sign-in failed",
      profile: null,
    };
  }
}

async function signInWithBrowserOAuth(
  provider: "google" | "apple",
  loadProfile: LoadProfile,
): Promise<OAuthResult> {
  const redirectTo = getAuthRedirectUri();
  if (__DEV__) {
    console.log(`[RASHMAT] OAuth (${provider}) redirectTo — add to Supabase Redirect URLs:`, redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams:
        provider === "google"
          ? { access_type: "offline", prompt: "select_account" }
          : undefined,
    },
  });

  if (error) return { error: error.message, profile: null };
  if (!data.url) return { error: "No OAuth URL returned from Supabase.", profile: null };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "cancel" || result.type === "dismiss") {
    return { error: null, profile: null, cancelled: true };
  }

  if (result.type !== "success" || !("url" in result) || !result.url) {
    return { error: "OAuth did not complete. Try again.", profile: null };
  }

  try {
    const sessionResult = await createSessionFromUrl(result.url);
    const nextSession = sessionResult.session;
    if (nextSession?.user) {
      const profile = await loadProfile(nextSession.user.id);
      return { error: null, profile };
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "OAuth failed",
      profile: null,
    };
  }

  // Deep link may have been handled by AuthProvider listener first
  const { data: cur } = await supabase.auth.getSession();
  if (cur.session?.user) {
    const profile = await loadProfile(cur.session.user.id);
    return { error: null, profile };
  }

  return {
    error:
      "Sign-in did not finish. Check Supabase Redirect URLs include: " + redirectTo,
    profile: null,
  };
}
