import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { completeSession, enrollProgram, loadSessionProgress, fetchSetHistory } from "@/src/data/progress";
import { fetchFavoriteProgramIds, toggleFavoriteProgram } from "@/src/data/favorites";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { useWorkoutSession } from "@/src/hooks/useResource";
import { downloadSessionOffline, isSessionOffline } from "@/src/lib/offlineVideo";
import { parseRepScheme } from "@/src/lib/workoutMath";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing, typography } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Bookmark,
  CheckCircle2,
  Clock3,
  Download,
  History,
  Layers,
  Play,
  Star,
} from "lucide-react-native";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/src/i18n";

export default function WorkoutPreviewScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, loading, error, reload } = useWorkoutSession(id);
  const { programs } = useCatalog();
  const { enrollments, completedSessionIds, reload: reloadProgress } = useProgress();
  const { user, refreshProfile } = useAuth();
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadPct, setDownloadPct] = useState(0);
  const [offlineReady, setOfflineReady] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [marking, setMarking] = useState(false);
  const insets = useSafeAreaInsets();

  const program = programs.find((p) => p.id === session?.programId);
  const enrolled = !!session && enrollments.some((e) => e.programId === session.programId);
  const canStart = !!session && session.exercises.length > 0;
  const alreadyDone = !!session && completedSessionIds.includes(session.id);

  const setCount = session
    ? session.exercises.reduce((n, ex) => n + parseRepScheme(ex.reps).length, 0)
    : 0;

  useEffect(() => {
    if (!session) return;
    void isSessionOffline(
      session.id,
      session.exercises.map((e) => e.id),
    ).then(setOfflineReady);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      let cancelled = false;
      void loadSessionProgress(id).then((p) => {
        if (!cancelled) setCanResume(!!p);
      });
      void fetchSetHistory(id).then((rows) => {
        if (!cancelled) setHistoryCount(rows.length);
      });
      if (user?.id && session?.programId) {
        void fetchFavoriteProgramIds(user.id).then((set) => {
          if (!cancelled) setFavorited(set.has(session.programId));
        });
      }
      return () => {
        cancelled = true;
      };
    }, [id, user?.id, session?.programId]),
  );

  const ensureAccess = () => {
    if (program?.isPremium && !enrolled) {
      Alert.alert(t("workoutPreview.unlockRequired"), t("workoutPreview.unlockBody"), [
        { text: t("workoutPreview.maybeLater"), style: "cancel" },
        {
          text: t("workoutPreview.unlock"),
          onPress: () =>
            router.push({ pathname: "/checkout", params: { programId: program.id } }),
        },
      ]);
      return false;
    }
    return true;
  };

  const onMarkOff = async () => {
    if (!session || marking) return;
    if (!ensureAccess()) return;
    setMarking(true);
    try {
      if (user) {
        try {
          await enrollProgram(session.programId);
        } catch {
          /* ok */
        }
      }
      const result = await completeSession({
        sessionId: session.id,
        durationSeconds: (session.minutes || 45) * 60,
        setsLogged: setCount,
      });
      await reloadProgress();
      await refreshProfile();
      router.replace({
        pathname: "/workout-complete",
        params: { id: session.id, xp: String(result.xp || 0) },
      });
    } finally {
      setMarking(false);
    }
  };

  const onStart = async () => {
    if (!session || !canStart || starting) return;
    if (!ensureAccess()) return;
    setStarting(true);
    try {
      if (user) {
        try {
          await enrollProgram(session.programId);
        } catch {
          // allow start even if enroll fails (offline / demo)
        }
      }
      router.push(`/session/${session.id}`);
    } finally {
      setStarting(false);
    }
  };

  const onDownload = async () => {
    if (!session) return;
    if (!ensureAccess()) return;
    if (session.exercises.length === 0) {
      Alert.alert(
        t("workoutPreview.nothingToDownload"),
        t("workoutPreview.nothingToDownloadBody"),
      );
      return;
    }
    setDownloading(true);
    setDownloadPct(0);
    try {
      await downloadSessionOffline({
        sessionId: session.id,
        muxPlaybackId: session.muxPlaybackId,
        videoUrl: session.videoUrl,
        exercises: session.exercises,
        onProgress: setDownloadPct,
      });
      setOfflineReady(true);
      Alert.alert(t("workoutPreview.savedOffline"), t("workoutPreview.savedOfflineBody"));
    } catch (e) {
      Alert.alert(
        t("workoutPreview.downloadFailed"),
        e instanceof Error ? e.message : t("workoutPreview.downloadFailedBody"),
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.root}>
      <QueryGate
        loading={loading}
        error={error}
        empty={!session}
        emptyTone="training"
        emptyTitle={t("workoutPreview.notFound")}
        emptyMessage={t("workoutPreview.notFoundBody")}
        emptyActionLabel={t("common.back")}
        emptyOnAction={() => router.back()}
        onRetry={reload}
      >
        {session ? (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 150 }}
            >
              <View style={styles.hero}>
                <Image
                  source={{ uri: session.coverUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(20,17,17,0.15)", "rgba(20,17,17,0.55)", "#141111"]}
                  locations={[0, 0.45, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.back, { top: insets.top + 8 }]}>
                  <BackButton />
                </View>
                {canStart ? (
                  <Pressable
                    style={[styles.downloadIcon, { top: insets.top + 8 }]}
                    onPress={() => void onDownload()}
                    disabled={downloading}
                    hitSlop={8}
                  >
                    <Download
                      color={offlineReady ? colors.accent : colors.white}
                      size={18}
                    />
                    {downloading ? (
                      <Text style={styles.downloadPct}>{downloadPct}%</Text>
                    ) : null}
                  </Pressable>
                ) : null}
                <View style={styles.heroText}>
                  {program ? (
                    <Text style={styles.programLabel} numberOfLines={1}>
                      {program.title}
                    </Text>
                  ) : null}
                  <Text style={styles.title}>{session.title}</Text>
                  <Text style={styles.desc}>{session.description}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MetaChip
                  icon={<Clock3 color={colors.black} size={14} />}
                  label={t("workoutPreview.minutesChip", { n: session.minutes })}
                />
                <MetaChip
                  icon={<Layers color={colors.black} size={14} />}
                  label={t("workoutPreview.drillsChip", { n: session.exercises.length })}
                />
                <MetaChip
                  icon={<Play color={colors.black} size={14} />}
                  label={t("workoutPreview.roundsChip", { n: setCount })}
                />
              </View>

              <View style={styles.actionGrid}>
                <ActionBtn
                  icon={
                    <Star
                      color={favorited ? colors.accent : colors.white}
                      fill={favorited ? colors.accent : "transparent"}
                      size={18}
                    />
                  }
                  label={t("workoutPreview.favorite")}
                  onPress={() => {
                    if (!program) return;
                    void toggleFavoriteProgram(program.id, user?.id).then((r) =>
                      setFavorited(r.favorited),
                    );
                  }}
                />
                <ActionBtn
                  icon={<Bookmark color={colors.white} size={18} />}
                  label={t("workoutPreview.saveOffline")}
                  onPress={() => void onDownload()}
                />
                <ActionBtn
                  icon={<History color={colors.white} size={18} />}
                  label={
                    historyCount
                      ? t("workoutPreview.logsCount", { n: historyCount })
                      : t("workoutPreview.history")
                  }
                  onPress={() =>
                    Alert.alert(
                      t("workoutPreview.historyTitle"),
                      historyCount
                        ? t("workoutPreview.historyBody", { n: historyCount })
                        : t("workoutPreview.historyEmpty"),
                    )
                  }
                />
                <ActionBtn
                  icon={<CheckCircle2 color={alreadyDone ? colors.accent : colors.white} size={18} />}
                  label={
                    alreadyDone ? t("workoutPreview.done") : t("workoutPreview.markOff")
                  }
                  onPress={() => {
                    if (alreadyDone) {
                      Alert.alert(
                        t("workoutPreview.alreadyComplete"),
                        t("workoutPreview.alreadyCompleteBody"),
                      );
                      return;
                    }
                    Alert.alert(
                      t("workoutPreview.markTitle"),
                      t("workoutPreview.markBody"),
                      [
                        { text: t("common.cancel"), style: "cancel" },
                        {
                          text: t("workoutPreview.markOff"),
                          onPress: () => void onMarkOff(),
                        },
                      ],
                    );
                  }}
                />
              </View>

              <View style={styles.overviewCard}>
                <Text style={styles.overviewTitle}>{t("workoutPreview.overviewTitle")}</Text>
                <View style={styles.overviewStats}>
                  <View style={styles.ovStat}>
                    <Text style={styles.ovValue}>{session.exercises.length}</Text>
                    <Text style={styles.ovLabel}>{t("workoutPreview.drills")}</Text>
                  </View>
                  <View style={styles.ovDiv} />
                  <View style={styles.ovStat}>
                    <Text style={styles.ovValue}>{setCount}</Text>
                    <Text style={styles.ovLabel}>{t("workoutPreview.rounds")}</Text>
                  </View>
                  <View style={styles.ovDiv} />
                  <View style={styles.ovStat}>
                    <Text style={styles.ovValue}>{session.minutes}</Text>
                    <Text style={styles.ovLabel}>{t("workoutPreview.minutes")}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.flowHint}>
                <Text style={styles.flowTitle}>{t("workoutPreview.howItWorks")}</Text>
                <Text style={styles.flowBody}>{t("workoutPreview.howItWorksBody")}</Text>
              </View>

              <View style={styles.body}>
                <Text style={styles.section}>{t("workoutPreview.sectionDrills")}</Text>
                {session.exercises.length === 0 ? (
                  <EmptyState
                    compact
                    tone="training"
                    title={t("workoutPreview.noDrills")}
                    message={t("workoutPreview.noDrillsBody")}
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    {session.exercises.map((ex, i) => {
                      const sets = Math.max(parseRepScheme(ex.reps).length, 1);
                      return (
                        <View key={ex.id} style={styles.ex}>
                          <Text style={styles.exNum}>{i + 1}</Text>
                          <Image source={{ uri: ex.thumbnailUrl }} style={styles.thumb} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.exName}>{ex.name}</Text>
                            <Text style={styles.exMeta}>
                              {ex.reps}
                              {"  ·  "}
                              {sets === 1
                                ? t("workoutPreview.setOne")
                                : t("workoutPreview.setMany", { n: sets })}
                              {"  ·  "}
                              {t("workoutPreview.restSeconds", { n: ex.restSeconds ?? 60 })}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[styles.fabWrap, { paddingBottom: insets.bottom + 12 }]}>
              <Button
                label={
                  !canStart
                    ? t("workoutPreview.drillsUnavailable")
                    : canResume
                      ? t("workoutPreview.resumeSession")
                      : t("workoutPreview.startSession")
                }
                variant="accent"
                loading={starting}
                disabled={!canStart || starting}
                onPress={() => void onStart()}
                style={styles.fab}
              />
            </View>
          </>
        ) : null}
      </QueryGate>
    </View>
  );
}

function MetaChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.metaChip}>
      {icon}
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress}>
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  hero: { height: 320, justifyContent: "flex-end" },
  back: { position: "absolute", left: spacing.lg, zIndex: 2 },
  downloadIcon: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 2,
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  downloadPct: {
    color: colors.white,
    fontFamily: fonts.poppinsMedium,
    fontSize: 11,
  },
  heroText: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  programLabel: {
    color: colors.accent,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
    marginBottom: 6,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 34,
    lineHeight: 36,
  },
  desc: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: fonts.poppinsRegular,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.xl,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  metaChipText: {
    color: colors.black,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: "row",
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 12,
  },
  actionLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 10,
    textAlign: "center",
  },
  overviewCard: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  overviewTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
    marginBottom: 12,
  },
  overviewStats: { flexDirection: "row", alignItems: "center" },
  ovStat: { flex: 1, alignItems: "center" },
  ovValue: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 26,
    lineHeight: 28,
  },
  ovLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 2,
  },
  ovDiv: { width: 1, height: 28, backgroundColor: colors.border },
  flowHint: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flowTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
  },
  flowBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  body: { padding: spacing.xl },
  section: {
    ...typography.section,
    color: colors.white,
    marginBottom: spacing.md,
  },
  ex: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    alignItems: "center",
  },
  exNum: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 22,
    width: 24,
    textAlign: "center",
  },
  thumb: { width: 60, height: 60, borderRadius: radii.md },
  exName: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
  },
  exMeta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  fabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    backgroundColor: "rgba(20,17,17,0.92)",
  },
  fab: {
    alignSelf: "stretch",
    paddingVertical: 16,
  },
});
