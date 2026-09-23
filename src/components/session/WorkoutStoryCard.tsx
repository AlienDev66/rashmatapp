import { BrandMark } from "@/src/components/ui/BrandMark";
import { brand } from "@/src/lib/brand";
import { colors, fonts } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

export type WorkoutStoryStats = {
  title: string;
  coverUrl?: string | null;
  xp: number;
  minutes: number;
  sets: number;
  drills: number;
  /** Optional date label e.g. "23 SEP 2026" */
  dateLabel?: string;
};

type Props = {
  stats: WorkoutStoryStats;
  /** Visual width of the preview; height follows 9:16 */
  width?: number;
};

/**
 * Premium Strava-style Instagram Story (9:16).
 * Designed to look sharp when captured at 1080×1920.
 */
export const WorkoutStoryCard = forwardRef<View, Props>(function WorkoutStoryCard(
  { stats, width = 280 },
  ref,
) {
  const height = Math.round((width * 16) / 9);
  const s = width / 280; // scale from design base

  return (
    <View ref={ref} collapsable={false} style={[styles.root, { width, height }]}>
      {/* Full-bleed media */}
      {stats.coverUrl ? (
        <Image
          source={{ uri: stats.coverUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1C1C1E" }]} />
      )}

      {/* Atmosphere */}
      <LinearGradient
        colors={["rgba(20,17,17,0.15)", "rgba(20,17,17,0.2)", "rgba(20,17,17,0.92)"]}
        locations={[0, 0.38, 0.78]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "rgba(241,188,3,0.12)", "transparent"]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Gold accent bar */}
      <View
        style={[
          styles.accentBar,
          { height: 4 * s, top: height * 0.42 },
        ]}
      />

      <View
        style={[
          styles.inner,
          {
            paddingHorizontal: 22 * s,
            paddingTop: 32 * s,
            paddingBottom: 28 * s,
          },
        ]}
      >
        {/* Top brand */}
        <View style={styles.top}>
          <View style={[styles.markChip, { padding: 6 * s, borderRadius: 12 * s }]}>
            <BrandMark size={Math.round(26 * s)} variant="yellow" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.brand,
                { fontSize: 16 * s, lineHeight: 18 * s, letterSpacing: 1.4 * s },
              ]}
            >
              {brand.name}
            </Text>
            <Text style={[styles.date, { fontSize: 10 * s, marginTop: 2 * s }]}>
              {stats.dateLabel ?? "TRAINING DAY"}
            </Text>
          </View>
        </View>

        {/* Hero copy */}
        <View style={{ gap: 8 * s }}>
          <Text
            style={[
              styles.kicker,
              { fontSize: 11 * s, letterSpacing: 2.4 * s },
            ]}
          >
            SESSION COMPLETE
          </Text>
          <Text
            style={[
              styles.title,
              { fontSize: 38 * s, lineHeight: 40 * s },
            ]}
            numberOfLines={3}
          >
            {stats.title}
          </Text>
          <Text
            style={[
              styles.tagline,
              { fontSize: 12 * s, lineHeight: 16 * s, marginTop: 4 * s },
            ]}
          >
            Showed up. Logged the work. On to the next round.
          </Text>
        </View>

        {/* XP hero */}
        <View style={[styles.xpHero, { marginTop: 8 * s }]}>
          <Text
            style={[
              styles.xpPlus,
              { fontSize: 28 * s, lineHeight: 30 * s, marginBottom: 10 * s },
            ]}
          >
            +
          </Text>
          <Text
            style={[
              styles.xpValue,
              { fontSize: 84 * s, lineHeight: 86 * s },
            ]}
          >
            {stats.xp}
          </Text>
          <View style={[styles.xpBadge, { marginLeft: 10 * s, paddingHorizontal: 10 * s, paddingVertical: 5 * s, borderRadius: 8 * s }]}>
            <Text style={[styles.xpBadgeText, { fontSize: 12 * s, letterSpacing: 1.5 * s }]}>
              XP
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { gap: 8 * s }]}>
          <StatPill value={`${stats.minutes}`} label="MIN" s={s} accent />
          <StatPill value={`${stats.sets}`} label="SETS" s={s} />
          <StatPill value={`${stats.drills}`} label="DRILLS" s={s} />
        </View>

        {/* Footer */}
        <View style={[styles.bottom, { gap: 4 * s }]}>
          <View style={[styles.bottomRule, { marginBottom: 10 * s }]} />
          <Text style={[styles.handle, { fontSize: 13 * s }]}>
            {brand.social.handle}
          </Text>
          <Text style={[styles.domain, { fontSize: 11 * s }]}>
            Train with structure · {brand.domain}
          </Text>
        </View>
      </View>
    </View>
  );
});

function StatPill({
  value,
  label,
  s,
  accent,
}: {
  value: string;
  label: string;
  s: number;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        {
          paddingVertical: 12 * s,
          borderRadius: 14 * s,
          backgroundColor: accent ? colors.accent : "rgba(0,0,0,0.45)",
          borderColor: accent ? colors.accent : "rgba(255,255,255,0.14)",
        },
      ]}
    >
      <Text
        style={[
          styles.pillValue,
          {
            fontSize: 22 * s,
            lineHeight: 24 * s,
            color: accent ? colors.black : colors.white,
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.pillLabel,
          {
            fontSize: 9 * s,
            letterSpacing: 1.2 * s,
            marginTop: 3 * s,
            color: accent ? "rgba(0,0,0,0.55)" : colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.black,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.accent,
    opacity: 0.9,
  },
  inner: {
    flex: 1,
    justifyContent: "space-between",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markChip: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(241,188,3,0.35)",
  },
  brand: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
  },
  date: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: fonts.poppinsMedium,
    letterSpacing: 0.8,
  },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.alumniScSemiBoldItalic,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
  },
  tagline: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: fonts.poppinsRegular,
  },
  xpHero: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  xpPlus: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
  },
  xpValue: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
  },
  xpBadge: {
    backgroundColor: "rgba(241,188,3,0.18)",
    borderWidth: 1,
    borderColor: "rgba(241,188,3,0.45)",
    marginBottom: 14,
  },
  xpBadgeText: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
  },
  statsRow: {
    flexDirection: "row",
  },
  pill: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
  },
  pillValue: {
    fontFamily: fonts.alumniBoldItalic,
  },
  pillLabel: {
    fontFamily: fonts.poppinsMedium,
  },
  bottom: {},
  bottomRule: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  handle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
  },
  domain: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: fonts.poppinsRegular,
  },
});
