import { Application, Color, Utils } from '@nativescript/core';

/**
 * Extracts Material Design 3 theme colors from the Android theme
 * and makes them available as CSS variables.
 */
export function initThemeColors() {
    console.log('Style: Initializing theme colors');
    if (global.isAndroid) {
        const context = Utils.android.getApplicationContext();
        const theme = context.getTheme();
        const typedValue = new android.util.TypedValue();
        const resources = context.getResources();
        const packageName = context.getPackageName();

        // Material Design 3 Theme colors mapping with both attribute names and resource names
        const colorMappings = [
            // Primary Colors
            { cssVar: 'primary', attrName: 'colorPrimary', resName: 'md_theme_primary' },
            { cssVar: 'onPrimary', attrName: 'colorOnPrimary', resName: 'md_theme_onPrimary' },
            { cssVar: 'primaryContainer', attrName: 'colorPrimaryContainer', resName: 'md_theme_primaryContainer' },
            { cssVar: 'onPrimaryContainer', attrName: 'colorOnPrimaryContainer', resName: 'md_theme_onPrimaryContainer' },
            
            // Secondary Colors
            { cssVar: 'secondary', attrName: 'colorSecondary', resName: 'md_theme_secondary' },
            { cssVar: 'onSecondary', attrName: 'colorOnSecondary', resName: 'md_theme_onSecondary' },
            { cssVar: 'secondaryContainer', attrName: 'colorSecondaryContainer', resName: 'md_theme_secondaryContainer' },
            { cssVar: 'onSecondaryContainer', attrName: 'colorOnSecondaryContainer', resName: 'md_theme_onSecondaryContainer' },
            
            // Tertiary Colors
            { cssVar: 'tertiary', attrName: 'colorTertiary', resName: 'md_theme_tertiary' },
            { cssVar: 'onTertiary', attrName: 'colorOnTertiary', resName: 'md_theme_onTertiary' },
            { cssVar: 'tertiaryContainer', attrName: 'colorTertiaryContainer', resName: 'md_theme_tertiaryContainer' },
            { cssVar: 'onTertiaryContainer', attrName: 'colorOnTertiaryContainer', resName: 'md_theme_onTertiaryContainer' },
            
            // Error Colors
            { cssVar: 'error', attrName: 'colorError', resName: 'md_theme_error' },
            { cssVar: 'onError', attrName: 'colorOnError', resName: 'md_theme_onError' },
            { cssVar: 'errorContainer', attrName: 'colorErrorContainer', resName: 'md_theme_errorContainer' },
            { cssVar: 'onErrorContainer', attrName: 'colorOnErrorContainer', resName: 'md_theme_onErrorContainer' },
            
            // Surface Colors
            { cssVar: 'surface', attrName: 'colorSurface', resName: 'md_theme_surface' },
            { cssVar: 'onSurface', attrName: 'colorOnSurface', resName: 'md_theme_onSurface' },
            { cssVar: 'surfaceVariant', attrName: 'colorSurfaceVariant', resName: 'md_theme_surfaceVariant' },
            { cssVar: 'onSurfaceVariant', attrName: 'colorOnSurfaceVariant', resName: 'md_theme_onSurfaceVariant' },
            
            // Background Colors
            { cssVar: 'background', attrName: 'android:colorBackground', resName: 'md_theme_background' },
            { cssVar: 'onBackground', attrName: 'colorOnBackground', resName: 'md_theme_onBackground' },
            
            // Outline Colors
            { cssVar: 'outline', attrName: 'colorOutline', resName: 'md_theme_outline' },
            { cssVar: 'outlineVariant', attrName: 'colorOutlineVariant', resName: 'md_theme_outlineVariant' },
            
            // Surface Container Colors (less likely to be available as theme attributes)
            { cssVar: 'surfaceDim', attrName: 'colorSurfaceDim', resName: 'md_theme_surfaceDim' },
            { cssVar: 'surfaceBright', attrName: 'colorSurfaceBright', resName: 'md_theme_surfaceBright' },
            { cssVar: 'surfaceContainerLowest', attrName: 'colorSurfaceContainerLowest', resName: 'md_theme_surfaceContainerLowest' },
            { cssVar: 'surfaceContainerLow', attrName: 'colorSurfaceContainerLow', resName: 'md_theme_surfaceContainerLow' },
            { cssVar: 'surfaceContainer', attrName: 'colorSurfaceContainer', resName: 'md_theme_surfaceContainer' },
            { cssVar: 'surfaceContainerHigh', attrName: 'colorSurfaceContainerHigh', resName: 'md_theme_surfaceContainerHigh' },
            { cssVar: 'surfaceContainerHighest', attrName: 'colorSurfaceContainerHighest', resName: 'md_theme_surfaceContainerHighest' },
            
            // Fixed Colors (less likely to be available as theme attributes)
            { cssVar: 'primaryFixed', attrName: 'colorPrimaryFixed', resName: 'md_theme_primaryFixed' },
            { cssVar: 'onPrimaryFixed', attrName: 'colorOnPrimaryFixed', resName: 'md_theme_onPrimaryFixed' },
            { cssVar: 'primaryFixedDim', attrName: 'colorPrimaryFixedDim', resName: 'md_theme_primaryFixedDim' },
            { cssVar: 'onPrimaryFixedVariant', attrName: 'colorOnPrimaryFixedVariant', resName: 'md_theme_onPrimaryFixedVariant' },
            
            // Inverse Colors (less likely to be available as theme attributes)
            { cssVar: 'inverseSurface', attrName: 'colorSurfaceInverse', resName: 'md_theme_inverseSurface' },
            { cssVar: 'inverseOnSurface', attrName: 'colorOnSurfaceInverse', resName: 'md_theme_inverseOnSurface' },
            { cssVar: 'inversePrimary', attrName: 'colorPrimaryInverse', resName: 'md_theme_inversePrimary' },

            // Scrim
            { cssVar: 'scrim', attrName: 'colorScrim', resName: 'md_theme_scrim' }
        ];

        let cssVariables = '';
        
        // Extract each color and add it as a CSS variable
        for (const mapping of colorMappings) {
            try {
                let color = null;
                let fromFallback = false;
                
                // First try: Get color from theme attribute
                let attrId = 0;
                try {
                    // Try to get the attribute ID from android.R.attr
                    const androidAttr = mapping.attrName.replace('android:', '');
                    if (android.R.attr[androidAttr]) {
                        attrId = android.R.attr[androidAttr];
                    } else {
                        // Try to get the attribute ID by resource identifier
                        attrId = resources.getIdentifier(
                            androidAttr,
                            'attr',
                            'android'
                        );
                    }
                } catch (e) {
                    // Ignore errors when accessing android.R.attr
                }
                
                // If we have a valid attribute ID, try to resolve it
                if (attrId !== 0 && theme.resolveAttribute(attrId, typedValue, true)) {
                    color = new Color(typedValue.data);
                    console.log(`Extracted color from theme attribute: ${mapping.cssVar} = ${color.hex}`);
                } else {
                    // Second try: Get color directly from resources
                    fromFallback = true;
                    const colorResId = resources.getIdentifier(
                        mapping.resName,
                        'color',
                        packageName
                    );
                    
                    if (colorResId !== 0) {
                        try {
                            // Use the theme-aware getColor method
                            const colorValue = resources.getColor(colorResId, theme);
                            color = new Color(colorValue);
                            console.warn(`Falling back to direct resource for: ${mapping.cssVar} = ${color.hex}`);
                        } catch (e) {
                            console.error(`Error extracting color from resources: ${mapping.cssVar}`, e);
                        }
                    } else {
                        console.warn(`Color resource not found: ${mapping.resName}`);
                    }
                }
                
                // Add the color as a CSS variable if we found it
                if (color) {
                    cssVariables += `--md-theme-${mapping.cssVar}: ${color.hex};\n`;
                }
            } catch (e) {
                console.error(`Error processing color: ${mapping.cssVar}`, e);
            }
        }

        if (cssVariables) {
            // Add the CSS variables to the root class
            const cssCode = `.ns-root { ${cssVariables} }`;
            console.log('Adding CSS variables to root');
            Application.addCss(cssCode);
        } else {
            console.warn('No theme colors were extracted');
        }
    } else {
        console.log('Not running on Android, skipping theme color extraction');
    }
}
