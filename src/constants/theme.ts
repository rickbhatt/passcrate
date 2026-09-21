import { useColorScheme } from "react-native";

/** Must mirror the --color-* tokens in global.css. */
export const LIGHT_COLORS = {
  background: "#FAF9F6",
  card: "#FFFFFF",
  elevated: "#F2F0EB",
  primary: "#C87932",
  primaryPressed: "#A96024",
  primaryForeground: "#FFFFFF",
  textPrimary: "#171717",
  textSecondary: "#6F6D68",
  border: "#E4E1DB",
  success: "#3E8B63",
  danger: "#C95555",
} as const;

export const DARK_COLORS = {
  background: "#0D0D0F",
  card: "#17171A",
  elevated: "#222226",
  primary: "#F2A65A",
  primaryPressed: "#D9893D",
  primaryForeground: "#0D0D0F",
  textPrimary: "#F5F5F2",
  textSecondary: "#A6A6A0",
  border: "#2C2C30",
  success: "#6FCF97",
  danger: "#E57373",
} as const;

export type ThemeColors = { [K in keyof typeof LIGHT_COLORS]: string };

export const THEMES: Record<"light" | "dark", ThemeColors> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};

/** Palette matching the current system color scheme, for props that can't take classNames. */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === "dark" ? THEMES.dark : THEMES.light;
}
