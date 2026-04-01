import { ThemeService as BaseThemeService } from "@learn6502/common-ui";
import type { ThemeMode } from "@learn6502/common-ui";
import { Application, ApplicationSettings } from "@nativescript/core";
import { systemStates, SystemStates } from "../states";
import { getRootViewWhenReady, restartApp, showError } from "../utils/index";
import { ContrastMode, SETTINGS_THEME, DEFAULT_THEME } from "../constants";
import type { ContrastChangeEvent } from "~/types";
import { logger } from "~/utils";

/**
 * Android-specific implementation of the ThemeManager
 * Uses Android's AppCompatDelegate for theming
 *
 * Pattern from reference projects:
 * - Centralized logger for conditional logging
 * - Centralized settings keys from constants.ts
 * - Direct export as instance (like notificationService)
 */
export class ThemeService extends BaseThemeService {
  // Instance state
  private restartRequiredOnResume = false;

  // Scoped logger for this class
  private log = logger.scoped("ThemeService");

  /**
   * Public constructor - instance is exported directly
   * Keeps the constructor minimal to avoid startup issues
   */
  public constructor() {
    super();
    this.log.debug("Constructor called");
    // NO initialization here to prevent startup deadlocks
  }

  /**
   * Initialize the ThemeService
   * Should be called once during app launch
   */
  public initialize(): void {
    this.log.debug("initializeManager called");

    try {
      // Load theme from settings
      this.loadThemeFromSettings();

      // Monitor system appearance changes
      this.monitorSystemAppearance();

      // Monitor contrast changes
      this.monitorContrastChanges();

      // Setup Android activity lifecycle handlers (like reference projects)
      this.setupActivityLifecycleHandlers();

      // Add listener for the resume event to handle deferred restart
      systemStates.events.on(SystemStates.resumeEvent, () => {
        this.log.debug("Application resumed");
        if (this.restartRequiredOnResume) {
          this.log.debug("Restart required flag is set, restarting app now");
          // Reset the flag before triggering the restart,
          // to avoid infinite loops if the restart fails.
          this.restartRequiredOnResume = false;
          restartApp();
        }
      });

      this.log.debug("Initialization completed");
    } catch (error) {
      showError(error, {
        forcedMessage: "Failed to initialize theme service",
        showAsNotification: true,
      });
    }
  }

  /**
   * Setup Android activity lifecycle event handlers
   * Pattern from reference projects (conty, oss-weather, alpimaps)
   * Based on StackOverflow solution: https://stackoverflow.com/questions/79319740
   */
  private setupActivityLifecycleHandlers(): void {
    // Handle activity start - update theme colors (like reference projects)
    // This ensures dynamic colors are applied on every activity start
    Application.android?.on(
      Application.android.activityStartedEvent,
      (event: any) => {
        if (event?.activity) {
          this.log.debug("Activity started, updating theme colors");
          // Ensure theme is applied
          event.activity.getDelegate().applyDayNight();
        }
      }
    );
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
   * Like reference projects: use startActivity and call applyDayNight after setting mode
   */
  protected applyTheme(mode: ThemeMode): void {
    try {
      const activity = Application.android
        .startActivity as androidx.appcompat.app.AppCompatActivity;
      if (!activity) {
        this.log.error("Could not apply theme, no start activity");
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

      // Apply day/night mode like reference projects do
      activity.getDelegate().applyDayNight();

      // Save theme to settings
      this.saveThemeToSettings(mode);
    } catch (error) {
      showError(error, {
        forcedMessage: "Failed to apply theme",
        showAsNotification: true,
      });
    }
  }

  /**
   * Load theme from application settings
   */
  private loadThemeFromSettings(): void {
    try {
      this.log.debug("Loading theme from settings...");
      const savedTheme = ApplicationSettings.getString(
        SETTINGS_THEME,
        DEFAULT_THEME
      );

      this.log.debug("Saved theme:", savedTheme);
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
      this.log.error("Error loading theme from settings:", error);
      // Fallback to system theme
      this.setTheme("system");
    }
  }

  /**
   * Save theme to application settings
   */
  private saveThemeToSettings(mode: ThemeMode): void {
    try {
      this.log.debug("Saving theme to settings:", mode);
      ApplicationSettings.setString(SETTINGS_THEME, mode);
    } catch (error) {
      this.log.error("Error saving theme to settings:", error);
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
        DEV_LOG && this.log.debug("System appearance changed:", event);
        // Only update isDarkTheme if we're in system mode
        if (this._currentTheme === "system") {
          this._isDarkTheme = systemStates.systemAppearance === "dark";
          this.notifyThemeChanged();
        }

        // Apply day/night mode to the activity
        // Like reference projects: use startActivity and call applyDayNight
        try {
          const activity = Application.android
            .startActivity as androidx.appcompat.app.AppCompatActivity;
          if (activity) {
            activity.getDelegate().applyDayNight();
          }
        } catch (error) {
          // Silent error - theme changes are non-critical
          showError(error, {
            silent: true,
          });
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
        this.log.debug("contrastChangedEvent", event);

        // WORKAROUND: Flag the app for restart when the contrast mode changes
        // (instead of restarting immediately)
        if (!event.initial) {
          DEV_LOG &&
            this.log.debug("Contrast changed, flagging for restart on resume");
          this.restartRequiredOnResume = true;
        }

        // Update CSS classes for contrast mode
        try {
          await this.updateContrastClasses(event.newValue);
        } catch (error) {
          // Silent error - contrast changes are non-critical
          showError(error, {
            silent: true,
          });
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
      if (!rootView) return;

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

      DEV_LOG &&
        this.log.debug(
          "rootView cssClasses",
          Array.from(rootView.cssClasses.values())
        );
    } catch (error) {
      // Silent error - contrast changes are non-critical
      showError(error, {
        silent: true,
      });
    }
  }

  /**
   * Update CSS variables for safe area insets
   * These variables can be used throughout the app via var(--safeAreaInset*)
   * Pattern from reference projects (conty, alpimaps, oss-weather) - using camelCase
   */
  public updateSafeAreaInsets(insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }): void {
    try {
      const rootViewStyle = Application.getRootView()?.style;
      if (!rootViewStyle) {
        this.log.warn(
          "Root view style not available for setting safe area insets"
        );
        return;
      }

      // Set CSS variables using setUnscopedCssVariable (like reference projects)
      // Using camelCase naming convention like --windowInsetLeft, --actionBarHeight
      // Values are set without units (NativeScript uses dip automatically)
      rootViewStyle.setUnscopedCssVariable(
        "--safeAreaInsetTop",
        insets.top + ""
      );
      rootViewStyle.setUnscopedCssVariable(
        "--safeAreaInsetBottom",
        insets.bottom + ""
      );
      rootViewStyle.setUnscopedCssVariable(
        "--safeAreaInsetLeft",
        insets.left + ""
      );
      rootViewStyle.setUnscopedCssVariable(
        "--safeAreaInsetRight",
        insets.right + ""
      );

      // Trigger CSS state change to apply the new variables (pattern from reference projects)
      // This ensures all views using these CSS variables are re-rendered
      const rootView = Application.getRootView();
      if (rootView) {
        rootView._onCssStateChange();
        const rootModalViews = rootView._getRootModalViews();
        if (rootModalViews) {
          rootModalViews.forEach((rootModalView) =>
            rootModalView._onCssStateChange()
          );
        }
      }

      DEV_LOG &&
        this.log.debug("Safe area insets updated:", {
          top: insets.top,
          bottom: insets.bottom,
          left: insets.left,
          right: insets.right,
        });
    } catch (error) {
      // Silent error - inset updates are non-critical
      showError(error, {
        silent: true,
      });
    }
  }
}

export const themeService = new ThemeService();
