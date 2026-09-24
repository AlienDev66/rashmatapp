import { InstagramIcon, TikTokIcon, XIcon } from "@/src/components/icons";
import { Avatar, CoverImage } from "@/src/components/ui/Avatar";
import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import {
  fetchCreatorFollowStats,
  toggleCreatorFollow,
  type FollowStats,
} from "@/src/data/follows";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { BadgeCheck } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { creators, programs, loading, error, refresh, online } = useCatalog();
  const creator = creators.find((c) => c.id === id) ?? creators[0];
  const insets = useSafeAreaInsets();
  const creatorPrograms = programs.filter((p) => p.creatorId === creator?.id);
  const firstProgram = creatorPrograms[0];
  const [stats, setStats] = useState<FollowStats>({ followerCount: 0, following: false });
  const [followBusy, setFollowBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        if (!creator?.id) return;
        const next = await fetchCreatorFollowStats(creator.id);
        if (!cancelled) setStats(next);
      };
      void run();
      return () => {
        cancelled = true;
      };
    }, [creator?.id]),
  );

  const openSocial = (url?: string) => {
    if (!url || url === "#") return;
    void Linking.openURL(url);
  };

  const onToggleFollow = async () => {
    if (!creator || !user) {
      Alert.alert("Sign in required", "Sign in to follow creators.");
      router.push("/(auth)/sign-in");
      return;
    }
    setFollowBusy(true);
    const result = await toggleCreatorFollow(creator.id, user.id);
    setFollowBusy(false);
    if (result.error) {
      Alert.alert("Couldn’t update", result.error);
      return;
    }
    setStats({ following: result.following, followerCount: result.followerCount });
  };

  const socials = [
    { key: "ig", url: creator?.socials.instagram, Icon: InstagramIcon, label: "Instagram" },
    { key: "tt", url: creator?.socials.tiktok, Icon: TikTokIcon, label: "TikTok" },
    { key: "x", url: creator?.socials.x, Icon: XIcon, label: "X" },
  ].filter((s) => s.url && s.url !== "#");

  return (
    <View style={styles.root}>
      <QueryGate
        loading={loading}
        error={error}
        empty={!creator}
        emptyTone="missing"
        emptyTitle="Creator not found"
        emptyMessage="This profile may have been removed or is still unpublished."
        emptyActionLabel="Browse creators  →"
        emptyOnAction={() => router.replace("/(tabs)/creators")}
        onRetry={refresh}
        offline={!online}
      >
        {creator ? (
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
          >
            <CoverImage uri={creator.coverUrl} style={styles.hero}>
              <LinearGradient
                colors={["rgba(20,17,17,0.15)", "rgba(20,17,17,0.55)", colors.bg]}
                locations={[0.2, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
                <BackButton />
              </View>
              <View style={styles.heroBottom}>
                <Avatar uri={creator.avatarUrl} name={creator.name} size={72} ring />
                <View style={styles.badgeRow}>
                  <Text style={styles.certified}>
                    {(creator.role || "Certified Trainer").toUpperCase()}
                  </Text>
                  {creator.verified ? (
                    <BadgeCheck color={colors.black} fill={colors.accent} size={18} />
                  ) : null}
                </View>
                <Text style={styles.name}>{creator.name}</Text>
                {socials.length > 0 ? (
                  <View style={styles.socialsInline}>
                    {socials.map(({ key, url, Icon, label }) => (
                      <Pressable
                        key={key}
                        style={styles.socialChip}
                        accessibilityLabel={label}
                        onPress={() => openSocial(url)}
                        hitSlop={6}
                      >
                        <Icon size={22} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </CoverImage>

            <View style={styles.padded}>
              {creator.bio ? <Text style={styles.bio}>{creator.bio}</Text> : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {creatorPrograms.length} program{creatorPrograms.length === 1 ? "" : "s"}
                </Text>
                <Text style={styles.metaDot}>·</Text>
                <Pressable
                  onPress={() => router.push(`/creator-followers/${creator.id}`)}
                  hitSlop={8}
                >
                  <Text style={styles.metaLink}>
                    {stats.followerCount} follower{stats.followerCount === 1 ? "" : "s"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.followBtn,
                    !firstProgram && !stats.following && styles.followBtnPrimary,
                    stats.following && styles.followBtnOn,
                    pressed && { opacity: 0.88 },
                    followBusy && { opacity: 0.55 },
                  ]}
                  onPress={() => void onToggleFollow()}
                  disabled={followBusy}
                  accessibilityRole="button"
                  accessibilityLabel={stats.following ? "Following" : "Follow"}
                >
                  {followBusy ? (
                    <ActivityIndicator
                      color={
                        stats.following || firstProgram ? colors.white : colors.black
                      }
                    />
                  ) : (
                    <Text
                      style={[
                        styles.followLabel,
                        (stats.following || !!firstProgram) && styles.followLabelMuted,
                        !firstProgram && !stats.following && styles.followLabelOnPrimary,
                      ]}
                    >
                      {stats.following ? "Following" : "Follow"}
                    </Text>
                  )}
                </Pressable>

                {firstProgram ? (
                  <Button
                    label="Train  →"
                    variant="accent"
                    style={styles.trainBtn}
                    onPress={() => router.push(`/program/${firstProgram.id}`)}
                  />
                ) : null}
              </View>

              <View style={styles.programsHeader}>
                <Text style={styles.programsTitle}>PROGRAMS</Text>
                {creatorPrograms.length > 1 ? (
                  <Pressable
                    onPress={() => router.push(`/creator-programs/${creator.id}`)}
                    hitSlop={8}
                  >
                    <Text style={styles.seeAll}>See all</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {creatorPrograms.length === 0 ? (
              <EmptyState
                compact
                tone="programs"
                title="No programs yet"
                message="This creator hasn’t published a camp. Check back soon."
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                contentContainerStyle={styles.cardsRow}
              >
                {creatorPrograms.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.card}
                    onPress={() => router.push(`/program/${p.id}`)}
                  >
                    <CoverImage uri={p.coverUrl} style={StyleSheet.absoluteFill} showMark={false} />
                    <LinearGradient
                      colors={["transparent", "rgba(20,17,17,0.92)"]}
                      locations={[0.35, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.cardLevel}>{p.level}</Text>
                    <Text style={styles.cardTitle}>{p.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {p.description}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </ScrollView>
        ) : null}
      </QueryGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 340, justifyContent: "flex-end" },
  top: { position: "absolute", left: spacing.lg, top: 0, zIndex: 2 },
  heroBottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  certified: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  name: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 34,
    lineHeight: 38,
  },
  socialsInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  socialChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  padded: { paddingHorizontal: spacing.lg, gap: 14 },
  bio: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -2,
  },
  metaText: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
  },
  metaDot: { color: colors.textDim, fontSize: 13 },
  metaLink: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  followBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.xxl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.lg,
  },
  followBtnPrimary: {
    backgroundColor: colors.accent,
    borderWidth: 0,
  },
  followBtnOn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  followLabel: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  followLabelMuted: { color: colors.white },
  followLabelOnPrimary: { color: colors.black },
  trainBtn: { flex: 1.45 },
  programsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  programsTitle: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  seeAll: { color: colors.accent, fontFamily: fonts.poppinsSemiBold, fontSize: 13 },
  cardsRow: { paddingHorizontal: spacing.lg, gap: 12, paddingTop: 12 },
  card: {
    width: 220,
    height: 160,
    borderRadius: radii.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 14,
  },
  cardLevel: {
    position: "absolute",
    top: 12,
    left: 12,
    color: colors.black,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 10,
    backgroundColor: colors.accent,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  cardTitle: { color: colors.white, fontFamily: fonts.alumniBoldItalic, fontSize: 16 },
  cardDesc: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 4,
  },
});
