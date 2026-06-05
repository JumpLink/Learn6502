import { StackLayout, Property } from "@nativescript/core";
import { ListItem } from "./list-item";
import { systemStates, SystemStates } from "../states";
import type { SystemAppearanceChangeEvent } from "~/types";

/**
 * Material Design 3 List component for Android
 *
 * Provides a styled container for list items following Material Design 3 guidelines.
 * This is a simple wrapper around StackLayout that provides consistent styling.
 *
 * ## Material Design 3 Features
 *
 * - **Vertical layout**: Container for list items
 * - **Styling**: Automatic background colors and rounded corners
 * - **Color System**: Full Material Design 3 color token support
 *
 * ## Material Design 3 Color System
 *
 * | UI Element          | Default Material Color Token |
 * |---------------------|------------------------------|
 * | Container background| surfaceContainerHigh         |
 *
 * ## References
 * - [Lists Overview](https://m3.material.io/components/lists/overview)
 * - [Lists Specs](https://m3.material.io/components/lists/specs)
 * - [Lists Guidelines](https://m3.material.io/components/lists/guidelines)
 *
 * @example
 * // In XML:
 * <w:List containerColor="surfaceContainerHigh">
 *   <w:ListItem headline="Item 1" supporting="Description 1" />
 *   <w:ListItem headline="Item 2" supporting="Description 2" />
 * </w:List>
 *
 * // Programmatically:
 * const list = new List();
 * list.containerColor = "surfaceContainerHigh";
 * list.className = "rounded-md mb-4";
 *
 * const item = new ListItem();
 * item.headline = "Item";
 * item.supporting = "Description";
 * list.addChild(item);
 */

/**
 * Property for setting the container background color style name
 * @default 'surfaceContainerHigh'
 */
const containerColorProperty = new Property<List, string>({
  name: "containerColor",
  defaultValue: "surfaceContainerHigh",
});

export class List extends StackLayout {
  // Property backing field for container color
  private _containerColor: string = containerColorProperty.defaultValue;

  // Constructor
  constructor() {
    super();
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);

    // Apply default styling
    this.applyDefaultStyling();
  }

  // Native property change handler
  /**
   * Native property change handler for containerColor
   * @param value - The new container color value
   */
  [containerColorProperty.setNative](value: string): void {
    this._containerColor = value;
    this.applyTheme();
  }

  // Public getters and setters
  get containerColor(): string {
    return this._containerColor;
  }

  set containerColor(value: string) {
    this._containerColor = value;
    this.applyTheme();
  }

  // Public methods
  public onLoaded(): void {
    super.onLoaded();

    systemStates.events.on(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    this.applyTheme();
  }

  public onUnloaded(): void {
    systemStates.events.off(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    super.onUnloaded();
  }

  // Private methods
  /**
   * Applies default Material Design 3 styling
   */
  private applyDefaultStyling(): void {
    // Get existing classes or empty string
    const existingClasses = this.className || "";
    const classes = existingClasses.split(" ").filter((c) => c.length > 0);

    // Add rounded-md if not present
    if (!classes.includes("rounded-md")) {
      classes.push("rounded-md");
    }

    // Add margin bottom if not present
    if (!classes.some((c) => c.startsWith("mb-"))) {
      classes.push("mb-4");
    }

    this.className = classes.join(" ");
  }

  /**
   * Handles system appearance (dark/light mode) changes
   * @param event - The system appearance change event
   */
  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    this.applyTheme();
  }

  /**
   * Applies the current theme colors to the list
   * Called when colors change or system theme changes
   */
  private applyTheme(): void {
    // Get existing classes
    const existingClasses = this.className || "";
    const classes = existingClasses.split(" ").filter((c) => c.length > 0);

    // Remove any existing bg- classes
    const filteredClasses = classes.filter((c) => !c.startsWith("bg-"));

    // Add the background color class based on containerColor
    const bgClass = `bg-${this.kebabCase(this._containerColor)}`;
    filteredClasses.push(bgClass);

    this.className = filteredClasses.join(" ");
  }

  /**
   * Converts camelCase to kebab-case
   * @param str - The camelCase string
   * @returns The kebab-case string
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
containerColorProperty.register(List);
