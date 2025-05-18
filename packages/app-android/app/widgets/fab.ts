import { ContentView, Property, CSSType } from "@nativescript/core";
import {
  createColorStateList,
  getMaterialColor,
  getResource,
} from "../utils/index";
import { systemStates, SystemStates } from "../states";
import { SystemAppearanceChangeEvent } from "~/types";

/**
 * Material Design 3 Extended Floating Action Button (FAB) component for Android
 *
 * Provides a customizable FAB with an optional text label, following Material Design 3 guidelines.
 * It supports customizable colors, icons, and text.
 *
 * ## Material Design 3 Color System
 *
 * | UI Element          | Default Material Color Token |
 * |---------------------|------------------------------|
 * | Container background| colorSecondaryContainer      |
 * | Icon/Text color     | colorOnSecondaryContainer    |
 *
 * For more details, see the [Material Design Extended FAB documentation](https://m3.material.io/components/extended-fab/overview)
 * and [Android Material Extended FAB](https://github.com/material-components/material-components-android/blob/master/docs/components/ExtendedFloatingActionButton.md)
 *
 * @example
 * <Fab icon="res://ic_add" text="Create" containerColor="primaryContainer" contentColor="onPrimaryContainer" />
 * <Fab icon="res://ic_edit" /> <!-- Standard FAB -->
 */

/**
 * Property for setting the FAB icon resource ID (e.g., "res://add_symbolic")
 */
const iconProperty = new Property<Fab, string>({
  name: "icon",
});

/**
 * Property for setting the FAB text label.
 * If set, the component renders as an Extended FAB.
 */
const textProperty = new Property<Fab, string>({
  name: "text",
});

/**
 * Property for setting the FAB container background color
 * @default 'secondaryContainer'
 */
const containerColorProperty = new Property<Fab, string>({
  name: "containerColor",
  defaultValue: "secondaryContainer",
});

/**
 * Property for setting the FAB icon and text color
 * @default 'onSecondaryContainer'
 */
const contentColorProperty = new Property<Fab, string>({
  name: "contentColor",
  defaultValue: "onSecondaryContainer",
});

// It's important to declare the CSS type for potential future styling
@CSSType("Fab")
export class Fab extends ContentView {
  /** The native Android Extended FAB view */
  // Use ExtendedFloatingActionButton to support text labels
  private fab: com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;

  // Property backing fields
  private _icon: string;
  private _text: string;
  private _containerColor: string = containerColorProperty.defaultValue;
  private _contentColor: string = contentColorProperty.defaultValue;

  /**
   * Native property change handler for icon
   * @param value - The new icon resource string
   */
  [iconProperty.setNative](value: string) {
    this._icon = value;
    this.applyIcon();
  }

  /**
   * Native property change handler for text
   * @param value - The new text label
   */
  [textProperty.setNative](value: string) {
    this._text = value;
    this.applyText();
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

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
    this.applyText();
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

  get isExtended(): boolean {
    return this.fab.isExtended();
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
    // Use ExtendedFloatingActionButton to support text
    this.fab =
      new com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton(
        this.context
      );

    // Ensure it's clickable
    this.fab.setClickable(true);

    // Set up click listener to forward the event to NativeScript
    this.fab.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (view: android.view.View) => {
          this.notify({ eventName: Fab.tapEvent, object: this });
        },
      })
    );

    // Apply initial theme, icon, and text
    this.applyTheme();
    this.applyIcon();
    this.applyText();

    systemStates.events.on(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );

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
  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    this.applyTheme(event.newValue === "dark");
  }

  /**
   * Applies the current theme colors to the FAB
   * Called when colors change or system theme changes
   */
  private applyTheme(
    isDarkMode = systemStates.systemAppearance === "dark"
  ): void {
    if (!this.fab) return;

    const backgroundColor = getMaterialColor(
      this._containerColor,
      this.context
    );
    const contentColor = getMaterialColor(this._contentColor, this.context);

    const backgroundTintList = createColorStateList(backgroundColor);
    // Apply content color to both icon and text
    const contentTintList = createColorStateList(contentColor);

    this.fab.setBackgroundTintList(backgroundTintList);
    this.fab.setIconTint(contentTintList);
    this.fab.setTextColor(contentColor); // Set text color directly

    this.fab.refreshDrawableState(); // Refresh to apply changes
  }

  /**
   * Sets the icon drawable for the FAB
   */
  private applyIcon(): void {
    if (!this.fab) return;

    if (this._icon && this._icon.startsWith("res://")) {
      const iconName = this._icon.replace("res://", "");
      const resId = getResource(iconName, "drawable", this.context);
      if (resId) {
        this.fab.setIconResource(resId); // Use setIconResource for Extended FAB
      } else {
        console.error(`FAB Icon resource not found: ${iconName}`);
        this.fab.setIcon(null); // Clear icon if not found
      }
    } else if (this._icon) {
      console.warn(
        `FAB Icon format not supported (expected res://): ${this._icon}`
      );
      this.fab.setIcon(null);
    } else {
      // If no icon is provided, clear it
      this.fab.setIcon(null);
    }
  }

  /**
   * Sets the text label for the FAB.
   */
  private applyText(): void {
    if (!this.fab) return;
    this.fab.setText(this._text || null); // Set text or clear if null/empty
  }

  /**
   * Disposes the native view and cleans up resources
   * Called by NativeScript when the view is no longer needed
   */
  public disposeNativeView(): void {
    // Remove theme change listener
    systemStates.events.off(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
    this.fab = null;
    super.disposeNativeView();
  }

  /**
   * Collapses the Extended FAB into a standard FAB (icon only).
   * Uses the native shrink animation.
   */
  public collapse(): void {
    if (!this.fab) return;
    this.fab.shrink();
  }

  /**
   * Extends the FAB to show the text label alongside the icon.
   * Uses the native extend animation.
   */
  public extend(): void {
    if (!this.fab) return;
    // Only extend if there is text defined
    if (this._text) {
      this.fab.extend();
    }
  }

  // Expose the tap event for use in XML or code
  public static tapEvent = "tap";
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
iconProperty.register(Fab);
textProperty.register(Fab); // Register the new text property
containerColorProperty.register(Fab);
contentColorProperty.register(Fab);
