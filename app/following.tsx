import { Avatar } from "@/src/components/ui/Avatar";
import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { fetchFollowingCreatorIds } from "@/src/data/follows";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii } from "@/src/theme";
import { router, useFocusEffect } from "expo-router";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
import { useT } from "@/src/i18n";
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function FollowingScreen() {
  const t = useT();
  const { user } = useAuth();
  const { creators, loading: catalogLoading } = useCatalog();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        setLoading(true);
        const ids = await fetchFollowingCreatorIds(user?.id);
        if (!cancelled) {
          setFollowingIds(ids);
          setLoading(false);
        }
      };
      void run();
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  const list = useMemo(
    () => creators.filter((c) => followingIds.has(c.id)),
    [creators, followingIds],
  );

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("creator.followingTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.sub}>Creators you follow — train with their programs anytime.</Text>

      {loading || catalogLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : list.length === 0 ? (
        <EmptyState
          tone="creators"
          title={t("creator.emptyFollowing")}
          message={t("creator.emptyFollowingBody")}
          actionLabel={t("creator.browseCreators")}
          onAction={() => router.push("/(tabs)/creators")}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: 10 }}>
          {list.map((c) => (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/creator/${c.id}`)}
            >
              <Avatar uri={c.avatarUrl} name={c.name} size={48} ring />
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {c.name}
                  </Text>
                  {c.verified ? (
                    <BadgeCheck color={colors.black} fill={colors.accent} size={16} />
                  ) : null}
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {c.role || "Creator"}
                </Text>
              </View>
              <ChevronRight color={colors.textDim} size={20} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 15, flexShrink: 1 },
  meta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 2 },
});
