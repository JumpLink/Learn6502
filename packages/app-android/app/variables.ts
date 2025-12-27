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
import { systemStates } from "./states";

/**
 * Centralized variables manager
 *
 * Provides reactive state for UI dimensions and configurations.
 */
class AppVariables {

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
  private _windowInset = { top: 0, left: 0, right: 0, bottom: 0, keyboard: 0 };
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
   * Window insets for edge-to-edge display
   * Contains top, left, right, bottom, and keyboard insets
   */
  public get windowInset(): {
    top: number;
    left: number;
    right: number;
    bottom: number;
    keyboard: number;
  } {
    return { ...this._windowInset };
  }

  /**
   * Initialize the variables manager
   * Should be called once during app launch
   * Pattern from reference projects (conty, oss-weather, alpimaps)
   */
  public initialize(): void {
    if (this._initialized) {
      DEV_LOG && console.log("[AppVariables] Already initialized");
      return;
    }

    DEV_LOG && console.log("[AppVariables] Initializing...");
    this._initialized = true;

    // Initial values from system
    this.updateFromConfiguration();

    // Setup Android activity lifecycle handlers (like reference projects)
    this.setupActivityLifecycleHandlers();

    DEV_LOG && console.log("[AppVariables] Initialized", {
      screenDims: `${this.screenWidthDips}x${this.screenHeightDips}`,
      fontScale: this._fontScale,
      isRTL: this._isRTL,
    });
  }

  /**
   * Setup Android activity lifecycle event handlers
   * Pattern from reference projects: direct use of Application.android.on() events
   */
  private setupActivityLifecycleHandlers(): void {
    // Handle activity start - update configuration (RTL, font scale, etc.)
    // This ensures configuration is updated when activity starts (e.g., after theme changes)
    Application.android?.on(Application.android.activityStartedEvent, () => {
      DEV_LOG && console.log("[AppVariables] Activity started, updating configuration");
      this.updateFromConfiguration();
    });
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
      this._fontScale = newFontScale;
      DEV_LOG && console.log("[AppVariables] Font scale updated:", newFontScale);
    }

    // RTL layout direction
    const newIsRTL = configuration.getLayoutDirection() === 1;
    if (newIsRTL !== this._isRTL) {
      this._isRTL = newIsRTL;
      DEV_LOG && console.log("[AppVariables] RTL mode:", newIsRTL);
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
        this._actionBarHeight = newHeight;
        this._actionBarButtonHeight = newHeight - 10;
        DEV_LOG && console.log("[AppVariables] Action bar height updated:", newHeight);
      }
    }
  }

  /**
   * Set window insets for edge-to-edge display
   * Pattern from reference projects (conty, oss-weather, alpimaps)
   * Sets CSS variables and dispatches change event
   */
  public setWindowInset(inset: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    keyboard?: number;
  }): void {
    const newInset = {
      top: inset.top,
      left: inset.left,
      right: inset.right,
      bottom: inset.bottom,
      keyboard: inset.keyboard || 0,
    };

    // Only update if changed
    if (
      this._windowInset.top !== newInset.top ||
      this._windowInset.left !== newInset.left ||
      this._windowInset.right !== newInset.right ||
      this._windowInset.bottom !== newInset.bottom ||
      this._windowInset.keyboard !== newInset.keyboard
    ) {
      this._windowInset = newInset;

      // Set CSS variables on root view style (like reference projects)
      const rootView = Application.getRootView();
      if (rootView?.style) {
        const rootViewStyle = rootView.style;
        rootViewStyle.setUnscopedCssVariable(
          "--windowInsetTop",
          newInset.top + ""
        );
        rootViewStyle.setUnscopedCssVariable(
          "--windowInsetLeft",
          newInset.left + ""
        );
        rootViewStyle.setUnscopedCssVariable(
          "--windowInsetRight",
          newInset.right + ""
        );
        rootViewStyle.setUnscopedCssVariable(
          "--windowInsetBottom",
          newInset.bottom + ""
        );
        rootViewStyle.setUnscopedCssVariable(
          "--windowInsetKeyboard",
          newInset.keyboard + ""
        );

        // Trigger CSS state change
        rootView._onCssStateChange?.();
      }

      DEV_LOG && console.log("[AppVariables] Window inset updated:", newInset);
    }
  }
}

/**
 * Singleton instance of AppVariables
 */
export const appVariables = new AppVariables();
