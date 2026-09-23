import { EmptyState } from "@/src/components/ui/EmptyState";
import { Stack, router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: false }} />
      <View style={styles.container}>
        <EmptyState
          tone="missing"
          title="Screen not found"
          message="This route doesn’t exist in RASHMAT."
          actionLabel="Go home  →"
          onAction={() => router.replace("/")}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
});
