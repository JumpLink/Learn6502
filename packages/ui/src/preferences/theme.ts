// Settings keys the theme is stored under
export const KEY_COLOR_SCHEME = "color-scheme"; // 0=follow,1=light,2=dark
export const KEY_PRIMARY_COLOR = "primary-color"; // 'none' | predefined key
export const KEY_ACCENT_COLOR = "accent-color"; // 'system' | predefined key

// Color scheme enum for better type safety
export enum ColorScheme {
  SYSTEM = 0,
  LIGHT = 1,
  DARK = 2,
}

// Default settings values for theme
export const DEFAULT_COLOR_SCHEME: ColorScheme = ColorScheme.SYSTEM;
export const DEFAULT_PRIMARY_COLOR = "none" as const;
export const DEFAULT_ACCENT_COLOR = "system" as const;

// Default override values (applied when settings are unset/reset)
export const DEFAULT_COLOR_SCHEME_OVERRIDE = 0; // 0=follow system, 1=light, 2=dark
export const DEFAULT_PRIMARY_OVERRIDE_KEY = "purple" as const;
export const DEFAULT_ACCENT_OVERRIDE_KEY = "system" as const;

// Primary color family keys supported by libadwaita accent variables
export const PRIMARY_FAMILIES = [
  "blue",
  "teal",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "slate",
] as const;

export type PrimaryFamilyKey = (typeof PRIMARY_FAMILIES)[number];

export const isPrimaryFamilyKey = (value: string | null | undefined): value is PrimaryFamilyKey =>
  (PRIMARY_FAMILIES as readonly string[]).includes(value ?? "");
