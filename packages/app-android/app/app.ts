import { Application, LaunchEventData, isAndroid } from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { setEdgeToEdge } from "./utils/index";
import { systemStates, SystemStates } from "./states";
import { ThemeService } from "./services";

if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

// Add global error handling
global.__errorHandler = function (error, nativeError) {
  console.log("GLOBAL ERROR CAUGHT:");
  console.log("JS Error:", error && error.message);
  if (nativeError) {
    console.log("Native Error:", nativeError);
  }
  return true;
};

// Initial startup logging
console.log("App.ts starting...");
console.log("Is Android:", isAndroid);

// Handle the launch event
systemStates.events.on(SystemStates.launchEvent, (_args: LaunchEventData) => {
  console.log("Launch event received, setting up the app...");

  try {
    // Set edge-to-edge display
    setEdgeToEdge(true);

    // Initialize theme manager when the app is ready
    console.log("About to initialize theme manager...");

    // TODO: Fix app freezing when initializing theme manager
    const themeService = ThemeService.initialize();
    // console.log("Theme manager initialized:", themeService !== null);

    console.log("App initialization complete");
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});

// Log when the application is actually running
Application.on(Application.resumeEvent, () => {
  console.log("Application resumed (main activity is running)");
});

console.log("Setting application resources...");
Application.setResources({ _: localize });
console.log("Starting application...");
Application.run({ moduleName: "app-root" });
