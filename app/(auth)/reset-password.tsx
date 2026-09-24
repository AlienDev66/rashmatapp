import { PasswordIcon } from "@/src/components/icons";
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
import { useT } from "@/src/i18n";

export default function ResetPasswordScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const onUpdate = async () => {
    if (password.length < 8) {
      Alert.alert(t("authExtra.weakPassword"), t("authExtra.minChars"));
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don’t match", "Confirm your new password.");
      return;
    }
    if (!session) {
      Alert.alert(
        "Open the email link",
        "Tap the reset link from your email on this device, then set a new password.",
      );
      return;
    }
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) {
      Alert.alert("Update failed", error);
      return;
    }
    Alert.alert("Password updated", "Sign in with your new password.", [
      { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
    ]);
  };

  return (
    <DismissKeyboard
      style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
    >
      <BackButton />
      <Text style={styles.title}>{t("authExtra.resetTitle")}</Text>
      <Text style={styles.sub}>Use at least 8 characters. Then sign in with your new password.</Text>

      <View style={styles.form}>
        <TextField
          placeholder={t("authExtra.newPassword")}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          leftIcon={<PasswordIcon size={20} color={colors.white} />}
        />
        <TextField
          placeholder={t("authExtra.confirmNewPassword")}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          leftIcon={<PasswordIcon size={20} color={colors.white} />}
        />
        <Button
          label={t("authExtra.updatePassword")}
          variant="accent"
          loading={busy}
          disabled={busy}
          onPress={onUpdate}
        />
      </View>
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
  form: { gap: 12 },
});
