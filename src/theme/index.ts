export const colors = {
  black: "#141111",
  bg: "#141111",
  surface: "#1C1C1E",
  surfaceElevated: "#2C2C2E",
  border: "#2A2A2C",
  white: "#FFFFFF",
  text: "#FFFFFF",
  textMuted: "#8E8E93",
  textDim: "#636366",
  accent: "#F1BC03",
  accentSoft: "#FFF3C4",
  danger: "#FF453A",
  success: "#30D158",
  overlay: "rgba(0,0,0,0.45)",
  pill: "rgba(28,28,30,0.85)",
} as const;

/** Loaded via `useFonts` in root layout — use these string names in styles. */
export const fonts = {
  alumniBoldItalic: "AlumniSans_700Bold_Italic",
  alumniScSemiBoldItalic: "AlumniSansSC_600SemiBold_Italic",
  poppinsRegular: "Poppins_400Regular",
  poppinsMedium: "Poppins_500Medium",
  poppinsSemiBold: "Poppins_600SemiBold",
  poppinsBold: "Poppins_700Bold",
  bebasRegular: "BebasNeue_400Regular",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const typography = {
  hero: {
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  section: {
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
  title: {
    fontFamily: fonts.poppinsBold,
    fontSize: 24,
    lineHeight: 30,
  },
  body: {
    fontFamily: fonts.poppinsRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  micro: {
    fontFamily: fonts.poppinsMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  cta: {
    fontFamily: fonts.bebasRegular,
    fontSize: 16,
    letterSpacing: 1.2,
  },
  kicker: {
    fontFamily: fonts.alumniScSemiBoldItalic,
    fontSize: 16,
    letterSpacing: 1.4,
  },
} as const;

export const theme = { colors, fonts, spacing, radii, typography } as const;
export type Theme = typeof theme;
