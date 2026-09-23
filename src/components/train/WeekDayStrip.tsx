import type { ScheduleDay } from "@/src/lib/trainSchedule";
import { colors, fonts, spacing } from "@/src/theme";
import { Check, ChevronLeft, ChevronRight, Moon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  weekIndex: number;
  weekTotal: number;
  days: ScheduleDay[];
  selectedAbsoluteDay: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectDay: (day: ScheduleDay) => void;
};

export function WeekDayStrip({
  weekIndex,
  weekTotal,
  days,
  selectedAbsoluteDay,
  onPrevWeek,
  onNextWeek,
  onSelectDay,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.weekRow}>
        <Pressable
          onPress={onPrevWeek}
          disabled={weekIndex <= 0}
          hitSlop={10}
          style={({ pressed }) => [styles.arrow, pressed && { opacity: 0.6 }, weekIndex <= 0 && { opacity: 0.25 }]}
        >
          <ChevronLeft color={colors.white} size={22} />
        </Pressable>
        <Text style={styles.weekTitle}>Week {weekIndex + 1}</Text>
        <Pressable
          onPress={onNextWeek}
          disabled={weekIndex >= weekTotal - 1}
          hitSlop={10}
          style={({ pressed }) => [
            styles.arrow,
            pressed && { opacity: 0.6 },
            weekIndex >= weekTotal - 1 && { opacity: 0.25 },
          ]}
        >
          <ChevronRight color={colors.white} size={22} />
        </Pressable>
      </View>

      <View style={styles.days}>
        {days.map((d) => {
          const selected = d.absoluteDay === selectedAbsoluteDay;
          return (
            <Pressable
              key={d.absoluteDay}
              style={styles.dayCol}
              onPress={() => onSelectDay(d)}
            >
              {selected ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
              <Text style={[styles.dayLabel, selected && styles.dayLabelOn]}>DAY {d.dayInWeek}</Text>
              <View style={[styles.dayGlyph, selected && styles.dayGlyphOn]}>
                {d.status === "done" ? (
                  <Check color={selected ? colors.black : colors.accent} size={16} strokeWidth={2.5} />
                ) : d.rest ? (
                  <Moon color={selected ? colors.black : colors.textMuted} size={15} />
                ) : (
                  <Text style={[styles.dayNum, selected && styles.dayNumOn]}>{d.dayInWeek}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  arrow: { padding: 4 },
  weekTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
    minWidth: 88,
    textAlign: "center",
  },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  dotSpacer: { width: 6, height: 6 },
  dayLabel: {
    color: colors.textDim,
    fontFamily: fonts.poppinsMedium,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  dayLabelOn: { color: colors.white },
  dayGlyph: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayGlyphOn: {
    backgroundColor: colors.white,
  },
  dayNum: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  dayNumOn: { color: colors.black },
});
