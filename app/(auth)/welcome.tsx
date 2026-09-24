import { colors, fonts, spacing } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Text as SvgText } from "react-native-svg";

const welcomeHero = require("@/src/assets/welcome-hero.jpg");

const HERO = 84;
const CTA_H = 52;
const CUT = 16;

/** True hollow stroke via SVG (RN Text can't do fill:none + stroke). */
function OutlineHeadline({ children }: { children: string }) {
  return (
    <Svg height={HERO * 0.92} width="100%">
      <SvgText
        fill="none"
        stroke={colors.white}
        strokeWidth={1.4}
        fontSize={HERO}
        fontFamily={fonts.alumniBoldItalic}
        x={2}
        y={HERO * 0.78}
      >
        {children}
      </SvgText>
    </Svg>
  );
}

function ChamferButton({ label, onPress }: { label: string; onPress: () => void }) {
  const [size, setSize] = useState({ w: 260, h: CTA_H });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) {
      setSize({ w: width, h: height });
    }
  };

  const { w, h } = size;
  const path = `M ${CUT} 0 H ${w} V ${h - CUT} L ${w - CUT} ${h} H 0 V ${CUT} Z`;

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [styles.ctaPress, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Path d={path} fill={colors.accent} />
      </Svg>
      <Text style={styles.ctaLabel}>{label}</Text>
    </Pressable>
  );
}

/** In-app auth entry — marketing + Studio live in the sibling `web/` package. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Image
        source={welcomeHero}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ top: "20%", right: 0 }}
      />
      <LinearGradient
        colors={["transparent", "rgba(20,17,17,0.45)", colors.bg]}
        locations={[0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.kicker}>
          TRAIN ON THE <Text style={styles.bolt}>MAT</Text>
        </Text>
        <OutlineHeadline>BUILD</OutlineHeadline>
        <Text style={[styles.heroBase, styles.solid]}>YOUR GAME</Text>
        <Text style={styles.sub}>
          Train with creators who live your sport — drill, track, and build your game.
        </Text>
        <ChamferButton label="FIND YOUR JOURNEY" onPress={() => router.push("/(auth)/sign-in")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xxl,
  },
  kicker: {
    fontFamily: fonts.alumniScSemiBoldItalic,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  bolt: {
    color: colors.accent,
  },
  heroBase: {
    fontFamily: fonts.alumniBoldItalic,
    fontSize: HERO,
    lineHeight: HERO * 0.88,
    letterSpacing: -1.2,
  },
  solid: {
    color: colors.white,
    marginTop: -6,
    marginBottom: 18,
  },
  sub: {
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 250,
  },
  ctaPress: {
    alignSelf: "stretch",
    maxWidth: 280,
    height: CTA_H,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: fonts.bebasRegular,
    fontSize: 16,
    color: "#000000",
    letterSpacing: 1.2,
    zIndex: 1,
  },
});
