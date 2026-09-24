import { quotes } from "@/src/data/mock";
import { useT } from "@/src/i18n";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function QuoteScreen() {
  const t = useT();
  const quote = quotes[0];

  useEffect(() => {
    const t = setTimeout(() => router.replace("/(tabs)"), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.root}>
      <Image source={{ uri: quote.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)", "#000"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.marks}>”</Text>
        </View>
        <Text style={styles.text}>{t("quoteScreen.text")}</Text>
        <Text style={styles.author}>— {t("quoteScreen.author")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xxl,
    paddingBottom: 80,
    alignItems: "center",
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  marks: { color: colors.white, fontFamily: fonts.alumniBoldItalic, fontSize: 28, marginTop: 8 },
  text: {
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  author: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
    letterSpacing: 2,
  },
});
