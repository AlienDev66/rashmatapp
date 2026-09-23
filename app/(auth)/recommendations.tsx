import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { enrollProgram } from "@/src/data/progress";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FLAGSHIP_ID = "mat-foundations";

export default function RecommendationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { programs, sessions } = useCatalog();
  const [busyId, setBusyId] = useState<string | null>(null);

  const picks = useMemo(() => {
    const sorted = [...programs].sort((a, b) => {
      if (a.id === FLAGSHIP_ID) return -1;
      if (b.id === FLAGSHIP_ID) return 1;
      return Number(!!a.isPremium) - Number(!!b.isPremium);
    });
    return sorted.slice(0, 3);
  }, [programs]);

  const primary = picks[0];

  const firstSessionId = (programId: string) => {
    const list = sessions
      .filter((s) => s.programId === programId)
      .sort((a, b) => a.day - b.day);
    return list[0]?.id ?? null;
  };

  const startCamp = async (programId: string) => {
    if (!user) {
      Alert.alert("Sign in required", "Create an account to start this camp.");
      router.push("/(auth)/sign-in");
      return;
    }
    const program = programs.find((p) => p.id === programId);
    if (program?.isPremium) {
      router.push({ pathname: "/checkout", params: { programId } });
      return;
    }
    setBusyId(programId);
    try {
      await enrollProgram(programId);
      const sessionId = firstSessionId(programId);
      if (sessionId) {
        router.replace(`/workout/${sessionId}`);
      } else {
        router.replace(`/program/${programId}`);
      }
    } catch (e) {
      Alert.alert("Could not start", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.kicker}>YOU&apos;RE SET</Text>
      <Text style={styles.title}>Your first camp</Text>
      <Text style={styles.sub}>
        Start the flagship camp, complete session one, and build the habit — drills, rounds, progress.
      </Text>

      {picks.length === 0 ? (
        <EmptyState
          tone="programs"
          title="No programs yet"
          message="The catalog is empty right now. Jump in and explore when camps go live."
          actionLabel="Enter RASHMAT  →"
          onAction={() => router.replace("/(tabs)")}
          secondaryLabel="Browse creators"
          onSecondary={() => router.replace("/(tabs)/creators")}
        />
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {picks.map((p, index) => (
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
                {index === 0 ? <Text style={styles.badge}>START HERE</Text> : null}
                {p.isPremium ? <Text style={styles.premiumBadge}>PREMIUM</Text> : null}
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {p.description}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {primary ? (
            <View style={styles.ctaCol}>
              <Button
                label={
                  busyId === primary.id
                    ? "Starting…"
                    : primary.isPremium
                      ? "Unlock first camp  →"
                      : "Start this camp  →"
                }
                variant="accent"
                loading={busyId === primary.id}
                disabled={!!busyId}
                onPress={() => void startCamp(primary.id)}
              />
              <Button
                label="Browse all programs"
                variant="soft"
                disabled={!!busyId}
                onPress={() => router.replace("/(tabs)/programs")}
              />
            </View>
          ) : null}
        </>
      )}
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
  badge: {
    alignSelf: "flex-start",
    color: colors.black,
    backgroundColor: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
  },
  premiumBadge: {
    alignSelf: "flex-start",
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.55)",
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
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
  ctaCol: { gap: 10 },
});
