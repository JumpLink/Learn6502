/**
 * Application entry point
 * Pattern from reference projects: direct Application events, minimal setup
 */

import "./engine";
import { Application, isAndroid } from "@nativescript/core";
import { androidLaunchEventLocalizationHandler, localize } from "@nativescript/localize";
import { initLocale } from "@gjsify/adwaita-app/locale";
import { Adw, registerAdwaita } from "@gjsify/adwaita-nativescript";
import type GjsAdw from "@girs/adw-1";
import { initResources } from "./resources";
import { appVariables } from "./variables";
import { setupGlobalErrorHandler, showError } from "./utils/error-handler";
import { logger } from "./utils";
import { APPLICATION_ID } from "./constants";
import { MainWindow, setTranslator, settings, themeService } from "@learn6502/ui";
import { registerMainWindowPlatform } from "./views/main-window-platform";

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

      servicesInitialized = true;
      logger.debug("App", "Services initialized");
    } catch (error) {
      await showError(error, {
        forcedMessage: "Failed to initialize application services",
        showAsNotification: true,
      });
    }
  }

  // The shared UI strings: GLib gettext over the staged `.mo`, following the system locale.
  // Before anything asks GLib for a string: it decides once whether the default domain translates.
  setTranslator(initLocale(APPLICATION_ID));

  // Register the native Adwaita widgets (Adw.ToolbarView / Adw.ViewStack / …) as NS
  // XML elements so the Adwaita shell + screens resolve. Idempotent; no-op off NS.
  registerAdwaita();
  initResources();

  Application.setResources({ _: localize });

  const application = new Adw.Application({ application_id: APPLICATION_ID });
  application.connect("startup", () => {
    androidLaunchEventLocalizationHandler();
    void initializeServices();
  });
  application.connect("activate", () => {
    registerMainWindowPlatform();
    themeService.init(settings);
    new MainWindow(application as unknown as GjsAdw.Application);
  });
  void application.runAsync([]).catch((error) => logger.error("App", "Application failed:", error));
} catch (error) {
  // Note: Cannot use showError here as services may not be initialized
  logger.error("App", "Fatal startup error:", error);
}
