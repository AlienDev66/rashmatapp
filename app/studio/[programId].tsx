import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { TextField } from "@/src/components/ui/TextField";
import {
  createSession,
  fetchCreatorStudentProgress,
  fetchMyPrograms,
  fetchProgramSessions,
  publishProgram,
  updateProgram,
  type StudioProgram,
  type StudioSession,
  type StudentProgressRow,
} from "@/src/data/studio";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii } from "@/src/theme";
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

export default function StudioProgramDetailScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { user } = useAuth();
  const [program, setProgram] = useState<StudioProgram | null>(null);
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!programId || !user) return;
    const { programs } = await fetchMyPrograms(user.id);
    const p = programs.find((x) => x.id === programId) ?? null;
    setProgram(p);
    setTitle(p?.title ?? "");
    setDescription(p?.description ?? "");
    const sess = await fetchProgramSessions(programId);
    setSessions(sess.sessions);
    const studs = await fetchCreatorStudentProgress(programId);
    setStudents(studs.rows);
  }, [programId, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onSave = async () => {
    if (!programId) return;
    setBusy(true);
    const { error } = await updateProgram(programId, {
      title: title.trim(),
      description: description.trim(),
    });
    setBusy(false);
    if (error) Alert.alert("Save failed", error);
    else Alert.alert("Saved", "Program details updated.");
  };

  const onTogglePublish = async () => {
    if (!programId || !program) return;
    const next = program.status !== "published";
    setBusy(true);
    const { error } = await publishProgram(programId, next);
    setBusy(false);
    if (error) {
      Alert.alert("Publish failed", error);
      return;
    }
    setProgram({ ...program, status: next ? "published" : "draft" });
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
      Alert.alert("Could not add session", error ?? "");
      return;
    }
    setSessions((prev) => [...prev, session]);
    router.push({ pathname: "/studio/cms", params: { programId, sessionId: session.id } });
  };

  if (!program) {
    return (
      <Screen>
        <View style={styles.top}>
          <BackButton />
          <Text style={styles.title}>Program</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.meta}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Edit</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.badge}>{program.status === "published" ? "PUBLISHED" : "DRAFT"}</Text>
        <View style={styles.form}>
          <TextField value={title} onChangeText={setTitle} placeholder="Title" />
          <TextField value={description} onChangeText={setDescription} placeholder="Description" />
        </View>
        <Button label={busy ? "…" : "Save details"} variant="surface" disabled={busy} onPress={() => void onSave()} />
        <Button
          label={program.status === "published" ? "Unpublish" : "Publish  →"}
          variant="accent"
          disabled={busy}
          style={{ marginTop: 10 }}
          onPress={() => void onTogglePublish()}
        />

        <Text style={styles.section}>SESSIONS</Text>
        {sessions.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title="No sessions yet"
            message="Add Day 1 to start building this program’s schedule."
            actionLabel="Add session  →"
            onAction={() => void onAddSession()}
          />
        ) : (
          sessions.map((s) => (
            <Pressable
              key={s.id}
              style={styles.row}
              onPress={() =>
                router.push({ pathname: "/studio/cms", params: { programId, sessionId: s.id } })
              }
            >
              <Text style={styles.rowTitle}>
                Day {s.day}: {s.title}
              </Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))
        )}
        {sessions.length > 0 ? (
          <Button label="Add session" variant="ghost" onPress={() => void onAddSession()} style={{ marginTop: 8 }} />
        ) : null}

        <Text style={styles.section}>STUDENTS ({students.length})</Text>
        {students.map((s) => (
          <View key={s.enrollment_id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{s.student_name}</Text>
              <Text style={styles.meta}>
                {s.sessions_done} sessions · Day {s.current_day}
              </Text>
            </View>
            <Text style={styles.pct}>{s.progress_pct}%</Text>
          </View>
        ))}
        {students.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title="No subscribers yet"
            message="Athletes who unlock this program will show progress here."
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
    marginBottom: 12,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  badge: {
    alignSelf: "flex-start",
    color: colors.black,
    backgroundColor: colors.accent,
    fontFamily: fonts.poppinsBold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  form: { gap: 10, marginBottom: 12 },
  section: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 8,
  },
  rowTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  meta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 2 },
  chev: { color: colors.textMuted, fontSize: 20 },
  pct: { color: colors.accent, fontFamily: fonts.poppinsSemiBold },
});
