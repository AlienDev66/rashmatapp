import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { sessionsForProgram } from "@/src/data/catalog";
import { enrollProgram } from "@/src/data/progress";
import { restartProgram, toggleFavoriteProgram, fetchFavoriteProgramIds } from "@/src/data/favorites";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { useAuth } from "@/src/providers/AuthProvider";
import { loadDayOrder, saveDayOrder } from "@/src/lib/dayOrder";
import { colors, fonts, radii, spacing, typography } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Calendar, Clock, GripVertical, RotateCcw, Star } from "lucide-react-native";
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
import { useT } from "@/src/i18n";

type DayItem = {
  id: string;
  title: string;
  meta: string;
  thumb: string;
  rest: boolean;
};

export default function ProgramDetailScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { programs, sessions, loading, error, refresh, online } = useCatalog();
  const { enrollments, resume, completedSessionIds, reload: reloadProgress } = useProgress();
  const program = programs.find((p) => p.id === id) ?? null;
  const [tab, setTab] = useState<"overview" | "program">("overview");
  const [enrolling, setEnrolling] = useState(false);
  const [days, setDays] = useState<DayItem[]>([]);
  const [favorited, setFavorited] = useState(false);
  const insets = useSafeAreaInsets();
  const completed = useMemo(() => new Set(completedSessionIds), [completedSessionIds]);

  const doneCount = useMemo(
    () => days.filter((d) => !d.rest && completed.has(d.id)).length,
    [days, completed],
  );
  const totalTrainDays = useMemo(() => days.filter((d) => !d.rest).length, [days]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || !program) return;
      void fetchFavoriteProgramIds(user.id).then((set) => setFavorited(set.has(program.id)));
    }, [user?.id, program?.id]),
  );

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
    if (!program) return days.find((d) => !d.rest)?.id;
    const fromResume = resume.find((r) => r.programId === program.id);
    if (fromResume && !completed.has(fromResume.id)) return fromResume.id;
    const incomplete = days.find((d) => !d.rest && !completed.has(d.id));
    return incomplete?.id ?? days.find((d) => !d.rest)?.id;
  }, [days, program, resume, completed]);

  const onEnroll = async () => {
    if (!program) return;
    if (!user) {
      Alert.alert(t("common.signInRequired"), t("programDetail.joinBody"));
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
      const firstId = nextWorkoutId ?? days.find((d) => !d.rest)?.id;
      if (firstId) {
        router.replace(`/workout/${firstId}`);
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      Alert.alert(
        t("home.couldNotStart"),
        e instanceof Error ? e.message : t("home.tryAgain"),
      );
    } finally {
      setEnrolling(false);
    }
  };

  const startTraining = async () => {
    if (!program) return;
    if (!enrolled) {
      await onEnroll();
      return;
    }
    const firstId = nextWorkoutId ?? days.find((d) => !d.rest)?.id;
    if (firstId) {
      router.push(`/workout/${firstId}`);
      return;
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
    ({ item, drag, isActive }: RenderItemParams<DayItem>) => {
      const done = completed.has(item.id);
      const isNext = item.id === nextWorkoutId && !done;
      return (
        <ScaleDecorator>
          <Pressable
            style={[
              styles.day,
              isActive && styles.dayActive,
              isNext && styles.dayNext,
              done && styles.dayDone,
            ]}
            onPress={() => router.push(`/workout/${item.id}`)}
            onLongPress={drag}
            delayLongPress={160}
            disabled={isActive}
          >
            <Image source={{ uri: item.thumb }} style={styles.dayThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dayTitle}>{item.title}</Text>
              <View style={styles.dayMeta}>
                <Text style={styles.dayMetaText}>
                  {done
                    ? t("programDetail.done")
                    : isNext
                      ? t("programDetail.upNext")
                      : item.meta}
                </Text>
              </View>
            </View>
            <Pressable onPressIn={drag} hitSlop={10} style={styles.grip}>
              <GripVertical color={colors.textMuted} size={18} />
            </Pressable>
          </Pressable>
        </ScaleDecorator>
      );
    },
    [completed, nextWorkoutId, t],
  );

  const hero = program ? (
    <>
      <View style={styles.hero}>
        <Image source={{ uri: program.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={["rgba(0,0,0,0.25)", "#000"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.back, { top: insets.top + 8 }]}>
          <BackButton />
        </View>
        <Pressable
          style={[styles.favBtn, { top: insets.top + 8 }]}
          onPress={() => {
            if (!program) return;
            void toggleFavoriteProgram(program.id, user?.id).then((r) => {
              setFavorited(r.favorited);
              void Haptics.selectionAsync();
            });
          }}
        >
          <Star
            color={favorited ? colors.accent : colors.white}
            fill={favorited ? colors.accent : "transparent"}
            size={18}
          />
        </Pressable>
        {enrolled && totalTrainDays > 0 ? (
          <View style={styles.ringWrap}>
            <View style={styles.ring}>
              <Text style={styles.ringNum}>
                {doneCount}/{totalTrainDays}
              </Text>
              <Text style={styles.ringLabel}>{t("programDetail.days")}</Text>
            </View>
          </View>
        ) : null}
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
          <Text style={[styles.tabText, tab === "overview" && styles.tabTextOn]}>
            {t("programDetail.overviewTab")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "program" && styles.tabOn]}
          onPress={() => setTab("program")}
        >
          <Text style={[styles.tabText, tab === "program" && styles.tabTextOn]}>
            {t("programDetail.programTab")}
          </Text>
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
        emptyTitle={t("programDetail.notFound")}
        emptyMessage={t("programDetail.notFoundBody")}
        emptyActionLabel={t("programDetail.browsePrograms")}
        emptyOnAction={() => router.replace("/(tabs)/programs")}
        onRetry={refresh}
        offline={!online}
      >
        {program ? (
          tab === "overview" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {hero}
              <View style={styles.body}>
                <Text style={styles.section}>{t("programDetail.highlights")}</Text>
                <View style={styles.highlights}>
                  <View style={styles.hl}>
                    <Calendar color={colors.white} size={16} />
                    <Text style={styles.hlText}>
                      {t("programDetail.daysPerWeek", { n: program.daysPerWeek })}
                    </Text>
                  </View>
                  <View style={styles.hl}>
                    <Clock color={colors.white} size={16} />
                    <Text style={styles.hlText}>
                      {t("programDetail.minSession", { n: program.minutes })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.section}>{t("programDetail.overviewSection")}</Text>
                <Text style={styles.copy}>{program.description}</Text>
                {enrollment ? (
                  <>
                    <Text style={styles.progressNote}>
                      {t("programDetail.progressNote", {
                        pct: enrollment.progressPct,
                        day: enrollment.currentDay,
                      })}
                    </Text>
                    <Pressable onPress={() => router.push(`/progress/${program.id}`)}>
                      <Text style={styles.progressLink}>
                        {t("programDetail.viewFullProgress")}
                      </Text>
                    </Pressable>
                    {nextWorkoutId ? (
                      <Pressable
                        style={styles.nextHint}
                        onPress={() => router.push(`/workout/${nextWorkoutId}`)}
                      >
                        <Text style={styles.nextHintLabel}>
                          {t("programDetail.nextSession")}
                        </Text>
                        <Text style={styles.nextHintTitle}>
                          {days.find((d) => d.id === nextWorkoutId)?.title ??
                            t("programDetail.continueLabel")}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}
                <Text style={styles.reorderHint}>
                  {t("programDetail.reorderHintOverview")}
                </Text>
                {enrolled ? (
                  <View style={styles.sideActions}>
                    <Pressable
                      style={styles.sideBtn}
                      onPress={() => router.push("/workout-logs")}
                    >
                      <Text style={styles.sideBtnText}>
                        {t("programDetail.workoutLogs")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.sideBtn}
                      onPress={() => {
                        Alert.alert(
                          t("programDetail.restartTitle"),
                          t("programDetail.restartBody"),
                          [
                            { text: t("common.cancel"), style: "cancel" },
                            {
                              text: t("programDetail.restart"),
                              style: "destructive",
                              onPress: () => {
                                void restartProgram(program.id).then(async ({ error }) => {
                                  if (error)
                                    Alert.alert(t("programDetail.couldNotRestart"), error);
                                  else {
                                    await reloadProgress();
                                    void Haptics.notificationAsync(
                                      Haptics.NotificationFeedbackType.Success,
                                    );
                                  }
                                });
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <RotateCcw color={colors.textMuted} size={14} />
                      <Text style={styles.sideBtnText}>{t("programDetail.restart")}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.sideBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/leaderboard",
                        })
                      }
                    >
                      <Text style={styles.sideBtnText}>{t("programDetail.campRanks")}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          ) : (
            <DraggableFlatList
              data={days}
              keyExtractor={(item) => item.id}
              onDragEnd={onDragEnd}
              renderItem={renderDay}
              containerStyle={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
              ListHeaderComponent={
                <>
                  {hero}
                  <View style={styles.bodyHeader}>
                    <View style={styles.previewHead}>
                      <Text style={styles.section}>{t("programDetail.previewSection")}</Text>
                      <Pressable
                        onPress={() => {
                          if (!program) return;
                          void saveDayOrder(
                            user?.id,
                            program.id,
                            defaultDays.map((d) => d.id),
                          ).then(() => {
                            setDays(defaultDays);
                            void Haptics.selectionAsync();
                          });
                        }}
                      >
                        <Text style={styles.resetOrder}>{t("programDetail.resetOrder")}</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.reorderHint}>
                      {t("programDetail.reorderHintPreview")}
                    </Text>
                  </View>
                </>
              }
              ListEmptyComponent={
                <EmptyState
                  compact
                  tone="training"
                  title={t("programDetail.noDays")}
                  message={t("programDetail.noDaysBody")}
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )
        ) : null}
      </QueryGate>

      {program ? (
        <View style={[styles.sticky, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={
              enrolling
                ? t("programDetail.starting")
                : enrolled
                  ? nextWorkoutId
                    ? t("programDetail.startDay", {
                        day:
                          days
                            .find((d) => d.id === nextWorkoutId)
                            ?.title?.split("·")[0]
                            ?.trim() ?? t("programDetail.nextDay"),
                      })
                    : t("programDetail.continueTraining")
                  : program.isPremium
                    ? t("programDetail.unlockCamp")
                    : t("programDetail.startCamp")
            }
            variant="accent"
            disabled={enrolling}
            onPress={() => {
              if (enrolled) void startTraining();
              else void onEnroll();
            }}
          />
        </View>
      ) : null}
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
  dayNext: { borderWidth: 1, borderColor: colors.accent },
  dayDone: { opacity: 0.72 },
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
  nextHint: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(245,197,24,0.35)",
  },
  nextHintLabel: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  nextHintTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
    marginTop: 4,
  },
  favBtn: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringWrap: {
    position: "absolute",
    top: "32%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.accent,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringNum: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 16,
  },
  ringLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
  },
  sideActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  sideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  sideBtnText: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  previewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resetOrder: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
  },
  sticky: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    backgroundColor: "rgba(20,17,17,0.94)",
  },
});
