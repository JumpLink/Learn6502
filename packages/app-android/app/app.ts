/**
 * Application entry point
 *
 * Pattern from reference projects:
 * - Uses DEV_LOG for conditional logging
 * - Global error handling
 * - Sequential service initialization
 * - Edge-to-edge display support
 */

import { Application, LaunchEventData, isAndroid } from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { setEdgeToEdge } from "./utils/index";
import { systemStates, SystemStates } from "./states";
import { ThemeService } from "./services";
import { appVariables } from "./variables";

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
  DEV_LOG && console.log("App.ts starting...");

  // Handle the launch event
  systemStates.events.on(SystemStates.launchEvent, (_args: LaunchEventData) => {
    DEV_LOG && console.log("Launch event received, setting up the app...");

    try {
      // Set edge-to-edge display
      setEdgeToEdge(true);

      // Initialize app variables (window insets, action bar height, etc.)
      appVariables.initialize();

      // Initialize theme service
      DEV_LOG && console.log("Initializing theme service...");
      ThemeService.initialize();

      DEV_LOG && console.log("App initialization complete");
    } catch (error) {
      console.error("Error during app initialization:", error);
    }
  });

  // Log when the application is actually running
  Application.on(Application.resumeEvent, () => {
    DEV_LOG && console.log("Application resumed");
  });

  // Set localization resources
  DEV_LOG && console.log("Setting application resources...");
  Application.setResources({ _: localize });

  // Start the application
  DEV_LOG && console.log("Starting application...");
  Application.run({ moduleName: "app-root" });
} catch (error) {
  console.error("Fatal error during app startup:", error);
}
