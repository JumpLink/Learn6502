import { ContentView, Property, CSSType, booleanConverter } from "@nativescript/core";
import { getMaterialColor, createColorStateList } from "../utils/index";
import { systemStates, SystemStates } from "../states";
import type { SystemAppearanceChangeEvent } from "~/types";
import { logger } from "~/utils";

/**
 * Material Design 3 Switch component for Android
 *
 * Provides a toggle switch following Material Design 3 guidelines.
 * Wraps the native Android SwitchMaterial component for optimal performance
 * and native look/feel with Material theming support.
 *
 * ## Material Design 3 Features
 *
 * - **States**: On/Off with smooth transitions
 * - **Color System**: Full Material Design 3 color token support
 * - **Accessibility**: Native screen reader support
 * - **Touch target**: 48dp minimum for accessibility
 *
 * ## Material Design 3 Color System
 *
 * | UI Element          | Checked Color Token         | Unchecked Color Token        |
 * |---------------------|-----------------------------|-----------------------------|
 * | Track background    | colorPrimary                | colorSurfaceContainerHighest|
 * | Thumb               | colorOnPrimary              | colorOutline                |
 *
 * ## References
 * - [Switch Overview](https://m3.material.io/components/switch/overview)
 * - [Switch Specs](https://m3.material.io/components/switch/specs)
 * - [Switch Guidelines](https://m3.material.io/components/switch/guidelines)
 *
 * @example
 * <Switch checked="true" />
 * <Switch checked="false" checkedTrackColor="tertiary" />
 *
 * @example
 * // Programmatic usage
 * switch.checked = true;
 * switch.on(Switch.checkedChangeEvent, (args) => {
 *   console.log("Checked:", args.value);
 * });
 */

/**
 * Property for setting the checked state
 * @default false
 */
const checkedProperty = new Property<Switch, boolean>({
  name: "checked",
  defaultValue: false,
  valueConverter: booleanConverter,
});

/**
 * Property for enabling/disabling the switch
 * @default true
 */
const enabledProperty = new Property<Switch, boolean>({
  name: "enabled",
  defaultValue: true,
  valueConverter: booleanConverter,
});

/**
 * Property for setting the checked track color
 * @default 'primary'
 */
const checkedTrackColorProperty = new Property<Switch, string>({
  name: "checkedTrackColor",
  defaultValue: "primary",
});

/**
 * Property for setting the unchecked track color
 * @default 'surfaceContainerHighest'
 */
const uncheckedTrackColorProperty = new Property<Switch, string>({
  name: "uncheckedTrackColor",
  defaultValue: "surfaceContainerHighest",
});

/**
 * Property for setting the checked thumb color
 * @default 'onPrimary'
 */
const checkedThumbColorProperty = new Property<Switch, string>({
  name: "checkedThumbColor",
  defaultValue: "onPrimary",
});

/**
 * Property for setting the unchecked thumb color
 * @default 'outline'
 */
const uncheckedThumbColorProperty = new Property<Switch, string>({
  name: "uncheckedThumbColor",
  defaultValue: "outline",
});

@CSSType("Switch")
export class Switch extends ContentView {
  // Static properties
  /** Event fired when the checked state changes */
  public static checkedChangeEvent = "checkedChange";

  // Private instance properties - Native view
  private _nativeSwitch: com.google.android.material.materialswitch.MaterialSwitch | null = null;

  // Private instance properties - Property backing fields
  private _checked: boolean = checkedProperty.defaultValue;
  private _enabled: boolean = enabledProperty.defaultValue;
  private _checkedTrackColor: string = checkedTrackColorProperty.defaultValue;
  private _uncheckedTrackColor: string = uncheckedTrackColorProperty.defaultValue;
  private _checkedThumbColor: string = checkedThumbColorProperty.defaultValue;
  private _uncheckedThumbColor: string = uncheckedThumbColorProperty.defaultValue;

  /** Flag to prevent event loops when setting checked state programmatically */
  private _isUpdating: boolean = false;

  // Constructor
  constructor() {
    super();
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
  }

  // Native property change handlers
  [checkedProperty.setNative](value: boolean): void {
    this._checked = value;
    this.applyChecked();
  }

  [enabledProperty.setNative](value: boolean): void {
    this._enabled = value;
    this.applyEnabled();
  }

  [checkedTrackColorProperty.setNative](value: string): void {
    this._checkedTrackColor = value;
    this.applyTheme();
  }

  [uncheckedTrackColorProperty.setNative](value: string): void {
    this._uncheckedTrackColor = value;
    this.applyTheme();
  }

  [checkedThumbColorProperty.setNative](value: string): void {
    this._checkedThumbColor = value;
    this.applyTheme();
  }

  [uncheckedThumbColorProperty.setNative](value: string): void {
    this._uncheckedThumbColor = value;
    this.applyTheme();
  }

  // Public getters and setters
  /**
   * Gets the native Android MaterialSwitch view
   */
  get nativeSwitch(): com.google.android.material.materialswitch.MaterialSwitch | null {
    return this._nativeSwitch;
  }

  /**
   * Gets the Android context
   */
  get context(): android.content.Context {
    return this._context;
  }

  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    if (this._checked !== value) {
      this._checked = value;
      this.applyChecked();
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.applyEnabled();
  }

  get checkedTrackColor(): string {
    return this._checkedTrackColor;
  }

  set checkedTrackColor(value: string) {
    this._checkedTrackColor = value;
    this.applyTheme();
  }

  get uncheckedTrackColor(): string {
    return this._uncheckedTrackColor;
  }

  set uncheckedTrackColor(value: string) {
    this._uncheckedTrackColor = value;
    this.applyTheme();
  }

  get checkedThumbColor(): string {
    return this._checkedThumbColor;
  }

  set checkedThumbColor(value: string) {
    this._checkedThumbColor = value;
    this.applyTheme();
  }

  get uncheckedThumbColor(): string {
    return this._uncheckedThumbColor;
  }

  set uncheckedThumbColor(value: string) {
    this._uncheckedThumbColor = value;
    this.applyTheme();
  }

  // Public methods
  /**
   * Creates the native Android view for the switch
   * @returns The native Android view
   */
  public createNativeView(): android.view.View {
    this._nativeSwitch = new com.google.android.material.materialswitch.MaterialSwitch(this.context);

    // Set up checked change listener
    this._nativeSwitch.setOnCheckedChangeListener(
      new android.widget.CompoundButton.OnCheckedChangeListener({
        onCheckedChanged: (buttonView: android.widget.CompoundButton, isChecked: boolean): void => {
          if (!this._isUpdating) {
            this._checked = isChecked;
            this.notify({
              eventName: Switch.checkedChangeEvent,
              object: this,
              value: isChecked,
            });
          }
        },
      })
    );

    // Apply initial state
    this.applyTheme();
    this.applyChecked();
    this.applyEnabled();

    // Listen for system appearance changes
    systemStates.events.on(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    return this._nativeSwitch;
  }

  /**
   * Initializes the native view
   * Called by NativeScript after the native view is created
   */
  public initNativeView(): void {
    super.initNativeView();
  }

  /**
   * Disposes the native view and cleans up resources
   * Called by NativeScript when the view is no longer needed
   */
  public disposeNativeView(): void {
    systemStates.events.off(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    if (this._nativeSwitch) {
      this._nativeSwitch.setOnCheckedChangeListener(null!);
    }

    this._nativeSwitch = null;
    super.disposeNativeView();
  }

  /**
   * Toggles the switch state
   */
  public toggle(): void {
    this.checked = !this.checked;
  }

  // Private methods
  /**
   * Handles system appearance (dark/light mode) changes
   * @param event - The system appearance change event
   */
  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    this.applyTheme(event.newValue === "dark");
  }

  /**
   * Applies the current theme colors to the switch
   * Called when colors change or system theme changes
   */
  private applyTheme(_isDarkMode = systemStates.systemAppearance === "dark"): void {
    if (!this._nativeSwitch) return;

    try {
      // Get colors from Material Design 3 theme
      const checkedTrackColor = getMaterialColor(this._checkedTrackColor, this.context);
      const uncheckedTrackColor = getMaterialColor(this._uncheckedTrackColor, this.context);
      const checkedThumbColor = getMaterialColor(this._checkedThumbColor, this.context);
      const uncheckedThumbColor = getMaterialColor(this._uncheckedThumbColor, this.context);

      // Create track color state list (checked/unchecked states)
      // Note: createColorStateList uses checked state as first param, unchecked as second
      const trackColorStateList = createColorStateList(checkedTrackColor, uncheckedTrackColor);

      // Create thumb color state list (checked/unchecked states)
      const thumbColorStateList = createColorStateList(checkedThumbColor, uncheckedThumbColor);

      // Apply colors
      this._nativeSwitch.setTrackTintList(trackColorStateList);
      this._nativeSwitch.setThumbTintList(thumbColorStateList);

      // Track decoration (border) colors - MD3 feature
      // Checked: border matches track color, Unchecked: border is "outline"
      // See: https://m3.material.io/components/switch/specs
      const uncheckedBorderColor = getMaterialColor("outline", this.context);
      const borderColorStateList = createColorStateList(checkedTrackColor, uncheckedBorderColor);
      this._nativeSwitch.setTrackDecorationTintList(borderColorStateList);
    } catch (error) {
      logger.error("Switch", "Failed to apply theme:", error);
    }
  }

  /**
   * Applies the checked state to the native view
   */
  private applyChecked(): void {
    if (!this._nativeSwitch) return;

    this._isUpdating = true;
    this._nativeSwitch.setChecked(this._checked);
    this._isUpdating = false;
  }

  /**
   * Applies the enabled state to the native view
   */
  private applyEnabled(): void {
    if (!this._nativeSwitch) return;

    this._nativeSwitch.setEnabled(this._enabled);

    // Apply Material Design 3 disabled alpha
    this._nativeSwitch.setAlpha(this._enabled ? 1.0 : 0.38);
  }
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
checkedProperty.register(Switch);
enabledProperty.register(Switch);
checkedTrackColorProperty.register(Switch);
uncheckedTrackColorProperty.register(Switch);
checkedThumbColorProperty.register(Switch);
uncheckedThumbColorProperty.register(Switch);
