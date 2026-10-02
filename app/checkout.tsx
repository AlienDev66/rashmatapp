import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/TextField";
import { Screen } from "@/src/components/ui/Screen";
import { demoUnlockProgram } from "@/src/data/studio";
import {
  isFreeUnlockSoftLaunch,
  isStoreKitLive,
  isWebPaidUnlock,
  programWebCheckoutUrl,
} from "@/src/lib/billing";
import { notifyEvent } from "@/src/lib/notifications";
import { useAuth } from "@/src/providers/AuthProvider";
import { useCatalog } from "@/src/hooks/useCatalog";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n";

/**
 * Soft launch: free unlock for unpriced camps — App Store 3.1.1 safe.
 * Priced premium → open web Stripe Checkout (no in-app payment).
 * Phase 2 (`billing.storeKitEnabled`): StoreKit / processor for Pro.
 */
export default function CheckoutScreen() {
  const t = useT();
  const { plan, programId } = useLocalSearchParams<{ plan?: string; programId?: string }>();
  const { user, updateProfile, refreshProfile } = useAuth();
  const { data: catalog } = useCatalog();
  const [busy, setBusy] = useState(false);
  const storeKit = isStoreKitLive();
  const freeUnlock = isFreeUnlockSoftLaunch();

  const program = useMemo(
    () => catalog?.programs.find((p) => p.id === programId) ?? null,
    [catalog, programId],
  );

  const isProgramUnlock = !!programId;
  const webPaid = program ? isWebPaidUnlock(program) : false;
  const label = isProgramUnlock
    ? webPaid
      ? t("extra.programUnlockWeb")
      : t("extra.programUnlockFree")
    : plan === "monthly"
      ? t("extra.proMonthlyDemo")
      : t("extra.proYearlyDemo");

  const onConfirm = async () => {
    if (!user) {
      Alert.alert(t("common.signInRequired"), t("extra.signInToUnlock"));
      router.push("/(auth)/sign-in");
      return;
    }

    // Soft launch: never present paid Pro activation without StoreKit.
    if (!isProgramUnlock && !storeKit) {
      Alert.alert(t("extra.billingSoonTitle"), t("extra.billingSoonBody"));
      return;
    }

    if (programId && webPaid) {
      await Linking.openURL(programWebCheckoutUrl(programId));
      return;
    }

    setBusy(true);
    if (programId) {
      const { error } = await demoUnlockProgram(programId);
      setBusy(false);
      if (error) {
        Alert.alert(t("extra.couldNotUnlock"), error);
        return;
      }
      void notifyEvent({
        title: t("screens.notifUnlockTitle"),
        body: t("screens.notifUnlockBody"),
        type: "unlock",
      });
      try {
        const { fetchCatalog } = await import("@/src/data/catalog");
        const cat = await fetchCatalog();
        const first = cat.sessions
          .filter((s) => s.programId === programId)
          .sort((a, b) => a.day - b.day)[0];
        if (first) {
          router.replace(`/workout/${first.id}`);
          return;
        }
      } catch {
        /* fall through */
      }
      router.replace(`/program/${programId}`);
      return;
    }

    // Phase 2 path — membership via StoreKit (placeholder until wired).
    const membership = plan === "monthly" ? "Pro Monthly" : "Pro Yearly";
    const { error } = await updateProfile({ membership });
    setBusy(false);
    if (error) {
      Alert.alert(t("extra.couldNotActivate"), error);
      return;
    }
    await refreshProfile();
    router.replace("/subscriptions");
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>
          {webPaid
            ? t("screens.unlock")
            : freeUnlock && isProgramUnlock
              ? t("screens.unlock")
              : t("screens.checkout")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{t("screens.selected")}</Text>
        <Text style={styles.summaryValue}>{label}</Text>
        <Text style={styles.note}>
          {webPaid
            ? t("extra.checkoutWebNote")
            : freeUnlock && isProgramUnlock
              ? t("extra.checkoutFreeNote")
              : t("extra.checkoutNote")}
        </Text>
      </View>

      {/* Phase 2: card / StoreKit fields — hidden on soft launch */}
      {storeKit ? (
        <>
          <Text style={styles.section}>{t("screens.paymentDemo")}</Text>
          <View style={styles.form}>
            <TextField placeholder={t("screens.cardholder")} />
            <TextField placeholder={t("screens.cardNumber")} keyboardType="number-pad" />
            <View style={styles.row}>
              <TextField placeholder={t("screens.mmyy")} style={{ flex: 1 }} />
              <TextField placeholder={t("screens.cvc")} style={{ flex: 1 }} keyboardType="number-pad" />
            </View>
          </View>
        </>
      ) : null}

      <View style={{ marginTop: "auto" }}>
        <Button
          label={
            busy
              ? t("extra.unlocking")
              : webPaid
                ? t("extra.confirmWebUnlock")
                : freeUnlock && isProgramUnlock
                  ? t("extra.confirmFreeUnlock")
                  : t("extra.confirmDemo")
          }
          variant="accent"
          disabled={busy}
          onPress={() => void onConfirm()}
        />
      </View>
    </Screen>
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
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: 22,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 18,
    marginTop: 4,
  },
  note: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 16,
    marginBottom: 12,
  },
  form: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
});
