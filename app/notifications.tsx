import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { useT } from "@/src/i18n";
import {
  applyNotificationPrefs,
  getNotificationStatus,
  scheduleTestReminder,
  type PushStatus,
} from "@/src/lib/notifications";
import { parseNotificationPrefs } from "@/src/lib/profile";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

export default function NotificationsScreen() {
  const t = useT();
  const { profile, updateProfile } = useAuth();
  const prefs = parseNotificationPrefs(profile?.notification_prefs);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const reload = useCallback(async () => {
    setStatus(await getNotificationStatus());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onEnable = async () => {
    setBusy(true);
    const next = {
      workout_reminders: true,
      creator_updates: prefs.creator_updates,
      marketing: prefs.marketing,
    };
    const applied = await applyNotificationPrefs(next, {
      reminderBody: t("settings.reminderBody"),
    });
    if (applied.error) {
      setBusy(false);
      Alert.alert(t("settings.pushPermissionTitle"), t(applied.error), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("screens.openSettings"),
          onPress: () => void Linking.openSettings(),
        },
      ]);
      return;
    }
    await updateProfile({
      notification_prefs: {
        ...next,
        expo_push_token: applied.expoPushToken,
      },
    });
    await reload();
    setBusy(false);
  };

  const onTestReminder = async () => {
    setTesting(true);
    const result = await scheduleTestReminder({
      title: "RASHMAT",
      body: t("screens.notifTestBody"),
      seconds: 5,
    });
    setTesting(false);
    if (result.error) {
      Alert.alert(t("settings.pushPermissionTitle"), t(result.error), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("screens.openSettings"),
          onPress: () => void Linking.openSettings(),
        },
      ]);
      return;
    }
    Alert.alert(t("screens.notifTestScheduledTitle"), t("screens.notifTestScheduledBody"));
  };

  const permissionGranted = status?.permission === "granted";
  const remindersOn = prefs.workout_reminders && Boolean(status?.remindersScheduled);

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("screens.notifications")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {permissionGranted ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("screens.notifActiveTitle")}</Text>
          <Text style={styles.cardBody}>
            {remindersOn
              ? t("screens.notifActiveReminders")
              : t("screens.notifActiveNoReminders")}
          </Text>
          {status?.expoPushToken ? (
            <Text style={styles.token}>{t("screens.notifPushReady")}</Text>
          ) : (
            <Text style={styles.token}>{t("screens.notifPushDev")}</Text>
          )}
          <Button
            label={testing ? "…" : t("screens.notifTestCta")}
            variant="accent"
            disabled={testing}
            style={{ marginTop: 14 }}
            onPress={() => void onTestReminder()}
          />
          <Button
            label={t("extra.notifSettings")}
            variant="surface"
            style={{ marginTop: 10 }}
            onPress={() => router.push("/settings")}
          />
        </View>
      ) : (
        <EmptyState
          tone="notifications"
          title={t("screens.notifEmptyTitle")}
          message={t("screens.notifEmptyBody")}
          actionLabel={busy ? "…" : t("screens.enableNotifications")}
          onAction={busy ? undefined : () => void onEnable()}
          secondaryLabel={t("extra.notifSettings")}
          onSecondary={() => router.push("/settings")}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  cardTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
  },
  cardBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  token: {
    color: colors.accent,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
    marginTop: 12,
  },
});
