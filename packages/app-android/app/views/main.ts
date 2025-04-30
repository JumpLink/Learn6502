import { Application, Page, SystemAppearanceChangedEventData } from "@nativescript/core";

import { EventData } from "@nativescript/core";
import { lifecycleEvents } from "~/utils/lifecycle";
import { applySystemBarInsets, setStatusBarAppearance } from "~/utils/system";

const onSystemAppearanceChanged = (view: Page, args: SystemAppearanceChangedEventData) => {
  applySystemBarInsets(view, true, false, false, false);
  setStatusBarAppearance("md_theme_surface");
}

/**
 * Event handler for the 'loaded' event of the root view.
 * Applies system bar insets to ensure content is not drawn under system bars
 * when Edge-to-Edge is enabled.
 * @param args Event arguments containing the view object.
 */
export const onLoaded = (args: EventData) => {
  const view = args.object as Page;
  console.log('main: loaded:', view.id);

  lifecycleEvents.on(Application.systemAppearanceChangedEvent, onSystemAppearanceChanged.bind(onSystemAppearanceChanged,view));
  applySystemBarInsets(view, true, false, false, false);
  setStatusBarAppearance("md_theme_surface");

  lifecycleEvents.dispatch(`loaded:${view.id}`, view);
}


export const run = () => {
  console.log('run');
};

export const openMenu = () => {
  console.log('openMenu');
};
