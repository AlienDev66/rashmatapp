import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { brand } from "@/src/lib/brand";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

export default function SubscriptionsScreen() {
  const t = useT();
  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("screens.subscriptions")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.badge}>{t("screens.active")}</Text>
        <Text style={styles.plan}>Pro Yearly</Text>
        <Text style={styles.meta}>Renews Jun 20, 2027 · €119/year</Text>
      </View>

      <View style={styles.group}>
        <Row label="Billing email" value={brand.email} />
        <Row label="Payment method" value="Visa ···· 4242" />
        <Row label="Next invoice" value="€119.00" />
        <Row label="Support" value={brand.supportEmail} />
      </View>

      <View style={{ marginTop: "auto", gap: 12 }}>
        <Button label="Change plan" variant="surface" onPress={() => router.push("/paywall")} />
        <Button label="Cancel subscription" variant="danger" onPress={() => {}} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badge: {
    color: colors.accent,
    fontFamily: fonts.poppinsBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  plan: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    marginTop: 6,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginTop: 6,
    fontSize: 13,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12 },
  rowValue: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
    marginTop: 4,
  },
});
