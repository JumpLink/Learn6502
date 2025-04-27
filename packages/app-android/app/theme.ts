import { Application, type SystemAppearanceChangedEventData } from '@nativescript/core'
import { lifecycleEvents } from './utils/lifecycle';
import { isAndroid } from '@nativescript/core/platform';

const onSystemAppearanceChanged = (event: SystemAppearanceChangedEventData): void => {
    console.log('Theme: systemAppearanceChangedEvent', event.newValue);
    
    if (isAndroid) {
        const isDarkMode = event.newValue === 'dark';
        applyThemeChange(isDarkMode);
    }
}

function applyThemeChange(isDarkMode: boolean): void {
    if (!isAndroid) return;
    
    try {
        const activity = Application.android.startActivity;
        
        // Set AppCompatDelegate mode (helps with older Android versions)
        const AppCompatDelegate = androidx.appcompat.app.AppCompatDelegate;
        const nightMode = isDarkMode ? 
            AppCompatDelegate.MODE_NIGHT_YES : 
            AppCompatDelegate.MODE_NIGHT_NO;
        
        AppCompatDelegate.setDefaultNightMode(nightMode);
        
        // Recreate the activity to fully reload the theme
        // activity.recreate();
    } catch (error) {
        console.error('Error applying theme:', error);
    }
}

export const initThemeManager = () => {
    lifecycleEvents.on(Application.systemAppearanceChangedEvent, onSystemAppearanceChanged);
    
    // DO NOT force theme application on start as it causes issues before UI is fully initialized
    // Instead, rely on XML theme definitions for initial appearance
}

// Function to manually toggle dark mode (if needed)
export const toggleDarkMode = () => {
    const currentMode = Application.systemAppearance();
    const newIsDarkMode = currentMode !== 'dark';
    applyThemeChange(newIsDarkMode);
}

// Function to get current theme state
export const isDarkMode = (): boolean => {
    return Application.systemAppearance() === 'dark';
} 