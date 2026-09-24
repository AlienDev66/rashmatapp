import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { fetchWorkoutLogs } from "@/src/data/achievements";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

export default function WorkoutLogsScreen() {
  const t = useT();
  const { user } = useAuth();
  const { sessions } = useCatalog();
  const [rows, setRows] = useState<
    { sessionId: string; completedAt: string; xpEarned: number; durationSeconds: number | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      void fetchWorkoutLogs(user.id).then((list) => {
        setRows(list);
        setLoading(false);
      });
    }, [user]),
  );

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("logs.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          tone="training"
          title={t("logs.empty")}
          message={t("logs.emptyBody")}
          actionLabel={t("logs.backHub")}
          onAction={() => router.replace("/(tabs)")}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {rows.map((r) => {
            const session = sessions.find((s) => s.id === r.sessionId);
            const mins = r.durationSeconds != null ? Math.round(r.durationSeconds / 60) : null;
            return (
              <Pressable
                key={`${r.sessionId}-${r.completedAt}`}
                style={styles.row}
                onPress={() => router.push(`/workout/${r.sessionId}`)}
              >
                <Image
                  source={{ uri: session?.coverUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {session?.title ?? r.sessionId}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {new Date(r.completedAt).toLocaleDateString()}
                    {mins != null ? ` · ${t("logs.minutes", { n: mins })}` : ""}
                    {` · ${t("logs.xpEarned", { n: r.xpEarned })}`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Screen>
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
  list: { gap: 8, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
  },
  thumb: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors.surfaceElevated },
  rowTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 14 },
  rowMeta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 4,
  },
});
