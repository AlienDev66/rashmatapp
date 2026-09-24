import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import {
  activateCreator,
  fetchCreatorStudentProgress,
  fetchMyPrograms,
  type StudioProgram,
  type StudentProgressRow,
} from "@/src/data/studio";
import { fetchMyCreatorFollowers } from "@/src/data/follows";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
import { useT } from "@/src/i18n";
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StudioHomeScreen() {
  const t = useT();
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<StudioProgram[]>([]);
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [followerCount, setFollowerCount] = useState(0);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [progs, studs, followers] = await Promise.all([
      fetchMyPrograms(user.id),
      fetchCreatorStudentProgress(),
      fetchMyCreatorFollowers(),
    ]);
    setPrograms(progs.programs);
    setStudents(studs.rows);
    setFollowerCount(followers.length);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onActivate = async () => {
    if (!user) {
      Alert.alert(t("common.signInRequired"), t("studioScreens.signInBody"));
      router.push("/(auth)/sign-in");
      return;
    }
    setBusy(true);
    const { error } = await activateCreator(profile?.full_name ?? undefined);
    setBusy(false);
    if (error) {
      Alert.alert(t("studioScreens.couldNotActivate"), error);
      return;
    }
    await refreshProfile();
    await load();
  };

  if (!profile?.is_creator) {
    return (
      <Screen>
        <View style={styles.top}>
          <BackButton />
          <Text style={styles.title}>{t("studioApp.title")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.hero}>{t("studioScreens.heroPitch")}</Text>
        <Text style={styles.sub}>{t("studioScreens.pitchSub")}</Text>
        <Button
          label={
            busy ? t("studioScreens.activating") : t("studioScreens.becomeCreator")
          }
          variant="accent"
          disabled={busy}
          onPress={() => void onActivate()}
          style={{ marginTop: 24 }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("studioApp.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.hero}>@{profile.creator_slug}</Text>
        <Text style={styles.sub}>{t("studioScreens.minimalSub")}</Text>

        <View style={styles.stats}>
          <Stat label={t("studioScreens.programs")} value={String(programs.length)} />
          <Stat label={t("studioScreens.students")} value={String(students.length)} />
          <Pressable style={styles.stat} onPress={() => router.push("/studio/followers")}>
            <Text style={styles.statValue}>{followerCount}</Text>
            <Text style={styles.statLabel}>{t("studioScreens.followers")}</Text>
          </Pressable>
        </View>

        <Button
          label={t("studioScreens.newProgramCta")}
          variant="accent"
          onPress={() => router.push("/studio/new")}
          style={{ marginTop: 8 }}
        />

        <Pressable
          style={styles.webLink}
          onPress={() => {
            if (Platform.OS === "web") {
              router.push("/studio/cms");
            } else {
              Alert.alert(
                t("studioScreens.fullStudio"),
                t("studioScreens.fullStudioBody"),
                [
                  { text: t("common.ok") },
                  {
                    text: t("studioScreens.openCmsPath"),
                    onPress: () => {
                      void Linking.openURL("/studio/cms");
                    },
                  },
                ],
              );
              router.push("/studio/cms");
            }
          }}
        >
          <Text style={styles.webLinkText}>{t("studioScreens.openFullCms")}</Text>
        </Pressable>

        <Text style={styles.section}>{t("studioScreens.yourPrograms")}</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : programs.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title={t("studioScreens.noPrograms")}
            message={t("studioScreens.noProgramsBody")}
            actionLabel={t("studioScreens.newProgramCta")}
            onAction={() => router.push("/studio/new")}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {programs.map((p) => (
              <Pressable
                key={p.id}
                style={styles.card}
                onPress={() => router.push(`/studio/${p.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.cardMeta}>
                    {t("studioScreens.programMeta", {
                      status:
                        p.status === "published"
                          ? t("studioScreens.published")
                          : t("studioScreens.draft"),
                      weeks: p.weeks,
                    })}
                  </Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t("studioScreens.followersSection")}</Text>
          <Link href="/studio/followers" asChild>
            <Pressable>
              <Text style={styles.seeAll}>{t("studioScreens.seeAll")}</Text>
            </Pressable>
          </Link>
        </View>
        <Pressable style={styles.card} onPress={() => router.push("/studio/followers")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {followerCount === 1
                ? t("studioScreens.followerOne")
                : t("studioScreens.followerMany", { n: followerCount })}
            </Text>
            <Text style={styles.cardMeta}>{t("studioScreens.followersCardMeta")}</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>

        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t("studioScreens.studentsSection")}</Text>
          <Link href="/studio/students" asChild>
            <Pressable>
              <Text style={styles.seeAll}>{t("studioScreens.seeAll")}</Text>
            </Pressable>
          </Link>
        </View>
        {students.slice(0, 5).map((s) => (
          <View key={s.enrollment_id} style={styles.student}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{s.student_name}</Text>
              <Text style={styles.cardMeta}>
                {t("studioScreens.studentMeta", {
                  program: s.program_title,
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
            title={t("studioScreens.noStudents")}
            message={t("studioScreens.noStudentsBody")}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  hero: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginTop: 8,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
  },
  stats: { flexDirection: "row", gap: 8, marginBottom: 16 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    alignItems: "center",
  },
  statValue: { color: colors.white, fontFamily: fonts.alumniBoldItalic, fontSize: 22 },
  statLabel: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 11, marginTop: 2 },
  webLink: { alignItems: "center", paddingVertical: 12 },
  webLinkText: { color: colors.accent, fontFamily: fonts.poppinsSemiBold, fontSize: 13 },
  section: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAll: { color: colors.accent, fontFamily: fonts.poppinsMedium, fontSize: 13, marginTop: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
  },
  cardTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 15 },
  cardMeta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 4 },
  chev: { color: colors.textMuted, fontSize: 22 },
  student: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 8,
  },
  pct: { color: colors.accent, fontFamily: fonts.poppinsSemiBold },
});
