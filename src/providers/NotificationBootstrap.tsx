import { useT } from "@/src/i18n";
import { syncScheduledReminders } from "@/src/lib/notifications";
import { parseNotificationPrefs } from "@/src/lib/profile";
import { useAuth } from "@/src/providers/AuthProvider";
import { useEffect, useRef } from "react";

/**
 * After login, re-schedule the daily local reminder if the user already opted in.
 * Avoids “prefs say on but nothing scheduled after reinstall / new build”.
 */
export function NotificationBootstrap() {
  const { profile, user } = useAuth();
  const t = useT();
  const lastUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !profile) return;
    if (lastUser.current === user.id) return;
    lastUser.current = user.id;

    const prefs = parseNotificationPrefs(profile.notification_prefs);
    void syncScheduledReminders(prefs, {
      reminderBody: t("settings.reminderBody"),
    });
  }, [user?.id, profile, t]);

  return null;
}
