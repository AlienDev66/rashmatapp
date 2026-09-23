import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { useCatalog } from "@/src/hooks/useCatalog";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecommendationsScreen() {
  const insets = useSafeAreaInsets();
  const { programs } = useCatalog();
  const picks = programs.slice(0, 3);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.kicker}>YOU&apos;RE SET</Text>
      <Text style={styles.title}>Recommended for you</Text>
      <Text style={styles.sub}>
        Based on your assessment, these creator programs match your goals and schedule.
      </Text>

      {picks.length === 0 ? (
        <EmptyState
          tone="programs"
          title="No recommendations yet"
          message="The catalog is empty right now. Explore creators or jump into the app."
          actionLabel="Explore RASHMAT  →"
          onAction={() => router.replace("/(tabs)")}
          secondaryLabel="Browse creators"
          onSecondary={() => router.replace("/(tabs)/creators")}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {picks.map((p) => (
            <Pressable
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/program/${p.id}`)}
            >
              <Image source={{ uri: p.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={["transparent", "rgba(20,17,17,0.92)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {p.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {picks.length > 0 ? (
        <Button
          label="Explore RASHMAT  →"
          variant="accent"
          onPress={() => router.replace("/(tabs)")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  kicker: {
    fontFamily: fonts.alumniScSemiBoldItalic,
    color: colors.accent,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 34,
    lineHeight: 36,
    marginTop: 8,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 22,
  },
  list: { gap: 14, paddingBottom: 20 },
  card: {
    height: 160,
    borderRadius: radii.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 18,
  },
  cardDesc: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 4,
  },
});
