import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { sessionsForProgram } from "@/src/data/catalog";
import { enrollProgram } from "@/src/data/progress";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { useAuth } from "@/src/providers/AuthProvider";
import { loadDayOrder, saveDayOrder } from "@/src/lib/dayOrder";
import { colors, fonts, radii, spacing, typography } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Calendar, Clock, GripVertical } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DayItem = {
  id: string;
  title: string;
  meta: string;
  thumb: string;
  rest: boolean;
};

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { programs, sessions, loading, error, refresh, online } = useCatalog();
  const { enrollments, resume, reload: reloadProgress } = useProgress();
  const program = programs.find((p) => p.id === id) ?? programs[0];
  const [tab, setTab] = useState<"overview" | "program">("overview");
  const [enrolling, setEnrolling] = useState(false);
  const [days, setDays] = useState<DayItem[]>([]);
  const insets = useSafeAreaInsets();

  const defaultDays = useMemo(
    () => (program ? sessionsForProgram(sessions, program.id) : []),
    [program, sessions],
  );

  const enrolled = program ? enrollments.some((e) => e.programId === program.id) : false;
  const enrollment = enrollments.find((e) => e.programId === program?.id);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!program) return;
      const order = await loadDayOrder(
        user?.id,
        program.id,
        defaultDays.map((d) => d.id),
        enrollment?.dayOrder,
      );
      if (cancelled) return;
      const byId = new Map(defaultDays.map((d) => [d.id, d]));
      setDays(order.map((oid) => byId.get(oid)).filter(Boolean) as DayItem[]);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [defaultDays, program, user?.id, enrollment?.dayOrder]);

  const nextWorkoutId = useMemo(() => {
    if (!program) return days[0]?.id;
    const fromResume = resume.find((r) => r.programId === program.id);
    if (fromResume) return fromResume.id;
    return days[0]?.id;
  }, [days, program, resume]);

  const onEnroll = async () => {
    if (!program) return;
    if (!user) {
      Alert.alert("Sign in required", "Create an account to join this program.");
      router.push("/(auth)/sign-in");
      return;
    }
    if (program.isPremium && !enrolled) {
      router.push({ pathname: "/checkout", params: { programId: program.id } });
      return;
    }
    setEnrolling(true);
    try {
      await enrollProgram(program.id);
      await reloadProgress();
      Alert.alert("Enrolled", "This program is now on your home hub.", [
        {
          text: "Go to hub",
          onPress: () => router.replace("/(tabs)"),
        },
        { text: "OK", style: "cancel" },
      ]);
    } catch (e) {
      Alert.alert("Could not enroll", e instanceof Error ? e.message : "Try again");
    } finally {
      setEnrolling(false);
    }
  };

  const startTraining = async () => {
    if (!program) return;
    if (!enrolled) {
      if (program.isPremium) {
        router.push({ pathname: "/checkout", params: { programId: program.id } });
        return;
      }
      if (user) {
        try {
          await enrollProgram(program.id);
          await reloadProgress();
        } catch {
          // still allow continue
        }
      }
      if (nextWorkoutId) {
        router.push(`/workout/${nextWorkoutId}`);
        return;
      }
    }
    router.replace("/(tabs)");
  };

  const onDragEnd = useCallback(
    async ({ data }: { data: DayItem[] }) => {
      setDays(data);
      if (!program) return;
      await saveDayOrder(
        user?.id,
        program.id,
        data.map((d) => d.id),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [program, user?.id],
  );

  const renderDay = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DayItem>) => (
      <ScaleDecorator>
        <Pressable
          style={[styles.day, isActive && styles.dayActive]}
          onPress={() => router.push(`/workout/${item.id}`)}
          onLongPress={drag}
          delayLongPress={160}
          disabled={isActive}
        >
          <Image source={{ uri: item.thumb }} style={styles.dayThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dayTitle}>{item.title}</Text>
            <View style={styles.dayMeta}>
              <Text style={styles.dayMetaText}>{item.meta}</Text>
            </View>
          </View>
          <Pressable onPressIn={drag} hitSlop={10} style={styles.grip}>
            <GripVertical color={colors.textMuted} size={18} />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    ),
    [],
  );

  const hero = program ? (
    <>
      <View style={styles.hero}>
        <Image source={{ uri: program.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={["rgba(0,0,0,0.25)", "#000"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.back, { top: insets.top + 8 }]}>
          <BackButton />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.title}>{program.title}</Text>
          <Text style={styles.desc}>{program.description}</Text>
        </View>
      </View>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "overview" && styles.tabOn]}
          onPress={() => setTab("overview")}
        >
          <Text style={[styles.tabText, tab === "overview" && styles.tabTextOn]}>Overview</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "program" && styles.tabOn]}
          onPress={() => setTab("program")}
        >
          <Text style={[styles.tabText, tab === "program" && styles.tabTextOn]}>Program</Text>
        </Pressable>
      </View>
    </>
  ) : null;

  return (
    <View style={styles.root}>
      <QueryGate
        loading={loading}
        error={error}
        empty={!program}
        emptyTone="missing"
        emptyTitle="Program not found"
        emptyMessage="This camp may have been unpublished or removed."
        emptyActionLabel="Browse programs  →"
        emptyOnAction={() => router.replace("/(tabs)/programs")}
        onRetry={refresh}
        offline={!online}
      >
        {program ? (
          tab === "overview" ? (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {hero}
              <View style={styles.body}>
                <Text style={styles.section}>PROGRAM HIGHLIGHTS</Text>
                <View style={styles.highlights}>
                  <View style={styles.hl}>
                    <Calendar color={colors.white} size={16} />
                    <Text style={styles.hlText}>{program.daysPerWeek} Days Per Week</Text>
                  </View>
                  <View style={styles.hl}>
                    <Clock color={colors.white} size={16} />
                    <Text style={styles.hlText}>{program.minutes} Min Workout</Text>
                  </View>
                </View>
                <Text style={styles.section}>PROGRAM OVERVIEW</Text>
                <Text style={styles.copy}>{program.description}</Text>
                {enrollment ? (
                  <>
                    <Text style={styles.progressNote}>
                      Progress {enrollment.progressPct}% · Day {enrollment.currentDay}
                    </Text>
                    <Pressable onPress={() => router.push(`/progress/${program.id}`)}>
                      <Text style={styles.progressLink}>View full progress ›</Text>
                    </Pressable>
                  </>
                ) : null}
                <Text style={styles.reorderHint}>
                  Open the Program tab and long-press a day to reorder your schedule.
                </Text>
                <Button
                  label={
                    enrolling
                      ? "…"
                      : enrolled
                        ? "Continue training  →"
                        : "Join this program  →"
                  }
                  variant="accent"
                  disabled={enrolling}
                  style={{ marginTop: 20 }}
                  onPress={() => {
                    if (enrolled) void startTraining();
                    else void onEnroll();
                  }}
                />
              </View>
            </ScrollView>
          ) : (
            <DraggableFlatList
              data={days}
              keyExtractor={(item) => item.id}
              onDragEnd={onDragEnd}
              renderItem={renderDay}
              containerStyle={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
              ListHeaderComponent={
                <>
                  {hero}
                  <View style={styles.bodyHeader}>
                    <Text style={styles.section}>YOUR SCHEDULE</Text>
                    <Text style={styles.reorderHint}>
                      Long-press a day (or the grip) and drag up or down.
                    </Text>
                  </View>
                </>
              }
              ListEmptyComponent={
                <EmptyState
                  compact
                  tone="training"
                  title="No days yet"
                  message="This program doesn’t have sessions published."
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )
        ) : null}
      </QueryGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  hero: { height: 280, justifyContent: "flex-end" },
  back: { position: "absolute", left: spacing.lg, zIndex: 2 },
  heroText: { padding: spacing.xl },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  desc: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.poppinsRegular,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  tabs: {
    marginHorizontal: spacing.lg,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    flexDirection: "row",
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radii.md },
  tabOn: { backgroundColor: colors.surfaceElevated },
  tabText: { color: colors.textMuted, fontFamily: fonts.poppinsSemiBold },
  tabTextOn: { color: colors.white },
  body: { padding: spacing.xl, paddingBottom: 40 },
  bodyHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 8 },
  section: {
    ...typography.section,
    color: colors.white,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  highlights: { flexDirection: "row", gap: 10, marginBottom: 18 },
  hl: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hlText: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 12, flex: 1 },
  copy: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, lineHeight: 22, fontSize: 14 },
  progressNote: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
    marginTop: 14,
  },
  progressLink: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 13,
    marginTop: 6,
  },
  reorderHint: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },
  day: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    marginHorizontal: spacing.xl,
  },
  dayActive: { opacity: 0.92, borderWidth: 1, borderColor: colors.accent },
  dayThumb: { width: 52, height: 52, borderRadius: radii.md },
  dayTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  dayMeta: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayMetaText: { color: colors.textMuted, fontFamily: fonts.poppinsMedium, fontSize: 11 },
  grip: { padding: 4 },
});
