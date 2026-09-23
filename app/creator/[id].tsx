import { InstagramIcon, TikTokIcon, XIcon } from "@/src/components/icons";
import { Avatar, CoverImage } from "@/src/components/ui/Avatar";
import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { useCatalog } from "@/src/hooks/useCatalog";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { BadgeCheck } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { creators, programs, loading, error, refresh, online } = useCatalog();
  const creator = creators.find((c) => c.id === id) ?? creators[0];
  const insets = useSafeAreaInsets();
  const creatorPrograms = programs.filter((p) => p.creatorId === creator?.id);
  const firstProgram = creatorPrograms[0];

  const openSocial = (url?: string) => {
    if (!url || url === "#") return;
    void Linking.openURL(url);
  };

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
              </View>
            </CoverImage>

            <View style={styles.padded}>
              <Text style={styles.bio}>{creator.bio}</Text>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statV}>{creatorPrograms.length}</Text>
                  <Text style={styles.statL}>Programs</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statV}>{creator.verified ? "Yes" : "—"}</Text>
                  <Text style={styles.statL}>Verified</Text>
                </View>
              </View>

              <View style={styles.socials}>
                <Pressable
                  style={styles.socialBtn}
                  accessibilityLabel="Instagram"
                  onPress={() => openSocial(creator.socials.instagram)}
                >
                  <InstagramIcon size={40} />
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  accessibilityLabel="TikTok"
                  onPress={() => openSocial(creator.socials.tiktok)}
                >
                  <TikTokIcon size={40} />
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  accessibilityLabel="X"
                  onPress={() => openSocial(creator.socials.x)}
                >
                  <XIcon size={40} />
                </Pressable>
              </View>

              {firstProgram ? (
                <Button
                  label="Train with this creator  →"
                  variant="accent"
                  style={{ marginTop: 8 }}
                  onPress={() => router.push(`/program/${firstProgram.id}`)}
                />
              ) : null}

              <View style={styles.programsHeader}>
                <Text style={styles.programsTitle}>INSTRUCTOR&apos;S PROGRAM</Text>
                {creatorPrograms.length > 0 ? (
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
  hero: { height: 360, justifyContent: "flex-end" },
  top: { position: "absolute", left: spacing.lg, top: 0, zIndex: 2 },
  heroBottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
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
  padded: { paddingHorizontal: spacing.lg, gap: 14 },
  bio: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  stats: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
  },
  statV: { color: colors.white, fontFamily: fonts.alumniBoldItalic, fontSize: 22 },
  statL: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 2 },
  socials: { flexDirection: "row", gap: 12 },
  socialBtn: { width: 44, height: 44 },
  programsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
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
