/**
 * Application entry point
 * Pattern from reference projects: direct Application events, minimal setup
 */

import "./engine";
import { Application, Device, isAndroid } from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { setLanguageSource } from "@learn6502/ui";
import { Gio, Gtk, registerAdwaita } from "@gjsify/adwaita-nativescript";
import resourceBytes from "../../app-gnome/data/eu.jumplink.Learn6502.data.gresource.xml";
import { systemStates, SystemStates } from "./states";
import { themeService } from "./services";
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

  // The shared widgets ask for the UI language; this V8 has no `Intl` to read it from.
  setLanguageSource(() => Device.language);

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
      themeService.initialize();

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

  // Register the native Adwaita widgets (Adw.ToolbarView / Adw.ViewStack / …) as NS
  // XML elements so the Adwaita shell + screens resolve. Idempotent; no-op off NS.
  registerAdwaita();
  // The icons the shared templates name come from the app's GResource, as on GNOME. Registering
  // the bundle is only half of it: GtkApplication would add `<resource-base-path>/icons/` to the
  // icon theme itself, and without a GtkApplication every app icon draws as `image-missing`.
  Gio.resources_register(Gio.Resource.new_from_data(resourceBytes));
  Gtk.IconTheme.get_for_display(null).add_resource_path("/eu/jumplink/Learn6502/icons");

  Application.setResources({ _: localize });
  Application.run({ moduleName: "app-root" });
} catch (error) {
  // Note: Cannot use showError here as services may not be initialized
  logger.error("App", "Fatal startup error:", error);
}
