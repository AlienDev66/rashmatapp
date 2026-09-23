import { Avatar, CoverImage, Screen } from "@/src/components/ui/Screen";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { useCatalog } from "@/src/hooks/useCatalog";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CreatorsScreen() {
  const { creators, programs, loading, error, refresh, refreshing, online } = useCatalog();

  const programById = (id: string) => programs.find((p) => p.id === id);

  return (
    <Screen>
      <Text style={styles.title}>CREATORS</Text>
      <Text style={styles.sub}>Follow creators and unlock their programs.</Text>
      <QueryGate
        loading={loading}
        error={error}
        empty={creators.length === 0}
        emptyTone="creators"
        emptyTitle="No creators yet"
        emptyMessage="Creators who publish on RASHMAT will show up here."
        emptyActionLabel="Refresh"
        emptyOnAction={refresh}
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
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
          }
        >
          {creators.map((c) => {
            const previews = c.programIds
              .map((pid) => programById(pid))
              .filter(Boolean)
              .slice(0, 3);

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
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.4,
    marginTop: 8,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 6,
    marginBottom: spacing.lg,
  },
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
    gap: 12,
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
