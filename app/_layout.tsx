import { AuthProvider } from "@/src/providers/AuthProvider";
import { colors } from "@/src/theme";
import { AlumniSans_700Bold_Italic } from "@expo-google-fonts/alumni-sans";
import { AlumniSansSC_600SemiBold_Italic } from "@expo-google-fonts/alumni-sans-sc";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AlumniSans_700Bold_Italic,
    AlumniSansSC_600SemiBold_Italic,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    BebasNeue_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "slide_from_right",
              animationDuration: 280,
            }}
          >
            <Stack.Screen name="index" options={{ gestureEnabled: false, animation: "none" }} />
            <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="auth/callback" options={{ gestureEnabled: false }} />
            <Stack.Screen
              name="(tabs)"
              options={{
                gestureEnabled: false,
                animation: "fade",
                fullScreenGestureEnabled: false,
              }}
            />
            <Stack.Screen name="program/[id]" />
            <Stack.Screen name="workout/[id]" />
            <Stack.Screen
              name="session/[id]"
              options={{ gestureEnabled: false, animation: "fade" }}
            />
            <Stack.Screen name="creator/[id]" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="goals" />
            <Stack.Screen name="paywall" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="subscriptions" />
            <Stack.Screen name="monetize" />
            <Stack.Screen name="studio" />
            <Stack.Screen name="progress" />
            <Stack.Screen
              name="workout-complete"
              options={{ gestureEnabled: false, animation: "fade" }}
            />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="personal-info" />
            <Stack.Screen name="search" />
            <Stack.Screen name="creator-programs/[id]" />
          </Stack>
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
