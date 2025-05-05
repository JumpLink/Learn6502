import {
  Application,
  Page,
  SystemAppearanceChangedEventData,
  ScrollView,
  ScrollEventData,
  Utils,
  View,
  ActionBar,
} from "@nativescript/core";
import { Fab } from "~/widgets/fab";

import { EventData } from "@nativescript/core";
import { systemStates, SystemStates } from "~/states";
import { setStatusBarAppearance } from "~/utils/system";

// Import WindowInsetsCompat
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;

/**
 * MainController class to handle all main page functionality
 */
export class MainController {
  private page: Page | null = null;
  private actionBar: ActionBar | null = null;

  constructor() {
    // Private constructor for singleton pattern
    console.log("MainController: initialized");
    this.handleWindowInsets = this.handleWindowInsets.bind(this);
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
  }

  /**
   * Handles window inset changes to apply top margin dynamically.
   * @param insets The WindowInsetsCompat object containing inset data.
   */
  private handleWindowInsets(
    insets: androidx_core_view_WindowInsetsCompat
  ): void {
    if (!insets || !this.actionBar) {
      // Check if content exists and is a View
      console.warn(
        `main: handleWindowInsets - Could not apply padding. Insets: ${!!insets}, ActionBar: ${this.actionBar}`
      );
      return;
    }

    const topInsetPixels = insets.getInsets(
      androidx_core_view_WindowInsetsCompat.Type.systemBars()
    ).top;
    const topPaddingDips =
      Utils.layout.toDeviceIndependentPixels(topInsetPixels);
    // Apply marginTop to the ActionBar
    this.actionBar.style.marginTop = topPaddingDips;

    console.log(
      `main: handleWindowInsets - Applied marginTop: ${topPaddingDips} DIPs to ActionBar (from ${topInsetPixels}px)`
    );
  }

  private onSystemAppearanceChanged(
    event: SystemAppearanceChangedEventData
  ): void {
    setStatusBarAppearance("md_theme_surface", event.newValue === "dark");
  }

  /**
   * Event handler for the 'loaded' event of the root view.
   * Applies system bar insets to ensure content is not drawn under system bars
   * when Edge-to-Edge is enabled.
   * @param args Event arguments containing the view object.
   */
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;
    this.actionBar = this.page.getViewById<ActionBar>("main-action-bar");
    console.log("main: loaded:", this.page.id);

    // Store the bound handler in our map using the view id as key
    const viewId = this.page.id;

    systemStates.events.on(
      SystemStates.windowInsetsChangedEvent,
      this.handleWindowInsets
    );
    systemStates.events.on(
      Application.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
    setStatusBarAppearance("md_theme_surface");

    this.initFabScrollBehavior();
  }

  /**
   * Event handler for the 'unloaded' event of the root view.
   * Cleans up event listeners.
   * @param args Event arguments containing the view object.
   */
  public onUnloaded(args: EventData): void {
    const view = args.object as Page;
    console.log("main: unloaded:", view.id);

    // Get the view id
    const viewId = view.id || "default";

    // Unsubscribe if handler exists
    if (this.handleWindowInsets) {
      systemStates.events.off(
        SystemStates.windowInsetsChangedEvent,
        this.handleWindowInsets
      );
    }

    // Backward compatibility
    if (view["insetsHandler"]) {
      systemStates.events.off(
        SystemStates.windowInsetsChangedEvent,
        view["insetsHandler"]
      );
    }
  }

  public initFabScrollBehavior(): void {
    if (!this.page) {
      console.error("main: initFabScrollBehavior - View not found");
      return;
    }

    const scrollView = this.page?.getViewById<ScrollView>("mainScrollView");
    const fab = this.page?.getViewById<Fab>("mainFab");

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
        else if (
          currentScrollY >= scrollView.scrollableHeight &&
          !fab.isExtended
        ) {
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
        if (Math.abs(scrollDiff) > scrollThreshold || currentScrollY <= 0) {
          lastScrollY = currentScrollY;
        }
      });
    } else {
      console.error("ScrollView or FAB not found for scroll behavior setup.");
    }
  }

  public run(): void {
    console.log("run");
  }

  public openMenu(): void {
    console.log("openMenu");
  }

  public onFabTap(): void {
    console.log("onFabTap");
  }
}

// Create singleton instance
const mainController = new MainController();

// Export public functions using the instance
export const onLoaded = mainController.onLoaded.bind(mainController);
export const onUnloaded = mainController.onUnloaded.bind(mainController);
export const run = mainController.run.bind(mainController);
export const openMenu = mainController.openMenu.bind(mainController);
export const onFabTap = mainController.onFabTap.bind(mainController);
