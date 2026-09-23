import { EmailIcon } from "@/src/components/icons";
import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { DismissKeyboard } from "@/src/components/ui/DismissKeyboard";
import { TextField } from "@/src/components/ui/TextField";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, spacing } from "@/src/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSend = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter the email for your account.");
      return;
    }
    setBusy(true);
    const { error } = await resetPassword(email.trim());
    setBusy(false);
    if (error) {
      Alert.alert("Could not send link", error);
      return;
    }
    setSent(true);
    Alert.alert(
      "Check your email",
      "Open the reset link on this device. It will return you to RASHMAT to set a new password.",
      [{ text: "OK", onPress: () => router.push("/(auth)/reset-password") }],
    );
  };

  return (
    <DismissKeyboard
      style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
    >
      <BackButton />
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.sub}>
        Enter the email linked to your RASHMAT account and we&apos;ll send a reset link.
      </Text>

      <TextField
        placeholder="Phone / Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        leftIcon={<EmailIcon size={20} color={colors.white} />}
        style={styles.field}
      />

      <Button
        label={sent ? "Link sent  →" : "Send reset link  →"}
        variant="accent"
        loading={busy}
        disabled={busy}
        onPress={onSend}
      />
    </DismissKeyboard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 28,
    marginTop: 28,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 28,
  },
  field: { marginBottom: 16 },
});
