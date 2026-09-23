import { BrandMark } from "@/src/components/ui/BrandMark";
import { Button } from "@/src/components/ui/Button";
import { colors, fonts, radii, spacing } from "@/src/theme";
import {
  Bell,
  FolderOpen,
  LayoutGrid,
  Search,
  Users,
  UserX,
  type LucideIcon,
} from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

export type EmptyTone =
  | "default"
  | "search"
  | "creators"
  | "programs"
  | "training"
  | "studio"
  | "notifications"
  | "missing";

const TONE_ICON: Record<EmptyTone, LucideIcon> = {
  default: LayoutGrid,
  search: Search,
  creators: Users,
  programs: FolderOpen,
  training: LayoutGrid,
  studio: FolderOpen,
  notifications: Bell,
  missing: UserX,
};

const TONE_KICKER: Partial<Record<EmptyTone, string>> = {
  training: "YOUR WEEK",
  programs: "CATALOG",
  creators: "COACHES",
  search: "SEARCH",
  studio: "STUDIO",
  notifications: "INBOX",
};

type Props = {
  title: string;
  message?: string;
  tone?: EmptyTone;
  /** Smaller layout for nested sections (Studio lists, etc.). */
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function EmptyState({
  title,
  message,
  tone = "default",
  compact = false,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  const Icon = TONE_ICON[tone];
  const kicker = TONE_KICKER[tone];
  const isTraining = tone === "training" && !compact;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, isTraining && styles.wrapTraining]}>
      {isTraining ? (
        <View style={styles.heroMark}>
          <View style={styles.heroGlow} />
          <BrandMark size={72} variant="yellow" />
        </View>
      ) : (
        <View style={[styles.visual, compact && styles.visualCompact]}>
          <View style={styles.slash} />
          <View style={[styles.slash, styles.slashDim]} />
          <View style={styles.mark}>
            <BrandMark size={compact ? 40 : 52} variant="yellow" />
          </View>
          <View style={[styles.iconBadge, compact && styles.iconBadgeCompact]}>
            <Icon color={colors.accent} size={compact ? 16 : 20} strokeWidth={2.2} />
          </View>
        </View>
      )}

      {kicker && !compact ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={[styles.title, compact && styles.titleCompact, isTraining && styles.titleTraining]}>
        {title}
      </Text>
      {message ? (
        <Text style={[styles.message, isTraining && styles.messageTraining]}>{message}</Text>
      ) : null}

      {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {actionLabel && onAction ? (
            <Button label={actionLabel} variant="accent" onPress={onAction} style={styles.btn} />
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button
              label={secondaryLabel}
              variant="ghost"
              onPress={onSecondary}
              style={styles.btnSecondary}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    gap: 8,
    minHeight: 280,
  },
  wrapTraining: {
    gap: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + 8,
  },
  wrapCompact: {
    flex: 0,
    minHeight: 0,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  heroMark: {
    width: 112,
    height: 112,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(241,188,3,0.22)",
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: "rgba(241,188,3,0.08)",
  },
  visual: {
    width: 120,
    height: 120,
    borderRadius: radii.xxl,
    backgroundColor: colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visualCompact: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    marginBottom: 6,
  },
  slash: {
    position: "absolute",
    width: "160%",
    height: 36,
    backgroundColor: "rgba(241,188,3,0.14)",
    transform: [{ rotate: "-18deg" }],
    top: "42%",
  },
  slashDim: {
    top: "58%",
    height: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  mark: {
    opacity: 0.35,
  },
  iconBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: "rgba(241,188,3,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    bottom: 8,
    right: 8,
  },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.alumniScSemiBoldItalic,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  titleTraining: {
    fontSize: 34,
    lineHeight: 36,
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 22,
  },
  message: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 300,
    marginTop: 8,
  },
  messageTraining: {
    maxWidth: 280,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    maxWidth: 320,
    gap: 10,
    marginTop: 28,
  },
  actionsCompact: {
    marginTop: 16,
    gap: 8,
  },
  btn: { alignSelf: "stretch" },
  btnSecondary: { alignSelf: "stretch" },
});
