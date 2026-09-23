import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { colors, fonts } from "@/src/theme";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Push / in-app notifications are not wired yet.
 * Keep this honest — no fake reminders that look like real product data.
 */
export default function NotificationsScreen() {
  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <EmptyState
        tone="notifications"
        title="You're all caught up"
        message="Session reminders and creator drops will land here once push is enabled."
        actionLabel="Back to training  →"
        onAction={() => router.back()}
        secondaryLabel="Notification settings"
        onSecondary={() => router.push("/settings")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
});
