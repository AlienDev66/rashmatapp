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
import { useT } from "@/src/i18n";
import { pickProgramCover, uploadProgramCover } from "@/src/lib/coverUpload";
import {
  getPublishReadiness,
  type PublishReadiness,
} from "@/src/lib/publishGate";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii } from "@/src/theme";
import { Image } from "expo-image";
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
  const t = useT();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { user } = useAuth();
  const [program, setProgram] = useState<StudioProgram | null>(null);
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gate, setGate] = useState<PublishReadiness | null>(null);
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
    if (p) setGate(await getPublishReadiness(p));
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
    if (error) Alert.alert(t("studioScreens.saveFailed"), error);
    else Alert.alert(t("studioScreens.saved"), t("studioScreens.programUpdated"));
  };

  const onCover = async () => {
    if (!programId || !user || !program) return;
    const picked = await pickProgramCover();
    if (picked.error) {
      Alert.alert(t("common.error"), t(picked.error));
      return;
    }
    if (!picked.uri) return;
    setBusy(true);
    const { url, error: upErr } = await uploadProgramCover(
      user.id,
      programId,
      picked.uri,
      picked.mimeType,
    );
    if (upErr || !url) {
      setBusy(false);
      Alert.alert(
        t("studioScreens.saveFailed"),
        upErr?.startsWith("studioScreens.") ? t(upErr) : upErr ?? t("studioScreens.uploadFailed"),
      );
      return;
    }
    const { error } = await updateProgram(programId, { cover_url: url });
    setBusy(false);
    if (error) {
      Alert.alert(t("studioScreens.saveFailed"), error);
      return;
    }
    const next = { ...program, cover_url: url };
    setProgram(next);
    setGate(await getPublishReadiness(next));
  };

  const onTogglePublish = async () => {
    if (!programId || !program) return;
    const next = program.status !== "published";
    if (next && gate && !gate.ready) {
      const missing = gate.checks
        .filter((c) => !c.ok)
        .map((c) => c.hint ?? t(`studioScreens.gate.${c.id}.label`))
        .join("\n");
      Alert.alert(t("studioScreens.publishNotReady"), missing);
      return;
    }
    setBusy(true);
    const { error } = await publishProgram(programId, next);
    setBusy(false);
    if (error) {
      const msg = error.startsWith("studioScreens.") ? t(error) : error;
      Alert.alert(t("studioScreens.publishFailed"), msg);
      return;
    }
    setProgram({ ...program, status: next ? "published" : "draft" });
  };

  const onAddSession = async () => {
    if (!programId) return;
    const day = sessions.length + 1;
    const { error, session } = await createSession({
      programId,
      title: t("common.day", { n: day }),
      day,
    });
    if (error || !session) {
      Alert.alert(t("studioScreens.couldNotAddSession"), error ?? "");
      return;
    }
    setSessions((prev) => [...prev, session]);
    if (program) setGate(await getPublishReadiness(program));
    router.push({ pathname: "/studio/cms", params: { programId, sessionId: session.id } });
  };

  if (!program) {
    return (
      <Screen>
        <View style={styles.top}>
          <BackButton />
          <Text style={styles.title}>{t("studioScreens.programHeader")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.meta}>{t("common.loading")}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("studioScreens.edit")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.badge}>
          {program.status === "published"
            ? t("studioScreens.publishedBadge")
            : t("studioScreens.draftBadge")}
        </Text>

        <View style={styles.coverBlock}>
          {program.cover_url ? (
            <Image source={{ uri: program.cover_url }} style={styles.cover} contentFit="cover" />
          ) : (
            <View style={[styles.cover, styles.coverEmpty]}>
              <Text style={styles.meta}>{t("studioScreens.noCover")}</Text>
            </View>
          )}
          <Button
            label={busy ? "…" : t("studioScreens.changeCover")}
            variant="ghost"
            disabled={busy}
            onPress={() => void onCover()}
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.form}>
          <TextField value={title} onChangeText={setTitle} placeholder={t("studioScreens.titlePlaceholder")} />
          <TextField value={description} onChangeText={setDescription} placeholder={t("studioScreens.descriptionPlaceholder")} />
        </View>
        <Button
          label={busy ? "…" : t("studioScreens.saveDetails")}
          variant="surface"
          disabled={busy}
          onPress={() => void onSave()}
        />

        {gate ? (
          <View style={styles.gate}>
            <Text style={styles.gateTitle}>{t("studioScreens.publishChecklist")}</Text>
            {gate.checks.map((c) => (
              <View key={c.id} style={styles.gateRow}>
                <Text style={[styles.gateMark, c.ok ? styles.gateOk : styles.gateBad]}>
                  {c.ok ? "✓" : "○"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gateLabel}>{t(`studioScreens.gate.${c.id}.label`)}</Text>
                  {!c.ok ? (
                    <Text style={styles.gateHint}>
                      {c.hint ?? t(`studioScreens.gate.${c.id}.hint`)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          label={
            program.status === "published"
              ? t("studioScreens.unpublish")
              : t("studioScreens.publish")
          }
          variant="accent"
          disabled={busy || (program.status !== "published" && Boolean(gate && !gate.ready))}
          style={{ marginTop: 10 }}
          onPress={() => void onTogglePublish()}
        />

        <Text style={styles.section}>{t("studioScreens.sessionsSection")}</Text>
        {sessions.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title={t("studioScreens.noSessionsYet")}
            message={t("studioScreens.noSessionsYetBody")}
            actionLabel={t("studioScreens.addSessionCta")}
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
                {t("studioScreens.sessionRow", { day: s.day, title: s.title })}
              </Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))
        )}
        {sessions.length > 0 ? (
          <Button label={t("studioScreens.addSession")} variant="ghost" onPress={() => void onAddSession()} style={{ marginTop: 8 }} />
        ) : null}

        <Text style={styles.section}>
          {t("studioScreens.studentsCount", { n: students.length })}
        </Text>
        {students.map((s) => (
          <View key={s.enrollment_id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{s.student_name}</Text>
              <Text style={styles.meta}>
                {t("studioScreens.studentSessionsMeta", {
                  n: s.sessions_done,
                  day: s.current_day,
                })}
              </Text>
            </View>
            <Text style={styles.pct}>{s.progress_pct}%</Text>
          </View>
        ))}
        {students.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title={t("studioScreens.noSubscribers")}
            message={t("studioScreens.noSubscribersBody")}
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
  coverBlock: { marginBottom: 14 },
  cover: {
    width: "100%",
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  coverEmpty: { alignItems: "center", justifyContent: "center" },
  form: { gap: 10, marginBottom: 12 },
  gate: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    gap: 10,
  },
  gateTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
    marginBottom: 2,
  },
  gateRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  gateMark: { fontFamily: fonts.poppinsBold, fontSize: 14, width: 16 },
  gateOk: { color: colors.accent },
  gateBad: { color: colors.textMuted },
  gateLabel: { color: colors.white, fontFamily: fonts.poppinsMedium, fontSize: 13 },
  gateHint: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
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
