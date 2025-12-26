/**
 * Central app variables and reactive state management
 *
 * This module provides centralized access to:
 * - Action bar dimensions
 * - Screen dimensions
 * - Font scale settings
 * - RTL layout detection
 *
 * Pattern inspired by reference projects (conty, oss-weather) but adapted
 * for our non-Svelte TypeScript architecture using EventDispatcher.
 */

import { Application, Screen, Utils } from "@nativescript/core";
import { EventDispatcher } from "@learn6502/6502";
import { systemStates } from "./states";
import { logger } from "./utils";
import type { VariablesEventsMap } from "./types";

const log = logger.scoped("AppVariables");

/**
 * Centralized variables manager
 *
 * Provides reactive state for UI dimensions and configurations.
 * Uses EventDispatcher for change notifications.
 */
class AppVariables {
  public readonly events = new EventDispatcher<VariablesEventsMap>();

  // Screen dimensions (constant after app start)
  public readonly screenHeightDips = Screen.mainScreen.heightDIPs;
  public readonly screenWidthDips = Screen.mainScreen.widthDIPs;
  public readonly screenRatio =
    Screen.mainScreen.widthDIPs / Screen.mainScreen.heightDIPs;

  // Private backing fields
  private _actionBarHeight: number = 56; // Default Material action bar height
  private _actionBarButtonHeight: number = 46;
  private _fontScale: number = 1.0;
  private _isRTL: boolean = false;
  private _initialized: boolean = false;

  /**
   * Action bar height in DIPs
   */
  public get actionBarHeight(): number {
    return this._actionBarHeight;
  }

  /**
   * Action bar button height in DIPs (typically actionBarHeight - 10)
   */
  public get actionBarButtonHeight(): number {
    return this._actionBarButtonHeight;
  }

  /**
   * System font scale factor (1.0 = normal)
   */
  public get fontScale(): number {
    return this._fontScale;
  }

  /**
   * Whether the UI is in right-to-left layout mode
   */
  public get isRTL(): boolean {
    return this._isRTL;
  }

  /**
   * Initialize the variables manager
   * Should be called once during app launch
   * Pattern from reference projects (conty, oss-weather, alpimaps)
   */
  public initialize(): void {
    if (this._initialized) {
      log.debug("Already initialized");
      return;
    }

    log.info("Initializing...");
    this._initialized = true;

    // Initial values from system
    this.updateFromConfiguration();

    // Setup Android activity lifecycle handlers (like reference projects)
    this.setupActivityLifecycleHandlers();

    log.info("Initialized", {
      screenDims: `${this.screenWidthDips}x${this.screenHeightDips}`,
      fontScale: this._fontScale,
      isRTL: this._isRTL,
    });
  }

  /**
   * Setup Android activity lifecycle event handlers
   * Pattern from reference projects (conty, oss-weather, alpimaps)
   */
  private setupActivityLifecycleHandlers(): void {
    // Handle activity start - update configuration (RTL, font scale, etc.)
    Application.android?.on(Application.android.activityStartedEvent, () => {
      log.debug("Activity started, updating configuration");
      this.updateFromConfiguration();
    });

    // Note: Reference projects also handle activityResumedEvent and activityPausedEvent
    // for orientation listeners, but we don't need that yet
  }

  /**
   * Update values from device configuration
   */
  private updateFromConfiguration(): void {
    const context = Utils.android.getApplicationContext();
    if (!context) return;

    const resources = context.getResources();
    const configuration = resources.getConfiguration();

    // Font scale
    const newFontScale = configuration.fontScale || 1.0;
    if (newFontScale !== this._fontScale) {
      const oldValue = this._fontScale;
      this._fontScale = newFontScale;
      this.events.dispatch("fontScale:changed", {
        newValue: newFontScale,
        oldValue,
      });
      log.debug("Font scale updated:", newFontScale);
    }

    // RTL layout direction
    const newIsRTL = configuration.getLayoutDirection() === 1;
    if (newIsRTL !== this._isRTL) {
      const oldValue = this._isRTL;
      this._isRTL = newIsRTL;
      this.events.dispatch("rtl:changed", {
        newValue: newIsRTL,
        oldValue,
      });
      log.debug("RTL mode:", newIsRTL);
    }

    // Action bar height
    this.updateActionBarHeight(context);
  }

  /**
   * Update action bar height from system dimensions
   */
  private updateActionBarHeight(context: android.content.Context): void {
    // actionBarSize attribute ID: 16843499
    const actionBarSizeAttr = 16843499;
    const typedValue = new android.util.TypedValue();

    if (
      context.getTheme().resolveAttribute(actionBarSizeAttr, typedValue, true)
    ) {
      const newHeight = Utils.layout.toDeviceIndependentPixels(
        android.util.TypedValue.complexToDimensionPixelSize(
          typedValue.data,
          context.getResources().getDisplayMetrics()
        )
      );

      if (newHeight > 0 && newHeight !== this._actionBarHeight) {
        const oldValue = this._actionBarHeight;
        this._actionBarHeight = newHeight;
        this._actionBarButtonHeight = newHeight - 10;
        this.events.dispatch("actionBarHeight:changed", {
          newValue: newHeight,
          oldValue,
        });
        log.debug("Action bar height updated:", newHeight);
      }
    }
  }
}

/**
 * Singleton instance of AppVariables
 */
export const appVariables = new AppVariables();
