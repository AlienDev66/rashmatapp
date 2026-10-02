import type { NotificationPrefs } from "@/src/lib/profile";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const WORKOUT_REMINDER_ID = "rashmat-workout-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushStatus = {
  permission: Notifications.PermissionStatus;
  expoPushToken: string | null;
  remindersScheduled: boolean;
};

export async function getNotificationStatus(): Promise<PushStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  let expoPushToken: string | null = null;
  if (status === "granted") {
    try {
      expoPushToken = await getExpoPushToken();
    } catch {
      expoPushToken = null;
    }
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return {
    permission: status,
    expoPushToken,
    remindersScheduled: scheduled.some((n) => n.identifier === WORKOUT_REMINDER_ID),
  };
}

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return current;
  if (current.status === "denied" && !current.canAskAgain) return current;
  return Notifications.requestPermissionsAsync();
}

async function getExpoPushToken() {
  const projectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId;
  if (!projectId) return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

async function scheduleDailyWorkoutReminder(body: string) {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_REMINDER_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: WORKOUT_REMINDER_ID,
    content: {
      title: "RASHMAT",
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  });
}

async function cancelWorkoutReminders() {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_REMINDER_ID).catch(() => undefined);
}

const TEST_REMINDER_ID = "rashmat-test-reminder";

/** Fire a local notification in a few seconds — for QA without changing device time. */
export async function scheduleTestReminder(copy: {
  title: string;
  body: string;
  seconds?: number;
}): Promise<{ error: string | null }> {
  const permission = await requestNotificationPermission();
  if (permission.status !== "granted") {
    return { error: "settings.pushPermissionDenied" };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync(TEST_REMINDER_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: TEST_REMINDER_ID,
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: copy.seconds ?? 5,
      repeats: false,
    },
  });

  return { error: null };
}

/**
 * Apply OS permission + local reminders + Expo push token from Settings toggles.
 * Returns token to persist on the profile (for future remote creator/marketing pushes).
 */
export async function applyNotificationPrefs(
  prefs: NotificationPrefs,
  copy: { reminderBody: string },
): Promise<{ error: string | null; expoPushToken: string | null; permission: Notifications.PermissionStatus }> {
  const needsOs =
    prefs.workout_reminders || prefs.creator_updates || prefs.marketing;

  let permission = (await Notifications.getPermissionsAsync()).status;
  let expoPushToken: string | null = null;

  if (needsOs) {
    const next = await requestNotificationPermission();
    permission = next.status;
    if (permission !== "granted") {
      if (prefs.workout_reminders) await cancelWorkoutReminders();
      return {
        error: "settings.pushPermissionDenied",
        expoPushToken: null,
        permission,
      };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    try {
      expoPushToken = await getExpoPushToken();
    } catch {
      expoPushToken = null;
    }
  }

  if (prefs.workout_reminders && permission === "granted") {
    await scheduleDailyWorkoutReminder(copy.reminderBody);
  } else {
    await cancelWorkoutReminders();
  }

  return { error: null, expoPushToken, permission };
}
