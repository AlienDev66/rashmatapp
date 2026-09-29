import { useT } from "@/src/i18n";
import { createSessionFromUrl } from "@/src/lib/auth";
import { colors, fonts } from "@/src/theme";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * Deep-link landing for email confirm / OAuth / password recovery.
 * Expo Go: exp://…/--/auth/callback
 * Builds: rashmat://auth/callback
 */
export default function AuthCallbackScreen() {
  const t = useT();
  const params = useLocalSearchParams();
  const [messageKey, setMessageKey] = useState("authCallback.confirming");

  useEffect(() => {
    let cancelled = false;

    const finish = (type: string | null, session: boolean) => {
      if (type === "recovery") {
        router.replace("/(auth)/reset-password");
        return;
      }
      if (session || type === "signup" || type === "email") {
        router.replace("/(tabs)");
        return;
      }
      setMessageKey("authCallback.failed");
      setTimeout(() => router.replace("/(auth)/sign-in"), 1600);
    };

    const run = async () => {
      try {
        const query = Object.fromEntries(
          Object.entries(params).map(([k, v]) => [
            k,
            Array.isArray(v) ? v[0] : String(v ?? ""),
          ]),
        );

        // Prefer the real OS URL (keeps hash / code intact)
        const initial = await Linking.getInitialURL();
        const built = Linking.createURL("auth/callback", { queryParams: query });
        const candidates = [initial, built].filter(Boolean) as string[];

        for (const url of candidates) {
          const result = await createSessionFromUrl(url);
          if (cancelled) return;
          if (result.session || result.type === "recovery" || result.type === "signup") {
            finish(result.type, Boolean(result.session));
            return;
          }
        }

        // Params alone (Expo Router may have parsed code / token_hash)
        if (query.code || query.token_hash || query.access_token) {
          const result = await createSessionFromUrl(built);
          if (cancelled) return;
          finish(result.type, Boolean(result.session));
          return;
        }

        finish(null, false);
      } catch {
        if (!cancelled) {
          setMessageKey("authCallback.expired");
          setTimeout(() => router.replace("/(auth)/sign-in"), 1600);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.text}>{t(messageKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  text: {
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    textAlign: "center",
  },
});
