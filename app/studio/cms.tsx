import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { TextField } from "@/src/components/ui/TextField";
import {
  createExercise,
  createSession,
  deleteExercise,
  fetchMyPrograms,
  fetchProgramSessions,
  fetchSessionExercises,
  updateSession,
  type StudioExercise,
  type StudioProgram,
  type StudioSession,
} from "@/src/data/studio";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Full Studio CMS — best on web; usable on mobile for drill editing.
 */
export default function StudioCmsScreen() {
  const { programId: paramProgramId, sessionId: paramSessionId } = useLocalSearchParams<{
    programId?: string;
    sessionId?: string;
  }>();
  const { user, profile } = useAuth();
  const [programs, setPrograms] = useState<StudioProgram[]>([]);
  const [programId, setProgramId] = useState(paramProgramId ?? "");
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [sessionId, setSessionId] = useState(paramSessionId ?? "");
  const [exercises, setExercises] = useState<StudioExercise[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [muxId, setMuxId] = useState("");
  const [drillName, setDrillName] = useState("");
  const [drillReps, setDrillReps] = useState("Reps: 8 8 8");
  const [drillMux, setDrillMux] = useState("");
  const [busy, setBusy] = useState(false);

  const loadPrograms = useCallback(async () => {
    if (!user) return;
    const { programs: list } = await fetchMyPrograms(user.id);
    setPrograms(list);
    if (!programId && list[0]) setProgramId(list[0].id);
  }, [user, programId]);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (paramProgramId) setProgramId(paramProgramId);
    if (paramSessionId) setSessionId(paramSessionId);
  }, [paramProgramId, paramSessionId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!programId) {
        setSessions([]);
        return;
      }
      const { sessions: list } = await fetchProgramSessions(programId);
      if (cancelled) return;
      setSessions(list);
      if (!sessionId && list[0]) setSessionId(list[0].id);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [programId, sessionId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!sessionId) {
        setExercises([]);
        setSessionTitle("");
        setMuxId("");
        return;
      }
      const sess = sessions.find((s) => s.id === sessionId);
      setSessionTitle(sess?.title ?? "");
      setMuxId(sess?.mux_playback_id ?? "");
      const { exercises: list } = await fetchSessionExercises(sessionId);
      if (!cancelled) setExercises(list);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, sessions]);

  if (!profile?.is_creator) {
    return (
      <Screen>
        <BackButton />
        <Text style={styles.sub}>Activate creator mode in Minimal Studio first.</Text>
        <Button label="Go to Studio" variant="accent" onPress={() => router.replace("/studio")} />
      </Screen>
    );
  }

  const onSaveSession = async () => {
    if (!sessionId) return;
    setBusy(true);
    const { error } = await updateSession(sessionId, {
      title: sessionTitle.trim(),
      mux_playback_id: muxId.trim() || null,
    });
    setBusy(false);
    if (error) Alert.alert("Save failed", error);
    else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, title: sessionTitle.trim(), mux_playback_id: muxId.trim() || null }
            : s,
        ),
      );
      Alert.alert("Saved", "Session updated.");
    }
  };

  const onAddSession = async () => {
    if (!programId) return;
    const day = sessions.length + 1;
    const { error, session } = await createSession({
      programId,
      title: `Day ${day}`,
      day,
    });
    if (error || !session) {
      Alert.alert("Error", error ?? "");
      return;
    }
    setSessions((p) => [...p, session]);
    setSessionId(session.id);
  };

  const onAddDrill = async () => {
    if (!sessionId || !drillName.trim()) {
      Alert.alert("Name required", "Enter a drill name.");
      return;
    }
    setBusy(true);
    const { error, exercise } = await createExercise({
      sessionId,
      name: drillName,
      reps: drillReps,
      sortOrder: exercises.length,
      muxPlaybackId: drillMux || undefined,
    });
    setBusy(false);
    if (error || !exercise) {
      Alert.alert("Could not add drill", error ?? "");
      return;
    }
    setExercises((p) => [...p, exercise]);
    setDrillName("");
    setDrillMux("");
  };

  const onDeleteDrill = (id: string) => {
    Alert.alert("Delete drill?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteExercise(id).then(({ error }) => {
            if (error) Alert.alert("Error", error);
            else setExercises((p) => p.filter((e) => e.id !== id));
          });
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Studio CMS</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.sub}>
        Full editor for programs, sessions, and drills. Paste Mux playback IDs or video URLs.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {programs.length === 0 ? (
          <EmptyState
            tone="studio"
            title="No programs to edit"
            message="Create a program in Studio first, then come back to add sessions and drills."
            actionLabel="New program  →"
            onAction={() => router.push("/studio/new")}
          />
        ) : (
          <>
        <Text style={styles.label}>Program</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {programs.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                setProgramId(p.id);
                setSessionId("");
              }}
              style={[styles.chip, programId === p.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, programId === p.id && styles.chipTextOn]}>
                {p.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Sessions</Text>
          <Pressable onPress={() => void onAddSession()}>
            <Text style={styles.link}>+ Session</Text>
          </Pressable>
        </View>
        {sessions.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title="No sessions"
            message="Add Day 1, then edit drills and Mux IDs."
            actionLabel="Add session  →"
            onAction={() => void onAddSession()}
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {sessions.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSessionId(s.id)}
                style={[styles.chip, sessionId === s.id && styles.chipOn]}
              >
                <Text style={[styles.chipText, sessionId === s.id && styles.chipTextOn]}>
                  D{s.day}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {sessionId ? (
          <View style={styles.panel}>
            <TextField value={sessionTitle} onChangeText={setSessionTitle} placeholder="Session title" />
            <TextField
              value={muxId}
              onChangeText={setMuxId}
              placeholder="Session Mux playback ID (optional)"
              autoCapitalize="none"
            />
            <Button
              label={busy ? "…" : "Save session"}
              variant="surface"
              disabled={busy}
              onPress={() => void onSaveSession()}
            />

            <Text style={[styles.label, { marginTop: 18 }]}>Drills</Text>
            {exercises.length === 0 ? (
              <EmptyState
                compact
                tone="studio"
                title="No drills yet"
                message="Add the first drill for this session."
              />
            ) : (
              exercises.map((ex) => (
                <View key={ex.id} style={styles.drill}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drillName}>{ex.name}</Text>
                    <Text style={styles.meta}>{ex.reps}</Text>
                  </View>
                  <Pressable onPress={() => onDeleteDrill(ex.id)}>
                    <Text style={styles.delete}>Delete</Text>
                  </Pressable>
                </View>
              ))
            )}

            <TextField value={drillName} onChangeText={setDrillName} placeholder="New drill name" />
            <TextField value={drillReps} onChangeText={setDrillReps} placeholder="Reps: 8 8 8" />
            <TextField
              value={drillMux}
              onChangeText={setDrillMux}
              placeholder="Drill Mux ID (optional)"
              autoCapitalize="none"
            />
            <Button
              label={busy ? "…" : "Add drill"}
              variant="accent"
              disabled={busy}
              onPress={() => void onAddDrill()}
            />
          </View>
        ) : sessions.length > 0 ? (
          <EmptyState
            compact
            tone="studio"
            title="Pick a session"
            message="Select a day chip above, or create a new session."
          />
        ) : null}
          </>
        )}

        {programId ? (
          <Button
            label="Back to program overview"
            variant="ghost"
            style={{ marginTop: 20 }}
            onPress={() => router.push(`/studio/${programId}`)}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    letterSpacing: 1,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontFamily: fonts.poppinsMedium, fontSize: 12 },
  chipTextOn: { color: colors.black },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: colors.accent, fontFamily: fonts.poppinsSemiBold, fontSize: 13 },
  panel: { gap: 10 },
  drill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 12,
  },
  drillName: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  meta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 2 },
  delete: { color: colors.danger, fontFamily: fonts.poppinsMedium, fontSize: 12 },
});
