import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { colors, fonts, radii } from "@/src/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const GOALS = [
  "Build muscle",
  "Lose fat",
  "Improve BJJ",
  "Competition prep",
  "Flexibility",
  "General fitness",
];

export default function GoalsScreen() {
  const [selected, setSelected] = useState<string[]>(["Improve BJJ"]);

  const toggle = (g: string) => {
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Your Goals</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.sub}>What do you want to achieve with RASHMAT?</Text>

      <View style={styles.grid}>
        {GOALS.map((g) => {
          const on = selected.includes(g);
          return (
            <Pressable
              key={g}
              onPress={() => toggle(g)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{g}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: "auto" }}>
        <Button label="Save goals  →" variant="accent" onPress={() => router.back()} />
      </View>
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
  sub: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: "rgba(245,197,24,0.12)" },
  chipText: { color: colors.textMuted, fontFamily: fonts.poppinsSemiBold },
  chipTextOn: { color: colors.accent },
});
