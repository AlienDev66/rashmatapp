import { DayHeroCard } from "@/src/components/train/DayHeroCard";
import { ProgramDrawer } from "@/src/components/train/ProgramDrawer";
import { WeekDayStrip } from "@/src/components/train/WeekDayStrip";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { Screen } from "@/src/components/ui/Screen";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import {
  buildProgramSchedule,
  daysForWeek,
  initialSelectedDay,
  orderedProgramSessions,
  weekCount,
  weekIndexForDay,
  type ScheduleDay,
} from "@/src/lib/trainSchedule";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useFocusEffect } from "expo-router";
import { Bell, Menu } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const { profile, refreshProfile } = useAuth();
  const {
    programs,
    sessions,
    loading: catalogLoading,
    error: catalogError,
    refresh: refreshCatalog,
    refreshing,
    online,
  } = useCatalog();
  const {
    loading: progressLoading,
    error: progressError,
    enrollments,
    currentProgram,
    weeklyDone,
    completedSessionIds,
    reload: reloadProgress,
  } = useProgress();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<ScheduleDay | null>(null);

  const loading = catalogLoading || progressLoading;
  const error = catalogError || progressError;

  const enrolled = enrollments.length > 0;
  const activeProgram =
    programs.find((p) => p.id === activeProgramId) ??
    currentProgram ??
    (enrollments[0]
      ? programs.find((p) => p.id === enrollments[0]!.programId) ?? null
      : null);

  const enrollment = enrollments.find((e) => e.programId === activeProgram?.id) ?? enrollments[0];

  useFocusEffect(
    useCallback(() => {
      void reloadProgress();
    }, [reloadProgress]),
  );

  useEffect(() => {
    if (!activeProgramId && currentProgram?.id) {
      setActiveProgramId(currentProgram.id);
    } else if (!activeProgramId && enrollments[0]?.programId) {
      setActiveProgramId(enrollments[0].programId);
    }
  }, [activeProgramId, currentProgram?.id, enrollments]);

  const completedSet = useMemo(
    () => new Set(completedSessionIds),
    [completedSessionIds],
  );

  const schedule = useMemo(() => {
    if (!activeProgram) return [];
    const programSessions = orderedProgramSessions(
      sessions,
      activeProgram.id,
      enrollment?.dayOrder ?? [],
    );
    return buildProgramSchedule(
      programSessions,
      activeProgram,
      enrollment?.currentDay ?? 1,
      completedSet,
    );
  }, [activeProgram, sessions, enrollment?.dayOrder, enrollment?.currentDay, completedSet]);

  const totalWeeks = weekCount(schedule);
  const weekDays = daysForWeek(schedule, weekIndex);

  useEffect(() => {
    if (schedule.length === 0) {
      setSelectedDay(null);
      return;
    }
    const initial = initialSelectedDay(schedule, enrollment?.currentDay ?? 1);
    if (initial) {
      setSelectedDay(initial);
      setWeekIndex(initial.weekIndex);
    }
  }, [schedule, enrollment?.currentDay, activeProgram?.id]);

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshCatalog(), reloadProgress(), refreshProfile()]);
  }, [refreshCatalog, reloadProgress, refreshProfile]);

  const onSelectDay = (day: ScheduleDay) => {
    setSelectedDay(day);
  };

  const goWorkout = (sessionId: string) => {
    router.push(`/workout/${sessionId}`);
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <QueryGate
          loading={loading}
          error={error}
          empty={!enrolled || !activeProgram}
          emptyTone="training"
          emptyTitle="No active program"
          emptyMessage="Unlock a creator camp to track your week and next session here."
          emptyActionLabel="Browse programs  →"
          emptyOnAction={() => router.push("/(tabs)/programs")}
          emptySecondaryLabel="Meet creators"
          emptyOnSecondary={() => router.push("/(tabs)/creators")}
          onRetry={onRefresh}
          offline={!online}
        >
          {activeProgram && selectedDay ? (
            <>
              <View style={styles.hubHeader}>
                <BrandMark size={28} variant="yellow" />
                <Pressable
                  style={styles.programTitleBtn}
                  onPress={() => router.push(`/program/${activeProgram.id}`)}
                >
                  <Text style={styles.programTitle} numberOfLines={1}>
                    {activeProgram.title}
                  </Text>
                  <Text style={styles.programChevron}>›</Text>
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications")}>
                  <Bell color={colors.white} size={18} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => setDrawerOpen(true)}>
                  <Menu color={colors.white} size={20} />
                </Pressable>
              </View>

              <View style={styles.accel}>
                <View style={styles.accelTop}>
                  <Text style={styles.accelTitle}>Accelerate your progress</Text>
                  <Text style={styles.why}>Why 4?</Text>
                </View>
                <Text style={styles.accelSub}>
                  {weeklyDone}/4 workouts this week. Keep going.
                </Text>
                <View style={styles.segments}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[styles.segment, i < weeklyDone && styles.segmentOn]}
                    />
                  ))}
                </View>
              </View>

              <WeekDayStrip
                weekIndex={weekIndex}
                weekTotal={totalWeeks}
                days={weekDays}
                selectedAbsoluteDay={selectedDay.absoluteDay}
                onPrevWeek={() => {
                  const next = Math.max(0, weekIndex - 1);
                  setWeekIndex(next);
                  const days = daysForWeek(schedule, next);
                  if (days[0]) setSelectedDay(days[0]);
                }}
                onNextWeek={() => {
                  const next = Math.min(totalWeeks - 1, weekIndex + 1);
                  setWeekIndex(next);
                  const days = daysForWeek(schedule, next);
                  if (days[0]) setSelectedDay(days[0]);
                }}
                onSelectDay={onSelectDay}
              />

              <DayHeroCard
                day={selectedDay}
                onPreview={
                  selectedDay.session
                    ? () => goWorkout(selectedDay.session!.id)
                    : undefined
                }
                onStart={
                  selectedDay.session
                    ? () => goWorkout(selectedDay.session!.id)
                    : undefined
                }
              />
            </>
          ) : null}
        </QueryGate>
      </ScrollView>

      <ProgramDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        programs={programs}
        enrollments={enrollments}
        activeProgramId={activeProgram?.id ?? null}
        isCreator={!!profile?.is_creator}
        onSelectProgram={(id) => {
          setActiveProgramId(id);
          const en = enrollments.find((e) => e.programId === id);
          if (en) setWeekIndex(weekIndexForDay(en.currentDay));
        }}
        onOpenProgress={(id) => router.push(`/progress/${id}`)}
        onOpenOverview={(id) => router.push(`/program/${id}`)}
        onOpenStudio={() => router.push("/studio")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
    gap: spacing.xl,
  },
  hubHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
  },
  programTitleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  programTitle: {
    flexShrink: 1,
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  programChevron: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 20,
    lineHeight: 22,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  accel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  accelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accelTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
  },
  why: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
  },
  accelSub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
  },
  segments: { flexDirection: "row", gap: 6 },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
  },
  segmentOn: { backgroundColor: colors.accent },
});
