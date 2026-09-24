import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { Screen } from "@/src/components/ui/Screen";
import { useCatalog } from "@/src/hooks/useCatalog";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { Search as SearchIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useT } from "@/src/i18n";

export default function SearchScreen() {
  const t = useT();
  const [query, setQuery] = useState("");
  const { creators, programs, loading, error, refresh, online } = useCatalog();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { programs: programs.slice(0, 4), creators: creators.slice(0, 3) };
    return {
      programs: programs.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      ),
      creators: creators.filter(
        (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
      ),
    };
  }, [query, programs, creators]);

  const empty =
    query.trim().length > 0 && results.programs.length === 0 && results.creators.length === 0;

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("searchScreen.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBox}>
        <SearchIcon color={colors.textMuted} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchScreen.placeholder")}
          placeholderTextColor={colors.textDim}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <QueryGate
        loading={loading}
        error={error}
        empty={programs.length === 0 && creators.length === 0}
        emptyTone="search"
        emptyTitle={t("searchScreen.nothingToSearch")}
        emptyMessage={t("searchScreen.nothingToSearchBody")}
        emptyActionLabel={t("common.refresh")}
        emptyOnAction={refresh}
        onRetry={refresh}
        offline={!online}
      >
        {empty ? (
          <EmptyState
            tone="search"
            title={t("searchScreen.noMatches")}
            message={t("searchScreen.noMatchesBody")}
            actionLabel={t("searchScreen.browseCreators")}
            onAction={() => router.push("/(tabs)/creators")}
            secondaryLabel={t("searchScreen.browsePrograms")}
            onSecondary={() => router.push("/(tabs)/programs")}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18 }}>
            <Section title={t("searchScreen.programs")}>
              {results.programs.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.row}
                  onPress={() => router.push(`/program/${p.id}`)}
                >
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Text style={styles.rowMeta}>
                    {t("searchScreen.programMeta", { weeks: p.weeks, level: p.level })}
                  </Text>
                </Pressable>
              ))}
            </Section>
            <Section title={t("searchScreen.creators")}>
              {results.creators.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.row}
                  onPress={() => router.push(`/creator/${c.id}`)}
                >
                  <Text style={styles.rowTitle}>{c.name}</Text>
                  <Text style={styles.rowMeta}>{c.role}</Text>
                </Pressable>
              ))}
            </Section>
          </ScrollView>
        )}
      </QueryGate>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </View>
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    fontSize: 15,
    paddingVertical: 14,
  },
  section: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  rowTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 15 },
  rowMeta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12 },
});
