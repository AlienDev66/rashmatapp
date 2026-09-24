import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import {
  federationsForSport,
  getSport,
  guidesForSport,
  type SportId,
} from "@/src/data/rulesLibrary";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

export default function LibrarySportScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sport = getSport(id ?? "");
  const feds = sport ? federationsForSport(sport.id as SportId) : [];
  const featured = sport ? guidesForSport(sport.id as SportId).slice(0, 4) : [];

  if (!sport) {
    return (
      <Screen>
        <View style={styles.top}>
          <BackButton />
          <Text style={styles.title}>{t("screens.library")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <EmptyState
          tone="missing"
          title={t("rules.sportNotFound")}
          message={t("rules.sportNotFoundBody")}
          actionLabel={t("rules.backToLibrary")}
          onAction={() => router.replace("/library")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{sport.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.blurb}>{sport.blurb}</Text>

        <Text style={styles.section}>{t("rules.federations")}</Text>
        {feds.map((f) => (
          <Pressable
            key={f.id}
            style={styles.card}
            onPress={() => router.push(`/library/federation/${f.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{f.name}</Text>
              <Text style={styles.cardBody}>{f.blurb}</Text>
            </View>
            <ChevronRight color={colors.textDim} size={20} />
          </Pressable>
        ))}

        <Text style={[styles.section, { marginTop: 16 }]}>{t("rules.quickGuides")}</Text>
        {featured.map((g) => (
          <Pressable
            key={g.id}
            style={styles.guideRow}
            onPress={() => router.push(`/library/guide/${g.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.guideTitle}>{g.title}</Text>
              <Text style={styles.guideMeta}>{g.tags.join(" · ")}</Text>
            </View>
            <ChevronRight color={colors.textDim} size={18} />
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
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17, flexShrink: 1 },
  content: { paddingBottom: 40, gap: 10 },
  blurb: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
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
  cardTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
  },
  cardBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
  },
  guideTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsMedium,
    fontSize: 14,
  },
  guideMeta: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 3,
  },
});
