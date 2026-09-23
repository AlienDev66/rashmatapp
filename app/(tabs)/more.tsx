import { Avatar, Screen } from "@/src/components/ui/Screen";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { brand } from "@/src/lib/brand";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing, typography } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { CreditCard, LogOut, MapPin, Settings, Trophy, User } from "lucide-react-native";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function MoreScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { programs } = useCatalog();
  const { enrollments } = useProgress();

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );

  const name = (profile?.full_name ?? user?.email?.split("@")[0] ?? "Athlete").toUpperCase();
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
        <Text style={styles.screenTitle}>Profile</Text>
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
          <Text style={styles.editHint}>Edit profile & photo</Text>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.xpRow}>
            <Trophy color={colors.accent} size={14} />
            <Text style={styles.xp}>{profile?.xp ?? 0} XP</Text>
          </View>
          <View style={styles.meta}>
            <MapPin color={colors.textMuted} size={12} />
            <Text style={styles.metaText}>
              {[profile?.city, profile?.country].filter(Boolean).join(", ") || "Add location"}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Pressable style={styles.membership} onPress={() => router.push("/paywall")}>
              <User color={colors.textMuted} size={12} />
              <Text style={styles.metaText}>{profile?.membership ?? "Basic member"}</Text>
            </Pressable>
          </View>
        </Pressable>

        <View style={styles.stats}>
          <Stat value={String(profile?.xp ?? 0)} unit="XP" />
          <Stat value={String(enrollments.length)} unit="camps" />
          <Stat
            value={profile?.weight_kg != null ? String(profile.weight_kg) : "—"}
            unit="kg"
          />
        </View>

        <Text style={styles.section}>YOUR PROGRAMS</Text>
        {displayPrograms.length === 0 ? (
          <EmptyState
            compact
            tone="programs"
            title="No programs yet"
            message="Unlock a creator camp to see it here."
            actionLabel="Browse programs  →"
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
                      <Text style={styles.currentText}>CURRENT</Text>
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
            icon={<User color={colors.accent} size={20} />}
            title="Personal information"
            sub="Edit name, city, age, weight"
            onPress={() => router.push("/personal-info")}
          />
          <MenuRow
            icon={<CreditCard color={colors.accent} size={20} />}
            title="Creator Studio"
            sub="Publish programs & track students"
            onPress={() => router.push("/studio")}
          />
          <MenuRow
            icon={<CreditCard color={colors.accent} size={20} />}
            title="Subscriptions"
            sub="Manage your subscriptions"
            onPress={() => router.push("/subscriptions")}
          />
        </View>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
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
