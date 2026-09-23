import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PLANS = [
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "€14.99",
    period: "/month",
    perks: ["All creator programs", "Session player", "Progress tracking"],
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "€119",
    period: "/year",
    perks: ["2 months free", "Priority support", "Exclusive camps"],
  },
];

export default function PaywallScreen() {
  const [plan, setPlan] = useState("yearly");

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Go Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hero}>Build your game</Text>
      <Text style={styles.sub}>Unlock every program, session player, and progress tools.</Text>

      <View style={styles.plans}>
        {PLANS.map((p) => {
          const on = plan === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPlan(p.id)}
              style={[styles.plan, on && styles.planOn]}
            >
              <View style={styles.planTop}>
                <Text style={styles.planName}>{p.name}</Text>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on ? <View style={styles.dot} /> : null}
                </View>
              </View>
              <Text style={styles.price}>
                {p.price}
                <Text style={styles.period}>{p.period}</Text>
              </Text>
              {p.perks.map((perk) => (
                <View key={perk} style={styles.perk}>
                  <Check color={colors.accent} size={14} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: "auto", gap: 12 }}>
        <Button
          label="Continue to checkout  →"
          variant="accent"
          onPress={() => router.push({ pathname: "/checkout", params: { plan } })}
        />
        <Button label="Maybe later" variant="ghost" onPress={() => router.back()} />
      </View>
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
  hero: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 32,
    lineHeight: 34,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    marginTop: 8,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 20,
  },
  plans: { gap: 12 },
  plan: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planOn: { borderColor: colors.accent },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 16 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  price: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    marginVertical: 8,
  },
  period: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
  },
  perk: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  perkText: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 13 },
});
