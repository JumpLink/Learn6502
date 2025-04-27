import { Application, type SystemAppearanceChangedEventData, Utils } from '@nativescript/core'
import { initLifecycle, lifecycleEvents } from './utils/lifecycle';
import { isAndroid } from '@nativescript/core/platform';
import { createColorStateList, getColor } from './utils/color';

const onSystemAppearanceChanged = (event: SystemAppearanceChangedEventData): void => {
    console.log('StatusBar: systemAppearanceChangedEvent', event.newValue);
    
    if (isAndroid) {
        const isDarkMode = event.newValue === 'dark';
        updateStatusBarForTheme(isDarkMode);
    }
}

function updateStatusBarForTheme(isDarkMode: boolean): void {
    if (!isAndroid) return;
    
    try {
        const window = Application.android.startActivity.getWindow();
        if (!window) return;

        const context = Utils.android.getApplicationContext(); // Application.android.context; // window.getContext();
        
        const statusBarColor = window.getStatusBarColor();
        console.log('StatusBar: color', statusBarColor);
        
        // Check window background color
        const background = window.getDecorView().getBackground();
        console.log('Window background:', background);
        
        const mdBackgroundColor = getColor(context, "md_theme_surface");
        console.log('MD background color:', mdBackgroundColor);

        // window.getDecorView().setBackgroundColor(mdBackgroundColor);
        // window.setStatusBarColor(mdBackgroundColor);


        // Transparente Statusbar/Navbar
        // window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        // window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);

        // // System-UI-Flags für Light/Dark anpassen
        // const decorView = window.getDecorView();
        // let flags = android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | 
        //             android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE;

        // if (!isDarkMode) {
        //     // Dunkle Icons im hellen Modus
        //     flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        //     if (android.os.Build.VERSION.SDK_INT >= 27) {
        //         flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        //     }
        // }
        // decorView.setSystemUiVisibility(flags);
        
        // Set app appearance based on theme
        // if (isDarkMode) {
        //     // Dark theme setup
        //     // Try alternative approach with window flags
        //     window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        //     window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            
        //     // For dark mode, we want light status bar icons
        //     const decorView = window.getDecorView();
        //     let currentFlags = decorView.getSystemUiVisibility();
            
        //     // Remove LIGHT_STATUS_BAR flag if present
        //     currentFlags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        //     decorView.setSystemUiVisibility(currentFlags);
            
        //     console.log('Set dark mode appearance');
        // } else {
        //     // Light theme setup
        //     // Try alternative approach with window flags
        //     window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        //     window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            
        //     // For light mode, we want dark status bar icons
        //     const decorView = window.getDecorView();
        //     let currentFlags = decorView.getSystemUiVisibility();
            
        //     // Add LIGHT_STATUS_BAR flag
        //     currentFlags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        //     decorView.setSystemUiVisibility(currentFlags);
            
        //     console.log('Set light mode appearance');
        // }
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