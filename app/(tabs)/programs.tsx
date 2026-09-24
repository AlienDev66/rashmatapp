import { BackButton } from "@/src/components/ui/BackButton";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { Screen } from "@/src/components/ui/Screen";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useT } from "@/src/i18n";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProgramsScreen() {
  const t = useT();
  const { programs, loading, error, refresh, refreshing, online } = useCatalog();

  return (
    <Screen padded={false}>
      <View style={styles.top}>
        <BackButton onPress={() => router.push("/(tabs)")} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>{t("programsTab.title")}</Text>
          <Text style={styles.sub}>{t("programsTab.sub")}</Text>
        </View>
        <Pressable style={styles.searchBtn} onPress={() => router.push("/search")}>
          <Search color={colors.white} size={18} />
        </Pressable>
      </View>
      <QueryGate
        loading={loading}
        error={error}
        empty={programs.length === 0}
        emptyTone="programs"
        emptyTitle={t("programsTab.emptyTitle")}
        emptyMessage={t("programsTab.emptyMessage")}
        emptyActionLabel={t("programsTab.refresh")}
        emptyOnAction={refresh}
        emptySecondaryLabel={t("programsTab.browseCreators")}
        emptyOnSecondary={() => router.push("/(tabs)/creators")}
        onRetry={refresh}
        offline={!online}
      >
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
          }
        >
          {programs.map((p) => (
            <Pressable
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/program/${p.id}`)}
            >
              <Image source={{ uri: p.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.85)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.badges}>
                <View style={styles.level}>
                  <Text style={styles.badgeText}>{p.level.toUpperCase()}</Text>
                </View>
                <View style={styles.weeks}>
                  <Text style={styles.badgeText}>{p.weeks} weeks</Text>
                </View>
              </View>
              <View style={styles.body}>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {p.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </QueryGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 4,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: spacing.lg, gap: 14, paddingBottom: 28 },
  card: {
    height: 200,
    borderRadius: radii.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  badges: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  level: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  weeks: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeText: { color: colors.black, fontFamily: fonts.poppinsSemiBold, fontSize: 11 },
  body: { padding: spacing.lg },
  cardTitle: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 22,
    lineHeight: 26,
  },
  cardDesc: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 6,
  },
});
