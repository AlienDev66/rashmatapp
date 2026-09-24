import { CoverImage } from "@/src/components/ui/Avatar";
import { Button } from "@/src/components/ui/Button";
import { useT } from "@/src/i18n";
import type { ScheduleDay } from "@/src/lib/trainSchedule";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Moon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  day: ScheduleDay;
  onStart?: () => void;
  onPreview?: () => void;
};

export function DayHeroCard({ day, onStart, onPreview }: Props) {
  const t = useT();

  if (day.rest || !day.session) {
    return (
      <View style={styles.restCard}>
        <Moon color={colors.accent} size={36} />
        <Text style={styles.restTitle}>{t("train.restDay")}</Text>
        <Text style={styles.restSub}>{t("train.restSub")}</Text>
      </View>
    );
  }

  const s = day.session;
  const tags = s.tags.length > 0 ? s.tags.join(" · ") : t("train.trainingDay");

  return (
    <View style={styles.card}>
      <CoverImage uri={s.coverUrl} style={StyleSheet.absoluteFill} showMark={false} />
      <LinearGradient
        colors={["rgba(20,17,17,0.15)", "rgba(20,17,17,0.55)", "rgba(20,17,17,0.95)"]}
        locations={[0.15, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.body}>
        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.tags}>{tags}</Text>
        <View style={styles.stats}>
          <Stat
            value={String(s.exerciseCount || s.exercises.length)}
            label={t("train.drills")}
          />
          <View style={styles.statDiv} />
          <Stat value={String(s.sets)} label={t("train.sets")} />
          <View style={styles.statDiv} />
          <Stat value={String(s.minutes)} label={t("train.minutes")} />
        </View>
        <View style={styles.actions}>
          {onPreview ? (
            <Button
              label={t("train.preview")}
              variant="ghost"
              onPress={onPreview}
              style={styles.btn}
            />
          ) : null}
          {onStart ? (
            <Button
              label={t("train.startSession")}
              variant="accent"
              onPress={onStart}
              style={styles.btn}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 340,
    borderRadius: radii.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  body: {
    padding: spacing.lg,
    gap: 8,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
  },
  tags: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  stat: { flex: 1, alignItems: "center" },
  statDiv: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  statValue: {
    color: colors.white,
    fontFamily: fonts.poppinsBold,
    fontSize: 18,
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 2,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { flex: 1, minHeight: 48 },
  restCard: {
    height: 280,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    gap: 10,
  },
  restTitle: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
  },
  restSub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
