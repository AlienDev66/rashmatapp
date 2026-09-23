import { BackButton } from "@/src/components/ui/BackButton";
import { Screen } from "@/src/components/ui/Screen";
import { evaluateAndAwardMedals, fetchAthleteStats, type AthleteStats } from "@/src/data/achievements";
import { MEDAL_DEFS } from "@/src/data/medalsCatalog";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useFocusEffect } from "expo-router";
import { ChevronRight, Trophy } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AchievementsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    await refreshProfile();
    await evaluateAndAwardMedals(user.id, profile?.xp ?? 0);
    const s = await fetchAthleteStats(user.id, profile?.xp ?? 0);
    setStats(s);
    setLoading(false);
  }, [user, profile?.xp, refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const owned = new Set(stats?.medals.map((m) => m.medalId) ?? []);
  const earned = MEDAL_DEFS.filter((m) => owned.has(m.id));
  const locked = MEDAL_DEFS.filter((m) => !owned.has(m.id));

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Achievements</Text>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/leaderboard")}>
          <Trophy color={colors.accent} size={18} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.name}>
                {(profile?.full_name ?? user?.email?.split("@")[0] ?? "Athlete").toUpperCase()}
              </Text>
              <Text style={styles.xp}>{(stats?.xp ?? profile?.xp ?? 0).toLocaleString()} XP</Text>
            </View>
            <View style={styles.metrics}>
              <Metric value={String(stats?.streakDays ?? 0)} label="Streak" />
              <Metric value={String(stats?.totalSessions ?? 0)} label="Sessions" />
              <Metric value={String(stats?.campsCompleted ?? 0)} label="Camps" />
            </View>
          </View>

          <Pressable style={styles.linkRow} onPress={() => router.push("/medals")}>
            <Text style={styles.linkTitle}>Medals</Text>
            <Text style={styles.linkMeta}>
              {earned.length}/{MEDAL_DEFS.length} · View all
            </Text>
            <ChevronRight color={colors.textDim} size={18} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => router.push("/leaderboard")}>
            <Text style={styles.linkTitle}>Leaderboard</Text>
            <Text style={styles.linkMeta}>All time · Monthly</Text>
            <ChevronRight color={colors.textDim} size={18} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => router.push("/workout-logs")}>
            <Text style={styles.linkTitle}>Workout logs</Text>
            <Text style={styles.linkMeta}>Session history</Text>
            <ChevronRight color={colors.textDim} size={18} />
          </Pressable>

          <Text style={styles.section}>RECENT MEDALS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.medalRow}>
            {(earned.length ? earned : locked.slice(0, 3)).map((m) => {
              const unlocked = owned.has(m.id);
              return (
                <View key={m.id} style={[styles.medalChip, !unlocked && styles.medalLocked]}>
                  <Text style={styles.medalTitle}>{m.title}</Text>
                  <Text style={styles.medalXp}>{m.xpReward} XP</Text>
                </View>
              );
            })}
          </ScrollView>
        </ScrollView>
      )}
    </Screen>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: 6,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 20,
    flex: 1,
  },
  xp: { color: colors.accent, fontFamily: fonts.poppinsSemiBold, fontSize: 14 },
  metrics: { flexDirection: "row", justifyContent: "space-around" },
  metric: { alignItems: "center" },
  metricValue: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 4,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  linkTitle: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  linkMeta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
  },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 4,
  },
  medalRow: { gap: 10, paddingBottom: 8 },
  medalChip: {
    width: 140,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(241,188,3,0.35)",
  },
  medalLocked: { opacity: 0.45, borderColor: "transparent" },
  medalTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
  },
  medalXp: {
    color: colors.accent,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
    marginTop: 6,
  },
});
