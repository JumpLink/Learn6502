/**
 * Application entry point
 * Pattern from reference projects: direct Application events, minimal setup
 */

import {
  Application,
  LaunchEventData,
  isAndroid,
  Utils,
  Color,
} from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { systemStates, SystemStates } from "./states";
import { ThemeService } from "./services";
import { appVariables } from "./variables";
import { setupBackButtonHandler } from "./utils/navigation";

if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

try {
  global.__errorHandler = function (error, nativeError) {
    console.error("GLOBAL ERROR CAUGHT:", error?.message, nativeError);
    return true;
  };

  DEV_LOG && console.log("[App] Starting...");

  // Configure edge-to-edge (NativeScript automatically calls enableEdgeToEdge in onActivityCreated)
  if (Application.android?.activityCreatedEvent) {
    Application.android.on(Application.android.activityCreatedEvent, (event: any) => {
      if (event?.activity) {
        try {
          Utils.android.setStatusBarColor({
            activity: event.activity,
            lightColor: new Color("#FFFFFF"),
            darkColor: new Color("#000000"),
          });
          Utils.android.setNavigationBarColor({
            activity: event.activity,
            lightColor: new Color("#FFFFFF"),
            darkColor: new Color("#000000"),
          });
          Utils.android.setDarkModeHandler({
            activity: event.activity,
            handler: (bar, resources) => {
              const isDarkMode =
                (resources.getConfiguration().uiMode &
                  android.content.res.Configuration.UI_MODE_NIGHT_MASK) ===
                android.content.res.Configuration.UI_MODE_NIGHT_YES;
              return !isDarkMode; // Dark icons for light mode
            },
          });
        } catch (error) {
          console.error("[App] Error configuring edge-to-edge:", error);
        }
      }
    });
  }

  systemStates.events.on(SystemStates.launchEvent, () => {
    try {
      appVariables.initialize();
      ThemeService.initialize();
      setupBackButtonHandler();
    } catch (error) {
      console.error("[App] Error during initialization:", error);
    }
  });

  Application.setResources({ _: localize });
  Application.run({ moduleName: "app-root" });
} catch (error) {
  console.error("[App] Fatal error during startup:", error);
}
