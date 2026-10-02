import type { Json } from "@/src/types/database";

export type NotificationPrefs = {
  workout_reminders: boolean;
  creator_updates: boolean;
  marketing: boolean;
  /** Expo push token for remote sends (creator updates / marketing). */
  expo_push_token?: string | null;
};

export const defaultNotificationPrefs: NotificationPrefs = {
  workout_reminders: true,
  creator_updates: true,
  marketing: false,
  expo_push_token: null,
};

export function parseNotificationPrefs(raw: Json | null | undefined): NotificationPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...defaultNotificationPrefs };
  }
  const o = raw as Record<string, unknown>;
  return {
    workout_reminders:
      typeof o.workout_reminders === "boolean"
        ? o.workout_reminders
        : defaultNotificationPrefs.workout_reminders,
    creator_updates:
      typeof o.creator_updates === "boolean"
        ? o.creator_updates
        : defaultNotificationPrefs.creator_updates,
    marketing:
      typeof o.marketing === "boolean" ? o.marketing : defaultNotificationPrefs.marketing,
    expo_push_token:
      typeof o.expo_push_token === "string" ? o.expo_push_token : null,
  };
}
