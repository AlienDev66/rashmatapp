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
import { tipForDrill } from "@/src/lib/drillTips";
import {
  estimateSessionXp,
  formatRepsLabel,
  nextSpeed,
  parseRepScheme,
  type PlaybackSpeed,
} from "@/src/lib/workoutMath";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Lightbulb, List, Pause, Play, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
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
  const { refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("work");
  const [restLeft, setRestLeft] = useState(0);
  const [restTotal, setRestTotal] = useState(60);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [elapsed, setElapsed] = useState(0);
  const [repsInput, setRepsInput] = useState("");
  const [maxReps, setMaxReps] = useState<number | null>(null);
  const [setsLogged, setSetsLogged] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [note, setNote] = useState("");
  const startedAt = useRef(Date.now());
  const baseElapsed = useRef(0);
  /** Applied when rest ends / is skipped — keeps "Up next" accurate during rest. */
  const afterRestRef = useRef<(() => void) | null>(null);

  const exercise = session?.exercises[exerciseIndex];
  const scheme = useMemo(() => parseRepScheme(exercise?.reps), [exercise?.reps]);
  const totalSets = Math.max(scheme.length, 1);
  const targetReps = scheme[setIndex] ?? scheme[0] ?? 8;
  const nextExercise = session?.exercises[exerciseIndex + 1];
  const isLastSet = setIndex >= totalSets - 1;
  const isLastExercise = !!session && exerciseIndex >= session.exercises.length - 1;
  const isRounds = /rounds?/i.test(exercise?.reps ?? "");

  const totalSteps = useMemo(() => {
    if (!session) return 1;
    return session.exercises.reduce((n, ex) => n + Math.max(parseRepScheme(ex.reps).length, 1), 0);
  }, [session]);

  const completedSteps = useMemo(() => {
    if (!session) return 0;
    let n = 0;
    for (let i = 0; i < exerciseIndex; i++) {
      n += Math.max(parseRepScheme(session.exercises[i]?.reps).length, 1);
    }
    return n + setIndex + (phase === "rest" ? 1 : 0);
  }, [session, exerciseIndex, setIndex, phase]);

  const progress = Math.min(1, completedSteps / Math.max(totalSteps, 1));

  const upNext = useMemo(() => {
    if (phase === "rest") {
      if (!isLastSet) {
        return {
          title: exercise?.name ?? "Drill",
          meta: `${isRounds ? "Round" : "Set"} ${setIndex + 2} of ${totalSets}`,
        };
      }
      if (nextExercise) {
        return {
          title: nextExercise.name,
          meta: formatRepsLabel(parseRepScheme(nextExercise.reps)[0] ?? 8, nextExercise.reps),
        };
      }
      return { title: "Session complete", meta: "Finish & log XP" };
    }
    if (!isLastSet) {
      return {
        title: "Next set",
        meta: formatRepsLabel(scheme[setIndex + 1] ?? targetReps, exercise?.reps),
      };
    }
    if (nextExercise) {
      return { title: nextExercise.name, meta: "Next drill" };
    }
    return { title: "Finish session", meta: "Last set" };
  }, [
    phase,
    isLastSet,
    exercise,
    setIndex,
    totalSets,
    isRounds,
    nextExercise,
    scheme,
    targetReps,
  ]);

  const primaryLabel = useMemo(() => {
    if (phase === "rest") return "Start next";
    if (isLastSet && isLastExercise) return "Finish session";
    if (isLastSet) return "Complete drill";
    return "Complete set";
  }, [phase, isLastSet, isLastExercise]);

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
    afterRestRef.current = null;
  }, [id]);

  useEffect(() => {
    if (!session || hydrated) return;
    let cancelled = false;
    const run = async () => {
      const progressRow = await loadSessionProgress(session.id);
      if (cancelled) return;
      if (progressRow && session.exercises.length > 0) {
        const ei = Math.min(progressRow.exerciseIndex, Math.max(session.exercises.length - 1, 0));
        setExerciseIndex(ei);
        const schemeLen = parseRepScheme(session.exercises[ei]?.reps).length;
        setSetIndex(Math.min(progressRow.setIndex, Math.max(schemeLen - 1, 0)));
        baseElapsed.current = progressRow.elapsedSeconds;
        startedAt.current = Date.now();
        setElapsed(progressRow.elapsedSeconds);
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
      afterRestRef.current?.();
      afterRestRef.current = null;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  useEffect(() => {
    if (!session || !hydrated) return;
    const t = setInterval(() => {
      void persist("in_progress");
    }, 15000);
    return () => clearInterval(t);
  }, [session, hydrated, persist]);

  const beginRest = (seconds: number) => {
    const rest = Math.max(15, seconds);
    setRestTotal(rest);
    setRestLeft(rest);
    setPhase("rest");
    setPlaying(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const finishWorkout = async () => {
    if (!session || finishing) return;
    setFinishing(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      /* best-effort */
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isLastSet && isLastExercise) {
      await finishWorkout();
      return;
    }

    const advanceToNextSet = !isLastSet;
    const nextExerciseIndex = exerciseIndex + 1;
    afterRestRef.current = () => {
      if (advanceToNextSet) {
        setSetIndex((s) => s + 1);
      } else {
        setExerciseIndex(nextExerciseIndex);
        setSetIndex(0);
      }
      void persist("in_progress");
    };

    beginRest(exercise.restSeconds ?? 60);
  };

  const skipRest = () => {
    afterRestRef.current?.();
    afterRestRef.current = null;
    setRestLeft(0);
    setPhase("work");
    setPlaying(true);
    void Haptics.selectionAsync();
  };

  const onAdvance = () => {
    if (phase === "rest") {
      skipRest();
      return;
    }
    void completeCurrentSet();
  };

  const onExit = () => {
    Alert.alert("Leave session?", "Progress is saved — you can resume later.", [
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

  const restPct = restTotal > 0 ? restLeft / restTotal : 0;

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
            <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
              <Pressable onPress={onExit} style={styles.iconBtn} hitSlop={8}>
                <X color={colors.white} size={20} />
              </Pressable>
              <View style={styles.topCenter}>
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {session.title}
                </Text>
                <Text style={styles.clock}>{formatClock(elapsed)}</Text>
              </View>
              <View style={styles.topRight}>
                <Text style={styles.stepCount}>
                  {exerciseIndex + 1}/{session.exercises.length}
                </Text>
                <Text style={styles.stepLabel}>Drill</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>

            {phase === "work" ? (
              <>
                <View style={styles.videoStage}>
                  <SessionVideo
                    key={exercise.id}
                    cacheKey={exercise.id}
                    muxPlaybackId={exercise.muxPlaybackId ?? session.muxPlaybackId}
                    videoUrl={exercise.videoUrl ?? session.videoUrl}
                    playing={playing}
                    playbackRate={speed}
                    loop
                    onEnded={() => setPlaying(true)}
                  />
                  <Pressable
                    style={styles.videoTap}
                    onPress={() => {
                      setPlaying((p) => !p);
                      void Haptics.selectionAsync();
                    }}
                  >
                    {!playing ? (
                      <View style={styles.pauseBadge}>
                        <Pause color={colors.white} fill={colors.white} size={28} />
                        <Text style={styles.pauseText}>Paused · tap to play</Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <LinearGradient
                    colors={["transparent", "rgba(20,17,17,0.9)"]}
                    style={styles.stageFade}
                    pointerEvents="none"
                  />
                </View>

                <View style={styles.workHud}>
                  <Text style={styles.drillName} numberOfLines={2}>
                    {exercise.name}
                  </Text>
                  <View style={styles.cueRow}>
                    <Pressable
                      style={styles.cueBtn}
                      onPress={() => {
                        setShowTip(true);
                        void Haptics.selectionAsync();
                      }}
                    >
                      <Lightbulb color={colors.accent} size={16} />
                      <Text style={styles.cueBtnText}>Tip</Text>
                    </Pressable>
                    <Pressable
                      style={styles.cueBtn}
                      onPress={() => {
                        setShowList(true);
                        void Haptics.selectionAsync();
                      }}
                    >
                      <List color={colors.accent} size={16} />
                      <Text style={styles.cueBtnText}>List</Text>
                    </Pressable>
                  </View>
                  <View style={styles.setRow}>
                    {Array.from({ length: totalSets }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.setDot,
                          i < setIndex && styles.setDotDone,
                          i === setIndex && styles.setDotActive,
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.setCaption}>
                    {isRounds ? "Round" : "Set"} {setIndex + 1} of {totalSets}
                    {"  ·  "}
                    <Text style={{ color: colors.accent }}>
                      {formatRepsLabel(targetReps, exercise.reps)}
                    </Text>
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.restCenter}>
                <Text style={styles.restKicker}>RECOVER</Text>
                <View style={styles.restRing}>
                  <View
                    style={[
                      styles.restRingTrack,
                      {
                        borderColor: `rgba(241,188,3,${0.25 + restPct * 0.55})`,
                      },
                    ]}
                  />
                  <Text style={styles.restClock}>{restLeft}</Text>
                  <Text style={styles.restUnit}>sec</Text>
                </View>
                <Text style={styles.upNextLabel}>UP NEXT</Text>
                <Text style={styles.upNextTitle} numberOfLines={2}>
                  {upNext.title}
                </Text>
                <Text style={styles.upNextMeta}>{upNext.meta}</Text>
              </View>
            )}

            <View style={[styles.dock, { paddingBottom: insets.bottom + 14 }]}>
              {phase === "work" ? (
                <View style={styles.dockTools}>
                  <Pressable
                    style={styles.toolChip}
                    onPress={() => {
                      setSpeed((s) => nextSpeed(s));
                      void Haptics.selectionAsync();
                    }}
                  >
                    <Text style={styles.toolChipText}>
                      {speed.toFixed(2).replace(/\.00$/, ".0")}x
                    </Text>
                  </Pressable>
                  <View style={styles.logChip}>
                    <Text style={styles.logLabel}>{isRounds ? "Rounds" : "Reps"}</Text>
                    <TextInput
                      style={styles.logInput}
                      value={repsInput}
                      onChangeText={setRepsInput}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                  </View>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Note"
                    placeholderTextColor={colors.textDim}
                  />
                  <Text style={styles.prHint}>
                    Best {maxReps != null ? maxReps : "—"}
                  </Text>
                </View>
              ) : (
                <View style={styles.dockTools}>
                  <Text style={styles.restHint}>Breathe · shake out · stay ready</Text>
                </View>
              )}

              <View style={styles.dockActions}>
                {phase === "rest" ? (
                  <Pressable style={styles.secondaryBtn} onPress={skipRest}>
                    <Text style={styles.secondaryBtnText}>Skip rest</Text>
                  </Pressable>
                ) : (
                  <View style={styles.nextPreview}>
                    <Text style={styles.nextPreviewLabel}>Next</Text>
                    <Text style={styles.nextPreviewTitle} numberOfLines={1}>
                      {upNext.title}
                    </Text>
                  </View>
                )}
                <Pressable
                  style={[styles.primaryBtn, finishing && { opacity: 0.55 }]}
                  onPress={onAdvance}
                  disabled={finishing}
                >
                  {phase === "rest" ? (
                    <Play color={colors.black} fill={colors.black} size={20} />
                  ) : (
                    <Check color={colors.black} size={22} strokeWidth={3} />
                  )}
                  <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
                </Pressable>
              </View>
            </View>

            <Modal visible={showList} transparent animationType="slide" onRequestClose={() => setShowList(false)}>
              <Pressable style={styles.modalBackdrop} onPress={() => setShowList(false)} />
              <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                <Text style={styles.sheetTitle}>Session drills</Text>
                <ScrollView>
                  {session.exercises.map((ex, i) => (
                    <Pressable
                      key={ex.id}
                      style={[styles.sheetRow, i === exerciseIndex && styles.sheetRowOn]}
                      onPress={() => {
                        setExerciseIndex(i);
                        setSetIndex(0);
                        setPhase("work");
                        setShowList(false);
                        void persist("in_progress");
                      }}
                    >
                      <Text style={styles.sheetNum}>{i + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sheetName}>{ex.name}</Text>
                        <Text style={styles.sheetMeta}>{ex.reps}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Modal>

            <Modal visible={showTip} transparent animationType="fade" onRequestClose={() => setShowTip(false)}>
              <View style={[styles.modalBackdrop, { justifyContent: "center" }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTip(false)} />
                <View style={styles.tipCard}>
                  <Text style={styles.tipKicker}>FORM CUE</Text>
                  <Text style={styles.tipTitle}>{exercise.name}</Text>
                  <Text style={styles.tipBody}>{tipForDrill(exercise.name, exercise.reps)}</Text>
                  <Pressable style={styles.tipClose} onPress={() => setShowTip(false)}>
                    <Text style={styles.tipCloseText}>Got it</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </>
        ) : null}
      </QueryGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  videoStage: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginTop: 12,
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  stageFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: { flex: 1, alignItems: "center" },
  sessionTitle: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  clock: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 22,
    lineHeight: 24,
    marginTop: 2,
  },
  topRight: { alignItems: "flex-end", minWidth: 40 },
  stepCount: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 20,
    lineHeight: 22,
  },
  stepLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 10,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    marginTop: 12,
    marginHorizontal: spacing.lg,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 99,
  },
  videoTap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseBadge: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  pauseText: {
    color: colors.white,
    fontFamily: fonts.poppinsMedium,
    fontSize: 13,
  },
  workHud: {
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    paddingBottom: 8,
  },
  drillName: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 32,
    lineHeight: 34,
  },
  setRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },
  setDot: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.18)",
    maxWidth: 48,
  },
  setDotDone: { backgroundColor: colors.accent },
  setDotActive: { backgroundColor: colors.white },
  setCaption: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 10,
  },
  restCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  restKicker: {
    color: colors.accent,
    fontFamily: fonts.alumniScSemiBoldItalic,
    letterSpacing: 3,
    fontSize: 14,
    marginBottom: 18,
  },
  restRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  restRingTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
    borderWidth: 6,
  },
  restClock: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 88,
    lineHeight: 90,
  },
  restUnit: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 14,
    marginTop: -4,
  },
  upNextLabel: {
    color: colors.textDim,
    fontFamily: fonts.poppinsMedium,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  upNextTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 20,
    textAlign: "center",
    marginTop: 6,
  },
  upNextMeta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 4,
  },
  dock: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  dockTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toolChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  toolChipText: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
  },
  logChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  logLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  logInput: {
    minWidth: 40,
    textAlign: "center",
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  prHint: {
    marginLeft: "auto",
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
  },
  restHint: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
  },
  dockActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nextPreview: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nextPreviewLabel: {
    color: colors.textDim,
    fontFamily: fonts.poppinsMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  nextPreviewTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
    marginTop: 2,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  secondaryBtnText: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: radii.lg,
    minWidth: 168,
  },
  primaryBtnText: {
    color: colors.black,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  cueRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  cueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  cueBtnText: {
    color: colors.white,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  noteInput: {
    flex: 1,
    minWidth: 64,
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
  },
  sheetTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 16,
    marginBottom: 12,
  },
  sheetRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetRowOn: { backgroundColor: colors.surfaceElevated, borderRadius: 10, paddingHorizontal: 8 },
  sheetNum: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 20,
    width: 24,
  },
  sheetName: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 14 },
  sheetMeta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 2 },
  tipCard: {
    marginHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    zIndex: 2,
  },
  tipKicker: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  tipTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 18,
    marginTop: 8,
  },
  tipBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  tipClose: {
    marginTop: 18,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: "center",
  },
  tipCloseText: {
    color: colors.black,
    fontFamily: fonts.poppinsSemiBold,
  },
});
