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

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.visual, compact && styles.visualCompact]}>
        <View style={styles.slash} />
        <View style={[styles.slash, styles.slashDim]} />
        <View style={styles.mark}>
          <BrandMark size={compact ? 40 : 56} variant="yellow" />
        </View>
        <View style={[styles.iconBadge, compact && styles.iconBadgeCompact]}>
          <Icon color={colors.accent} size={compact ? 18 : 22} strokeWidth={2.2} />
        </View>
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="accent" onPress={onAction} style={styles.btn} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} style={styles.btnSecondary} />
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
    gap: 10,
    minHeight: 280,
  },
  wrapCompact: {
    flex: 0,
    minHeight: 0,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  visual: {
    width: 132,
    height: 132,
    borderRadius: radii.xxl,
    backgroundColor: colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visualCompact: {
    width: 96,
    height: 96,
    borderRadius: radii.xl,
    marginBottom: 4,
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
    opacity: 0.22,
  },
  iconBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: "rgba(241,188,3,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    bottom: 8,
    right: 8,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 26,
    lineHeight: 28,
    textAlign: "center",
    letterSpacing: -0.3,
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
  },
  btn: { marginTop: 14, alignSelf: "stretch", maxWidth: 320 },
  btnSecondary: { alignSelf: "stretch", maxWidth: 320 },
});
