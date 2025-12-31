/**
 * System-level state management
 *
 * Manages reactive state for:
 * - System appearance (light/dark mode)
 * - Contrast mode (normal/medium/high)
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
// Direct imports to avoid circular dependency (utils/index → color → system.states → utils/index)
import { contrastLevelToMode } from "../utils/contrast";
import { logger } from "../utils/logger";

import type {
  ContrastChangeEvent,
  SystemAppearanceChangeEvent,
  SystemEventsMap,
} from "~/types";

/**
 * Class for managing system-related states and events
 */
export class SystemStates {
  /**
   * Event dispatcher for system events with type safety
   */
  public events = new EventDispatcher<SystemEventsMap>();

  // Scoped logger for this class
  private log = logger.scoped("SystemStates");

  /**
   * Event name for property change events
   * These constants provide string literals for the events defined in SystemEventsMap
   */
  public static readonly systemAppearanceChangedEvent =
    "systemAppearance:changed";
  public static readonly contrastChangedEvent = "contrast:changed";

  public static readonly launchEvent = "launchEvent";
  public static readonly resumeEvent = "resumeEvent";

  private initialized = false;
  private _systemAppearance: "light" | "dark" | null = null;
  private _contrast: ContrastMode | null = null;

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
   * Initializes theme-related functionality when the app is ready
   */
  public onLaunch(event: LaunchEventData): void {
    if (!event.android)
      throw new Error("SystemStates:: onLaunch - No Android event found");
    if (this.initialized)
      throw new Error("SystemStates:: onLaunch - Already initialized");
    this.initialized = true;

    androidLaunchEventLocalizationHandler();

    this.log.debug("onLaunch called");

    // Get initial system appearance
    const systemAppearance = Application.systemAppearance();
    this.log.debug("systemAppearance", systemAppearance);
    this.systemAppearance = systemAppearance;

    // Set the default locale for testing, see https://docs.nativescript.org/plugins/localize#changing-the-language-dynamically-at-runtime
    const localeOverriddenSuccessfully = overrideLocale("de-DE");
    DEV_LOG &&
      this.log.debug(
        "localeOverriddenSuccessfully",
        localeOverriddenSuccessfully
      );

    this.events.dispatch("launchEvent", event);

    this.listenContrastChange();
  }

  private listenContrastChange(): void {
    // Listen for contrast changes (API 35+)
    // addContrastChangeListener and getContrast() are only available on Android 15+ (API 35+)
    if (android.os.Build.VERSION.SDK_INT < 35) {
      DEV_LOG &&
        this.log.debug(
          "ContrastChangeListener requires API level 35+, using default contrast"
        );
      this.contrast = ContrastMode.NORMAL;
      return;
    }

    const context = Utils.android.getApplicationContext();
    if (!context) {
      DEV_LOG &&
        this.log.debug(
          "Could not get application context for contrast listener, using default contrast"
        );
      this.contrast = ContrastMode.NORMAL;
      return;
    }

    const uiModeManager = context.getSystemService(
      android.content.Context.UI_MODE_SERVICE
    ) as android.app.UiModeManager;

    if (!uiModeManager) {
      DEV_LOG &&
        this.log.debug(
          "Could not get UiModeManager service for contrast listener, using default contrast"
        );
      this.contrast = ContrastMode.NORMAL;
      return;
    }

    // Get the main executor to run the callback on the main thread
    const mainExecutor = context.getMainExecutor();
    if (!mainExecutor) {
      DEV_LOG &&
        this.log.debug(
          "Could not get main executor for ContrastChangeListener, using default contrast"
        );
      this.contrast = ContrastMode.NORMAL;
      return;
    }

    const contrastListener =
      new android.app.UiModeManager.ContrastChangeListener({
        onContrastChanged: (contrastLevel: number) => {
          DEV_LOG && this.log.debug("System contrast changed:", contrastLevel);
          // Set the contrast property (this will trigger property change event)
          this.contrast = contrastLevelToMode(contrastLevel);
        },
      });

    // Get initial contrast state and dispatch
    // getContrast() and addContrastChangeListener() are only available on Android 15+ (API 35+)
    // Even on API 35+, these methods might not be available on all devices/emulators
    try {
      const initialContrast = uiModeManager.getContrast();
      DEV_LOG &&
        this.log.debug("Initial system contrast level:", initialContrast);

      // Set the contrast property (this will trigger property change event)
      this.contrast = contrastLevelToMode(initialContrast);

      uiModeManager.addContrastChangeListener(mainExecutor, contrastListener);
      DEV_LOG && this.log.debug("ContrastChangeListener added successfully");
    } catch (error) {
      // Method might not be available even on API 35+ (e.g., on some devices/emulators)
      // This is expected and not an error - we just use the default contrast mode
      DEV_LOG &&
        this.log.debug(
          "Contrast API methods not available on this device/emulator, using default contrast mode"
        );
      // Fallback: use default contrast mode
      this.contrast = ContrastMode.NORMAL;
    }
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

    // Note: Activity lifecycle events (including back pressed) should be handled directly
    // via Application.android.on() in the components that need them, following the pattern
    // from reference projects (conty, alpimaps, oss-weather)

    this.log.debug("Events setup complete");
  }
}

export const systemStates = new SystemStates();
