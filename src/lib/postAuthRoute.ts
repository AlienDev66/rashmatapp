import type { Profile } from "@/src/types/auth";
import { router } from "expo-router";

/** Incomplete onboarding always goes here. */
export const ASSESSMENT_HREF = "/(auth)/assessment" as const;

/**
 * Home tab — must match `app/(tabs)/home.tsx`.
 * Note: `/(tabs)/index` is NOT a valid Expo Router href (404).
 */
export const HOME_HREF = "/(tabs)/home" as const;

export type PostAuthHref = typeof ASSESSMENT_HREF | typeof HOME_HREF;

/** Where a signed-in user should land based on onboarding state. */
export function hrefAfterAuth(profile: Profile | null | undefined): PostAuthHref {
  if (!profile || !profile.assessment_completed) {
    return ASSESSMENT_HREF;
  }
  return HOME_HREF;
}

export function replaceAfterAuth(profile: Profile | null | undefined) {
  router.replace(hrefAfterAuth(profile));
}

/** Leave onboarding / auth into the main app (Home tab only). */
export function enterAppHome() {
  router.replace(HOME_HREF);
}
