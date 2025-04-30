import { ContentView, Property, Application, SystemAppearanceChangedEventData, Utils, CSSType } from '@nativescript/core';
import { createColorStateList, getColor, getResource } from '../utils/index';
import { lifecycleEvents } from '../utils/index';

/**
 * Material Design 3 Floating Action Button (FAB) component for Android
 *
 * Provides a customizable FAB following Material Design 3 guidelines.
 * It supports customizable colors and icons.
 *
 * ## Material Design 3 Color System
 *
 * | UI Element          | Default Material Color Token |
 * |---------------------|------------------------------|
 * | Container background| colorSecondaryContainer      |
 * | Icon color          | colorOnSecondaryContainer    |
 *
 * For more details, see the [Material Design FAB documentation](https://m3.material.io/components/floating-action-button/specs)
 * and [Android Material FAB](https://github.com/material-components/material-components-android/blob/master/docs/components/FloatingActionButton.md)
 *
 * @example
 * <Fab icon="res://ic_add" containerColor="md_theme_tertiaryContainer" contentColor="md_theme_onTertiaryContainer" />
 */

/**
 * Property for setting the FAB icon resource ID (e.g., "res://add_symbolic")
 */
const iconProperty = new Property<Fab, string>({
  name: 'icon',
});

/**
 * Property for setting the FAB container background color
 * @default 'md_theme_secondaryContainer'
 */
const containerColorProperty = new Property<Fab, string>({
  name: 'containerColor',
  defaultValue: 'md_theme_secondaryContainer',
});

/**
 * Property for setting the FAB icon/content color
 * @default 'md_theme_onSecondaryContainer'
 */
const contentColorProperty = new Property<Fab, string>({
  name: 'contentColor',
  defaultValue: 'md_theme_onSecondaryContainer',
});

// It's important to declare the CSS type for potential future styling
@CSSType('Fab')
export class Fab extends ContentView {
  /** The native Android FAB view */
  private fab: com.google.android.material.floatingactionbutton.FloatingActionButton;

  // Property backing fields
  private _icon: string;
  private _containerColor: string = 'md_theme_secondaryContainer';
  private _contentColor: string = 'md_theme_onSecondaryContainer';

  /**
   * Native property change handler for icon
   * @param value - The new icon resource string
   */
  [iconProperty.setNative](value: string) {
    this._icon = value;
    this.applyIcon();
  }

  /**
   * Native property change handler for containerColor
   * @param value - The new container color value
   */
  [containerColorProperty.setNative](value: string) {
    this._containerColor = value;
    this.applyTheme();
  }

  /**
   * Native property change handler for contentColor
   * @param value - The new content color value
   */
  [contentColorProperty.setNative](value: string) {
    this._contentColor = value;
    this.applyTheme();
  }

  /**
   * Gets the Android context
   */
  get context(): android.content.Context {
    return this._context;
  }

  // Getters and setters for properties
  get icon(): string {
    return this._icon;
  }

  set icon(value: string) {
    this._icon = value;
    this.applyIcon();
  }

  get containerColor(): string {
    return this._containerColor;
  }

  set containerColor(value: string) {
    this._containerColor = value;
    this.applyTheme();
  }

  get contentColor(): string {
    return this._contentColor;
  }

  set contentColor(value: string) {
    this._contentColor = value;
    this.applyTheme();
  }

  constructor() {
    super();
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
  }

  /**
   * Creates the native Android view for the FAB
   * @returns The native Android view
   */
  public createNativeView(): android.view.View {
    // Use default FAB style
    this.fab = new com.google.android.material.floatingactionbutton.FloatingActionButton(this.context);

    // Ensure it's clickable
    this.fab.setClickable(true);

    // Set up click listener to forward the event to NativeScript
    this.fab.setOnClickListener(new android.view.View.OnClickListener({
        onClick: (view: android.view.View) => {
            this.notify({ eventName: Fab.tapEvent, object: this });
        }
    }));

    // Apply initial theme and icon
    this.applyTheme();
    this.applyIcon();

    lifecycleEvents.on(Application.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    return this.fab;
  }

  /**
   * Initializes the native view
   * Called by NativeScript after the native view is created
   */
  public initNativeView(): void {
    super.initNativeView();
    // Additional initialization if needed
  }

  /**
   * Handles system appearance (dark/light mode) changes
   * @param event - The system appearance change event
   */
  private onSystemAppearanceChanged(event: SystemAppearanceChangedEventData): void {
    this.applyTheme(event.newValue === 'dark');
  }

  /**
   * Applies the current theme colors to the FAB
   * Called when colors change or system theme changes
   */
  private applyTheme(isDarkMode = Application.systemAppearance() === 'dark'): void {
    if (!this.fab) return;

    const backgroundColor = getColor(this._containerColor, this.context);
    const tintColor = getColor(this._contentColor, this.context);

    const backgroundTintList = createColorStateList(backgroundColor);
    const tintList = createColorStateList(tintColor);

    this.fab.setBackgroundTintList(backgroundTintList);
    this.fab.setSupportImageTintList(tintList); // Use Support version for compatibility
    this.fab.refreshDrawableState(); // Refresh to apply changes
  }

  /**
   * Sets the icon drawable for the FAB
   */
  private applyIcon(): void {
    if (!this.fab || !this._icon) return;

    if (this._icon.startsWith('res://')) {
      const iconName = this._icon.replace('res://', '');
      const resId = getResource(iconName, 'drawable', this.context);
      if (resId) {
        this.fab.setImageResource(resId);
      } else {
        console.error(`FAB Icon resource not found: ${iconName}`);
        this.fab.setImageDrawable(null); // Clear icon if not found
      }
    } else {
         console.warn(`FAB Icon format not supported (expected res://): ${this._icon}`);
         this.fab.setImageDrawable(null);
    }
  }

  /**
   * Disposes the native view and cleans up resources
   * Called by NativeScript when the view is no longer needed
   */
  public disposeNativeView(): void {
    // Remove theme change listener
    lifecycleEvents.off(Application.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);
    this.fab = null;
    super.disposeNativeView();
  }

  // Expose the tap event for use in XML or code
  public static tapEvent = "tap";
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
iconProperty.register(Fab);
containerColorProperty.register(Fab);
contentColorProperty.register(Fab); 