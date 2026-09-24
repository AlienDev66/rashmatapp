import { BrandMark } from "@/src/components/ui/BrandMark";
import type { Enrollment } from "@/src/data/progress";
import { useT } from "@/src/i18n";
import type { Program } from "@/src/types";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { Check, ChevronRight, BookOpen, ClipboardList, LayoutGrid, Trophy, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  programs: Program[];
  enrollments: Enrollment[];
  activeProgramId: string | null;
  isCreator?: boolean;
  onSelectProgram: (programId: string) => void;
  onOpenProgress: (programId: string) => void;
  onOpenOverview: (programId: string) => void;
  onOpenStudio?: () => void;
  onOpenLibrary?: () => void;
  onOpenLogs?: () => void;
  onOpenAchievements?: () => void;
};

export function ProgramDrawer({
  visible,
  onClose,
  programs,
  enrollments,
  activeProgramId,
  isCreator,
  onSelectProgram,
  onOpenProgress,
  onOpenOverview,
  onOpenStudio,
  onOpenLibrary,
  onOpenLogs,
  onOpenAchievements,
}: Props) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelW = Math.min(320, width * 0.82);
  const slide = useRef(new Animated.Value(panelW)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(panelW);
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, panelW, slide]);

  const enrolledPrograms = enrollments
    .map((e) => {
      const p = programs.find((x) => x.id === e.programId);
      return p ? { program: p, enrollment: e } : null;
    })
    .filter(Boolean) as { program: Program; enrollment: Enrollment }[];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.panel,
            {
              width: panelW,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: slide }],
            },
          ]}
        >
          <View style={styles.panelHead}>
            <BrandMark size={36} variant="yellow" />
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X color={colors.white} size={20} />
            </Pressable>
          </View>
          <Text style={styles.kicker}>{t("train.drawerCamps")}</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {enrolledPrograms.length === 0 ? (
              <Text style={styles.empty}>{t("train.drawerEmpty")}</Text>
            ) : (
              enrolledPrograms.map(({ program, enrollment }) => {
                const active = program.id === activeProgramId;
                return (
                  <Pressable
                    key={program.id}
                    style={[styles.progRow, active && styles.progRowOn]}
                    onPress={() => {
                      onSelectProgram(program.id);
                      onClose();
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.progTitle} numberOfLines={2}>
                        {program.title}
                      </Text>
                      <Text style={styles.progMeta}>
                        {t("train.drawerDayMeta", {
                          day: enrollment.currentDay,
                          pct: enrollment.progressPct,
                        })}
                      </Text>
                    </View>
                    {active ? <Check color={colors.accent} size={18} /> : null}
                  </Pressable>
                );
              })
            )}

            {activeProgramId ? (
              <>
                <Text style={[styles.kicker, { marginTop: 16 }]}>
                  {t("train.drawerThisProgram")}
                </Text>
                <DrawerLink
                  icon={<Trophy color={colors.accent} size={18} />}
                  label={t("train.drawerProgress")}
                  onPress={() => {
                    onOpenProgress(activeProgramId);
                    onClose();
                  }}
                />
                <DrawerLink
                  icon={<LayoutGrid color={colors.accent} size={18} />}
                  label={t("train.drawerOverview")}
                  onPress={() => {
                    onOpenOverview(activeProgramId);
                    onClose();
                  }}
                />
              </>
            ) : null}

            {onOpenLibrary || onOpenLogs || onOpenAchievements ? (
              <>
                <Text style={[styles.kicker, { marginTop: 16 }]}>
                  {t("train.drawerLearn")}
                </Text>
                {onOpenAchievements ? (
                  <DrawerLink
                    icon={<Trophy color={colors.accent} size={18} />}
                    label={t("train.drawerAchievements")}
                    onPress={() => {
                      onOpenAchievements();
                      onClose();
                    }}
                  />
                ) : null}
                {onOpenLibrary ? (
                  <DrawerLink
                    icon={<BookOpen color={colors.accent} size={18} />}
                    label={t("train.drawerLibrary")}
                    onPress={() => {
                      onOpenLibrary();
                      onClose();
                    }}
                  />
                ) : null}
                {onOpenLogs ? (
                  <DrawerLink
                    icon={<ClipboardList color={colors.accent} size={18} />}
                    label={t("train.drawerLogs")}
                    onPress={() => {
                      onOpenLogs();
                      onClose();
                    }}
                  />
                ) : null}
              </>
            ) : null}

            {isCreator && onOpenStudio ? (
              <>
                <Text style={[styles.kicker, { marginTop: 16 }]}>
                  {t("train.drawerCreator")}
                </Text>
                <DrawerLink
                  icon={<LayoutGrid color={colors.accent} size={18} />}
                  label={t("train.drawerStudio")}
                  onPress={() => {
                    onOpenStudio();
                    onClose();
                  }}
                />
              </>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      {icon}
      <Text style={styles.linkLabel}>{label}</Text>
      <ChevronRight color={colors.textDim} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  panel: {
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
  },
  progRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  progRowOn: {
    borderColor: "rgba(241,188,3,0.45)",
  },
  progTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
  },
  progMeta: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 3,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkLabel: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.poppinsMedium,
    fontSize: 15,
  },
});
