/**
 * System utilities for Android
 *
 * Provides helper functions for:
 * - App restart functionality
 * - Font scale detection
 * - Type guards for NativeScript activities
 *
 * Note: Status bar and navigation bar customization is handled by NativeScript's
 * built-in Utils.android.setStatusBarColor/setNavigationBarColor methods.
 */

import { Application, Utils } from "@nativescript/core";
import { logger } from "./logger";
import { waitForFunctionResult } from "@learn6502/common-ui";
import { systemStates } from "../states/system.states";
import { appVariables } from "../variables";

// Note: Edge-to-edge window setup is handled automatically by NativeScript
// We only need system utilities here (status bar, navigation bar appearance, etc.)

const log = logger.scoped("System");

/**
 * Type guard to check if an activity is a NativeScript activity
 * This provides type-safe checking for the isNativeScriptActivity property
 */
export function isNativeScriptActivity(
  activity: any
): activity is androidx.appcompat.app.AppCompatActivity & {
  isNativeScriptActivity: true;
} {
  return (
    activity != null &&
    typeof activity === "object" &&
    activity.isNativeScriptActivity === true
  );
}

/**
 * Check if the system is currently in dark mode
 */
export function isDarkMode(): boolean {
  return systemStates.systemAppearance === "dark";
}

/**
 * Note: Status bar and navigation bar icon colors are automatically handled by NativeScript's
 * setStatusBarColor/setNavigationBarColor with SystemBarStyle.auto().
 * These methods automatically determine light/dark icons based on the provided colors.
 * See: references/nativescript/nativescript/packages/core/utils/native-helper-for-android.ts
 */

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

/**
 * Note: Edge-to-edge is automatically enabled by NativeScript in onActivityCreated
 * See: references/nativescript/nativescript/packages/core/application/application.android.ts:71
 * We configure colors via Utils.android.setStatusBarColor/setNavigationBarColor in app.ts
 */
