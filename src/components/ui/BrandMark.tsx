import { Image } from "expo-image";
import { View } from "react-native";

const logos = {
  yellow: require("@/src/assets/rashmat_logo_yellow.png"),
  white: require("@/src/assets/rashmat_logo_white.png"),
  black: require("@/src/assets/rashmat_logo_black.png"),
} as const;

export type BrandMarkVariant = keyof typeof logos;

type Props = {
  /** Visual size of the square mark. */
  size?: number;
  /**
   * yellow — hero / splash / auth on dark (default)
   * white — secondary chrome on dark
   * black — light surfaces only
   */
  variant?: BrandMarkVariant;
};

/** Official RASHMAT mark (square R monogram, distressed). */
export function BrandMark({ size = 72, variant = "yellow" }: Props) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Image source={logos[variant]} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}
