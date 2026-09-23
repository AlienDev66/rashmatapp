import { BrandMark } from "@/src/components/ui/BrandMark";
import { colors, fonts } from "@/src/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export function hasMediaUri(uri?: string | null): boolean {
  return Boolean(uri?.trim());
}

export function initialsFromName(name?: string | null): string {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  ring?: boolean;
};

/** Profile photo, or initials / brand mark when missing. */
export function Avatar({ uri, name, size = 44, ring = false }: AvatarProps) {
  const src = hasMediaUri(uri) ? uri!.trim() : null;
  const initials = initialsFromName(name);
  const fontSize = Math.max(12, Math.round(size * 0.34));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: colors.surfaceElevated,
        },
        ring && { borderWidth: 2, borderColor: colors.accent, padding: 2 },
      ]}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: "100%", height: "100%", borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <View style={styles.avatarFallback}>
          <LinearGradient
            colors={["#2A2420", colors.black]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {initials ? (
            <Text style={[styles.initials, { fontSize, lineHeight: fontSize + 2 }]}>{initials}</Text>
          ) : (
            <BrandMark size={Math.round(size * 0.42)} variant="yellow" />
          )}
        </View>
      )}
    </View>
  );
}

type CoverImageProps = {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Soft brand watermark when using the placeholder. */
  showMark?: boolean;
  children?: React.ReactNode;
};

/** Cover / hero image with a RASHMAT mat placeholder when uri is empty. */
export function CoverImage({ uri, style, showMark = true, children }: CoverImageProps) {
  const src = hasMediaUri(uri) ? uri!.trim() : null;

  return (
    <View style={[styles.coverRoot, style]}>
      {src ? (
        <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={["#1F1A16", colors.black, "#0C0A0A"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.coverSlash} />
          <View style={[styles.coverSlash, styles.coverSlashDim]} />
          {showMark ? (
            <View style={styles.coverMark} pointerEvents="none">
              <BrandMark size={72} variant="yellow" />
            </View>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.accent,
    fontFamily: fonts.alumniBoldItalic,
    letterSpacing: 1,
  },
  coverRoot: {
    overflow: "hidden",
    backgroundColor: colors.surfaceElevated,
  },
  coverSlash: {
    position: "absolute",
    width: "140%",
    height: 56,
    backgroundColor: "rgba(241,188,3,0.12)",
    transform: [{ rotate: "-18deg" }],
    top: "38%",
    left: "-20%",
  },
  coverSlashDim: {
    top: "52%",
    height: 28,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  coverMark: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.35,
  },
});
