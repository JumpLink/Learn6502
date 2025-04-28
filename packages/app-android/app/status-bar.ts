import { Application, type SystemAppearanceChangedEventData, Utils } from '@nativescript/core'
import { lifecycleEvents } from './utils/lifecycle';
import { getColor } from './utils/color';

const onSystemAppearanceChanged = (event: SystemAppearanceChangedEventData): void => {
    console.log('StatusBar: systemAppearanceChangedEvent', event.newValue);

    const isDarkMode = event.newValue === 'dark';
    updateStatusBarForTheme(isDarkMode);
}

function updateStatusBarForTheme(isDarkMode: boolean): void {
    try {
        const window = Application.android.startActivity.getWindow();
        if (!window) return;

        const context = Utils.android.getApplicationContext();
        const colorSurface = getColor(context, "md_theme_surface");
        const colorSurfaceContainer = getColor(context, "md_theme_surfaceContainer");

        window.setStatusBarColor(colorSurface);
        window.setNavigationBarColor(colorSurfaceContainer);

        // Using WindowInsetsController for Android 11+ (API 30+)
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            const controller = window.getDecorView().getWindowInsetsController();
            if (!controller) {
                console.log('No controller');
                return;
            }

            let statusBarAppearance = isDarkMode ? 0 : android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS;
            let navigationBarAppearance = isDarkMode ? 0 : android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;

            controller.setSystemBarsAppearance(
              statusBarAppearance,
              android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            );
            controller.setSystemBarsAppearance(
              navigationBarAppearance,
              android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            );
        } else {
            // Backward compatibility for Android < 11
            const decorView = window.getDecorView();
            let flags = decorView.getSystemUiVisibility();

            if (!isDarkMode) {
                // Dark icons in light mode
                flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (android.os.Build.VERSION.SDK_INT >= 27) {
                    flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            } else {
                // Light icons in dark mode
                flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (android.os.Build.VERSION.SDK_INT >= 27) {
                    flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            }
            decorView.setSystemUiVisibility(flags);
        }
    } catch (error) {
        console.error('Error updating status bar theme:', error);
    }
}

export const initStatusBar = () => {
    lifecycleEvents.on(Application.systemAppearanceChangedEvent, onSystemAppearanceChanged);

    // Initialize StatusBar based on current mode
    const isDarkMode = Application.systemAppearance() === 'dark';
    updateStatusBarForTheme(isDarkMode);
}