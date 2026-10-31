/**
 * Application entry point
 * Pattern from reference projects: direct Application events, minimal setup
 */

import "./engine";
import { isAndroid } from "@nativescript/core";
import { initLocale } from "@gjsify/adwaita-app/locale";
import { Adw, registerAdwaita } from "@gjsify/adwaita-nativescript";
import type GjsAdw from "@girs/adw-1";
import { initResources } from "./resources";
import { setupGlobalErrorHandler } from "./utils/error-handler";
import { APPLICATION_ID } from "./constants";
import { MainWindow, setTranslator, settings, themeService } from "@learn6502/ui";
import { registerMainWindowPlatform } from "./views/main-window-platform";

if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

try {
  // Setup global error handler
  setupGlobalErrorHandler();

  // The shared UI strings: GLib gettext over the staged `.mo`, following the system locale.
  // Before anything asks GLib for a string: it decides once whether the default domain translates.
  setTranslator(initLocale(APPLICATION_ID));

  // Register the native Adwaita widgets (Adw.ToolbarView / Adw.ViewStack / …) as NS
  // XML elements so the Adwaita shell + screens resolve. Idempotent; no-op off NS.
  registerAdwaita();
  initResources();

  const application = new Adw.Application({ application_id: APPLICATION_ID });
  application.connect("activate", () => {
    registerMainWindowPlatform();
    themeService.init(settings);
    new MainWindow(application as unknown as GjsAdw.Application);
  });
  void application.runAsync([]).catch((error) => console.error("[App]", "Application failed:", error));
} catch (error) {
  // Note: Cannot use showError here as services may not be initialized
  console.error("[App]", "Fatal startup error:", error);
}
