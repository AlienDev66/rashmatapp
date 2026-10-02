import { BackButton } from "@/src/components/ui/BackButton";
import { ConfirmSheet } from "@/src/components/ui/ConfirmSheet";
import { Screen } from "@/src/components/ui/Screen";
import { useI18n, useT } from "@/src/i18n";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/src/i18n/types";
import { brand } from "@/src/lib/brand";
import { parseNotificationPrefs } from "@/src/lib/profile";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { Bell, ChevronRight, Globe, Lock, Moon, Shield, Trash2, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
  const { profile, user, updateProfile, refreshProfile, deleteAccount } = useAuth();
  const { locale, setLocale } = useI18n();
  const t = useT();
  const prefs = parseNotificationPrefs(profile?.notification_prefs);
  const [workoutReminders, setWorkoutReminders] = useState(prefs.workout_reminders);
  const [creatorUpdates, setCreatorUpdates] = useState(prefs.creator_updates);
  const [marketing, setMarketing] = useState(prefs.marketing);
  const [deleting, setDeleting] = useState(false);
  /** null | first confirm | final confirm */
  const [deleteStep, setDeleteStep] = useState<null | "warn" | "final">(null);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const p = parseNotificationPrefs(profile?.notification_prefs);
    setWorkoutReminders(p.workout_reminders);
    setCreatorUpdates(p.creator_updates);
    setMarketing(p.marketing);
  }, [profile?.notification_prefs]);

  const savePrefs = async (next: {
    workout_reminders: boolean;
    creator_updates: boolean;
    marketing: boolean;
  }) => {
    await updateProfile({ notification_prefs: next });
  };

  const displayName = profile?.full_name || user?.email || t("common.athlete");

  const onConfirmDelete = async () => {
    if (deleteStep === "warn") {
      setDeleteStep("final");
      return;
    }
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      setDeleteStep(null);
      Alert.alert(t("settings.deleteAccountFailed"), error);
      return;
    }
    setDeleteStep(null);
    router.replace("/(auth)/sign-in");
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("settings.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.email}>{displayName}</Text>
        <Text style={styles.hint}>{user?.email ?? t("settings.hint")}</Text>

        <Text style={styles.section}>{t("settings.language")}</Text>
        <View style={styles.group}>
          <View style={styles.langRow}>
            <View style={styles.icon}>
              <Globe color={colors.accent} size={18} />
            </View>
            <Text style={styles.label}>{t("lang.hint")}</Text>
          </View>
          <View style={styles.langChips}>
            {LOCALES.map((code) => (
              <Pressable
                key={code}
                style={[styles.langChip, locale === code && styles.langChipActive]}
                onPress={() => setLocale(code as Locale)}
              >
                <Text style={[styles.langChipText, locale === code && styles.langChipTextActive]}>
                  {LOCALE_LABELS[code]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.section}>{t("settings.general")}</Text>
        <View style={styles.group}>
          <Row
            icon={<User color={colors.accent} size={18} />}
            label={t("settings.personalInfo")}
            onPress={() => router.push("/personal-info")}
          />
          <Row
            icon={<Bell color={colors.accent} size={18} />}
            label={t("settings.notificationCenter")}
            onPress={() => router.push("/notifications")}
          />
          <Row
            icon={<Moon color={colors.accent} size={18} />}
            label={t("settings.appearance")}
            value={t("settings.appearanceDark")}
          />
          <Row
            icon={<Lock color={colors.accent} size={18} />}
            label={t("settings.privacy")}
            onPress={() => void Linking.openURL(`${brand.url}/privacy`)}
          />
          <Row
            icon={<Shield color={colors.accent} size={18} />}
            label={t("settings.security")}
            onPress={() => void Linking.openURL(`${brand.url}/terms`)}
          />
        </View>

        <Text style={styles.section}>{t("settings.notifications")}</Text>
        <View style={styles.group}>
          <ToggleRow
            label={t("settings.trainingReminders")}
            value={workoutReminders}
            onValueChange={(v) => {
              setWorkoutReminders(v);
              void savePrefs({
                workout_reminders: v,
                creator_updates: creatorUpdates,
                marketing,
              });
            }}
          />
          <ToggleRow
            label={t("settings.creatorUpdates")}
            value={creatorUpdates}
            onValueChange={(v) => {
              setCreatorUpdates(v);
              void savePrefs({
                workout_reminders: workoutReminders,
                creator_updates: v,
                marketing,
              });
            }}
          />
          <ToggleRow
            label={t("settings.offers")}
            value={marketing}
            onValueChange={(v) => {
              setMarketing(v);
              void savePrefs({
                workout_reminders: workoutReminders,
                creator_updates: creatorUpdates,
                marketing: v,
              });
            }}
          />
        </View>

        <Text style={styles.section}>{t("settings.account")}</Text>
        <View style={styles.group}>
          <Row
            icon={<Trash2 color="#E85D5D" size={18} />}
            label={deleting ? t("settings.deletingAccount") : t("settings.deleteAccount")}
            danger
            onPress={deleting ? undefined : () => setDeleteStep("warn")}
          />
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={deleteStep !== null}
        title={t("settings.deleteAccountTitle")}
        message={
          deleteStep === "final"
            ? t("settings.deleteAccountFinal")
            : t("settings.deleteAccountBody")
        }
        confirmLabel={
          deleteStep === "final"
            ? t("settings.deleteAccountForever")
            : t("settings.deleteAccountConfirm")
        }
        cancelLabel={t("common.cancel")}
        tone="danger"
        loading={deleting}
        onConfirm={() => void onConfirmDelete()}
        onClose={() => {
          if (!deleting) setDeleteStep(null);
        }}
      />
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.icon}>{icon}</View>
      <Text style={[styles.label, danger && styles.dangerLabel]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress ? <ChevronRight color={colors.textMuted} size={18} /> : null}
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.surfaceElevated }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  email: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 18 },
  hint: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginTop: 4,
    marginBottom: 18,
  },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 8,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: "hidden",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: 8,
  },
  langChips: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: 16,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
  },
  langChipActive: {
    backgroundColor: colors.accent,
  },
  langChipText: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
  },
  langChipTextActive: {
    color: "#111",
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, color: colors.white, fontFamily: fonts.poppinsSemiBold },
  dangerLabel: { color: "#E85D5D" },
  value: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, marginRight: 4 },
});
