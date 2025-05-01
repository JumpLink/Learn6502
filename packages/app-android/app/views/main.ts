import { Application, Page, SystemAppearanceChangedEventData, ScrollView, ScrollEventData, AnimationCurve, Utils, View } from "@nativescript/core";
import { Fab } from "~/widgets/fab";

import { EventData } from "@nativescript/core";
import { lifecycleEvents, windowInsetsChangedEvent } from "~/utils/lifecycle";
import { setStatusBarAppearance } from "~/utils/system";

// Import WindowInsetsCompat
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;

/**
 * Handles window inset changes to apply top margin dynamically.
 * @param view The Page view to apply margin to.
 * @param insets The WindowInsetsCompat object containing inset data.
 */
const handleWindowInsets = (view: Page, insets: androidx_core_view_WindowInsetsCompat) => {
  if (!insets || !view.content || !(view.content instanceof View)) { // Check if content exists and is a View
    console.warn(`main: handleWindowInsets - Could not apply padding. Insets: ${!!insets}, Page content: ${view.content}`);
    return;
  }

  const topInsetPixels = insets.getInsets(androidx_core_view_WindowInsetsCompat.Type.systemBars()).top;
  const topMarginDips = Utils.layout.toDeviceIndependentPixels(topInsetPixels);
  // Apply padding to the Page's content
  view.style.marginTop = topMarginDips;
  console.log(`main: handleWindowInsets - Applied paddingTop: ${topMarginDips} DIPs to Page content (from ${topInsetPixels}px)`);
};

const onSystemAppearanceChanged = (view: Page, args: SystemAppearanceChangedEventData) => {
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

  // Bind the handler with the current view instance
  const boundInsetsHandler = handleWindowInsets.bind(null, view);
  // Store the bound handler on the view to easily unbind later
  view["insetsHandler"] = boundInsetsHandler;

  lifecycleEvents.on(windowInsetsChangedEvent, boundInsetsHandler);
  lifecycleEvents.on(Application.systemAppearanceChangedEvent, onSystemAppearanceChanged.bind(onSystemAppearanceChanged,view));
  setStatusBarAppearance("md_theme_surface");

  initFabScrollBehavior(view);
}

/**
 * Event handler for the 'unloaded' event of the root view.
 * Cleans up event listeners.
 * @param args Event arguments containing the view object.
 */
export const onUnloaded = (args: EventData) => {
    const view = args.object as Page;
    console.log('main: unloaded:', view.id);

    // Unsubscribe using the stored bound handler
    if (view["insetsHandler"]) {
        lifecycleEvents.off(windowInsetsChangedEvent, view["insetsHandler"]);
    }
    // TODO: Consider unsubscribing from systemAppearanceChangedEvent as well if appropriate
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