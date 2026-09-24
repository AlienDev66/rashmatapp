import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { colors, fonts } from "@/src/theme";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

/**
 * Push / in-app notifications are not wired yet.
 * Keep this honest — no fake reminders that look like real product data.
 */
export default function NotificationsScreen() {
  const t = useT();
  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("screens.notifications")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <EmptyState
        tone="notifications"
        title={t("screens.notifEmptyTitle")}
        message={t("screens.notifEmptyBody")}
        actionLabel={t("screens.backTraining")}
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
