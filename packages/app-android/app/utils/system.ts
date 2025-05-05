import { Application, Utils, View, CoreTypes } from "@nativescript/core";
import { getMaterialColor } from "./color";
import { waitForFunctionResult } from "./control";
import androidx_core_view_WindowCompat = androidx.core.view.WindowCompat;

export function isDarkMode(): boolean {
  return Application.systemAppearance() === "dark";
}

/**
 * Sets the status bar background color and icon color
 * @param backgroundColor Color to set as status bar background
 * @param useLightIcons Whether to use light colored icons (true for dark backgrounds)
 */
export function setStatusBarAppearance(
  backgroundColor?: number | string,
  useLightIcons: boolean = isDarkMode(),
  context: android.content.Context = Utils.android.getApplicationContext()
): void {
  try {
    // Convert color name to color value if provided
    backgroundColor =
      typeof backgroundColor === "string"
        ? getMaterialColor(backgroundColor, context)
        : backgroundColor;
    const window = Application.android.startActivity.getWindow();
    if (!window) return;

    // Set background color if provided, otherwise use default surface color
    if (backgroundColor !== undefined) {
      window.setStatusBarColor(backgroundColor);
    } else {
      const colorSurface = getMaterialColor("surface", context);
      window.setStatusBarColor(colorSurface);
    }

    // Use parameter if provided, otherwise infer from system appearance
    const shouldUseLightIcons =
      useLightIcons !== undefined
        ? useLightIcons
        : Application.systemAppearance() === "dark";

    // Using WindowInsetsController for Android 11+ (API 30+)
    if (android.os.Build.VERSION.SDK_INT >= 30) {
      const controller = window.getDecorView().getWindowInsetsController();
      if (!controller) return;

      const statusBarAppearance = shouldUseLightIcons
        ? 0
        : android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS;

      controller.setSystemBarsAppearance(
        statusBarAppearance,
        android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
      );
    } else {
      // Backward compatibility for Android < 11
      const decorView = window.getDecorView();
      let flags = decorView.getSystemUiVisibility();

      if (!shouldUseLightIcons) {
        // Dark icons on light background
        flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      } else {
        // Light icons on dark background
        flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      }

      decorView.setSystemUiVisibility(flags);
    }
  } catch (error) {
    console.error("Error setting status bar appearance:", error);
  }
}

/**
 * Sets the navigation bar background color and icon color
 * @param backgroundColor Color to set as navigation bar background
 * @param useLightIcons Whether to use light colored icons (true for dark backgrounds)
 */
export function setNavigationBarAppearance(
  backgroundColor?: number | string,
  useLightIcons: boolean = isDarkMode(),
  context: android.content.Context = Utils.android.getApplicationContext()
): void {
  try {
    // Convert color name to color value if provided
    backgroundColor =
      typeof backgroundColor === "string"
        ? getMaterialColor(backgroundColor, context)
        : backgroundColor;
    const window = Application.android.startActivity.getWindow();
    if (!window) return;

    // Set background color if provided, otherwise use default surface container color
    if (backgroundColor !== undefined) {
      window.setNavigationBarColor(backgroundColor);
    }

    // Use parameter if provided, otherwise infer from system appearance
    const shouldUseLightIcons =
      useLightIcons !== undefined
        ? useLightIcons
        : Application.systemAppearance() === "dark";

    // Using WindowInsetsController for Android 11+ (API 30+)
    if (android.os.Build.VERSION.SDK_INT >= 30) {
      const controller = window.getDecorView().getWindowInsetsController();
      if (!controller) return;

      const navigationBarAppearance = shouldUseLightIcons
        ? 0
        : android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;

      controller.setSystemBarsAppearance(
        navigationBarAppearance,
        android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
      );
    } else if (android.os.Build.VERSION.SDK_INT >= 27) {
      // Backward compatibility for Android 8.1+ (API 27+)
      const decorView = window.getDecorView();
      let flags = decorView.getSystemUiVisibility();

      if (!shouldUseLightIcons) {
        // Dark icons on light background
        flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
      } else {
        // Light icons on dark background
        flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
      }

      decorView.setSystemUiVisibility(flags);
    }
    // For Android < 8.1, navigation bar appearance customization is not supported
  } catch (error) {
    console.error("Error setting navigation bar appearance:", error);
  }
}

/**
 * Gets the current font scale factor from the device configuration.
 * Values > 1.0 indicate larger text for accessibility.
 * @returns {number} The font scale factor (1.0 is normal size)
 */
export function getFontScale(): number {
  try {
    const context = Utils.android.getApplicationContext();
    if (!context) return 1.0;

    const configuration = context.getResources().getConfiguration();
    return configuration.fontScale || 1.0;
  } catch (error) {
    console.error("Error getting font scale:", error);
    return 1.0;
  }
}

/**
 * Enables or disables Edge-to-Edge display mode for the application.
 * When enabled, the app draws behind the system status and navigation bars.
 * When disabled (default Android behavior), the system adds padding automatically.
 * @param enabled Set to true to enable Edge-to-Edge, false to disable it.
 */
export function setEdgeToEdge(enabled: boolean): void {
  try {
    // Ensure we run on the UI thread if called early during startup
    Utils.executeOnUIThread(() => {
      const activity =
        Application.android.startActivity ||
        Application.android.foregroundActivity;
      if (!activity) {
        console.error("setEdgeToEdge: Could not get Activity object.");
        return;
      }
      const window = activity.getWindow();
      if (!window) {
        console.error("setEdgeToEdge: Could not get Window object.");
        return;
      }
      // Tell the system whether the app will handle drawing behind system bars
      // setDecorFitsSystemWindows(window, false) -> enables edge-to-edge
      // setDecorFitsSystemWindows(window, true)  -> disables edge-to-edge (system handles padding)
      androidx_core_view_WindowCompat.setDecorFitsSystemWindows(
        window,
        !enabled
      );
      console.log(`Edge-to-Edge display ${enabled ? "enabled" : "disabled"}.`);
    });
  } catch (error) {
    console.error(`Error setting Edge-to-Edge to ${enabled}:`, error);
  }
}

/**
 * Restarts the entire Android application.
 * Useful when runtime adaptation to system setting changes (e.g., theme, locale) is not feasible.
 */
export function restartApp(): void {
  try {
    const context = Utils.android.getApplicationContext();
    if (!context) {
      console.error("Restart failed: Could not get application context.");
      return;
    }

    const packageManager = context.getPackageManager();
    const packageName = context.getPackageName();
    // Intent to launch the main activity
    const intent = packageManager.getLaunchIntentForPackage(packageName);
    if (!intent) {
      console.error("Restart failed: Could not get launch intent.");
      return;
    }

    // Use flags to clear the existing task and start a new one
    intent.addFlags(
      android.content.Intent.FLAG_ACTIVITY_NEW_TASK |
        android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
    );

    // Start the main activity
    context.startActivity(intent);

    console.log("Triggering app restart...");

    // Terminate the current application process
    // Use killProcess for a slightly more forceful exit than System.exit
    android.os.Process.killProcess(android.os.Process.myPid());
  } catch (error) {
    console.error("Error restarting application:", error);
  }
}

export async function getRootViewWhenReady() {
  try {
    const rootView = await waitForFunctionResult(
      Application.getRootView.bind(Application)
    );
    console.log("Root view is ready:", rootView);
    return rootView;
  } catch (error) {
    console.error("Failed to get root view:", error);
  }
}
