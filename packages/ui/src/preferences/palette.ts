import { adwaitaStandaloneColor, formatAdwRgb, parseAdwRgb } from "@gjsify/adwaita-core";
import { isPrimaryFamilyKey, type PrimaryFamilyKey } from "./theme.ts";

/** The libadwaita CSS variables the palette overrides. */
export type PaletteVariable =
  | "--window-bg-color"
  | "--window-fg-color"
  | "--view-bg-color"
  | "--view-fg-color"
  | "--card-bg-color"
  | "--sidebar-bg-color"
  | "--sidebar-backdrop-color"
  | "--popover-bg-color"
  | "--dialog-bg-color"
  | "--accent-bg-color"
  | "--accent-color";

export type Palette = Partial<Record<PaletteVariable, string>>;

/**
 * libadwaita's named palette (`--accent-<name>`), refs/libadwaita/src/stylesheet/_colors.scss.
 * Not the same as `adw_accent_color_to_rgba`: red is #e01b24 here and #e62d42 there.
 */
export const PALETTE_FAMILIES: Readonly<Record<PrimaryFamilyKey, string>> = {
  blue: "#3584e4",
  teal: "#2190a4",
  green: "#3a944a",
  yellow: "#c88800",
  orange: "#ed5b00",
  red: "#e01b24",
  pink: "#d56199",
  purple: "#9141ac",
  slate: "#6f8396",
};

/** libadwaita's `--light-N` / `--dark-N` neutrals, same file. */
const LIGHT_1 = "#ffffff";
const LIGHT_2 = "#f6f5f4";
const DARK_4 = "#241f31";
const DARK_5 = "#000000";

type Lab = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

const hexToLab = (hex: string): Lab => {
  const rgb = parseAdwRgb(hex);
  if (!rgb) throw new Error(`Not a color: ${hex}`);
  const r = toLinear(rgb.red);
  const g = toLinear(rgb.green);
  const b = toLinear(rgb.blue);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const labToHex = ([L, a, b]: Lab): string => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return formatAdwRgb({
    red: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    green: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    blue: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  });
};

/** CSS `color-mix(in oklab, <a> <percent>%, <b>)`. */
export const mixOklab = (a: string, percent: number, b: string): string => {
  const p = percent / 100;
  const x = hexToLab(a);
  const y = hexToLab(b);
  return labToHex([x[0] * p + y[0] * (1 - p), x[1] * p + y[1] * (1 - p), x[2] * p + y[2] * (1 - p)]);
};

/**
 * The literal colors for the chosen primary tint and accent.
 *
 * A variable is left out when the theme default should stay: everything tinted for primary
 * `'none'`, the accent pair for accent `'system'`. In dark mode the foreground colors keep
 * libadwaita's own values.
 */
export const computePalette = (
  primary: PrimaryFamilyKey | "none",
  accent: PrimaryFamilyKey | "system",
  dark: boolean
): Palette => {
  const palette: Palette = {};

  if (isPrimaryFamilyKey(primary)) {
    const p = PALETTE_FAMILIES[primary];
    if (dark) {
      palette["--window-bg-color"] = mixOklab(p, 60, DARK_5);
      palette["--view-bg-color"] = mixOklab(p, 30, DARK_5);
      palette["--card-bg-color"] = mixOklab(p, 50, DARK_4);
      palette["--sidebar-bg-color"] = mixOklab(p, 50, DARK_5);
      palette["--sidebar-backdrop-color"] = mixOklab(p, 40, DARK_5);
      palette["--popover-bg-color"] = mixOklab(p, 40, DARK_5);
      palette["--dialog-bg-color"] = mixOklab(p, 25, DARK_4);
    } else {
      const view = mixOklab(p, 30, LIGHT_1);
      palette["--window-bg-color"] = mixOklab(p, 50, LIGHT_1);
      palette["--window-fg-color"] = DARK_5;
      palette["--view-bg-color"] = view;
      palette["--view-fg-color"] = DARK_5;
      palette["--card-bg-color"] = view;
      palette["--sidebar-bg-color"] = mixOklab(p, 40, LIGHT_2);
      palette["--sidebar-backdrop-color"] = mixOklab(p, 35, LIGHT_2);
      palette["--popover-bg-color"] = mixOklab(p, 20, LIGHT_1);
      palette["--dialog-bg-color"] = mixOklab(p, 30, LIGHT_2);
    }
  }

  if (isPrimaryFamilyKey(accent)) {
    const a = PALETTE_FAMILIES[accent];
    palette["--accent-bg-color"] = a;
    palette["--accent-color"] = adwaitaStandaloneColor(a, dark);
  }

  return palette;
};

/** A palette as a `:root { … }` block, or an empty string when nothing is overridden. */
export const paletteToCss = (palette: Palette): string => {
  const declarations = Object.entries(palette).map(([name, value]) => `${name}: ${value};`);
  return declarations.length ? `:root { ${declarations.join(" ")} }` : "";
};
