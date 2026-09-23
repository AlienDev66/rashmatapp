import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/TextField";
import { Screen } from "@/src/components/ui/Screen";
import { demoUnlockProgram } from "@/src/data/studio";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function CheckoutScreen() {
  const { plan, programId } = useLocalSearchParams<{ plan?: string; programId?: string }>();
  const { user, updateProfile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);

  const isProgramUnlock = !!programId;
  const label = isProgramUnlock
    ? "Program unlock · Demo"
    : plan === "monthly"
      ? "Pro Monthly · Demo"
      : "Pro Yearly · Demo";

  const onConfirm = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Sign in to unlock.");
      router.push("/(auth)/sign-in");
      return;
    }
    setBusy(true);
    if (programId) {
      const { error } = await demoUnlockProgram(programId);
      setBusy(false);
      if (error) {
        Alert.alert("Could not unlock", error);
        return;
      }
      // Prefetch catalog to find first session
      try {
        const { fetchCatalog } = await import("@/src/data/catalog");
        const cat = await fetchCatalog();
        const first = cat.sessions
          .filter((s) => s.programId === programId)
          .sort((a, b) => a.day - b.day)[0];
        if (first) {
          router.replace(`/workout/${first.id}`);
          return;
        }
      } catch {
        /* fall through */
      }
      router.replace(`/program/${programId}`);
      return;
    }
    const membership = plan === "monthly" ? "Pro Monthly" : "Pro Yearly";
    const { error } = await updateProfile({ membership });
    setBusy(false);
    if (error) {
      Alert.alert("Could not activate", error);
      return;
    }
    await refreshProfile();
    router.replace("/subscriptions");
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Selected</Text>
        <Text style={styles.summaryValue}>{label}</Text>
        <Text style={styles.note}>Demo checkout — no real charge. Unlocks access for testing.</Text>
      </View>

      <Text style={styles.section}>Payment details (demo)</Text>
      <View style={styles.form}>
        <TextField placeholder="Cardholder name" />
        <TextField placeholder="Card number" keyboardType="number-pad" />
        <View style={styles.row}>
          <TextField placeholder="MM/YY" style={{ flex: 1 }} />
          <TextField placeholder="CVC" style={{ flex: 1 }} keyboardType="number-pad" />
        </View>
      </View>

      <View style={{ marginTop: "auto" }}>
        <Button
          label={busy ? "Unlocking…" : "Confirm (demo)  →"}
          variant="accent"
          disabled={busy}
          onPress={() => void onConfirm()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: 22,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 18,
    marginTop: 4,
  },
  note: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 16,
    marginBottom: 12,
  },
  form: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
});
