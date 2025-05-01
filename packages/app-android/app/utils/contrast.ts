import { Application, Utils } from "@nativescript/core";

/**
 * Describes the system contrast mode
 */
export enum ContrastMode {
  NORMAL = "normal",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * Determines the current Android system contrast setting using UiModeManager.
 * Requires Android API level 34+.
 *
 * @returns {ContrastMode} The current contrast mode (NORMAL, MEDIUM, or HIGH).
 *                         Returns NORMAL on older APIs or if an error occurs.
 */
export function getContrastMode(): ContrastMode {
  // Check if the API level is sufficient (API 34+)
  if (android.os.Build.VERSION.SDK_INT < 34) {
    console.warn(
      "UiModeManager.getContrast() requires API level 34+. Falling back to NORMAL."
    );
    return ContrastMode.NORMAL;
  }

  try {
    const context = Utils.android.getApplicationContext();
    if (!context) {
      console.error("Could not get application context.");
      return ContrastMode.NORMAL;
    }

    // Get the UiModeManager system service
    const uiModeManager = context.getSystemService(
      android.content.Context.UI_MODE_SERVICE
    ) as android.app.UiModeManager;

    if (!uiModeManager) {
      console.error("Could not get UiModeManager service.");
      return ContrastMode.NORMAL;
    }

    // Get the contrast level (-1.0 to 1.0)
    // Use `any` assertion because TypeScript definitions might lack getContrast()
    const contrastLevel = uiModeManager.getContrast();

    console.log("System contrast level:", contrastLevel);

    // Map the float value to the enum
    // Note: The exact mapping for MEDIUM might need adjustment based on testing,
    // as the API only guarantees -1 (min), 0 (default), 1 (max).
    // We'll tentatively map > 0 to HIGH, 0 to NORMAL, < 0 to MEDIUM.
    if (contrastLevel > 0) {
      return ContrastMode.HIGH;
    } else if (contrastLevel < 0) {
      // Consider if '< 0' should map to MEDIUM or if it should be grouped with NORMAL
      // if the system only explicitly supports default and high.
      // Let's start by mapping it to MEDIUM.
      return ContrastMode.MEDIUM;
    } else {
      // contrastLevel === 0 or potentially other values if API changes
      return ContrastMode.NORMAL;
    }
  } catch (error) {
    console.error(
      "Error determining contrast mode using UiModeManager:",
      error
    );
    return ContrastMode.NORMAL; // Fallback on error
  }
}
