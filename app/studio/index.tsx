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
      Alert.alert("Sign in required", "Create an account to become a creator.");
      router.push("/(auth)/sign-in");
      return;
    }
    setBusy(true);
    const { error } = await activateCreator(profile?.full_name ?? undefined);
    setBusy(false);
    if (error) {
      Alert.alert("Could not activate", error);
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
          <Text style={styles.title}>Creator Studio</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.hero}>Publish martial arts programs</Text>
        <Text style={styles.sub}>
          Build drills and camps like STNDRD — track every subscriber&apos;s progress as they train.
        </Text>
        <Button
          label={busy ? "Activating…" : "Become a creator  →"}
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
        <Text style={styles.title}>Creator Studio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.hero}>@{profile.creator_slug}</Text>
        <Text style={styles.sub}>Minimal studio — create, publish, and watch student progress.</Text>

        <View style={styles.stats}>
          <Stat label="Programs" value={String(programs.length)} />
          <Stat label="Students" value={String(students.length)} />
          <Pressable style={styles.stat} onPress={() => router.push("/studio/followers")}>
            <Text style={styles.statValue}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </Pressable>
        </View>

        <Button
          label="New program  →"
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
                "Full Studio",
                "Open RASHMAT in a browser for the full CMS editor (sessions, drills, Mux IDs).",
                [
                  { text: "OK" },
                  {
                    text: "Open CMS path",
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
          <Text style={styles.webLinkText}>Open full Studio CMS</Text>
        </Pressable>

        <Text style={styles.section}>YOUR PROGRAMS</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : programs.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title="No programs yet"
            message="Create your first camp or drill pack and publish it to athletes."
            actionLabel="New program  →"
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
                    {p.status === "published" ? "Published" : "Draft"} · {p.weeks}w
                  </Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.rowBetween}>
          <Text style={styles.section}>FOLLOWERS</Text>
          <Link href="/studio/followers" asChild>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </Link>
        </View>
        <Pressable style={styles.card} onPress={() => router.push("/studio/followers")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {followerCount} follower{followerCount === 1 ? "" : "s"}
            </Text>
            <Text style={styles.cardMeta}>Athletes who follow your creator profile</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>

        <View style={styles.rowBetween}>
          <Text style={styles.section}>STUDENTS</Text>
          <Link href="/studio/students" asChild>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </Link>
        </View>
        {students.slice(0, 5).map((s) => (
          <View key={s.enrollment_id} style={styles.student}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{s.student_name}</Text>
              <Text style={styles.cardMeta}>
                {s.program_title} · Day {s.current_day}
              </Text>
            </View>
            <Text style={styles.pct}>{s.progress_pct}%</Text>
          </View>
        ))}
        {students.length === 0 ? (
          <EmptyState
            compact
            tone="studio"
            title="No students yet"
            message="Subscribers appear here after they unlock a program."
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
