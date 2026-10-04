/**
 * Central app variables and reactive state management
 *
 * This module provides centralized access to:
 * - Screen dimensions
 * - Font scale settings
 * - RTL layout detection
 *
 * Pattern inspired by reference projects (conty, oss-weather) but adapted
 * for our non-Svelte TypeScript architecture using EventDispatcher.
 */

import { Application, Screen, Utils } from "@nativescript/core";
import { systemStates } from "./states";
import { logger } from "./utils";

/**
 * Centralized variables manager
 *
 * Provides reactive state for UI dimensions and configurations.
 */
class AppVariables {
  // Screen dimensions (constant after app start)
  public readonly screenHeightDips = Screen.mainScreen.heightDIPs;
  public readonly screenWidthDips = Screen.mainScreen.widthDIPs;
  public readonly screenRatio = Screen.mainScreen.widthDIPs / Screen.mainScreen.heightDIPs;

  // Private backing fields
  private _fontScale: number = 1.0;
  private _isRTL: boolean = false;
  private _initialized: boolean = false;

  // Scoped logger for this class
  private log = logger.scoped("AppVariables");

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
      this.log.debug("Already initialized");
      return;
    }

    this.log.debug("Initializing...");
    this._initialized = true;

    // Initial values from system
    this.updateFromConfiguration();

    // Setup Android activity lifecycle handlers (like reference projects)
    this.setupActivityLifecycleHandlers();

    DEV_LOG &&
      this.log.debug("Initialized", {
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
      DEV_LOG && this.log.debug("Activity started, updating configuration");
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
      DEV_LOG && this.log.debug("Font scale updated:", newFontScale);
    }

    // RTL layout direction
    const newIsRTL = configuration.getLayoutDirection() === 1;
    if (newIsRTL !== this._isRTL) {
      this._isRTL = newIsRTL;
      this.log.debug("RTL mode:", newIsRTL);
    }
  }
}

/**
 * Singleton instance of AppVariables
 */
export const appVariables = new AppVariables();
