import { Button } from "@/src/components/ui/Button";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { AlertTriangle, WifiOff } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title?: string;
  message?: string;
  offline?: boolean;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  message = "Check your connection and try again.",
  offline = false,
  onRetry,
}: Props) {
  const Icon = offline ? WifiOff : AlertTriangle;
  const heading = title ?? (offline ? "You’re offline" : "Something went wrong");

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon color={colors.accent} size={28} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{heading}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button label="Try again" variant="accent" onPress={onRetry} style={styles.btn} />
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
    minHeight: 260,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 24,
    lineHeight: 26,
    textAlign: "center",
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
});
