import { EmailIcon, PasswordIcon } from "@/src/components/icons";
import { BrandMark } from "@/src/components/ui/BrandMark";
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

export default function SignUpScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const onSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t("authExtra.missingFields"), t("authExtra.enterEmailPassword"));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t("authExtra.weakPassword"), t("authExtra.minChars"));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t("authExtra.passwordsMismatch"), t("authExtra.confirmYourPassword"));
      return;
    }
    setBusy(true);
    const { error, needsEmailConfirm, redirectTo } = await signUpWithEmail(
      email.trim(),
      password,
    );
    setBusy(false);
    if (error) {
      Alert.alert(t("authExtra.signUpFailed"), error);
      return;
    }
    if (needsEmailConfirm) {
      Alert.alert(
        "Confirm your email",
        [
          "Open the confirmation link on this phone (Safari/Mail → Open in Expo Go).",
          "",
          "If Chrome opens a blank page, add this URL in Supabase → Auth → Redirect URLs:",
          redirectTo ?? "(check Metro logs for Auth redirect URI)",
          "",
          "Also add: exp://**",
          "",
          "For faster Expo Go testing you can disable Confirm email in Supabase Auth settings.",
        ].join("\n"),
      );
      return;
    }
    router.push("/(auth)/assessment");
  };

  return (
    <DismissKeyboard
      style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}
    >
      <View style={styles.brand}>
        <BrandMark size={56} variant="yellow" />
      </View>
      <Text style={styles.title}>Sign Up For Free</Text>
      <Text style={styles.sub}>Quickly make your account in 1 minute</Text>

      <View style={styles.form}>
        <TextField
          placeholder={t("auth.emailPlaceholder")}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          leftIcon={<EmailIcon size={20} color={colors.white} />}
        />
        <TextField
          placeholder={t("auth.passwordPlaceholder")}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          leftIcon={<PasswordIcon size={20} color={colors.white} />}
        />
        <TextField
          placeholder={t("authExtra.confirmPassword")}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          leftIcon={<PasswordIcon size={20} color={colors.white} />}
        />
        <Button label="Go  →" loading={busy} disabled={busy} onPress={onSignUp} />
      </View>

      <Text style={styles.footer}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/(auth)/sign-in")}>
          Sign In.
        </Text>
      </Text>
    </DismissKeyboard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  brand: { alignItems: "center" },
  title: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 26,
    textAlign: "center",
    marginTop: 8,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  form: { gap: 12 },
  footer: {
    marginTop: "auto",
    textAlign: "center",
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    paddingTop: 24,
  },
  link: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    textDecorationLine: "underline",
  },
});
