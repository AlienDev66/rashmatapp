import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { enrollProgram, loadSessionProgress } from "@/src/data/progress";
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
import { Clock3, Download, Layers, Play } from "lucide-react-native";
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

export default function WorkoutPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, loading, error, reload } = useWorkoutSession(id);
  const { programs } = useCatalog();
  const { enrollments } = useProgress();
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadPct, setDownloadPct] = useState(0);
  const [offlineReady, setOfflineReady] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const insets = useSafeAreaInsets();

  const program = programs.find((p) => p.id === session?.programId);
  const enrolled = !!session && enrollments.some((e) => e.programId === session.programId);
  const canStart = !!session && session.exercises.length > 0;

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
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  const ensureAccess = () => {
    if (program?.isPremium && !enrolled) {
      Alert.alert("Unlock required", "Demo-unlock this program to train.", [
        { text: "Maybe later", style: "cancel" },
        {
          text: "Unlock",
          onPress: () =>
            router.push({ pathname: "/checkout", params: { programId: program.id } }),
        },
      ]);
      return false;
    }
    return true;
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
      Alert.alert("Nothing to download", "This session has no drills yet.");
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
      Alert.alert("Saved offline", "Videos are ready when you lose connection.");
    } catch (e) {
      Alert.alert(
        "Download failed",
        e instanceof Error ? e.message : "Try again on Wi‑Fi.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const setCount = session
    ? session.exercises.reduce((n, ex) => n + parseRepScheme(ex.reps).length, 0)
    : 0;

  return (
    <View style={styles.root}>
      <QueryGate
        loading={loading}
        error={error}
        empty={!session}
        emptyTone="training"
        emptyTitle="Session not found"
        emptyMessage="This session isn’t available. Pick another day from your program."
        emptyActionLabel="Back"
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
                <MetaChip icon={<Clock3 color={colors.black} size={14} />} label={`${session.minutes} min`} />
                <MetaChip icon={<Layers color={colors.black} size={14} />} label={`${session.exercises.length} drills`} />
                <MetaChip icon={<Play color={colors.black} size={14} />} label={`${setCount} sets`} />
              </View>

              <View style={styles.flowHint}>
                <Text style={styles.flowTitle}>How it works</Text>
                <Text style={styles.flowBody}>
                  Watch the drill · hit Complete set · rest timer · next set. Videos loop so you can match the movement.
                </Text>
              </View>

              <View style={styles.body}>
                <Text style={styles.section}>SESSION DRILLS</Text>
                {session.exercises.length === 0 ? (
                  <EmptyState
                    compact
                    tone="training"
                    title="No drills yet"
                    message="This session doesn’t have exercises published. Check back soon."
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
                              {sets} set{sets === 1 ? "" : "s"}
                              {"  ·  "}
                              {ex.restSeconds ?? 60}s rest
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
                    ? "Drills unavailable"
                    : canResume
                      ? "Resume session  →"
                      : "Start session  →"
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
