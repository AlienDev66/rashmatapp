import { Avatar, Screen } from "@/src/components/ui/Screen";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { useT } from "@/src/i18n";
import { brand } from "@/src/lib/brand";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing, typography } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { CreditCard, Clapperboard, BookOpen, Gift, LogOut, MapPin, MessageCircle, Settings, Trophy, User, Bell, Users } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchAthleteStats } from "@/src/data/achievements";

export default function MoreScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const t = useT();
  const { programs } = useCatalog();
  const { enrollments } = useProgress();
  const [stats, setStats] = useState({ streak: 0, sessions: 0, camps: 0 });

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
      if (user?.id) {
        void fetchAthleteStats(user.id, profile?.xp ?? 0).then((s) => {
          setStats({
            streak: s.streakDays,
            sessions: s.totalSessions,
            camps: s.campsCompleted,
          });
        });
      }
    }, [refreshProfile, user?.id, profile?.xp]),
  );

  const name = (profile?.full_name ?? user?.email?.split("@")[0] ?? t("common.athlete")).toUpperCase();
  const enrolledPrograms = enrollments
    .map((e) => programs.find((p) => p.id === e.programId))
    .filter(Boolean)
    .slice(0, 6);
  const displayPrograms =
    enrolledPrograms.length > 0 ? enrolledPrograms : programs.slice(0, 3);

  const onLogout = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>{t("more.profile")}</Text>
        <Pressable style={styles.settings} onPress={() => router.push("/settings")}>
          <Settings color={colors.white} size={18} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      > 
        <Pressable style={styles.hero} onPress={() => router.push("/personal-info")}>
          <Avatar uri={profile?.avatar_url} name={name} size={110} ring />
          <Text style={styles.editHint}>{t("more.editProfile")}</Text>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.xpRow}>
            <Trophy color={colors.accent} size={14} />
            <Text style={styles.xp}>{profile?.xp ?? 0} XP</Text>
          </View>
          <Pressable onPress={() => router.push("/achievements")}>
            <Text style={styles.achievementsLink}>{t("more.achievements")}</Text>
          </Pressable>
          <View style={styles.meta}>
            <MapPin color={colors.textMuted} size={12} />
            <Text style={styles.metaText}>
              {[profile?.city, profile?.country].filter(Boolean).join(", ") || t("more.addLocation")}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Pressable style={styles.membership} onPress={() => router.push("/paywall")}>
              <User color={colors.textMuted} size={12} />
              <Text style={styles.metaText}>{profile?.membership ?? t("more.basicMember")}</Text>
            </Pressable>
          </View>
        </Pressable>

        <View style={styles.stats}>
          <Stat value={String(stats.streak)} unit={t("more.streak")} />
          <Stat value={String(stats.sessions)} unit={t("more.sessions")} />
          <Stat value={String(stats.camps)} unit={t("more.camps")} />
        </View>

        <Text style={styles.section}>{t("more.yourPrograms")}</Text>
        {displayPrograms.length === 0 ? (
          <EmptyState
            compact
            tone="programs"
            title={t("more.noPrograms")}
            message={t("more.noProgramsMsg")}
            actionLabel={t("more.browsePrograms")}
            onAction={() => router.push("/(tabs)/programs")}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {displayPrograms.map((p) =>
              p ? (
                <Pressable
                  key={p.id}
                  style={styles.progCard}
                  onPress={() => router.push(`/program/${p.id}`)}
                >
                  <Image source={{ uri: p.coverUrl }} style={styles.progImg} contentFit="cover" />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  {enrollments.some((e) => e.programId === p.id) ? (
                    <View style={styles.current}>
                      <Text style={styles.currentText}>{t("more.current")}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.progTitle}>{p.title}</Text>
                </Pressable>
              ) : null,
            )}
          </ScrollView>
        )}

        <View style={styles.menu}>
          <MenuRow
            icon={<Trophy color={colors.accent} size={20} />}
            title={t("more.achievementsTitle")}
            sub={t("more.achievementsSub")}
            onPress={() => router.push("/achievements")}
          />
          <MenuRow
            icon={<BookOpen color={colors.accent} size={20} />}
            title={t("more.library")}
            sub={t("more.librarySub")}
            onPress={() => router.push("/library")}
          />
          <MenuRow
            icon={<Users color={colors.accent} size={20} />}
            title={t("more.following")}
            sub={t("more.followingSub")}
            onPress={() => router.push("/following")}
          />
          <MenuRow
            icon={<MessageCircle color={colors.accent} size={20} />}
            title={t("more.community")}
            sub={brand.community.label}
            onPress={() => void Linking.openURL(brand.community.discord)}
          />
          <MenuRow
            icon={<Gift color={colors.accent} size={20} />}
            title={t("more.referrals")}
            sub={t("more.referralsSub")}
            onPress={() => router.push("/referrals")}
          />
          <MenuRow
            icon={<Bell color={colors.accent} size={20} />}
            title={t("more.notifications")}
            sub={t("more.notificationsSub")}
            onPress={() => router.push("/settings")}
          />
          <MenuRow
            icon={<User color={colors.accent} size={20} />}
            title={t("more.personalInfo")}
            sub={t("more.personalInfoSub")}
            onPress={() => router.push("/personal-info")}
          />
          <MenuRow
            icon={<Clapperboard color={colors.accent} size={20} />}
            title={t("more.studio")}
            sub={t("more.studioSub")}
            onPress={() => router.push("/studio")}
          />
          <MenuRow
            icon={<CreditCard color={colors.accent} size={20} />}
            title={t("more.subscriptions")}
            sub={t("more.subscriptionsSub")}
            onPress={() => router.push("/subscriptions")}
          />
        </View>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>{t("more.logout")}</Text>
          <LogOut color={colors.danger} size={16} />
        </Pressable>

        <Text style={styles.brandFoot}>
          {brand.name} · {brand.social.handle} · {brand.domain}
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Text style={{ color: colors.textMuted }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  screenTitle: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  settings: {
    position: "absolute",
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { alignItems: "center", gap: 8, marginTop: 8 },
  editHint: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
    marginTop: 4,
  },
  name: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 1,
    marginTop: 10,
  },
  xpRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  xp: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 13 },
  achievementsLink: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
    marginTop: 4,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  membership: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12 },
  dot: { color: colors.textMuted, marginHorizontal: 4 },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 22,
  },
  stat: { alignItems: "center", flexDirection: "row", gap: 4 },
  statValue: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
  },
  statUnit: { color: colors.white, fontFamily: fonts.alumniBoldItalic, fontSize: 14 },
  section: {
    ...typography.section,
    color: colors.white,
    marginBottom: spacing.md,
  },
  row: { gap: 12, paddingBottom: 8 },
  progCard: {
    width: 120,
    height: 140,
    borderRadius: radii.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 8,
  },
  progImg: { ...StyleSheet.absoluteFill },
  current: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 36,
    backgroundColor: colors.accent,
    paddingVertical: 3,
    alignItems: "center",
  },
  currentText: { color: colors.black, fontFamily: fonts.poppinsMedium, fontSize: 9 },
  progTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 12 },
  menu: { gap: 10, marginTop: 22 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  menuSub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 2,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
  },
  logoutText: { color: colors.danger, fontFamily: fonts.poppinsSemiBold, fontSize: 15 },
  brandFoot: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    textAlign: "center",
    marginTop: 28,
    marginBottom: 8,
  },
});
