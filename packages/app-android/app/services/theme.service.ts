import { ThemeService as BaseThemeService } from "@learn6502/common-ui";
import type { ThemeMode } from "@learn6502/common-ui";
import { Application, ApplicationSettings } from "@nativescript/core";
import { systemStates, SystemStates } from "../states";
import { getRootViewWhenReady, restartApp, logger } from "../utils/index";
import { ContrastMode, SETTINGS_THEME, DEFAULT_THEME } from "../constants";
import type { ContrastChangeEvent } from "~/types";

const log = logger.scoped("ThemeService");

/**
 * Android-specific implementation of the ThemeManager
 * Uses Android's AppCompatDelegate for theming
 *
 * Pattern from reference projects:
 * - Centralized logger for conditional logging
 * - Centralized settings keys from constants.ts
 * - Singleton pattern with lazy initialization
 */
export class ThemeService extends BaseThemeService {
  // Singleton instance
  private static instance: ThemeService | null = null;

  // Instance state
  private restartRequiredOnResume = false;

  /**
   * Get the singleton instance of ThemeService
   * If the instance doesn't exist, it will NOT be created automatically.
   * Use initialize() to create the instance when the app is ready.
   */
  public static getInstance(): ThemeService | null {
    return ThemeService.instance;
  }

  /**
   * Initialize the ThemeManager singleton when the app is ready
   * @returns The singleton instance
   */
  public static initialize(): ThemeService {
    if (!ThemeService.instance) {
      log.info("Initializing...");
      ThemeService.instance = new ThemeService();

      // Now that the instance is created, perform initialization
      ThemeService.instance.initializeManager();
    }
    return ThemeService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   * Keeps the constructor minimal to avoid startup issues
   */
  private constructor() {
    super();
    log.debug("Constructor called");
    // NO initialization here to prevent startup deadlocks
  }

  /**
   * Initialize the manager - called after singleton creation
   * This keeps the constructor minimal and avoids potential deadlocks
   */
  private initializeManager(): void {
    log.debug("initializeManager called");

    try {
      // Load theme from settings
      this.loadThemeFromSettings();

      // Monitor system appearance changes
      this.monitorSystemAppearance();

      // Monitor contrast changes
      this.monitorContrastChanges();

      // Add listener for the resume event to handle deferred restart
      systemStates.events.on(SystemStates.resumeEvent, () => {
        log.debug("Application resumed");
        if (this.restartRequiredOnResume) {
          log.debug("Restart required flag is set, restarting app now");
          // Reset the flag before triggering the restart,
          // to avoid infinite loops if the restart fails.
          this.restartRequiredOnResume = false;
          restartApp();
        }
      });

      log.info("Initialization completed");
    } catch (error) {
      console.error("Error during ThemeService initialization:", error);
    }
  }

  /**
   * Check if the dark theme is currently active
   */
  protected isCurrentlyDarkTheme(): boolean {
    // Get the current system appearance
    return systemStates.systemAppearance === "dark";
  }

  /**
   * Apply the selected theme to the Android application
   */
  protected applyTheme(mode: ThemeMode): void {
    try {
      const activity = Application.android.foregroundActivity;
      if (!activity) {
        console.error("Could not apply theme, no foreground activity");
        return;
      }

      // Apply theme according to mode
      switch (mode) {
        case "light":
          // Use AppCompatDelegate constants for light mode (MODE_NIGHT_NO)
          activity.getDelegate().setLocalNightMode(1); // AppCompatDelegate.MODE_NIGHT_NO
          break;
        case "dark":
          // Use AppCompatDelegate constants for dark mode (MODE_NIGHT_YES)
          activity.getDelegate().setLocalNightMode(2); // AppCompatDelegate.MODE_NIGHT_YES
          break;
        case "system":
        default:
          // Use AppCompatDelegate constants for system mode (MODE_NIGHT_FOLLOW_SYSTEM)
          activity.getDelegate().setLocalNightMode(-1); // AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
          break;
      }

      // Save theme to settings
      this.saveThemeToSettings(mode);
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  }

  /**
   * Load theme from application settings
   */
  private loadThemeFromSettings(): void {
    try {
      log.debug("Loading theme from settings...");
      const savedTheme = ApplicationSettings.getString(
        SETTINGS_THEME,
        DEFAULT_THEME
      );

      log.debug("Saved theme:", savedTheme);
      if (
        savedTheme &&
        (savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system")
      ) {
        this.setTheme(savedTheme as ThemeMode);
      } else {
        // Use system theme by default
        this.setTheme("system");
      }
    } catch (error) {
      console.error("Error loading theme from settings:", error);
      // Fallback to system theme
      this.setTheme("system");
    }
  }

  /**
   * Save theme to application settings
   */
  private saveThemeToSettings(mode: ThemeMode): void {
    try {
      log.debug("Saving theme to settings:", mode);
      ApplicationSettings.setString(SETTINGS_THEME, mode);
    } catch (error) {
      console.error("Error saving theme to settings:", error);
    }
  }

  /**
   * Monitor changes to the system theme and update accordingly
   */
  private monitorSystemAppearance(): void {
    // Listen for system appearance changes and apply them
    systemStates.events.on(
      SystemStates.systemAppearanceChangedEvent,
      (event) => {
        log.debug("System appearance changed:", event);
        // Only update isDarkTheme if we're in system mode
        if (this._currentTheme === "system") {
          this._isDarkTheme = systemStates.systemAppearance === "dark";
          this.notifyThemeChanged();
        }

        // Apply day/night mode to the activity
        try {
          const activity = Application.android
            .foregroundActivity as androidx.appcompat.app.AppCompatActivity;
          if (activity) {
            activity.getDelegate().applyDayNight();
          }
        } catch (error) {
          console.error("Error applying day/night mode:", error);
        }
      }
    );
  }

  /**
   * Monitor changes to contrast mode and update UI accordingly
   */
  private monitorContrastChanges(): void {
    // Listen for contrast changes
    systemStates.events.on(
      SystemStates.contrastChangedEvent,
      async (event: ContrastChangeEvent) => {
        log.debug("contrastChangedEvent", event);

        // WORKAROUND: Flag the app for restart when the contrast mode changes
        // (instead of restarting immediately)
        if (!event.initial) {
          log.debug("Contrast changed, flagging for restart on resume");
          this.restartRequiredOnResume = true;
        }

        // Update CSS classes for contrast mode
        try {
          await this.updateContrastClasses(event.newValue);
        } catch (error) {
          console.error("Error updating contrast classes:", error);
        }
      }
    );
  }

  /**
   * Update CSS classes for the specified contrast mode
   */
  private async updateContrastClasses(
    contrast: ContrastMode | null
  ): Promise<void> {
    if (!contrast) return;

    try {
      const rootView = await getRootViewWhenReady();

      // Remove all contrast classes
      rootView.cssClasses.delete("ns-contrast-normal");
      rootView.cssClasses.delete("ns-contrast-medium");
      rootView.cssClasses.delete("ns-contrast-high");

      // Add the new contrast class
      rootView.cssClasses.add("ns-contrast-" + contrast);

      // Apply CSS changes
      rootView._onCssStateChange();

      // Update modal views if any
      rootView._getRootModalViews()?.forEach((view) => {
        view.cssClasses.delete("ns-contrast-normal");
        view.cssClasses.delete("ns-contrast-medium");
        view.cssClasses.delete("ns-contrast-high");
        view.cssClasses.add("ns-contrast-" + contrast);

        view?._onCssStateChange();
      });

      log.debug("rootView cssClasses", Array.from(rootView.cssClasses.values()));
    } catch (error) {
      console.error("Error updating contrast classes:", error);
    }
  }
}
