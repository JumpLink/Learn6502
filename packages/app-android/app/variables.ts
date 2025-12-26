/**
 * Central app variables and reactive state management
 *
 * This module provides centralized access to:
 * - Window insets (status bar, navigation bar, keyboard)
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
import { systemStates, SystemStates } from "./states";
import type { WindowInsets, VariablesEventsMap } from "./types";

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
  private _windowInsets: WindowInsets = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
  private _actionBarHeight: number = 56; // Default Material action bar height
  private _actionBarButtonHeight: number = 46;
  private _fontScale: number = 1.0;
  private _isRTL: boolean = false;
  private _initialized: boolean = false;

  /**
   * Current window insets (safe area)
   */
  public get windowInsets(): WindowInsets {
    return { ...this._windowInsets };
  }

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
   */
  public initialize(): void {
    if (this._initialized) {
      DEV_LOG && console.log("AppVariables already initialized");
      return;
    }

    DEV_LOG && console.log("Initializing AppVariables...");
    this._initialized = true;

    // Listen for window insets changes from systemStates
    systemStates.events.on(SystemStates.windowInsetsChangedEvent, (event) => {
      this.updateWindowInsetsFromNative(event.newValue);
    });

    // Initial values from system
    this.updateFromConfiguration();

    // Listen for activity start to update RTL
    Application.android?.on(Application.android.activityStartedEvent, () => {
      this.updateFromConfiguration();
    });

    DEV_LOG &&
      console.log("AppVariables initialized", {
        screenDims: `${this.screenWidthDips}x${this.screenHeightDips}`,
        fontScale: this._fontScale,
        isRTL: this._isRTL,
      });
  }

  /**
   * Update window insets from native WindowInsetsCompat
   */
  private updateWindowInsetsFromNative(
    nativeInsets: androidx.core.view.WindowInsetsCompat | null
  ): void {
    if (!nativeInsets) return;

    const systemBars = nativeInsets.getInsets(
      androidx.core.view.WindowInsetsCompat.Type.systemBars()
    );

    const newInsets: WindowInsets = {
      top: Utils.layout.toDeviceIndependentPixels(systemBars.top),
      bottom: Utils.layout.toDeviceIndependentPixels(systemBars.bottom),
      left: Utils.layout.toDeviceIndependentPixels(systemBars.left),
      right: Utils.layout.toDeviceIndependentPixels(systemBars.right),
    };

    this.setWindowInsets(newInsets);
  }

  /**
   * Set window insets and emit change event
   */
  private setWindowInsets(newInsets: WindowInsets): void {
    const oldValue = this._windowInsets;
    if (
      oldValue.top === newInsets.top &&
      oldValue.bottom === newInsets.bottom &&
      oldValue.left === newInsets.left &&
      oldValue.right === newInsets.right
    ) {
      return; // No change
    }

    this._windowInsets = newInsets;
    this.events.dispatch("windowInsets:changed", {
      newValue: newInsets,
      oldValue,
    });

    DEV_LOG && console.log("Window insets updated:", JSON.stringify(newInsets));
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
      DEV_LOG && console.log("Font scale updated:", newFontScale);
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
      DEV_LOG && console.log("RTL mode:", newIsRTL);
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
        DEV_LOG && console.log("Action bar height updated:", newHeight);
      }
    }
  }
}

/**
 * Singleton instance of AppVariables
 */
export const appVariables = new AppVariables();
