import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { useT } from "@/src/i18n";
import {
  clearInbox,
  listInboxItems,
  markInboxRead,
  type InboxItem,
} from "@/src/lib/notificationInbox";
import {
  applyNotificationPrefs,
  getNotificationStatus,
  scheduleTestReminder,
  type PushStatus,
} from "@/src/lib/notifications";
import { parseNotificationPrefs } from "@/src/lib/profile";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const t = useT();
  const { profile, updateProfile } = useAuth();
  const prefs = parseNotificationPrefs(profile?.notification_prefs);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const reload = useCallback(async () => {
    setStatus(await getNotificationStatus());
    setInbox(await listInboxItems());
    await markInboxRead();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

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
    await reload();
  };

  const onClearInbox = () => {
    Alert.alert(t("screens.notifClearTitle"), t("screens.notifClearBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("screens.notifClearConfirm"),
        style: "destructive",
        onPress: () => {
          void clearInbox().then(() => reload());
        },
      },
    ]);
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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

        <View style={styles.inboxHeader}>
          <Text style={styles.section}>{t("screens.notifInbox")}</Text>
          {inbox.length > 0 ? (
            <Pressable onPress={onClearInbox}>
              <Text style={styles.clear}>{t("screens.notifClear")}</Text>
            </Pressable>
          ) : null}
        </View>

        {inbox.length === 0 ? (
          <Text style={styles.inboxEmpty}>{t("screens.notifInboxEmpty")}</Text>
        ) : (
          inbox.map((item) => (
            <View key={item.id} style={styles.inboxRow}>
              <Text style={styles.inboxTitle}>{item.title}</Text>
              <Text style={styles.inboxBody}>{item.body}</Text>
              <Text style={styles.inboxMeta}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
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
    marginBottom: 20,
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
  inboxHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  section: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    letterSpacing: 1,
  },
  clear: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  inboxEmpty: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  inboxRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 8,
  },
  inboxTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
  },
  inboxBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  inboxMeta: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 8,
  },
});
