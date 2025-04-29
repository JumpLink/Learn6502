import { Application, Utils } from '@nativescript/core';
import { getColor } from './color';

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
        } else {
            const colorSurfaceContainer = getColor("md_theme_surfaceContainer", context);
            window.setNavigationBarColor(colorSurfaceContainer);
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
