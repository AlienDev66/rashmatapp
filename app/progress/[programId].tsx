import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { Screen } from "@/src/components/ui/Screen";
import { sessionsForProgram } from "@/src/data/catalog";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ProgramProgressScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { programs, sessions, loading, error, refresh } = useCatalog();
  const { enrollments, reload } = useProgress();

  const program = programs.find((p) => p.id === programId);
  const enrollment = enrollments.find((e) => e.programId === programId);
  const days = program ? sessionsForProgram(sessions, program.id) : [];
  const pct = enrollment?.progressPct ?? 0;

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>My progress</Text>
        <View style={{ width: 40 }} />
      </View>

      <QueryGate
        loading={loading}
        error={error}
        empty={!program}
        emptyTone="missing"
        emptyTitle="Program not found"
        emptyMessage="You may not be enrolled, or this program was removed."
        emptyActionLabel="Browse programs  →"
        emptyOnAction={() => router.replace("/(tabs)/programs")}
        onRetry={() => {
          void refresh();
          void reload();
        }}
      >
        {program ? (
          <>
            <Text style={styles.hero}>{program.title}</Text>
            <Text style={styles.sub}>
              {enrollment
                ? `Day ${enrollment.currentDay} · ${pct}% complete`
                : "Not enrolled yet — unlock to start tracking."}
            </Text>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} />
            </View>

            <Text style={styles.section}>SCHEDULE</Text>
            {days.length === 0 ? (
              <EmptyState
                compact
                tone="training"
                title="No sessions yet"
                message="This program doesn’t have a schedule published."
              />
            ) : (
              <View style={{ gap: 8 }}>
                {days.map((d, i) => {
                  const done = enrollment ? i + 1 < enrollment.currentDay || pct >= 100 : false;
                  const current = enrollment?.currentDay === i + 1;
                  return (
                    <View key={d.id} style={[styles.day, current && styles.dayCurrent]}>
                      <Text style={styles.dayTitle}>{d.title}</Text>
                      <Text style={styles.dayMeta}>
                        {done ? "Done" : current ? "Up next" : d.meta}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <Button
              label={enrollment ? "Continue training  →" : "Unlock program  →"}
              variant="accent"
              style={{ marginTop: 24 }}
              onPress={() => {
                if (enrollment) {
                  const next = days[Math.max(0, (enrollment.currentDay ?? 1) - 1)] ?? days[0];
                  if (next) router.push(`/workout/${next.id}`);
                } else {
                  router.push({ pathname: "/checkout", params: { programId: program.id } });
                }
              }}
            />
          </>
        ) : null}
      </QueryGate>
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
  hero: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginTop: 8,
    marginBottom: 16,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
    marginBottom: 20,
  },
  barFill: { height: "100%", backgroundColor: colors.accent },
  section: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    letterSpacing: 1,
    marginBottom: 10,
  },
  day: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
  },
  dayCurrent: { borderWidth: 1, borderColor: colors.accent },
  dayTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  dayMeta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 4 },
});
