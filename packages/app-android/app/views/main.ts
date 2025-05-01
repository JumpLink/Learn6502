import { Application, Page, SystemAppearanceChangedEventData, ScrollView, ScrollEventData, AnimationCurve } from "@nativescript/core";
import { Fab } from "~/widgets/fab";

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

  initFabScrollBehavior(view);
}

export const initFabScrollBehavior = (view: Page) => {
  const scrollView = view.getViewById<ScrollView>('mainScrollView');
  const fab = view.getViewById<Fab>('mainFab');

  if (scrollView && fab) {
    let lastScrollY = 0;
    const scrollThreshold = 10;

    scrollView.on(ScrollView.scrollEvent, (event: ScrollEventData) => {
      const currentScrollY = event.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Scrolled to the top and FAB is collapsed, extend it
      if (currentScrollY <= 0 && !fab.isExtended) {
        fab.extend();
      }
      // Scrolled to the bottom and FAB is collapsed, extend it
      else if (currentScrollY >= scrollView.scrollableHeight && !fab.isExtended) {
        fab.extend();
      }
      // Scroll down and FAB is extended, collapse it
      else if (scrollDiff > scrollThreshold && fab.isExtended) {
        fab.collapse();
      }
      // Scroll up and FAB is extended, collapse it
      else if (scrollDiff < -scrollThreshold && fab.isExtended) {
        fab.collapse();
      }

      // Update last scroll position
      if (Math.abs(scrollDiff) > scrollThreshold || currentScrollY <= 0 ) {
         lastScrollY = currentScrollY;
      }
    });
  } else {
    console.error("ScrollView or FAB not found for scroll behavior setup.");
  }
}

export const run = () => {
  console.log('run');
};

export const openMenu = () => {
  console.log('openMenu');
};

export const onFabTap = () => {
  console.log('onFabTap');
}