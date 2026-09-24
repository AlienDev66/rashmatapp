import { BackButton } from "@/src/components/ui/BackButton";
import { Screen } from "@/src/components/ui/Screen";
import { sports } from "@/src/data/rulesLibrary";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { BookOpen, ChevronRight, Search } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

export default function LibraryHomeScreen() {
  const t = useT();
  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("screens.library")}</Text>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/library/search")}>
          <Search color={colors.white} size={18} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <BookOpen color={colors.accent} size={22} />
          <Text style={styles.heroTitle}>{t("screens.rulesDivisions")}</Text>
          <Text style={styles.heroSub}>{t("rules.heroSub")}</Text>
        </View>

        <Text style={styles.section}>{t("screens.sports")}</Text>
        {sports.map((s) => (
          <Pressable
            key={s.id}
            style={styles.card}
            onPress={() => router.push(`/library/sport/${s.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardKicker}>{s.subtitle}</Text>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardBody}>{s.blurb}</Text>
            </View>
            <ChevronRight color={colors.textDim} size={20} />
          </Pressable>
        ))}
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingBottom: 40, gap: 10 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: 8,
    marginBottom: 8,
  },
  heroTitle: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 26,
    lineHeight: 28,
  },
  heroSub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  cardKicker: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  cardTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 17,
    marginTop: 4,
  },
  cardBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
