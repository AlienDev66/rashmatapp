import { createSessionFromUrl, getAuthRedirectUri } from "@/src/lib/auth";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import type { Profile } from "@/src/types/auth";
import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

WebBrowser.maybeCompleteAuthSession();

type SignUpResult = {
  error: string | null;
  needsEmailConfirm?: boolean;
  redirectTo?: string;
};

type NotificationPrefs = {
  workout_reminders?: boolean;
  creator_updates?: boolean;
  marketing?: boolean;
};

type ProfileUpdate = {
  full_name?: string | null;
  city?: string | null;
  country?: string | null;
  age?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  avatar_url?: string | null;
  kcal_goal?: number;
  membership?: string;
  is_creator?: boolean;
  creator_slug?: string | null;
  notification_prefs?: NotificationPrefs;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (__DEV__) console.warn("[RASHMAT] loadProfile", error.message);
      setProfile(null);
      return;
    }

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // Account may predate the trigger — create the row
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: null,
      })
      .select("*")
      .single();

    if (insertError) {
      if (__DEV__) console.warn("[RASHMAT] ensure profile", insertError.message);
      setProfile(null);
      return;
    }
    setProfile(created as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await loadProfile(session.user.id);
  }, [loadProfile, session?.user?.id]);

  const updateProfile = useCallback(
    async (patch: ProfileUpdate) => {
      if (!isSupabaseConfigured) {
        return { error: "Supabase not configured" };
      }
      const uid = session?.user?.id;
      if (!uid) return { error: "Not signed in" };

      const payload = {
        id: uid,
        full_name: patch.full_name,
        city: patch.city,
        country: patch.country,
        age: patch.age,
        weight_kg: patch.weight_kg,
        height_cm: patch.height_cm,
        avatar_url: patch.avatar_url,
        kcal_goal: patch.kcal_goal,
        membership: patch.membership,
        is_creator: patch.is_creator,
        creator_slug: patch.creator_slug,
        notification_prefs: patch.notification_prefs
          ? (patch.notification_prefs as Profile["notification_prefs"])
          : undefined,
      };

      // Drop undefined keys so we don't wipe columns
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined),
      ) as typeof payload;

      const { data, error } = await supabase
        .from("profiles")
        .upsert(cleaned, { onConflict: "id" })
        .select("*")
        .single();

      if (error) {
        if (__DEV__) console.warn("[RASHMAT] updateProfile", error.message);
        return { error: error.message };
      }

      setProfile(data as Profile);
      return { error: null };
    },
    [session?.user?.id],
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      if (mounted) setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) await loadProfile(next.user.id);
      else setProfile(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    if (!__DEV__ || !isSupabaseConfigured) return;
    console.log("[RASHMAT] Auth redirect URI (add to Supabase):", getAuthRedirectUri());
  }, []);

  // Cold-start / foreground deep links (password recovery, OAuth return)
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !isSupabaseConfigured) return;
      try {
        const result = await createSessionFromUrl(url);
        if (result.type === "recovery") {
          // AuthCallback / reset screen will handle navigation when route opens
        }
      } catch {
        // Invalid or non-auth URL — ignore
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });
    return () => sub.remove();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to .env" };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to .env" };
    }
    const redirectTo = getAuthRedirectUri();
    if (__DEV__) {
      console.log("[RASHMAT] Auth redirect URI (add to Supabase Redirect URLs):", redirectTo);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { error: error.message };
    // Session present = email confirm disabled (or already confirmed)
    if (data.session) return { error: null };
    return {
      error: null,
      needsEmailConfirm: true as const,
      redirectTo,
    };
  }, []);

  const signInWithOAuth = useCallback(async (provider: "google" | "apple") => {
    if (!isSupabaseConfigured) {
      return { error: "Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to .env" };
    }
    const redirectTo = getAuthRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return { error: error.message };
    if (!data.url) return { error: "No OAuth URL returned" };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success" && result.url) {
      try {
        await createSessionFromUrl(result.url);
      } catch (e) {
        return { error: e instanceof Error ? e.message : "OAuth failed" };
      }
    }
    return { error: null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to .env" };
    }
    const redirectTo = getAuthRedirectUri();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to .env" };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      configured: isSupabaseConfigured,
      refreshProfile,
      updateProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      resetPassword,
      updatePassword,
      signOut,
    }),
    [
      session,
      profile,
      loading,
      refreshProfile,
      updateProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      resetPassword,
      updatePassword,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
