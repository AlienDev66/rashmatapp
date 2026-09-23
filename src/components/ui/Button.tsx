import { colors, fonts, radii, spacing } from "@/src/theme";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Variant = "accent" | "surface" | "ghost" | "danger" | "soft" | "light";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = "surface",
  loading = false,
  iconRight,
  iconLeft,
  style,
  disabled,
  ...rest
}: Props) {
  const darkLabel = variant === "accent" || variant === "soft" || variant === "light";
  const spinnerColor = darkLabel ? "#000000" : colors.accent;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !loading && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {iconLeft}
          <Text
            style={[
              styles.label,
              darkLabel && styles.labelDark,
              variant === "danger" && styles.labelDanger,
            ]}
          >
            {label}
          </Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radii.xxl,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  accent: { backgroundColor: colors.accent },
  surface: { backgroundColor: colors.surface },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  soft: { backgroundColor: colors.accentSoft },
  light: { backgroundColor: colors.white },
  danger: { backgroundColor: "transparent" },
  label: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.poppinsSemiBold,
  },
  labelDark: { color: "#000000" },
  labelDanger: { color: colors.danger, fontFamily: fonts.poppinsBold },
});
