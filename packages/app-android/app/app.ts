/**
 * Application entry point
 * Pattern from reference projects: direct Application events, minimal setup
 */

import { Application, isAndroid } from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { systemStates, SystemStates } from "./states";
import { ThemeService } from "./services";
import { appVariables } from "./variables";
import { setupBackButtonHandler } from "./utils/navigation";
import { setupGlobalErrorHandler, showError } from "./utils/error-handler";
import { logger } from "./utils";

if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

try {
  // Setup global error handler
  setupGlobalErrorHandler();

  logger.debug("App", "Starting...");

  // Service initialization pattern from reference projects
  let servicesInitialized = false;

  async function initializeServices() {
    if (servicesInitialized) {
      return;
    }

    try {
      logger.debug("App", "Initializing services...");

      // Initialize app variables first (synchronous)
      appVariables.initialize();

      // Initialize services sequentially
      ThemeService.initialize();

      // Setup navigation handlers
      setupBackButtonHandler();

      servicesInitialized = true;
      logger.debug("App", "Services initialized");
    } catch (error) {
      await showError(error, {
        forcedMessage: "Failed to initialize application services",
        showAsNotification: true,
      });
    }
  }

  systemStates.events.on(SystemStates.launchEvent, async () => {
    await initializeServices();
  });

  Application.setResources({ _: localize });
  Application.run({ moduleName: "app-root" });
} catch (error) {
  // Note: Cannot use showError here as services may not be initialized
  logger.error("App", "Fatal startup error:", error);
}
