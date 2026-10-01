import { BrandMark } from "@/src/components/ui/BrandMark";
import { hrefAfterAuth } from "@/src/lib/postAuthRoute";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts } from "@/src/theme";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

/** Animated brand splash → session-aware route (navigates exactly once). */
export default function SplashScreen() {
  const { session, profile, loading, configured } = useAuth();
  const didRoute = useRef(false);

  useEffect(() => {
    if (didRoute.current) return;
    if (loading) return;
    // Wait for profile when signed in so we don't skip onboarding
    if (configured && session && profile === null) return;

    const t = setTimeout(() => {
      if (didRoute.current) return;
      didRoute.current = true;

      if (!configured || !session) {
        router.replace("/(auth)/welcome");
        return;
      }
      router.replace(hrefAfterAuth(profile));
    }, 1200);

    return () => clearTimeout(t);
  }, [configured, loading, profile, session]);

  return (
    <View style={styles.container}>
      <BrandMark size={88} variant="yellow" />
      <Text style={styles.wordmark}>RASHMAT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    marginTop: 18,
    color: colors.white,
    fontFamily: fonts.alumniScSemiBoldItalic,
    fontSize: 18,
    letterSpacing: 10,
  },
});
