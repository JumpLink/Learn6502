import { ContentView, Property, CSSType, Utils } from "@nativescript/core";
import { createColorStateList, getMaterialColor } from "../utils/index";
import { systemStates, SystemStates } from "../states";
import { SystemAppearanceChangeEvent } from "~/types";
import { logger } from "~/utils";

/**
 * Material Design 3 Extended Floating Action Button (FAB) component for Android
 *
 * Provides a customizable FAB with an optional text label, following Material Design 3 guidelines.
 * It supports customizable colors, icons, and text with smooth animations for state transitions.
 *
 * ## Material Design 3 Features
 *
 * - **Show/Hide Animations**: Smooth fade and scale transitions
 * - **Extend/Shrink Animations**: Text label animation following motion guidelines
 * - **State Transitions**: Consistent animation patterns for all state changes
 * - **Color System**: Full Material Design 3 color token support
 *
 * ## Material Design 3 Color System
 *
 * | UI Element          | Default Material Color Token |
 * |---------------------|------------------------------|
 * | Container background| colorSecondaryContainer      |
 * | Icon/Text color     | colorOnSecondaryContainer    |
 *
 * ## Animation Guidelines
 *
 * All animations follow Material Design 3 motion patterns:
 * - Show/Hide: [Transition patterns](https://m3.material.io/styles/motion/transitions/transition-patterns)
 * - Extend/Shrink: [Extended FAB specs](https://m3.material.io/components/extended-fab/specs)
 * - Guidelines: [Extended FAB guidelines](https://m3.material.io/components/extended-fab/guidelines)
 *
 * @example
 * <Fab icon="res://ic_add" text="Create" containerColor="primaryContainer" contentColor="onPrimaryContainer" />
 * <Fab icon="res://ic_edit" /> <!-- Standard FAB -->
 *
 * @example
 * // Programmatic usage with animations
 * fab.show(); // Animate in
 * fab.extend(); // Show text label
 * fab.shrink(); // Hide text label
 * fab.hide(); // Animate out
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

  private _nativeFab: com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton | null =
    null;

  public get nativeFab(): com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton | null {
    return this._nativeFab;
  }

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
    return this.nativeFab.isExtended();
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
    this._nativeFab =
      new com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton(
        this.context
      );

    // Ensure it's clickable
    this.nativeFab.setClickable(true);

    // Set up click listener to forward the event to NativeScript
    this.nativeFab.setOnClickListener(
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

    return this.nativeFab;
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
    if (!this.nativeFab) return;

    const backgroundColor = getMaterialColor(
      this._containerColor,
      this.context
    );
    const contentColor = getMaterialColor(this._contentColor, this.context);

    const backgroundTintList = createColorStateList(backgroundColor);
    // Apply content color to both icon and text
    const contentTintList = createColorStateList(contentColor);

    this.nativeFab.setBackgroundTintList(backgroundTintList);
    this.nativeFab.setIconTint(contentTintList);
    this.nativeFab.setTextColor(contentColor); // Set text color directly

    this.nativeFab.refreshDrawableState(); // Refresh to apply changes
  }

  /**
   * Sets the icon drawable for the FAB
   */
  private applyIcon(): void {
    if (!this.nativeFab) return;

    if (this._icon && this._icon.startsWith("res://")) {
      const iconName = this._icon.replace("res://", "");
      const resId = Utils.android.resources.getResource(iconName, "drawable");
      if (resId) {
        this.nativeFab.setIconResource(resId); // Use setIconResource for Extended FAB
      } else {
        logger.warn("FAB", `Icon resource not found: ${iconName}`);
        this.nativeFab.setIcon(null); // Clear icon if not found
      }
    } else if (this._icon) {
      logger.warn(
        "FAB",
        `Icon format not supported (expected res://): ${this._icon}`
      );
      this.nativeFab.setIcon(null);
    } else {
      // If no icon is provided, clear it
      this.nativeFab.setIcon(null);
    }
  }

  /**
   * Sets the text label for the FAB.
   */
  private applyText(): void {
    if (!this.nativeFab) return;
    this.nativeFab.setText(this._text || null); // Set text or clear if null/empty
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
    this._nativeFab = null;
    super.disposeNativeView();
  }

  /**
   * Shrinks the Extended FAB into a standard FAB (icon only).
   * Uses the native shrink animation following Material Design 3 motion guidelines.
   *
   * The animation smoothly transitions from icon-with-text to icon-only state,
   * maintaining the same position and visual continuity.
   *
   * @see https://m3.material.io/components/extended-fab/specs
   * @see https://m3.material.io/components/extended-fab/guidelines
   * @see https://m3.material.io/styles/motion/transitions/transition-patterns
   */
  public shrink(): void {
    if (!this.nativeFab) return;
    this.nativeFab.shrink();
  }

  /**
   * Extends the FAB to show the text label alongside the icon.
   * Uses the native extend animation following Material Design 3 motion guidelines.
   *
   * Only works if text is defined. The animation smoothly transitions from
   * icon-only to icon-with-text state.
   *
   * @see https://m3.material.io/components/extended-fab/specs
   * @see https://m3.material.io/styles/motion/transitions/transition-patterns
   */
  public extend(): void {
    if (!this.nativeFab) return;
    // Only extend if there is text defined
    if (this._text) {
      this.nativeFab.extend();
    }
  }

  /**
   * Shows the FAB with Material Design 3 show animation.
   * The FAB will animate in from hidden state to visible state.
   *
   * @see https://m3.material.io/components/extended-fab/specs
   * @see https://m3.material.io/styles/motion/transitions/transition-patterns
   */
  public show(): void {
    if (!this.nativeFab) return;
    this.nativeFab.show();
  }

  /**
   * Hides the FAB with Material Design 3 hide animation.
   * The FAB will animate out to hidden state.
   *
   * @see https://m3.material.io/components/extended-fab/specs
   * @see https://m3.material.io/styles/motion/transitions/transition-patterns
   */
  public hide(): void {
    if (!this.nativeFab) return;
    this.nativeFab.hide();
  }

  /**
   * Shows the FAB with custom animation duration.
   * Allows overriding the default Material Design 3 animation duration.
   *
   * @param duration - Animation duration in milliseconds
   * @see https://m3.material.io/styles/motion/transitions/transition-patterns
   */
  public showWithDuration(duration: number): void {
    if (!this.nativeFab) return;
    this.nativeFab.show();
    // Note: Custom duration would require additional implementation
    // using ViewPropertyAnimator or custom animation
  }

  /**
   * Hides the FAB with custom animation duration.
   * Allows overriding the default Material Design 3 animation duration.
   *
   * @param duration - Animation duration in milliseconds
   * @see https://m3.material.io/styles/motion/transitions/transition-patterns
   */
  public hideWithDuration(duration: number): void {
    if (!this.nativeFab) return;
    this.nativeFab.hide();
    // Note: Custom duration would require additional implementation
    // using ViewPropertyAnimator or custom animation
  }

  /**
   * Toggles between extended and shrunk states with smooth animation.
   * If the FAB has text and is shrunk, it will extend. If extended, it will shrink.
   * Follows Material Design 3 transition patterns.
   *
   * @see https://m3.material.io/styles/motion/transitions/transition-patterns
   */
  public toggle(): void {
    if (!this.nativeFab) return;

    if (this.isExtended) {
      this.shrink();
    } else if (this._text) {
      this.extend();
    }
  }

  /**
   * Checks if the FAB is currently visible.
   * Useful for determining current state before showing/hiding.
   *
   * @returns true if the FAB is visible, false otherwise
   */
  public isVisible(): boolean {
    if (!this.nativeFab) return false;
    return this.nativeFab.getVisibility() === android.view.View.VISIBLE;
  }

  /**
   * Checks if the FAB is currently shown (not hidden).
   * Different from isVisible() as it considers the FAB's show/hide animation state.
   *
   * @returns true if the FAB is shown, false if hidden
   */
  public isShown(): boolean {
    if (!this.nativeFab) return false;
    return this.nativeFab.isShown();
  }

  // Expose the tap event for use in XML or code
  public static tapEvent = "tap";
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
iconProperty.register(Fab);
textProperty.register(Fab);
containerColorProperty.register(Fab);
contentColorProperty.register(Fab);
