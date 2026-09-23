import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { TextField } from "@/src/components/ui/TextField";
import {
  applyReferralCode,
  ensureReferralCode,
  shareReferralInvite,
} from "@/src/data/referrals";
import { brand } from "@/src/lib/brand";
import { colors, fonts, radii, spacing } from "@/src/theme";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";

export default function ReferralsScreen() {
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void ensureReferralCode().then(setCode);
  }, []);

  const onCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", "Invite code copied.");
  };

  const onApply = async () => {
    if (!input.trim()) return;
    setBusy(true);
    const res = await applyReferralCode(input);
    setBusy(false);
    if (!res.ok) {
      Alert.alert("Could not apply", res.error ?? "Try another code.");
      return;
    }
    Alert.alert("You're linked", "When you finish your first session, your partner earns a medal.");
    setInput("");
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Invite partners</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hero}>Invite a training partner</Text>
      <Text style={styles.sub}>
        Share your code. When they complete their first session, you unlock the Training Partner
        medal (+XP).
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your code</Text>
        <Text style={styles.code}>{code ?? "…"}</Text>
        <View style={styles.row}>
          <Button label="Copy" variant="soft" onPress={() => void onCopy()} style={{ flex: 1 }} />
          <Button
            label="Share  →"
            variant="accent"
            onPress={() => code && void shareReferralInvite(code)}
            style={{ flex: 1 }}
            disabled={!code}
          />
        </View>
      </View>

      <Text style={styles.section}>Have a code?</Text>
      <TextField
        placeholder="Enter invite code"
        autoCapitalize="characters"
        value={input}
        onChangeText={setInput}
      />
      <Button
        label={busy ? "Applying…" : "Apply code"}
        variant="soft"
        style={{ marginTop: 12 }}
        disabled={busy || !input.trim()}
        onPress={() => void onApply()}
      />

      <Pressable onPress={() => void onCopy()}>
        <Text style={styles.foot}>
          {brand.name} · grow the mats together
        </Text>
      </Pressable>
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
  hero: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: 24,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  code: {
    color: colors.accent,
    fontFamily: fonts.poppinsBold,
    fontSize: 28,
    letterSpacing: 2,
    marginVertical: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  section: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    marginBottom: 10,
  },
  foot: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    textAlign: "center",
    marginTop: 28,
  },
});
