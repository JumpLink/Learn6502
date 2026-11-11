/**
 * Application entry point
 * Pattern from reference projects: direct Application events, minimal setup
 */

import "./engine";
import { isAndroid, isIOS } from "@nativescript/core";
import { initLocale } from "@gjsify/adwaita-app/locale";
import { Adw, registerAdwaita } from "@gjsify/adwaita-nativescript";
import { registerAppScaleCss } from "@gjsify/adwaita-nativescript/app-scale";
// The processed stylesheet, so the interface scale reaches the app's own rules too, not only
// the Adwaita theme. `?inline` and not `?raw`: Tailwind expanded and `@import`s inlined.
import appCss from "./app.css?inline";
import type GjsAdw from "@girs/adw-1";
import { initResources } from "./resources";
import { setupGlobalErrorHandler } from "./utils/error-handler";
import { APPLICATION_ID } from "./constants";
import { MainWindow, setTranslator, settings, themeService } from "@learn6502/ui";
import { registerMainWindowPlatform } from "./views/main-window-platform";
import { interfaceScaleService } from "./services/interface-scale.service";

if (!isAndroid && !isIOS) {
  throw new Error("This app is only supported on Android and iOS");
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
    // After NativeScript has applied `app.css`: an override appended first loses on position.
    registerAppScaleCss(appCss);
    // The learner's own factor, if they set one, before the first window is built.
    interfaceScaleService.init(settings);
    themeService.init(settings);
    new MainWindow(application as unknown as GjsAdw.Application);
  });
  void application.runAsync([]).catch((error) => console.error("[App]", "Application failed:", error));
} catch (error) {
  // Note: Cannot use showError here as services may not be initialized
  console.error("[App]", "Fatal startup error:", error);
}
