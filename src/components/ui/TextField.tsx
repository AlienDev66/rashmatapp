import { colors, fonts, radii, spacing } from "@/src/theme";
import { useMemo, useState } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  Text,
  View,
  type TextInputProps,
} from "react-native";

type Props = TextInputProps & {
  leftIcon?: React.ReactNode;
  secureToggle?: boolean;
};

export function TextField({
  leftIcon,
  style,
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const accessoryId = useMemo(() => `rashmat-input-${Math.random().toString(36).slice(2)}`, []);
  const isNumeric =
    rest.keyboardType === "number-pad" ||
    rest.keyboardType === "decimal-pad" ||
    rest.keyboardType === "phone-pad";

  return (
    <View style={[styles.wrap, focused && styles.focused]}>
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <TextInput
        placeholderTextColor={colors.textDim}
        {...rest}
        style={[styles.input, style]}
        returnKeyType={returnKeyType ?? "done"}
        blurOnSubmit={blurOnSubmit ?? true}
        inputAccessoryViewID={
          Platform.OS === "ios" && isNumeric ? accessoryId : rest.inputAccessoryViewID
        }
        onSubmitEditing={(e) => {
          Keyboard.dismiss();
          onSubmitEditing?.(e);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {Platform.OS === "ios" && isNumeric ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={styles.accessory}>
            <Pressable onPress={Keyboard.dismiss} hitSlop={8}>
              <Text style={styles.accessoryDone}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 54,
    borderRadius: radii.xxl,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "transparent",
  },
  focused: { borderColor: colors.accent },
  icon: { marginRight: spacing.md },
  input: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.poppinsRegular,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  accessory: {
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  accessoryDone: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 16,
  },
});
