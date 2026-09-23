import { Children } from "react";
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Tap empty space to dismiss keyboard.
 * Use only on form screens without nested ScrollViews that need free scrolling,
 * or wrap *around* a ScrollView that has keyboardDismissMode="on-drag".
 */
export function DismissKeyboard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  // RN throws if whitespace text nodes land outside <Text> (e.g. `>   <View`).
  const safeChildren = Children.toArray(children).filter(
    (child) => typeof child !== "string" || child.trim().length > 0,
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[{ flex: 1 }, style]}>{safeChildren}</View>
    </TouchableWithoutFeedback>
  );
}
