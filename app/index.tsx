import { BrandMark } from "@/src/components/ui/BrandMark";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts } from "@/src/theme";
import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

/** Animated brand splash → session-aware route */
export default function SplashScreen() {
  const { session, profile, loading, configured } = useAuth();

  useEffect(() => {
    if (loading) return;

    const t = setTimeout(() => {
      if (!configured || !session) {
        router.replace("/(auth)/welcome");
        return;
      }
      if (profile && !profile.assessment_completed) {
        router.replace("/(auth)/assessment");
        return;
      }
      router.replace("/(tabs)");
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
