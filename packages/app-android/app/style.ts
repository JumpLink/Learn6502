import { Application, Color, Utils } from '@nativescript/core';

/**
 * Defines color mappings for Material Design 3 colors
 */
function getColorMappings() {
    return [
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
}

/**
 * Attempts to extract an attribute from the Android theme
 */
function getThemeAttributeId(resources: android.content.res.Resources, attrName: string): number {
    try {
        // Process the attribute name (remove "android:" if present)
        const androidAttr = attrName.replace('android:', '');
        
        // Try to get the attribute ID from android.R.attr
        if (android.R.attr[androidAttr]) {
            return android.R.attr[androidAttr];
        } else {
            // Try to get the attribute ID by resource identifier
            return resources.getIdentifier(androidAttr, 'attr', 'android');
        }
    } catch (e) {
        console.error(`Error retrieving attribute ID for ${attrName}`, e);
        return 0;
    }
}

/**
 * Extracts a color from a direct resource
 */
function getColorFromResource(resources: android.content.res.Resources, theme: android.content.res.Resources.Theme, 
                               packageName: string, resName: string, cssVar: string): Color | null {
    try {
        const colorResId = resources.getIdentifier(resName, 'color', packageName);
        
        if (colorResId !== 0) {
            // Use the theme-aware getColor method
            const colorValue = resources.getColor(colorResId, theme);
            const color = new Color(colorValue);
            console.log(`Color extracted from resource: ${cssVar} = ${color.hex}`);
            return color;
        } else {
            console.warn(`Color resource not found: ${resName}`);
            return null;
        }
    } catch (e) {
        console.error(`Error extracting color from resources: ${cssVar}`, e);
        return null;
    }
}

/**
 * Extracts a color from a theme attribute
 */
function getColorFromThemeAttribute(theme: android.content.res.Resources.Theme, 
                                     typedValue: android.util.TypedValue, attrId: number, cssVar: string): Color | null {
    try {
        if (attrId !== 0 && theme.resolveAttribute(attrId, typedValue, true)) {
            const color = new Color(typedValue.data);
            console.log(`Color extracted from theme attribute: ${cssVar} = ${color.hex}`);
            return color;
        }
        return null;
    } catch (e) {
        console.error(`Error extracting color from theme attribute: ${cssVar}`, e);
        return null;
    }
}

/**
 * Extracts a color either from a theme attribute or from a direct resource
 */
function getThemeColor(context: android.content.Context, theme: android.content.res.Resources.Theme,
                       typedValue: android.util.TypedValue, resources: android.content.res.Resources, 
                       packageName: string, mapping: any, forceDirectResource: boolean): Color | null {
    
    // If forceDirectResource is enabled, skip the attribute method
    if (!forceDirectResource) {
        // First try to get the color from the theme attribute
        const attrId = getThemeAttributeId(resources, mapping.attrName);
        const themeColor = getColorFromThemeAttribute(theme, typedValue, attrId, mapping.cssVar);
        
        if (themeColor) {
            return themeColor;
        }
    }
    
    // If forceDirectResource is enabled or the attribute method failed,
    // try to get the color directly from the resources
    return getColorFromResource(resources, theme, packageName, mapping.resName, mapping.cssVar);
}

/**
 * Apply CSS variables to the root class
 */
function applyCssVariables(cssVariables: string) {
    if (cssVariables) {
        // Add CSS variables to the root class
        const cssCode = `.ns-root { ${cssVariables} }`;
        console.log('Adding CSS variables to root class');
        Application.addCss(cssCode);
    } else {
        console.warn('No theme colors were extracted');
    }
}

/**
 * The main function for extracting and applying Material Design 3 theme colors
 * @param options Configuration options
 */
export function initThemeColors(options: { forceDirectResource?: boolean } = {}) {
    console.log('Style: Initializing theme colors');
    
    // Default value for forceDirectResource if not specified
    const forceDirectResource = options.forceDirectResource ?? false;
    console.log(`Force direct resources: ${forceDirectResource}`);
    
    if (global.isAndroid) {
        const context = Utils.android.getApplicationContext();
        const theme = context.getTheme();
        const typedValue = new android.util.TypedValue();
        const resources = context.getResources();
        const packageName = context.getPackageName();

        // Get Material Design 3 color mappings
        const colorMappings = getColorMappings();
        
        let cssVariables = '';
        
        // Extract each color and add it as a CSS variable
        for (const mapping of colorMappings) {
            try {
                const color = getThemeColor(
                    context, theme, typedValue, resources, packageName, mapping, forceDirectResource
                );
                
                // Add the color as a CSS variable if we found it
                if (color) {
                    cssVariables += `--md-theme-${mapping.cssVar}: ${color.hex};\n`;
                }
            } catch (e) {
                console.error(`Error processing color: ${mapping.cssVar}`, e);
            }
        }

        // Apply the CSS variables
        applyCssVariables(cssVariables);
    } else {
        console.log('Not running on Android, skipping theme color extraction');
    }
}
