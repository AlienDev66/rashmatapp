import { Avatar, CoverImage, Screen } from "@/src/components/ui/Screen";
import { QueryGate } from "@/src/components/ui/QueryGate";
import {
  fetchFollowingCreatorIds,
  toggleCreatorFollow,
} from "@/src/data/follows";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Filter = "all" | "following";

export default function CreatorsScreen() {
  const { user } = useAuth();
  const { creators, programs, loading, error, refresh, refreshing, online } = useCatalog();
  const [filter, setFilter] = useState<Filter>("all");
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const reloadFollows = useCallback(async () => {
    const ids = await fetchFollowingCreatorIds(user?.id);
    setFollowingIds(ids);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void reloadFollows();
    }, [reloadFollows]),
  );

  const programById = (id: string) => programs.find((p) => p.id === id);

  const visible = useMemo(() => {
    if (filter === "following") return creators.filter((c) => followingIds.has(c.id));
    return creators;
  }, [creators, filter, followingIds]);

  const onToggle = async (creatorId: string) => {
    if (!user) {
      Alert.alert("Sign in required", "Sign in to follow creators.");
      router.push("/(auth)/sign-in");
      return;
    }
    setBusyId(creatorId);
    const result = await toggleCreatorFollow(creatorId, user.id);
    setBusyId(null);
    if (result.error) {
      Alert.alert("Couldn’t update", result.error);
      return;
    }
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (result.following) next.add(creatorId);
      else next.delete(creatorId);
      return next;
    });
  };

  return (
    <Screen>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>CREATORS</Text>
          <Text style={styles.sub}>Follow creators and train with their programs.</Text>
        </View>
        <Pressable onPress={() => router.push("/following")} hitSlop={8}>
          <Text style={styles.followingLink}>Following</Text>
        </Pressable>
      </View>

      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, filter === "all" && styles.chipOn]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.chipText, filter === "all" && styles.chipTextOn]}>All</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, filter === "following" && styles.chipOn]}
          onPress={() => setFilter("following")}
        >
          <Text style={[styles.chipText, filter === "following" && styles.chipTextOn]}>
            Following
          </Text>
        </Pressable>
      </View>

      <QueryGate
        loading={loading}
        error={error}
        empty={visible.length === 0}
        emptyTone="creators"
        emptyTitle={filter === "following" ? "Not following anyone yet" : "No creators yet"}
        emptyMessage={
          filter === "following"
            ? "Tap Follow on a creator profile to build your list."
            : "Creators who publish on RASHMAT will show up here."
        }
        emptyActionLabel={filter === "following" ? "Browse all" : "Refresh"}
        emptyOnAction={filter === "following" ? () => setFilter("all") : refresh}
        emptySecondaryLabel="Open Studio"
        emptyOnSecondary={() => router.push("/studio")}
        onRetry={refresh}
        offline={!online}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refresh();
                void reloadFollows();
              }}
              tintColor={colors.accent}
            />
          }
        >
          {visible.map((c) => {
            const previews = c.programIds
              .map((pid) => programById(pid))
              .filter(Boolean)
              .slice(0, 3);
            const isFollowing = followingIds.has(c.id);

            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
                onPress={() => router.push(`/creator/${c.id}`)}
              >
                <View style={styles.row}>
                  <Avatar uri={c.avatarUrl} name={c.name} size={56} ring />
                  <View style={styles.meta}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {c.name}
                      </Text>
                      {c.verified ? (
                        <BadgeCheck color={colors.black} fill={colors.accent} size={16} />
                      ) : null}
                    </View>
                    <Text style={styles.role} numberOfLines={1}>
                      {c.role || "Creator"}
                    </Text>
                    <Text style={styles.count}>
                      {c.programIds.length} program{c.programIds.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.followBtn, isFollowing && styles.followBtnOn]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      void onToggle(c.id);
                    }}
                    disabled={busyId === c.id}
                    hitSlop={6}
                  >
                    <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextOn]}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                  <ChevronRight color={colors.textDim} size={20} />
                </View>

                {previews.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.programs}
                    nestedScrollEnabled
                  >
                    {previews.map((p) =>
                      p ? (
                        <Pressable
                          key={p.id}
                          style={styles.programCard}
                          onPress={() => router.push(`/program/${p.id}`)}
                        >
                          <CoverImage
                            uri={p.coverUrl}
                            style={StyleSheet.absoluteFill}
                            showMark={false}
                          />
                          <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.85)"]}
                            style={StyleSheet.absoluteFill}
                          />
                          <Text style={styles.pTitle} numberOfLines={2}>
                            {p.title}
                          </Text>
                        </Pressable>
                      ) : null,
                    )}
                  </ScrollView>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </QueryGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 6,
  },
  followingLink: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
    marginTop: 8,
  },
  chips: { flexDirection: "row", gap: 8, marginTop: 14, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontFamily: fonts.poppinsSemiBold, fontSize: 12 },
  chipTextOn: { color: colors.black },
  list: { gap: 12, paddingBottom: 28 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  meta: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: {
    flexShrink: 1,
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
  role: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 2,
  },
  count: {
    color: colors.accent,
    fontFamily: fonts.poppinsMedium,
    fontSize: 11,
    marginTop: 4,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  followBtnOn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  followBtnText: {
    color: colors.black,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
  },
  followBtnTextOn: { color: colors.white },
  programs: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    paddingTop: spacing.md,
  },
  programCard: {
    width: 132,
    height: 88,
    borderRadius: radii.md,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 8,
  },
  pTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
});
