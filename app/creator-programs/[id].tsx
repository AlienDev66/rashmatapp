import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { Screen } from "@/src/components/ui/Screen";
import { useCatalog } from "@/src/hooks/useCatalog";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CreatorProgramsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { creators, programs, loading, error, refresh, online } = useCatalog();
  const creator = creators.find((c) => c.id === id) ?? creators[0];
  const list = programs.filter((p) => p.creatorId === creator?.id);

  return (
    <Screen padded={false}>
      <View style={[styles.top, { paddingHorizontal: spacing.lg }]}>
        <BackButton />
        <Text style={styles.title}>Programs</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={[styles.sub, { paddingHorizontal: spacing.lg }]}>
        All programs by {creator?.name ?? "…"}
      </Text>

      <QueryGate
        loading={loading}
        error={error}
        onRetry={refresh}
        offline={!online}
        empty={false}
      >
        {list.length === 0 ? (
          <EmptyState
            tone="programs"
            title="No programs yet"
            message="This creator hasn’t published a camp or drill pack."
            actionLabel="Back"
            onAction={() => router.back()}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {list.map((p) => (
              <Pressable
                key={p.id}
                style={styles.card}
                onPress={() => router.push(`/program/${p.id}`)}
              >
                <Image
                  source={{ uri: p.coverUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(20,17,17,0.92)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.badge}>{p.level}</Text>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {p.description}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </QueryGate>
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
  list: {
    paddingHorizontal: spacing.lg,
    gap: 14,
    paddingBottom: 28,
  },
  card: {
    height: 180,
    borderRadius: radii.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    color: colors.white,
    fontFamily: fonts.poppinsMedium,
    fontSize: 11,
    backgroundColor: "rgba(180,40,40,0.85)",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
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
