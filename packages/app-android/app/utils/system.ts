/**
 * System utilities for Android
 *
 * Provides helper functions for:
 * - App restart functionality
 *
 * Note: Status bar and navigation bar customization is handled by NativeScript's
 * built-in Utils.android.setStatusBarColor/setNavigationBarColor methods.
 * Edge-to-edge window setup is handled automatically by NativeScript in onActivityCreated.
 */

import { Application, Utils } from "@nativescript/core";
import { waitForFunctionResult } from "@learn6502/common-ui";
import { logger } from "./logger";

// Scoped logger for system utilities
const log = logger.scoped("System");

/**
 * Restarts the entire Android application.
 * Useful when runtime adaptation to system setting changes (e.g., theme, locale) is not feasible.
 */
export function restartApp(): void {
  try {
    const context = Utils.android.getApplicationContext();
    if (!context) {
      log.error("Restart failed: Could not get application context");
      return;
    }

    const packageManager = context.getPackageManager();
    const packageName = context.getPackageName();
    // Intent to launch the main activity
    const intent = packageManager.getLaunchIntentForPackage(packageName);
    if (!intent) {
      log.error("Restart failed: Could not get launch intent");
      return;
    }

    // Use flags to clear the existing task and start a new one
    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK | android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK);

    // Start the main activity
    context.startActivity(intent);

    log.debug("Triggering app restart...");

    // Terminate the current application process
    // Use killProcess for a slightly more forceful exit than System.exit
    android.os.Process.killProcess(android.os.Process.myPid());
  } catch (error) {
    log.error("Error restarting application:", error);
  }
}

/**
 * Wait for the root view to be ready and return it
 * Uses waitForFunctionResult from common-ui to handle async root view availability
 */
export async function getRootViewWhenReady() {
  try {
    const rootView = await waitForFunctionResult(Application.getRootView.bind(Application));
    log.debug("Root view is ready:", rootView);
    return rootView;
  } catch (error) {
    log.error("Failed to get root view:", error);
    return null;
  }
}
