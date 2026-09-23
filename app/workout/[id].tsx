import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { enrollProgram } from "@/src/data/progress";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { useWorkoutSession } from "@/src/hooks/useResource";
import { downloadSessionOffline, isSessionOffline } from "@/src/lib/offlineVideo";
import { parseRepScheme } from "@/src/lib/workoutMath";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing, typography } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Download } from "lucide-react-native";
import { useEffect, useState } from "react";
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
        emptyTitle="Workout not found"
        emptyMessage="This session isn’t available. Pick another day from your program."
        emptyActionLabel="Back"
        emptyOnAction={() => router.back()}
        onRetry={reload}
      >
        {session ? (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 140 }}
            >
              <View style={styles.hero}>
                <Image
                  source={{ uri: session.coverUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(0,0,0,0.2)", "#000"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.back, { top: insets.top + 8 }]}>
                  <BackButton />
                </View>
                <View style={styles.heroText}>
                  {program?.isPremium ? (
                    <Text style={styles.proBadge}>PRO</Text>
                  ) : null}
                  <Text style={styles.title}>{session.title}</Text>
                  <Text style={styles.desc}>{session.description}</Text>
                  <View style={styles.tags}>
                    {session.tags.map((t) => (
                      <View key={t} style={styles.tag}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  {session.minutes} MIN | {setCount} SETS | {session.exercises.length} DRILLS
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
                    {session.exercises.map((ex, i) => (
                      <View key={ex.id} style={styles.ex}>
                        <Text style={styles.exNum}>{i + 1}</Text>
                        <Image source={{ uri: ex.thumbnailUrl }} style={styles.thumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.exName}>{ex.name}</Text>
                          <View style={styles.reps}>
                            <Text style={styles.repsText}>{ex.reps}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[styles.fabWrap, { paddingBottom: insets.bottom + 12 }]}>
              {canStart ? (
                <Pressable
                  style={styles.downloadBtn}
                  onPress={onDownload}
                  disabled={downloading}
                >
                  <Download color={colors.white} size={18} />
                  <Text style={styles.downloadText}>
                    {downloading
                      ? `${downloadPct}%`
                      : offlineReady
                        ? "Downloaded"
                        : "Download"}
                  </Text>
                </Pressable>
              ) : null}
              <Button
                label={canStart ? "Start Workout  →" : "Drills unavailable"}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  hero: { height: 300, justifyContent: "flex-end" },
  back: { position: "absolute", left: spacing.lg, zIndex: 2 },
  heroText: { padding: spacing.xl },
  proBadge: {
    alignSelf: "flex-start",
    color: colors.black,
    backgroundColor: colors.accent,
    fontFamily: fonts.poppinsBold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 26,
    lineHeight: 30,
  },
  desc: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.poppinsRegular,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: {
    backgroundColor: colors.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { color: colors.white, fontFamily: fonts.poppinsMedium, fontSize: 11 },
  banner: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    alignItems: "center",
  },
  bannerText: {
    ...typography.section,
    color: colors.black,
    fontSize: 12,
    letterSpacing: 1,
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
    fontSize: 20,
    width: 22,
    textAlign: "center",
  },
  thumb: { width: 56, height: 56, borderRadius: radii.md },
  exName: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  reps: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  repsText: { color: colors.textMuted, fontFamily: fonts.poppinsMedium, fontSize: 11 },
  fabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.xl,
    backgroundColor: "transparent",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  downloadText: { color: colors.white, fontFamily: fonts.poppinsMedium, fontSize: 13 },
  fab: {
    alignSelf: "stretch",
    paddingVertical: 16,
  },
});
