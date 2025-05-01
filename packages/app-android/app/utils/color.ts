import { Utils } from "@nativescript/core";
import { getResource } from "./resource";

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
