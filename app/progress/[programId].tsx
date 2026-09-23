import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { Screen } from "@/src/components/ui/Screen";
import { enrollProgram } from "@/src/data/progress";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { orderedProgramSessions } from "@/src/lib/trainSchedule";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii } from "@/src/theme";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function ProgramProgressScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { user } = useAuth();
  const { programs, sessions, loading, error, refresh } = useCatalog();
  const { enrollments, completedSessionIds, reload } = useProgress();
  const [enrolling, setEnrolling] = useState(false);

  const program = programs.find((p) => p.id === programId);
  const enrollment = enrollments.find((e) => e.programId === programId);
  const completed = useMemo(() => new Set(completedSessionIds), [completedSessionIds]);

  const ordered = useMemo(
    () =>
      program
        ? orderedProgramSessions(sessions, program.id, enrollment?.dayOrder ?? [])
        : [],
    [program, sessions, enrollment?.dayOrder],
  );

  const pct = enrollment?.progressPct ?? 0;
  const nextSession =
    ordered.find((s) => !completed.has(s.id)) ?? ordered[0] ?? null;

  const onStart = async () => {
    if (!program) return;
    if (enrollment) {
      if (nextSession) router.push(`/workout/${nextSession.id}`);
      return;
    }
    if (!user) {
      Alert.alert("Sign in required", "Create an account to start this camp.");
      router.push("/(auth)/sign-in");
      return;
    }
    if (program.isPremium) {
      router.push({ pathname: "/checkout", params: { programId: program.id } });
      return;
    }
    setEnrolling(true);
    try {
      await enrollProgram(program.id);
      await reload();
      const first = ordered[0];
      if (first) router.replace(`/workout/${first.id}`);
    } catch (e) {
      Alert.alert("Could not start", e instanceof Error ? e.message : "Try again");
    } finally {
      setEnrolling(false);
    }
  };

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
                : "Not enrolled yet — start this camp to track progress."}
            </Text>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} />
            </View>

            {nextSession && enrollment ? (
              <Pressable
                style={styles.nextCard}
                onPress={() => router.push(`/workout/${nextSession.id}`)}
              >
                <Image
                  source={{ uri: nextSession.coverUrl }}
                  style={styles.nextThumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextLabel}>NEXT SESSION</Text>
                  <Text style={styles.nextTitle} numberOfLines={1}>
                    {nextSession.title}
                  </Text>
                  <Text style={styles.nextMeta}>
                    Day {nextSession.day} · {nextSession.minutes} min
                  </Text>
                </View>
                <Text style={styles.nextChevron}>›</Text>
              </Pressable>
            ) : null}

            <Text style={styles.section}>SCHEDULE</Text>
            {ordered.length === 0 ? (
              <EmptyState
                compact
                tone="training"
                title="No sessions yet"
                message="This program doesn’t have a schedule published."
              />
            ) : (
              <View style={{ gap: 8 }}>
                {ordered.map((s) => {
                  const done = completed.has(s.id);
                  const current = nextSession?.id === s.id && !done;
                  return (
                    <Pressable
                      key={s.id}
                      style={[styles.day, current && styles.dayCurrent, done && styles.dayDone]}
                      onPress={() => router.push(`/workout/${s.id}`)}
                    >
                      <Image
                        source={{ uri: s.coverUrl }}
                        style={styles.dayThumb}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dayTitle}>{s.title}</Text>
                        <Text style={styles.dayMeta}>
                          {done
                            ? "Done"
                            : current
                              ? "Up next"
                              : `Day ${s.day} · ${s.minutes} min`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Button
              label={
                enrolling
                  ? "Starting…"
                  : enrollment
                    ? "Continue training  →"
                    : program.isPremium
                      ? "Unlock this camp  →"
                      : "Start this camp  →"
              }
              variant="accent"
              disabled={enrolling}
              style={{ marginTop: 24 }}
              onPress={() => void onStart()}
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
    marginBottom: 16,
  },
  barFill: { height: "100%", backgroundColor: colors.accent },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  nextThumb: { width: 56, height: 56, borderRadius: radii.md },
  nextLabel: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  nextTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
    marginTop: 2,
  },
  nextMeta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 2,
  },
  nextChevron: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 22,
  },
  section: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    letterSpacing: 1,
    marginBottom: 10,
  },
  day: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
  },
  dayCurrent: { borderWidth: 1, borderColor: colors.accent },
  dayDone: { opacity: 0.72 },
  dayThumb: { width: 48, height: 48, borderRadius: radii.md },
  dayTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  dayMeta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 4,
  },
});
