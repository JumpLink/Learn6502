
const { ColorStateList } = android.content.res;

// Credits https://github.com/henrychavez/nativescript-bottom-navigation/blob/bec186cc2a6dbceec17d59416824207c027e169b/src/lib/android/utils.ts
export function createColorStateList(activeColor: number, inactiveColor?: number) {

  if (!inactiveColor) {
    return android.content.res.ColorStateList.valueOf(activeColor);
  }

  const stateChecked = Array.create('int', 1);
  stateChecked[0] = android.R.attr.state_checked;
  const stateUnChecked = Array.create('int', 0);

  const states = java.lang.reflect.Array.newInstance(
    stateChecked.getClass() || stateUnChecked.getClass(),
    2,
  );
  states[0] = stateChecked;
  states[1] = stateUnChecked;

  const colors = Array.create('int', 2);
  colors[0] = activeColor;
  colors[1] = inactiveColor;

  return new ColorStateList(states, colors);
}

export const getColor = (context: android.content.Context, color: string) => {
  return context.getResources().getColor(
    context.getResources().getIdentifier(color, "color", context.getPackageName()),
    context.getTheme()
  );
}