/**
 * System-level state management
 *
 * Manages reactive state for:
 * - System appearance (light/dark mode)
 * - Contrast mode (normal/medium/high)
 * - Window insets (safe areas)
 *
 * Pattern from reference projects: centralized state with EventDispatcher
 */

import {
  Application,
  LaunchEventData,
  type SystemAppearanceChangedEventData,
  Utils,
} from "@nativescript/core";
import {
  androidLaunchEventLocalizationHandler,
  overrideLocale,
} from "@nativescript/localize";
import { EventDispatcher } from "@learn6502/6502";
import { ContrastMode } from "../constants";
import { contrastLevelToMode } from "../utils";

import type {
  ContrastChangeEvent,
  SystemAppearanceChangeEvent,
  SystemEventsMap,
  WindowInsetsChangeEvent,
} from "~/types";

// Import necessary AndroidX classes
import androidx_core_view_ViewCompat = androidx.core.view.ViewCompat;
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;
import androidx_core_view_OnApplyWindowInsetsListener = androidx.core.view.OnApplyWindowInsetsListener;
import android_view_View = android.view.View;

/**
 * Class for managing system-related states and events
 */
export class SystemStates {
  /**
   * Event dispatcher for system events with type safety
   */
  public events = new EventDispatcher<SystemEventsMap>();

  /**
   * Event name for property change events
   * These constants provide string literals for the events defined in SystemEventsMap
   */
  public static readonly systemAppearanceChangedEvent =
    "systemAppearance:changed";
  public static readonly contrastChangedEvent = "contrast:changed";
  public static readonly windowInsetsChangedEvent = "windowInsets:changed";

  public static readonly launchEvent = "launchEvent";
  public static readonly resumeEvent = "resumeEvent";

  private initialized = false;
  private _systemAppearance: "light" | "dark" | null = null;
  private _contrast: ContrastMode | null = null;
  private _windowInsets: androidx_core_view_WindowInsetsCompat | null = null;

  constructor() {
    this.setupEvents();
  }

  /**
   * Get the current system appearance
   */
  public get systemAppearance(): "light" | "dark" | null {
    return this._systemAppearance;
  }

  /**
   * Set the system appearance and dispatch change event if changed
   */
  public set systemAppearance(value: "light" | "dark" | null) {
    if (value !== this._systemAppearance) {
      const oldValue = this._systemAppearance;
      this._systemAppearance = value;
      const changeEvent: SystemAppearanceChangeEvent = {
        newValue: value,
        oldValue,
        initial: oldValue === null,
      };
      this.events.dispatch("systemAppearance:changed", changeEvent);
    }
  }

  /**
   * Get the current contrast mode
   */
  public get contrast(): ContrastMode | null {
    return this._contrast;
  }

  /**
   * Set the contrast mode and dispatch change event if changed
   */
  public set contrast(value: ContrastMode | null) {
    if (value !== this._contrast) {
      const oldValue = this._contrast;
      this._contrast = value;
      const changeEvent: ContrastChangeEvent = {
        newValue: value,
        oldValue,
        initial: oldValue === null,
      };
      this.events.dispatch("contrast:changed", changeEvent);
    }
  }

  /**
   * Get the current window insets
   */
  public get windowInsets(): androidx_core_view_WindowInsetsCompat | null {
    return this._windowInsets;
  }

  /**
   * Set the window insets and dispatch change event if changed
   */
  public set windowInsets(value: androidx_core_view_WindowInsetsCompat | null) {
    if (value !== this._windowInsets) {
      const oldValue = this._windowInsets;
      this._windowInsets = value;
      const changeEvent: WindowInsetsChangeEvent = {
        newValue: value,
        oldValue,
        initial: oldValue === null,
      };
      this.events.dispatch("windowInsets:changed", changeEvent);
    }
  }

  /**
   * Initializes theme-related functionality when the app is ready
   */
  public onLaunch(event: LaunchEventData): void {
    if (!event.android)
      throw new Error("SystemStates:: onLaunch - No Android event found");
    if (this.initialized)
      throw new Error("SystemStates:: onLaunch - Already initialized");
    this.initialized = true;

    androidLaunchEventLocalizationHandler();

    DEV_LOG && console.log("SystemStates:: onLaunch called");

    // Get initial system appearance
    const systemAppearance = Application.systemAppearance();
    DEV_LOG && console.log("systemAppearance", systemAppearance);
    this.systemAppearance = systemAppearance;

    // Set the default locale for testing, see https://docs.nativescript.org/plugins/localize#changing-the-language-dynamically-at-runtime
    const localeOverriddenSuccessfully = overrideLocale("de-DE");
    DEV_LOG &&
      console.log("localeOverriddenSuccessfully", localeOverriddenSuccessfully);

    this.events.dispatch("launchEvent", event);

    this.listenContrastChange();
    this.listenWindowInsetsChange();
  }

  private listenContrastChange(): void {
    // Listen for contrast changes (API 34+)
    if (android.os.Build.VERSION.SDK_INT < 34) {
      DEV_LOG &&
        console.log("ContrastChangeListener requires API level 34+, skipping");
      return;
    }

    const context = Utils.android.getApplicationContext();
    if (!context) {
      console.error("Could not get application context for contrast listener");
      return;
    }

    const uiModeManager = context.getSystemService(
      android.content.Context.UI_MODE_SERVICE
    ) as android.app.UiModeManager;

    if (!uiModeManager) {
      console.error(
        "Could not get UiModeManager service for contrast listener"
      );
      return;
    }

    // Get the main executor to run the callback on the main thread
    const mainExecutor = context.getMainExecutor();
    if (!mainExecutor) {
      console.error("Could not get main executor for ContrastChangeListener");
      return;
    }

    const contrastListener =
      new android.app.UiModeManager.ContrastChangeListener({
        onContrastChanged: (contrastLevel: number) => {
          DEV_LOG && console.log("System contrast changed:", contrastLevel);
          // Set the contrast property (this will trigger property change event)
          this.contrast = contrastLevelToMode(contrastLevel);
        },
      });

    // Get initial contrast state and dispatch
    const initialContrast = uiModeManager.getContrast();
    DEV_LOG && console.log("Initial system contrast level:", initialContrast);

    // Set the contrast property (this will trigger property change event)
    this.contrast = contrastLevelToMode(initialContrast);

    uiModeManager.addContrastChangeListener(mainExecutor, contrastListener);
    DEV_LOG && console.log("ContrastChangeListener added");
  }

  private listenWindowInsetsChange(): void {
    const activity =
      Application.android?.foregroundActivity ||
      Application.android?.startActivity;
    if (!activity) {
      throw new Error(
        "SystemStates:: Could not get activity to attach WindowInsets listener"
      );
    }

    const rootView = activity.getWindow().getDecorView().getRootView();
    if (!rootView) {
      throw new Error(
        "SystemStates:: Could not get root view to attach WindowInsets listener"
      );
    }

    const self = this; // Preserve this reference for the inner scope

    androidx_core_view_ViewCompat.setOnApplyWindowInsetsListener(
      rootView,
      new androidx_core_view_OnApplyWindowInsetsListener({
        onApplyWindowInsets: (
          view: android_view_View,
          insets: androidx_core_view_WindowInsetsCompat
        ): androidx_core_view_WindowInsetsCompat => {
          // Set the windowInsets property (this will trigger property change event)
          self.windowInsets = insets;

          // Return the insets consumed by the decor view's default listener
          // to ensure proper handling by the system
          return androidx_core_view_ViewCompat.onApplyWindowInsets(
            view,
            insets
          );
        },
      })
    );
    // Request initial insets
    rootView.requestApplyInsets();
    DEV_LOG && console.log("WindowInsets listener attached");
  }

  /**
   * Initializes the Events: hooks at the appropriate time based on platform
   */
  public setupEvents(): void {
    if (!Application.android) {
      throw new Error(
        "SystemStates:: setupEvents - No Android application found"
      );
    }

    // This registers the onLaunch handler to the native Application event.
    // onLaunch itself will dispatch the event via events.
    Application.once(Application.launchEvent, (event) => this.onLaunch(event));

    // Listen for theme changes
    Application.on(
      Application.systemAppearanceChangedEvent,
      (event: SystemAppearanceChangedEventData) => {
        // Update the systemAppearance property (this will trigger property change event)
        this.systemAppearance = event.newValue;
      }
    );

    // Listen for resume events
    Application.on(Application.resumeEvent, (args) => {
      this.events.dispatch("resumeEvent", args);
    });

    DEV_LOG && console.log("SystemStates events setup complete");
  }
}

export const systemStates = new SystemStates();
