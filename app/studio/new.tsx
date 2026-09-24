import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { TextField } from "@/src/components/ui/TextField";
import { createProgram, createSession, publishProgram } from "@/src/data/studio";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, spacing } from "@/src/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

export default function StudioNewProgramScreen() {
  const t = useT();
  const { user, profile, refreshProfile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [firstSession, setFirstSession] = useState(
    t("studioScreens.firstSessionDefault"),
  );
  const [busy, setBusy] = useState(false);

  const onCreate = async (andPublish: boolean) => {
    if (!user || !profile?.creator_slug) {
      Alert.alert(
        t("studioScreens.creatorRequired"),
        t("studioScreens.creatorRequiredBody"),
      );
      router.replace("/studio");
      return;
    }
    if (!title.trim()) {
      Alert.alert(
        t("studioScreens.titleRequired"),
        t("studioScreens.titleRequiredBody"),
      );
      return;
    }
    setBusy(true);
    const { error, program } = await createProgram({
      userId: user.id,
      creatorSlug: profile.creator_slug,
      title,
      description,
    });
    if (error || !program) {
      setBusy(false);
      Alert.alert(t("studioScreens.couldNotCreate"), error ?? t("home.tryAgain"));
      return;
    }
    if (firstSession.trim()) {
      await createSession({
        programId: program.id,
        title: firstSession.trim(),
        day: 1,
        description: t("studioScreens.drillsHint"),
      });
    }
    if (andPublish) {
      const pub = await publishProgram(program.id, true);
      if (pub.error) {
        setBusy(false);
        Alert.alert(
          t("studioScreens.savedAsDraft"),
          t("studioScreens.publishFailedMsg", { error: pub.error }),
        );
        router.replace(`/studio/${program.id}`);
        return;
      }
    }
    await refreshProfile();
    setBusy(false);
    router.replace(`/studio/${program.id}`);
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("studioScreens.newTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.sub}>{t("studioScreens.newSub")}</Text>
      <View style={styles.form}>
        <TextField placeholder={t("studioScreens.programTitlePlaceholder")} value={title} onChangeText={setTitle} />
        <TextField
          placeholder={t("studioScreens.shortDescPlaceholder")}
          value={description}
          onChangeText={setDescription}
        />
        <TextField
          placeholder={t("studioScreens.firstSessionPlaceholder")}
          value={firstSession}
          onChangeText={setFirstSession}
        />
      </View>
      <View style={{ marginTop: "auto", gap: 10 }}>
        <Button
          label={busy ? "…" : t("studioScreens.createPublish")}
          variant="accent"
          disabled={busy}
          onPress={() => void onCreate(true)}
        />
        <Button
          label={t("studioScreens.saveDraft")}
          variant="surface"
          disabled={busy}
          onPress={() => void onCreate(false)}
        />
      </View>
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
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 18,
  },
  form: { gap: 12 },
});
