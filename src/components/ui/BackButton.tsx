import { colors } from "@/src/theme";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
      hitSlop={12}
    >
      <ChevronLeft color={colors.white} size={22} strokeWidth={2.4} />
    </Pressable>
  );
}

export function CircleIconButton({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(28,28,30,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
});
