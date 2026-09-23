import { SessionVideo } from "@/src/components/session/SessionVideo";
import { QueryGate } from "@/src/components/ui/QueryGate";
import {
  completeSession,
  fetchMaxReps,
  loadSessionProgress,
  logSetRep,
  saveSessionProgress,
} from "@/src/data/progress";
import { useWorkoutSession } from "@/src/hooks/useResource";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  estimateSessionXp,
  formatRepsLabel,
  nextSpeed,
  parseRepScheme,
  type PlaybackSpeed,
} from "@/src/lib/workoutMath";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronsLeft, ChevronsRight, Play, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Phase = "work" | "rest";

export default function SessionPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, loading, error, reload } = useWorkoutSession(id);
  const { user, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("work");
  const [restLeft, setRestLeft] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [elapsed, setElapsed] = useState(0);
  const [repsInput, setRepsInput] = useState("");
  const [maxReps, setMaxReps] = useState<number | null>(null);
  const [setsLogged, setSetsLogged] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const startedAt = useRef(Date.now());
  const baseElapsed = useRef(0);

  const exercise = session?.exercises[exerciseIndex];
  const scheme = useMemo(
    () => parseRepScheme(exercise?.reps),
    [exercise?.reps],
  );
  const totalSets = scheme.length;
  const targetReps = scheme[setIndex] ?? scheme[0] ?? 8;
  const nextExercise = session?.exercises[exerciseIndex + 1];
  const isLastSet = setIndex >= totalSets - 1;
  const isLastExercise = !!session && exerciseIndex >= session.exercises.length - 1;

  const nextLabel = useMemo(() => {
    if (phase === "rest") {
      if (!isLastSet) return `${exercise?.name ?? "Exercise"} · Set ${setIndex + 2}`;
      if (nextExercise) return nextExercise.name;
      return "Finish";
    }
    if (!isLastSet) {
      return `Set ${setIndex + 2} · ${formatRepsLabel(scheme[setIndex + 1] ?? targetReps, exercise?.reps)}`;
    }
    if (nextExercise) return nextExercise.name;
    return "Finish session";
  }, [
    phase,
    isLastSet,
    exercise?.name,
    exercise?.reps,
    setIndex,
    nextExercise,
    scheme,
    targetReps,
  ]);

  const nextMeta = useMemo(() => {
    if (phase === "rest") return `Rest ${restLeft}s`;
    if (!isLastSet) return formatRepsLabel(scheme[setIndex + 1] ?? targetReps, exercise?.reps);
    if (nextExercise) {
      const n = parseRepScheme(nextExercise.reps);
      return formatRepsLabel(n[0] ?? 8, nextExercise.reps);
    }
    return "Done";
  }, [phase, restLeft, isLastSet, scheme, setIndex, targetReps, nextExercise, exercise?.reps]);

  // Reset player state when navigating to a different session
  useEffect(() => {
    setExerciseIndex(0);
    setSetIndex(0);
    setPhase("work");
    setRestLeft(0);
    setPlaying(true);
    setSpeed(1);
    setElapsed(0);
    setSetsLogged(0);
    setFinishing(false);
    setHydrated(false);
    baseElapsed.current = 0;
    startedAt.current = Date.now();
  }, [id]);

  // Hydrate partial progress once per session load
  useEffect(() => {
    if (!session || hydrated) return;
    let cancelled = false;
    const run = async () => {
      const progress = await loadSessionProgress(session.id);
      if (cancelled) return;
      if (progress && session.exercises.length > 0) {
        setExerciseIndex(
          Math.min(progress.exerciseIndex, Math.max(session.exercises.length - 1, 0)),
        );
        const schemeLen = parseRepScheme(
          session.exercises[
            Math.min(progress.exerciseIndex, session.exercises.length - 1)
          ]?.reps,
        ).length;
        setSetIndex(Math.min(progress.setIndex, Math.max(schemeLen - 1, 0)));
        baseElapsed.current = progress.elapsedSeconds;
        startedAt.current = Date.now();
        setElapsed(progress.elapsedSeconds);
      }
      setHydrated(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [session, hydrated]);

  useEffect(() => {
    setRepsInput(String(targetReps));
  }, [exerciseIndex, setIndex, targetReps]);

  useEffect(() => {
    if (!exercise) return;
    let cancelled = false;
    void fetchMaxReps(exercise.id).then((v) => {
      if (!cancelled) setMaxReps(v);
    });
    return () => {
      cancelled = true;
    };
  }, [exercise?.id]);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(baseElapsed.current + Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== "rest") return;
    if (restLeft <= 0) {
      setPhase("work");
      setPlaying(true);
      return;
    }
    const t = setTimeout(() => setRestLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restLeft]);

  const persist = useCallback(
    async (status: "in_progress" | "abandoned" | "completed" = "in_progress") => {
      if (!session) return;
      const duration =
        baseElapsed.current + Math.floor((Date.now() - startedAt.current) / 1000);
      await saveSessionProgress({
        sessionId: session.id,
        exerciseIndex,
        setIndex,
        elapsedSeconds: duration,
        status,
      });
    },
    [session, exerciseIndex, setIndex],
  );

  // Autosave every 15s
  useEffect(() => {
    if (!session || !hydrated) return;
    const t = setInterval(() => {
      void persist("in_progress");
    }, 15000);
    return () => clearInterval(t);
  }, [session, hydrated, persist]);

  const finishWorkout = async () => {
    if (!session || finishing) return;
    setFinishing(true);
    const duration =
      baseElapsed.current + Math.floor((Date.now() - startedAt.current) / 1000);
    const xpHint = estimateSessionXp({ setsLogged, durationSeconds: duration });

    const result = await completeSession({
      sessionId: session.id,
      durationSeconds: duration,
      xpHint,
      setsLogged,
    });

    await persist("completed");
    try {
      await refreshProfile();
    } catch {
      // profile refresh is best-effort
    }
    router.replace({
      pathname: "/workout-complete",
      params: { id: session.id, xp: String(result.xp || xpHint) },
    });
  };

  const completeCurrentSet = async () => {
    if (!session || !exercise || finishing) return;
    const reps = Math.max(0, Number.parseInt(repsInput, 10) || targetReps);
    await logSetRep({
      sessionId: session.id,
      exerciseId: exercise.id,
      setNumber: setIndex + 1,
      reps,
    });
    setSetsLogged((n) => n + 1);
    if (maxReps == null || reps > maxReps) setMaxReps(reps);

    if (!isLastSet) {
      const rest = exercise.restSeconds ?? 60;
      setSetIndex((s) => s + 1);
      setPhase("rest");
      setRestLeft(rest);
      setPlaying(false);
      void persist("in_progress");
      return;
    }

    if (!isLastExercise) {
      const rest = exercise.restSeconds ?? 60;
      setExerciseIndex((i) => i + 1);
      setSetIndex(0);
      setPhase("rest");
      setRestLeft(rest);
      setPlaying(false);
      void persist("in_progress");
      return;
    }

    await finishWorkout();
  };

  const skipRest = () => {
    setRestLeft(0);
    setPhase("work");
    setPlaying(true);
  };

  const onAdvance = () => {
    if (phase === "rest") {
      skipRest();
      return;
    }
    void completeCurrentSet();
  };

  const onExit = () => {
    Alert.alert("Leave session?", "Your progress will be saved so you can resume later.", [
      { text: "Keep training", style: "cancel" },
      {
        text: "Save & exit",
        onPress: () => {
          void persist("in_progress").then(() => router.back());
        },
      },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          void persist("abandoned").then(() => router.back());
        },
      },
    ]);
  };

  const goPrevSet = () => {
    if (phase === "rest") {
      skipRest();
      return;
    }
    if (setIndex > 0) {
      setSetIndex((s) => s - 1);
      return;
    }
    if (exerciseIndex > 0) {
      const prev = session?.exercises[exerciseIndex - 1];
      const prevScheme = parseRepScheme(prev?.reps);
      setExerciseIndex((i) => i - 1);
      setSetIndex(Math.max(prevScheme.length - 1, 0));
    }
  };

  const goNextSet = () => {
    if (phase === "rest") {
      skipRest();
      return;
    }
    if (!isLastSet) {
      setSetIndex((s) => s + 1);
      return;
    }
    if (!isLastExercise) {
      setExerciseIndex((i) => i + 1);
      setSetIndex(0);
    }
  };

  return (
    <View style={styles.root}>
      <QueryGate
        loading={loading || !hydrated}
        error={error}
        empty={!session || !exercise}
        emptyTone="training"
        emptyTitle="Session not found"
        emptyMessage="This drill isn’t available. Go back and pick another day."
        emptyActionLabel="Back"
        emptyOnAction={() => router.back()}
        onRetry={reload}
      >
        {session && exercise ? (
          <>
            <View
              style={[styles.videoLayer, phase === "rest" && styles.videoHidden]}
              pointerEvents={phase === "rest" ? "none" : "auto"}
            >
              <SessionVideo
                cacheKey={exercise.id}
                muxPlaybackId={exercise.muxPlaybackId ?? session.muxPlaybackId}
                videoUrl={exercise.videoUrl ?? session.videoUrl}
                playing={playing && phase === "work"}
                playbackRate={speed}
                loop={false}
                onEnded={() => setPlaying(false)}
              />
            </View>
            {phase === "work" ? (
              <LinearGradient
                colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.85)"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            ) : null}

            <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
              <Pressable onPress={onExit} style={styles.exit} hitSlop={8}>
                <X color={colors.white} size={20} />
              </Pressable>
              <View>
                <Text style={styles.time}>{formatClock(elapsed)}</Text>
                <Text style={styles.meta}>Total Time</Text>
              </View>
              <View style={{ alignItems: "center", flex: 1, paddingHorizontal: 4 }}>
                <Text style={styles.exName} numberOfLines={1}>
                  {exercise.name}
                </Text>
                <Text style={styles.setLine}>
                  {phase === "rest" ? (
                    <Text style={{ color: colors.accent }}>Rest</Text>
                  ) : (
                    <Text style={{ color: colors.accent }}>Working Set</Text>
                  )}
                  {" | "}
                  {formatRepsLabel(targetReps, exercise.reps)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.time}>
                  {setIndex + 1}/{totalSets}
                </Text>
                <Text style={styles.meta}>
                  {/rounds?/i.test(exercise.reps) ? "Rounds" : "Sets"}
                </Text>
              </View>
            </View>

            {phase === "rest" ? (
              <View style={styles.restOverlay} pointerEvents="box-none">
                <Text style={styles.restLabel}>REST</Text>
                <Text style={styles.restClock}>{restLeft}s</Text>
                <Pressable style={styles.skipRest} onPress={skipRest}>
                  <Text style={styles.skipRestText}>Skip rest</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.mid}>
                <Pressable onPress={goPrevSet} style={styles.chev}>
                  <ChevronsLeft color={colors.accent} size={36} />
                </Pressable>
                <Pressable onPress={() => setPlaying((p) => !p)} style={styles.tapZone} />
                <Pressable onPress={goNextSet} style={styles.chev}>
                  <ChevronsRight color={colors.accent} size={36} />
                </Pressable>
              </View>
            )}

            <View style={styles.speedWrap}>
              <Pressable
                style={styles.speed}
                onPress={() => setSpeed((s) => nextSpeed(s))}
              >
                <Text style={styles.speedText}>{speed.toFixed(2).replace(/\.00$/, ".0")}x Speed</Text>
              </Pressable>
            </View>

            <View style={styles.logRow}>
              <Text style={styles.maxText}>
                Max Reps Logged:{" "}
                <Text style={{ color: colors.accent }}>
                  {maxReps != null ? maxReps : "—"}
                </Text>
              </Text>
              {phase === "work" ? (
                <View style={styles.repsBox}>
                  <Text style={styles.repsLabel}>Log</Text>
                  <TextInput
                    style={styles.repsInput}
                    value={repsInput}
                    onChangeText={setRepsInput}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                </View>
              ) : null}
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.next} numberOfLines={1}>
                  Next: {nextLabel}
                </Text>
                <Text style={styles.nextMeta}>{nextMeta}</Text>
                <Text style={styles.progressHint}>
                  Exercise {exerciseIndex + 1}/{session.exercises.length}
                </Text>
              </View>
              <Pressable
                style={[styles.play, finishing && { opacity: 0.6 }]}
                onPress={onAdvance}
                disabled={finishing}
              >
                <Play color={colors.white} fill={colors.white} size={22} />
              </Pressable>
            </View>
          </>
        ) : null}
      </QueryGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  videoHidden: {
    opacity: 0,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    gap: 8,
    zIndex: 2,
  },
  exit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  time: { color: colors.white, fontFamily: fonts.alumniBoldItalic, fontSize: 22, lineHeight: 26 },
  meta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 11, marginTop: 2 },
  exName: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
    textAlign: "center",
  },
  setLine: { color: colors.white, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 4 },
  mid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    zIndex: 2,
  },
  restOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  restLabel: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    letterSpacing: 2,
  },
  restClock: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 72,
    lineHeight: 76,
    marginTop: 8,
  },
  skipRest: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  skipRestText: { color: colors.white, fontFamily: fonts.poppinsMedium, fontSize: 13 },
  chev: { padding: 8 },
  tapZone: { flex: 1, height: "100%" },
  speedWrap: { alignItems: "center", marginBottom: 12, zIndex: 2 },
  speed: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  speedText: { color: colors.white, fontFamily: fonts.poppinsRegular, fontSize: 13 },
  logRow: {
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  maxText: { color: colors.white, fontFamily: fonts.poppinsRegular, fontSize: 13 },
  repsBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  repsLabel: { color: colors.textMuted, fontFamily: fonts.poppinsMedium, fontSize: 12 },
  repsInput: {
    minWidth: 48,
    textAlign: "center",
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: 8,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: 12,
    zIndex: 2,
  },
  next: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 16 },
  nextMeta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, marginTop: 2 },
  progressHint: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 4,
  },
  play: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
