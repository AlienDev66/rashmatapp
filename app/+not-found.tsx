import { EmptyState } from "@/src/components/ui/EmptyState";
import { Stack, router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";
import { useT } from "@/src/i18n";

export default function NotFoundScreen() {
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ title: t("screens.screenNotFound"), headerShown: false }} />
      <View style={styles.container}>
        <EmptyState
          tone="missing"
          title={t("screens.screenNotFound")}
          message={t("screens.routeMissing")}
          actionLabel={t("screens.goHome")}
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
