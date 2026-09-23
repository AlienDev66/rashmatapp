import type { Json } from "@/src/types/database";

export type NotificationPrefs = {
  workout_reminders: boolean;
  creator_updates: boolean;
  marketing: boolean;
};

export const defaultNotificationPrefs: NotificationPrefs = {
  workout_reminders: true,
  creator_updates: true,
  marketing: false,
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
  };
}
