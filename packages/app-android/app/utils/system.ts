import { Application, Utils, View, CoreTypes } from '@nativescript/core';
import { getColor } from './color';
import androidx_core_view_WindowCompat = androidx.core.view.WindowCompat;

export function isDarkMode(): boolean {
  return Application.systemAppearance() === 'dark';
}

/**
 * Sets the status bar background color and icon color
 * @param backgroundColor Color to set as status bar background
 * @param useLightIcons Whether to use light colored icons (true for dark backgrounds)
 */
export function setStatusBarAppearance(backgroundColor?: number | string, useLightIcons: boolean = isDarkMode(), context: android.content.Context = Utils.android.getApplicationContext()): void {
    try {
        // Convert color name to color value if provided
        backgroundColor = typeof backgroundColor === 'string' ? getColor(backgroundColor, context) : backgroundColor;
        const window = Application.android.startActivity.getWindow();
        if (!window) return;

        // Set background color if provided, otherwise use default surface color
        if (backgroundColor !== undefined) {
            window.setStatusBarColor(backgroundColor);
        } else {
            const colorSurface = getColor("md_theme_surface", context);
            window.setStatusBarColor(colorSurface);
        }

        // Use parameter if provided, otherwise infer from system appearance
        const shouldUseLightIcons = useLightIcons !== undefined
            ? useLightIcons
            : Application.systemAppearance() === 'dark';

        // Using WindowInsetsController for Android 11+ (API 30+)
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            const controller = window.getDecorView().getWindowInsetsController();
            if (!controller) return;

            const statusBarAppearance = shouldUseLightIcons ? 0 : android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS;

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
        console.error('Error setting status bar appearance:', error);
    }
}

/**
 * Sets the navigation bar background color and icon color
 * @param backgroundColor Color to set as navigation bar background
 * @param useLightIcons Whether to use light colored icons (true for dark backgrounds)
 */
export function setNavigationBarAppearance(backgroundColor?: number | string, useLightIcons: boolean = isDarkMode(), context: android.content.Context = Utils.android.getApplicationContext()): void {
    try {
        // Convert color name to color value if provided
        backgroundColor = typeof backgroundColor === 'string' ? getColor(backgroundColor, context) : backgroundColor;
        const window = Application.android.startActivity.getWindow();
        if (!window) return;

        // Set background color if provided, otherwise use default surface container color
        if (backgroundColor !== undefined) {
            window.setNavigationBarColor(backgroundColor);
        }

        // Use parameter if provided, otherwise infer from system appearance
        const shouldUseLightIcons = useLightIcons !== undefined
            ? useLightIcons
            : Application.systemAppearance() === 'dark';

        // Using WindowInsetsController for Android 11+ (API 30+)
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            const controller = window.getDecorView().getWindowInsetsController();
            if (!controller) return;

            const navigationBarAppearance = shouldUseLightIcons ? 0 : android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;

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
        console.error('Error setting navigation bar appearance:', error);
    }
}

export function getInsets(view: View, type: number = android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout(), maxRetries: number = 5): android.graphics.Insets {
  const nativeView = view.android as android.view.View;
  const rootInsets = nativeView.getRootWindowInsets();
  if (!rootInsets) {
    console.warn("getInsets: Could not get RootWindowInsets.");
    if (maxRetries > 0) {
      setTimeout(() => {
        return getInsets(view, type, maxRetries - 1);
      }, 50);
    } else {
      return android.graphics.Insets.NONE;
    }
  }
  return rootInsets.getInsets(type);
}

/**
 * Applies padding to a view based on the system bar and display cutout insets.
 * This should be called on the main content view after enabling Edge-to-Edge.
 * @param view The NativeScript View to apply padding to.
 * @param applyTop Apply padding to the top (default: true).
 * @param applyBottom Apply padding to the bottom (default: true).
 * @param applyLeft Apply padding to the left (default: false).
 * @param applyRight Apply padding to the right (default: false).
 */
export function applySystemBarInsets(view: View, applyTop = true, applyBottom = true, applyLeft = false, applyRight = false, maxRetries: number = 5): void {
    if (!view || !view.android) {
        console.error("applySystemBarInsets: Invalid View or not Android.");
        return;
    }

    // Ensure we have the root view and it's attached to a window
    const nativeView = view.android as android.view.View;

    if(typeof nativeView.isAttachedToWindow !== 'function') {
      console.error('applySystemBarInsets: Wrong view', nativeView);
      throw new Error('applySystemBarInsets: Wrong view');
    }

    if (maxRetries > 0 && (!nativeView || !nativeView.isAttachedToWindow())) {
        console.log('applySystemBarInsets: Not attached to window, try again...');
        // If not attached, try again slightly later. This might happen if called too early.
        setTimeout(() => applySystemBarInsets(view, applyTop, applyBottom, applyLeft, applyRight, maxRetries - 1), 50);
        return;
    }

    try {
        const insets = getInsets(view);

        console.log('applySystemBarInsets', insets);

        const topPx = applyTop ? insets.top : nativeView.getPaddingTop();
        const bottomPx = applyBottom ? insets.bottom : nativeView.getPaddingBottom();
        const leftPx = applyLeft ? insets.left : nativeView.getPaddingLeft();
        const rightPx = applyRight ? insets.right : nativeView.getPaddingRight();

        // Apply padding in device pixels
        nativeView.setPadding(leftPx, topPx, rightPx, bottomPx);
        console.log(`Applied Insets - Top: ${topPx}, Bottom: ${bottomPx}, Left: ${leftPx}, Right: ${rightPx}`);

    } catch (error) {
        console.error("Error applying system bar insets:", error);
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
        console.error('Error getting font scale:', error);
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
          const activity = Application.android.startActivity || Application.android.foregroundActivity;
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
          androidx_core_view_WindowCompat.setDecorFitsSystemWindows(window, !enabled);
          console.log(`Edge-to-Edge display ${enabled ? 'enabled' : 'disabled'}.`);
      });
  } catch (error) {
      console.error(`Error setting Edge-to-Edge to ${enabled}:`, error);
  }
}
