/**
 * Application entry point
 *
 * Pattern from reference projects:
 * - Centralized logger for conditional logging
 * - Global error handling
 * - Sequential service initialization
 * - Direct use of NativeScript Application events (no wrapper services)
 */

import {
  Application,
  LaunchEventData,
  isAndroid,
  Utils,
  Color,
} from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { logger } from "./utils/index";
import { systemStates, SystemStates } from "./states";
import { ThemeService } from "./services";
import { appVariables } from "./variables";
import { setupBackButtonHandler } from "./utils/navigation";

const log = logger.scoped("App");

// Ensure Android-only execution
if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

try {
  // Add global error handling
  global.__errorHandler = function (error, nativeError) {
    console.error("GLOBAL ERROR CAUGHT:");
    console.error("JS Error:", error && error.message);
    if (nativeError) {
      console.error("Native Error:", nativeError);
    }
    return true;
  };

  // Initial startup logging
  log.info("Starting...");

  // Configure edge-to-edge colors using NativeScript's built-in methods
  //
  // NativeScript automatically calls enableEdgeToEdge() in onActivityCreated
  // See: references/nativescript/nativescript/packages/core/application/application.android.ts:71
  //
  // We use setStatusBarColor, setNavigationBarColor, and setDarkModeHandler to configure
  // the colors and automatically handle icon appearance based on theme.
  // These methods internally call enableEdgeToEdge with the specified colors.
  //
  // Pattern: Use setStatusBarColor/setNavigationBarColor with setDarkModeHandler
  // See: https://docs.nativescript.org/core/utils#enableedgetoedge
  if (Application.android?.activityCreatedEvent) {
    Application.android.on(
      Application.android.activityCreatedEvent,
      (event: any) => {
        if (event?.activity) {
          log.debug("Activity created - configuring edge-to-edge colors");
          try {
            // Configure status bar and navigation bar colors
            // SystemBarStyle.auto() will automatically determine icon colors based on these colors
            Utils.android.setStatusBarColor({
              activity: event.activity,
              lightColor: new Color("#FFFFFF"), // Light background color
              darkColor: new Color("#000000"), // Dark background color
            });
            Utils.android.setNavigationBarColor({
              activity: event.activity,
              lightColor: new Color("#FFFFFF"), // Light background color
              darkColor: new Color("#000000"), // Dark background color
            });

            // Set dark mode handler to automatically adjust icon colors based on theme
            // Handler returns true for dark icons (light theme), false for light icons (dark theme)
            // This automatically reacts to theme changes without manual intervention
            Utils.android.setDarkModeHandler({
              activity: event.activity,
              handler: (
                bar: "status" | "navigation",
                resources: android.content.res.Resources
              ) => {
                // Return true if we want dark icons (for light backgrounds)
                // Return false if we want light icons (for dark backgrounds)
                // Check if system is in dark mode via configuration
                const isDarkMode =
                  (resources.getConfiguration().uiMode &
                    android.content.res.Configuration.UI_MODE_NIGHT_MASK) ===
                  android.content.res.Configuration.UI_MODE_NIGHT_YES;
                // Dark icons for light mode, light icons for dark mode
                return !isDarkMode;
              },
            });

            log.debug("Edge-to-edge colors and dark mode handler configured");
          } catch (error) {
            log.error("Error configuring edge-to-edge colors:", error);
          }
        }
      }
    );
  }

  // Handle the launch event
  systemStates.events.on(SystemStates.launchEvent, (_args: LaunchEventData) => {
    log.info("Launch event received, setting up the app...");

    try {
      // Initialize app variables (action bar height, screen dimensions, etc.)
      appVariables.initialize();

      // Initialize theme service
      log.debug("Initializing theme service...");
      ThemeService.initialize();

      // Setup back button handler
      log.debug("Setting up back button handler...");
      setupBackButtonHandler();

      log.info("App initialization complete");
    } catch (error) {
      console.error("Error during app initialization:", error);
    }
  });

  // Set localization resources
  log.debug("Setting application resources...");
  Application.setResources({ _: localize });

  // Start the application
  log.info("Starting application...");
  Application.run({ moduleName: "app-root" });
} catch (error) {
  console.error("Fatal error during app startup:", error);
}
