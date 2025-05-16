import { Utils } from "@nativescript/core";
import { getResource } from "./resource";
import { ContrastMode } from "../constants";
import { systemStates } from "../states/system.states";

// Credits https://github.com/henrychavez/nativescript-bottom-navigation/blob/bec186cc2a6dbceec17d59416824207c027e169b/src/lib/android/utils.ts
export function createColorStateList(
  activeColor: number,
  inactiveColor?: number
) {
  const ColorStateList = android.content.res.ColorStateList;

  if (!inactiveColor) {
    return ColorStateList.valueOf(activeColor);
  }

  const stateChecked = Array.create("int", 1);
  stateChecked[0] = android.R.attr.state_checked;
  const stateUnChecked = Array.create("int", 0);

  const states = java.lang.reflect.Array.newInstance(
    stateChecked.getClass() || stateUnChecked.getClass(),
    2
  );
  states[0] = stateChecked;
  states[1] = stateUnChecked;

  const colors = Array.create("int", 2);
  colors[0] = activeColor;
  colors[1] = inactiveColor;

  return new ColorStateList(states, colors);
}

/**
 * Returns a themed color integer associated with a particular resource ID. If the resource holds a complex ColorStateList, then the default color from the set is returned.
 *
 * @see https://developer.android.com/reference/android/content/res/Resources#getColor(int,%20android.content.res.Resources.Theme)
 * @param color - The name of the color resource to retrieve
 * @param context - The context to retrieve the color from
 * @param theme - The theme to use for the color
 * @param packageName - The package name of the color resource
 * @returns The color integer
 */
export const getColor = (
  color: string,
  context: android.content.Context = Utils.android.getApplicationContext(),
  theme: android.content.res.Resources.Theme = context.getTheme(),
  packageName: string = context.getPackageName()
) => {
  return context
    .getResources()
    .getColor(getResource(color, "color", context, packageName), theme);
};

/**
 * Returns a themed Material Design color integer associated with a particular resource ID.
 * It prefixes the provided color name with `md_theme_`.
 * If a contrast mode other than `NORMAL` is specified, it attempts to find a color resource
 * with the contrast suffix (e.g., `_mediumContrast`, `_highContrast`).
 * If the contrast-specific color resource exists, its value is returned.
 * Otherwise, it falls back to the base Material Design color resource (without the contrast suffix).
 * If the resource holds a complex ColorStateList, the default color from the set is returned.
 *
 * @param color - The base name of the Material Design color resource (e.g., `primary`, `onSurface`).
 * @param context - The context to retrieve the color from.
 * @param theme - The theme to use for the color.
 * @param contrastMode - The contrast mode to apply.
 * @param packageName - The package name of the color resource.
 * @returns The color integer.
 */
export const getMaterialColor = (
  color: string,
  context: android.content.Context = Utils.android.getApplicationContext(),
  theme: android.content.res.Resources.Theme = context.getTheme(),
  contrastMode: ContrastMode = systemStates.contrast,
  packageName: string = context.getPackageName()
) => {
  const baseColorName = `md_theme_${color}`;

  if (contrastMode !== ContrastMode.NORMAL) {
    const contrastedColorName = `${baseColorName}_${contrastMode}Contrast`;
    // Check if the contrasted color resource exists
    const contrastedResourceId = getResource(
      contrastedColorName,
      "color",
      context,
      packageName
    );

    if (contrastedResourceId !== 0) {
      // Use the contrasted color if it exists
      return getColor(contrastedColorName, context, theme, packageName);
    }
  }

  // Fallback to the base color name
  return getColor(baseColorName, context, theme, packageName);
};
