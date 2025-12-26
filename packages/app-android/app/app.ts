/**
 * Application entry point
 *
 * Pattern from reference projects:
 * - Centralized logger for conditional logging
 * - Global error handling
 * - Sequential service initialization
 */

import { Application, LaunchEventData, isAndroid } from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { logger } from "./utils/index";
import { systemStates, SystemStates } from "./states";
import { ThemeService } from "./services";
import { appVariables } from "./variables";

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

  // Handle the launch event
  systemStates.events.on(SystemStates.launchEvent, (_args: LaunchEventData) => {
    log.info("Launch event received, setting up the app...");

    try {
      // Initialize app variables (action bar height, screen dimensions, etc.)
      appVariables.initialize();

      // Initialize theme service
      log.debug("Initializing theme service...");
      ThemeService.initialize();

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
