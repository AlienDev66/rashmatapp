import { BackButton } from "@/src/components/ui/BackButton";
import { Screen } from "@/src/components/ui/Screen";
import { fetchOwnedMedals } from "@/src/data/achievements";
import { MEDAL_DEFS } from "@/src/data/medalsCatalog";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function MedalsScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"milestones" | "veteran">("milestones");
  const [ownedMap, setOwnedMap] = useState<Map<string, string>>(new Map());

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void fetchOwnedMedals(user.id).then((list) => {
        setOwnedMap(new Map(list.map((m) => [m.medalId, m.awardedAt])));
      });
    }, [user]),
  );

  const list = useMemo(() => {
    if (tab === "veteran") {
      return MEDAL_DEFS.filter((m) => m.category === "veteran" || m.category === "growth");
    }
    return MEDAL_DEFS.filter((m) => m.category === "training");
  }, [tab]);

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Medals</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "milestones" && styles.tabOn]}
          onPress={() => setTab("milestones")}
        >
          <Text style={[styles.tabText, tab === "milestones" && styles.tabTextOn]}>
            Milestones
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "veteran" && styles.tabOn]}
          onPress={() => setTab("veteran")}
        >
          <Text style={[styles.tabText, tab === "veteran" && styles.tabTextOn]}>Veteran</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {list.map((m) => {
          const awardedAt = ownedMap.get(m.id);
          const unlocked = !!awardedAt;
          return (
            <View key={m.id} style={styles.cell}>
              <View style={[styles.badge, !unlocked && styles.badgeLocked]}>
                <Text style={styles.badgeGlyph}>{m.title.slice(0, 1)}</Text>
              </View>
              <Text style={styles.medalTitle} numberOfLines={2}>
                {m.title}
              </Text>
              <View style={styles.xpPill}>
                <Text style={styles.xpText}>{m.xpReward} XP</Text>
              </View>
              <Text style={styles.status}>
                {unlocked
                  ? new Date(awardedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not Achieved"}
              </Text>
            </View>
          );
        })}
      </ScrollView>
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
  tabs: {
    flexDirection: "row",
    gap: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  tab: { paddingBottom: 10 },
  tabOn: { borderBottomWidth: 2, borderBottomColor: colors.white },
  tabText: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  tabTextOn: { color: colors.white },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 40,
  },
  cell: { width: "30%", alignItems: "center", marginBottom: 8 },
  badge: {
    width: 72,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.accent,
    marginBottom: 8,
  },
  badgeLocked: {
    opacity: 0.4,
    borderColor: colors.border,
  },
  badgeGlyph: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
  },
  medalTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
    textAlign: "center",
    minHeight: 32,
  },
  xpPill: {
    marginTop: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpText: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
  },
  status: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
});
