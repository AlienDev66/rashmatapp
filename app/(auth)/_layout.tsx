import { colors } from "@/src/theme";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="assessment" options={{ gestureEnabled: false }} />
      <Stack.Screen name="recommendations" options={{ gestureEnabled: false }} />
      <Stack.Screen name="quote" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
