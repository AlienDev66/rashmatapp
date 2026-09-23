import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { fetchCreatorStudentProgress, type StudentProgressRow } from "@/src/data/studio";
import { colors, fonts, radii } from "@/src/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

export default function StudioStudentsScreen() {
  const [rows, setRows] = useState<StudentProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        setLoading(true);
        const { error: err, rows: data } = await fetchCreatorStudentProgress();
        if (cancelled) return;
        setError(err);
        setRows(data);
        setLoading(false);
      };
      void run();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Students</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.sub}>Progress across all your published and draft programs.</Text>
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          tone="studio"
          title="No students yet"
          message="Publish a program and share the link — enrollments will show up here."
          actionLabel="My programs  →"
          onAction={() => router.push("/studio")}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {rows.map((s) => (
            <View key={s.enrollment_id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.student_name}</Text>
                <Text style={styles.meta}>{s.program_title}</Text>
                <Text style={styles.meta}>
                  Day {s.current_day} · {s.sessions_done} sessions done
                  {s.last_completed_at
                    ? ` · last ${new Date(s.last_completed_at).toLocaleDateString()}`
                    : ""}
                </Text>
              </View>
              <Text style={styles.pct}>{s.progress_pct}%</Text>
            </View>
          ))}
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
    marginBottom: 8,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginBottom: 16,
    fontSize: 13,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
  },
  name: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  meta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 3 },
  pct: { color: colors.accent, fontFamily: fonts.poppinsSemiBold, fontSize: 16 },
  error: { color: colors.danger, marginBottom: 8 },
});
