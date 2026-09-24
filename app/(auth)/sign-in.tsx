import { AppleIcon, EmailIcon, GoogleIcon, PasswordIcon } from "@/src/components/icons";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { Button } from "@/src/components/ui/Button";
import { DismissKeyboard } from "@/src/components/ui/DismissKeyboard";
import { TextField } from "@/src/components/ui/TextField";
import { useT } from "@/src/i18n";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, spacing } from "@/src/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signInWithOAuth, configured } = useAuth();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onEmailSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t("auth.missingTitle"), t("auth.missingBody"));
      return;
    }
    setBusy(true);
    const { error } = await signInWithEmail(email.trim(), password);
    setBusy(false);
    if (error) {
      Alert.alert(t("auth.failedTitle"), error);
      return;
    }
    router.replace("/(tabs)");
  };

  const onOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    const { error } = await signInWithOAuth(provider);
    setBusy(false);
    if (error) Alert.alert(t("auth.failedTitle"), error);
    else if (configured) router.replace("/(tabs)");
  };

  return (
    <DismissKeyboard
      style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}
    >
      <View style={styles.brand}>
        <BrandMark size={56} variant="yellow" />
      </View>
      <Text style={styles.title}>{t("auth.signInTitle")}</Text>
      <Text style={styles.sub}>{t("auth.signInSub")}</Text>

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
        <Button label={t("auth.go")} loading={busy} disabled={busy} onPress={onEmailSignIn} />
      </View>

      <View style={styles.divider} />

      <View style={styles.social}>
        <Button
          label={t("auth.goGmail")}
          variant="light"
          iconLeft={<GoogleIcon size={22} />}
          disabled={busy}
          onPress={() => onOAuth("google")}
        />
        <Button
          label={t("auth.goApple")}
          iconLeft={<AppleIcon size={22} color={colors.white} />}
          disabled={busy}
          onPress={() => onOAuth("apple")}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t("auth.noAccount")}{" "}
          <Text style={styles.link} onPress={() => router.push("/(auth)/sign-up")}>
            {t("auth.signUp")}
          </Text>
        </Text>
        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
          <Text style={styles.link}>{t("auth.forgot")}</Text>
        </Pressable>
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
  brand: { alignItems: "center", marginBottom: 4 },
  title: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 26,
    textAlign: "center",
    marginTop: 0,
  },
  sub: {
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
  },
  form: { gap: 12 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 22,
  },
  social: { gap: 12 },
  footer: { marginTop: "auto", alignItems: "center", gap: 14, paddingTop: 24 },
  footerText: { color: colors.white, fontFamily: fonts.poppinsRegular, fontSize: 14 },
  link: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    textDecorationLine: "underline",
  },
});
