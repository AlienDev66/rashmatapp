import { AppleIcon, EmailIcon, GoogleIcon, PasswordIcon } from "@/src/components/icons";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { Button } from "@/src/components/ui/Button";
import { DismissKeyboard } from "@/src/components/ui/DismissKeyboard";
import { TextField } from "@/src/components/ui/TextField";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, spacing } from "@/src/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signInWithOAuth, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onEmailSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Enter email and password.");
      return;
    }
    setBusy(true);
    const { error } = await signInWithEmail(email.trim(), password);
    setBusy(false);
    if (error) {
      Alert.alert("Sign in failed", error);
      return;
    }
    router.replace("/(tabs)");
  };

  const onOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    const { error } = await signInWithOAuth(provider);
    setBusy(false);
    if (error) Alert.alert("Sign in failed", error);
    else if (configured) router.replace("/(tabs)");
  };

  return (
    <DismissKeyboard
      style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}
    >
      <View style={styles.brand}>
        <BrandMark size={56} variant="yellow" />
      </View>
      <Text style={styles.title}>Sign In To RASHMAT</Text>
      <Text style={styles.sub}>Train with creators who live your sport.</Text>

      <View style={styles.form}>
        <TextField
          placeholder="Phone / Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          leftIcon={<EmailIcon size={20} color={colors.white} />}
        />
        <TextField
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          leftIcon={<PasswordIcon size={20} color={colors.white} />}
        />
        <Button label="Go  →" loading={busy} disabled={busy} onPress={onEmailSignIn} />
      </View>

      <View style={styles.divider} />

      <View style={styles.social}>
        <Button
          label="Go With Gmail"
          variant="light"
          iconLeft={<GoogleIcon size={22} />}
          disabled={busy}
          onPress={() => onOAuth("google")}
        />
        <Button
          label="Go With Apple"
          iconLeft={<AppleIcon size={22} color={colors.white} />}
          disabled={busy}
          onPress={() => onOAuth("apple")}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Text style={styles.link} onPress={() => router.push("/(auth)/sign-up")}>
            Sign Up.
          </Text>
        </Text>
        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
          <Text style={styles.link}>Forgot Password</Text>
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
