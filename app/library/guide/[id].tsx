import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { getFederation, getGuide } from "@/src/data/rulesLibrary";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

export default function LibraryGuideScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const guide = getGuide(id ?? "");
  const federation = guide ? getFederation(guide.federationId) : null;

  if (!guide) {
    return (
      <Screen>
        <View style={styles.top}>
          <BackButton />
          <Text style={styles.topTitle}>{t("rules.guide")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <EmptyState
          tone="missing"
          title={t("rules.guideNotFound")}
          message={t("rules.guideNotFoundBody")}
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
        <Text style={styles.topTitle} numberOfLines={1}>
          {federation?.shortName ?? t("rules.guide")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{federation?.name ?? guide.federationId}</Text>
        <Text style={styles.title}>{guide.title}</Text>
        <Text style={styles.summary}>{guide.summary}</Text>

        <View style={styles.tags}>
          {guide.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {guide.sections.map((section) => (
          <View key={section.heading} style={styles.block}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.body ? <Text style={styles.body}>{section.body}</Text> : null}
            {section.bullets?.length ? (
              <View style={styles.bullets}>
                {section.bullets.map((b) => (
                  <View key={b} style={styles.bulletRow}>
                    <Text style={styles.bulletMark}>·</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <Text style={styles.disclaimer}>{t("rules.disclaimer")}</Text>
      </ScrollView>
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
  topTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 17,
    flexShrink: 1,
  },
  content: { paddingBottom: 48 },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 30,
    lineHeight: 32,
    marginTop: 8,
  },
  summary: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14, marginBottom: 8 },
  tag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 11,
  },
  block: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: 12,
  },
  heading: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
    marginBottom: 8,
  },
  body: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  bullets: { gap: 8 },
  bulletRow: { flexDirection: "row", gap: 8 },
  bulletMark: {
    color: colors.accent,
    fontFamily: fonts.poppinsBold,
    fontSize: 16,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  disclaimer: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 22,
  },
});
