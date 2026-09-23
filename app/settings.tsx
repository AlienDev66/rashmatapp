import { BackButton } from "@/src/components/ui/BackButton";
import { Screen } from "@/src/components/ui/Screen";
import { parseNotificationPrefs } from "@/src/lib/profile";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { Bell, ChevronRight, Lock, Moon, Shield, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const prefs = parseNotificationPrefs(profile?.notification_prefs);
  const [workoutReminders, setWorkoutReminders] = useState(prefs.workout_reminders);
  const [creatorUpdates, setCreatorUpdates] = useState(prefs.creator_updates);
  const [marketing, setMarketing] = useState(prefs.marketing);

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

  const displayName =
    profile?.full_name || user?.email || "Athlete";

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Account Setting</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.email}>{displayName}</Text>
      <Text style={styles.hint}>{user?.email ?? "Manage your RASHMAT account"}</Text>

      <Text style={styles.section}>General</Text>
      <View style={styles.group}>
        <Row
          icon={<User color={colors.accent} size={18} />}
          label="Personal Information"
          onPress={() => router.push("/personal-info")}
        />
        <Row
          icon={<Bell color={colors.accent} size={18} />}
          label="Notification center"
          onPress={() => router.push("/notifications")}
        />
        <Row icon={<Moon color={colors.accent} size={18} />} label="Appearance" value="Dark" />
        <Row icon={<Lock color={colors.accent} size={18} />} label="Privacy" />
        <Row icon={<Shield color={colors.accent} size={18} />} label="Security" />
      </View>

      <Text style={styles.section}>Notifications</Text>
      <View style={styles.group}>
        <ToggleRow
          label="Workout reminders"
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
          label="Creator updates"
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
          label="Offers & tips"
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
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      <ChevronRight color={colors.textMuted} size={18} />
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
    marginBottom: 20,
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
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, color: colors.white, fontFamily: fonts.poppinsSemiBold },
  value: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, marginRight: 4 },
});
