import { Button } from "@/src/components/ui/Button";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { fetchSetHistory } from "@/src/data/progress";
import { useWorkoutSession } from "@/src/hooks/useResource";
import { colors, fonts, spacing } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkoutCompleteScreen() {
  const { id, xp } = useLocalSearchParams<{ id?: string; xp?: string }>();
  const { data: session, loading, error, reload } = useWorkoutSession(id);
  const insets = useSafeAreaInsets();
  const [setsDone, setSetsDone] = useState(0);
  const xpShown = Number(xp) || 0;

  useEffect(() => {
    if (!session) return;
    void fetchSetHistory(session.id).then((rows) => setSetsDone(rows.length));
  }, [session]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <QueryGate
        loading={loading}
        error={error}
        empty={!id || !session}
        emptyTone="training"
        emptyTitle="Session not found"
        emptyMessage="We couldn’t load this workout summary."
        emptyActionLabel="Back to home  →"
        emptyOnAction={() => router.replace("/(tabs)")}
        onRetry={reload}
      >
        {session ? (
          <>
            <Text style={styles.kicker}>SESSION COMPLETE</Text>
            <Text style={styles.title}>Great work</Text>
            <Text style={styles.sub}>{session.title}</Text>

            <View style={styles.stats}>
              <Stat value={`+${xpShown}`} label="XP" />
              <Stat value={`${session.minutes}`} label="MIN" />
              <Stat
                value={`${setsDone || session.exerciseCount || session.exercises.length}`}
                label="SETS"
              />
            </View>

            {setsDone > 0 ? (
              <Text style={styles.history}>
                Logged {setsDone} set{setsDone === 1 ? "" : "s"} this session.
              </Text>
            ) : null}

            <Button
              label="Back to home  →"
              variant="accent"
              onPress={() => router.replace("/(tabs)")}
              style={{ marginTop: 32 }}
            />
          </>
        ) : null}
      </QueryGate>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 42,
    lineHeight: 44,
    marginTop: 8,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 15,
    marginTop: 8,
  },
  stats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 36,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  statValue: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 11,
    marginTop: 4,
  },
  history: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 18,
    textAlign: "center",
  },
});
