/**
 * System utilities for Android
 *
 * Provides helper functions for:
 * - Status bar and navigation bar customization
 * - Edge-to-edge display mode
 * - App restart functionality
 * - Font scale detection
 */

import { Application, Utils } from "@nativescript/core";
import { logger } from "./logger";
import { waitForFunctionResult } from "@learn6502/common-ui";
import { systemStates } from "../states/system.states";

// Import necessary AndroidX classes for Edge-to-Edge
import androidx_core_view_WindowCompat = androidx.core.view.WindowCompat;

const log = logger.scoped("System");

/**
 * Check if the system is currently in dark mode
 */
export function isDarkMode(): boolean {
  return systemStates.systemAppearance === "dark";
}

/**
 * Sets the status bar icon color (light/dark icons)
 *
 * @param useLightIcons Whether to use light colored icons (true for dark backgrounds)
 */
export function setStatusBarAppearance(
  useLightIcons: boolean = isDarkMode()
): void {
  try {
    const window = Application.android.startActivity?.getWindow();
    if (!window) return;

    // Using WindowInsetsController for Android 11+ (API 30+)
    if (android.os.Build.VERSION.SDK_INT >= 30) {
      const controller = window.getDecorView().getWindowInsetsController();
      if (!controller) return;

      const statusBarAppearance = useLightIcons
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

      if (!useLightIcons) {
        // Dark icons on light background
        flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      } else {
        // Light icons on dark background
        flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      }

      decorView.setSystemUiVisibility(flags);
    }
  } catch (error) {
    log.error("Error setting status bar appearance:", error);
  }
}

/**
 * Sets the navigation bar icon color (light/dark icons)
 *
 * @param useLightIcons Whether to use light colored icons (true for dark backgrounds)
 */
export function setNavigationBarAppearance(
  useLightIcons: boolean = isDarkMode()
): void {
  try {
    const window = Application.android.startActivity?.getWindow();
    if (!window) return;

    // Using WindowInsetsController for Android 11+ (API 30+)
    if (android.os.Build.VERSION.SDK_INT >= 30) {
      const controller = window.getDecorView().getWindowInsetsController();
      if (!controller) return;

      const navigationBarAppearance = useLightIcons
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

      if (!useLightIcons) {
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
    log.error("Error setting navigation bar appearance:", error);
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
      console.error("Restart failed: Could not get application context");
      return;
    }

    const packageManager = context.getPackageManager();
    const packageName = context.getPackageName();
    // Intent to launch the main activity
    const intent = packageManager.getLaunchIntentForPackage(packageName);
    if (!intent) {
      console.error("Restart failed: Could not get launch intent");
      return;
    }

    // Use flags to clear the existing task and start a new one
    intent.addFlags(
      android.content.Intent.FLAG_ACTIVITY_NEW_TASK |
        android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
    );

    // Start the main activity
    context.startActivity(intent);

    log.info("Triggering app restart...");

    // Terminate the current application process
    // Use killProcess for a slightly more forceful exit than System.exit
    android.os.Process.killProcess(android.os.Process.myPid());
  } catch (error) {
    console.error("Error restarting application:", error);
  }
}

/**
 * Wait for the root view to be ready and return it
 */
export async function getRootViewWhenReady() {
  try {
    const rootView = await waitForFunctionResult(
      Application.getRootView.bind(Application)
    );
    log.debug("Root view is ready:", rootView);
    return rootView;
  } catch (error) {
    console.error("Failed to get root view:", error);
  }
}
