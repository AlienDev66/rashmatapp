import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { TextField } from "@/src/components/ui/TextField";
import { getFederation, searchGuides } from "@/src/data/rulesLibrary";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

export default function LibrarySearchScreen() {
  const t = useT();
  const [q, setQ] = useState("");
  const results = useMemo(() => searchGuides(q), [q]);

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("rules.searchTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <TextField
        placeholder={t("rules.searchPlaceholder")}
        value={q}
        onChangeText={setQ}
        autoFocus
        returnKeyType="search"
      />

      <ScrollView
        style={{ marginTop: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {results.length === 0 ? (
          <EmptyState
            compact
            tone="default"
            title={t("rules.noMatches")}
            message={t("rules.noMatchesBody")}
          />
        ) : (
          results.map((g) => {
            const fed = getFederation(g.federationId);
            return (
              <Pressable
                key={g.id}
                style={styles.row}
                onPress={() => router.push(`/library/guide/${g.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.kicker}>{fed?.shortName ?? g.federationId}</Text>
                  <Text style={styles.rowTitle}>{g.title}</Text>
                  <Text style={styles.rowBody} numberOfLines={2}>
                    {g.summary}
                  </Text>
                </View>
                <ChevronRight color={colors.textDim} size={18} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  list: { gap: 8, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
  },
  rowTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
    marginTop: 2,
  },
  rowBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
