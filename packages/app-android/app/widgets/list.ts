import { ContentView, Property } from "@nativescript/core";
import { ListItem } from "./list-item";
import { getMaterialColor } from "../utils/index";
import { systemStates, SystemStates } from "../states";
import { SystemAppearanceChangeEvent } from "~/types";

/**
 * Material Design 3 List component for Android
 *
 * Provides a container for list items following Material Design 3 guidelines.
 * Manages a collection of ListItem instances with proper spacing and dividers.
 *
 * ## Material Design 3 Features
 *
 * - **Vertical scrolling**: Scrollable container for list items
 * - **Dividers**: Optional dividers between items
 * - **Color System**: Full Material Design 3 color token support
 * - **Spacing**: Proper spacing according to Material Design 3 specs
 *
 * ## Material Design 3 Color System
 *
 * | UI Element          | Default Material Color Token |
 * |---------------------|------------------------------|
 * | Container background| colorSurface                 |
 *
 * ## References
 * - [Lists Overview](https://m3.material.io/components/lists/overview)
 * - [Lists Specs](https://m3.material.io/components/lists/specs)
 * - [Lists Guidelines](https://m3.material.io/components/lists/guidelines)
 *
 * @example
 * <List containerColor="surface">
 *   <ListItem headline="Item 1" supporting="Description 1" />
 *   <ListItem headline="Item 2" supporting="Description 2" />
 * </List>
 */

/**
 * Property for setting the container background color
 * @default 'surface'
 */
const containerColorProperty = new Property<List, string>({
  name: "containerColor",
  defaultValue: "surface",
});

export class List extends ContentView {
  // Private instance properties
  /** The native Android ScrollView */
  private scrollView: android.widget.ScrollView;
  /** The native Android LinearLayout container */
  private listContainer: android.widget.LinearLayout;
  /** List items to be added once the native view is created */
  private pendingItems: ListItem[] = [];
  /** Property backing field for container color */
  private _containerColor: string = containerColorProperty.defaultValue;

  // Constructor
  constructor() {
    super();
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
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
  /**
   * Gets the Android context
   */
  get context(): android.content.Context {
    return this._context;
  }

  get containerColor(): string {
    return this._containerColor;
  }

  set containerColor(value: string) {
    this._containerColor = value;
    this.applyTheme();
  }

  // Public methods
  /**
   * Creates the native Android view for the list
   * @returns The native Android view
   */
  public createNativeView(): android.view.View {
    // Create ScrollView for scrollable list
    this.scrollView = new android.widget.ScrollView(this.context);
    this.scrollView.setFillViewport(true);

    // Create LinearLayout container for list items
    this.listContainer = new android.widget.LinearLayout(this.context);
    this.listContainer.setOrientation(android.widget.LinearLayout.VERTICAL);

    // Add container to scroll view
    this.scrollView.addView(this.listContainer);

    // Apply theme
    this.applyTheme();

    systemStates.events.on(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );

    // Process any pending items that were added before view creation
    if (this.pendingItems.length > 0) {
      this.pendingItems.forEach((item) => this.addItemToContainer(item));
      this.pendingItems = [];
    }

    return this.scrollView;
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
    systemStates.events.off(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
    this.scrollView = null;
    this.listContainer = null;
    super.disposeNativeView();
  }

  /**
   * Adds child elements to the list
   * Currently supports ListItem instances only
   * This method is called by NativeScript when children are added declaratively in XML
   *
   * @param name - The name of the child element
   * @param value - The child element instance
   */
  public _addChildFromBuilder(name: string, value: unknown): void {
    if (value instanceof ListItem) {
      if (this.listContainer) {
        this.addItemToContainer(value);
      } else {
        // Store items to add them once the view is created
        this.pendingItems.push(value);
      }
    }
  }

  /**
   * Removes all items from the list
   */
  public clearItems(): void {
    if (!this.listContainer) return;
    this.listContainer.removeAllViews();
  }

  /**
   * Gets the number of items in the list
   * @returns The number of items
   */
  public getItemCount(): number {
    if (!this.listContainer) return 0;
    return this.listContainer.getChildCount();
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
   * Applies the current theme colors to the list
   * Called when colors change or system theme changes
   */
  private applyTheme(
    isDarkMode = systemStates.systemAppearance === "dark"
  ): void {
    if (!this.listContainer) return;

    const backgroundColor = getMaterialColor(
      this._containerColor,
      this.context
    );

    this.listContainer.setBackgroundColor(backgroundColor);
  }

  /**
   * Adds a list item to the container
   * @param item - The ListItem instance to add
   */
  private addItemToContainer(item: ListItem): void {
    if (!this.listContainer) return;

    // Create the native view for the item if not already created
    if (!item.nativeView) {
      item._setupAsRootView(this._context);
    }

    // Add the item's native view to the container
    this.listContainer.addView(item.nativeView as android.view.View);
  }
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
containerColorProperty.register(List);
