/**
 * Contrast utility functions
 */

import { ContrastMode } from "../constants";

/**
 * Map Android UiModeManager contrast level values to ContrastMode enum
 * @param contrastLevel - Android UiModeManager contrast level (0, 0.5, or 1)
 * @returns The corresponding ContrastMode
 */
export function contrastLevelToMode(contrastLevel: number): ContrastMode {
  if (contrastLevel === 1) {
    return ContrastMode.HIGH;
  } else if (contrastLevel === 0.5) {
    return ContrastMode.MEDIUM;
  }
  return ContrastMode.NORMAL;
}
