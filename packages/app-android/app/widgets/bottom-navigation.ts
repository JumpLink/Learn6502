import {
  ContentView,
  Property,
  Frame,
  Application,
  SystemAppearanceChangedEventData,
  Utils,
  EventData,
  View,
  CoreTypes,
} from "@nativescript/core";
import { BottomTab } from "./bottom-tab";
import {
  createColorStateList,
  getMaterialColor,
  setNavigationBarAppearance,
} from "../utils/index";
import { getResource } from "../utils/index";
import { systemStates, SystemStates } from "../states";

// Import necessary AndroidX classes
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;
import { SystemAppearanceChangeEvent, WindowInsetsChangeEvent } from "~/types";

/**
 * Material Design 3 Bottom Navigation component for Android
 *
 * This component provides a customizable bottom navigation bar following Material Design 3 guidelines.
 * It supports customizable colors through properties and dynamic theme changes.
 *
 * ## Material Design 3 Color System
 *
 * The component follows the standard Material Design 3 color mappings:
 *
 * | UI Element              | Default Material Color Token        |
 * |-------------------------|------------------------------------|
 * | Container background    | colorSurfaceContainer              |
 * | Active text             | colorOnSurface                     |
 * | Active icons            | colorOnSecondaryContainer          |
 * | Inactive text/icons     | colorOnSurfaceVariant              |
 * | Active indicator        | colorSecondaryContainer            |
 *
 * For more details, see the [Material Design Bottom Navigation documentation](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md)
 *
 * @example
 * <BottomNavigation class="bg-surface-container" activeColor="primary">
 *   <BottomTab id="home" title="Home" icon="res://ic_home" />
 *   <BottomTab id="search" title="Search" icon="res://ic_search" />
 * </BottomNavigation>
 */

// Define custom properties for colors
/**
 * Property for setting the active text color
 * @default 'onSurface'
 */
const activeTextColorProperty = new Property<BottomNavigation, string>({
  name: "activeTextColor",
  defaultValue: "onSurface",
});

/**
 * Property for setting the active icon color
 * @default 'onSecondaryContainer'
 */
const activeIconColorProperty = new Property<BottomNavigation, string>({
  name: "activeIconColor",
  defaultValue: "onSecondaryContainer",
});

/**
 * Property for setting the inactive text color
 * @default 'onSurfaceVariant'
 */
const inactiveTextColorProperty = new Property<BottomNavigation, string>({
  name: "inactiveTextColor",
  defaultValue: "onSurfaceVariant",
});

/**
 * Property for setting the inactive icon color
 * @default 'onSurfaceVariant'
 */
const inactiveIconColorProperty = new Property<BottomNavigation, string>({
  name: "inactiveIconColor",
  defaultValue: "onSurfaceVariant",
});

/**
 * Property for setting the active indicator color
 * @default 'secondaryContainer'
 */
const indicatorColorProperty = new Property<BottomNavigation, string>({
  name: "indicatorColor",
  defaultValue: "secondaryContainer",
});

export class BottomNavigation extends ContentView {
  /** The native Android bottom navigation view */
  private bottomNav: com.google.android.material.bottomnavigation.BottomNavigationView;
  /** Tabs to be added once the native view is created */
  private pendingTabs: BottomTab[] = [];
  /** Map of tab IDs to BottomTab instances */
  private tabsById = new Map<string, BottomTab>();
  /** Map of tab IDs to menu item IDs */
  private idToMenuId = new Map<string, number>();

  // Property backing fields
  /** Color for active text */
  private _activeTextColor: string = activeTextColorProperty.defaultValue;
  /** Color for active icons */
  private _activeIconColor: string = activeIconColorProperty.defaultValue;
  /** Color for inactive text */
  private _inactiveTextColor: string = inactiveTextColorProperty.defaultValue;
  /** Color for inactive icons */
  private _inactiveIconColor: string = inactiveIconColorProperty.defaultValue;
  /** Color for the active indicator */
  private _indicatorColor: string = indicatorColorProperty.defaultValue;

  /**
   * Native property change handler for activeTextColor
   * @param value - The new active text color value
   */
  [activeTextColorProperty.setNative](value: string) {
    this._activeTextColor = value;
    this.applyTheme();
  }

  /**
   * Native property change handler for activeIconColor
   * @param value - The new active icon color value
   */
  [activeIconColorProperty.setNative](value: string) {
    this._activeIconColor = value;
    this.applyTheme();
  }

  /**
   * Native property change handler for inactiveTextColor
   * @param value - The new inactive text color value
   */
  [inactiveTextColorProperty.setNative](value: string) {
    this._inactiveTextColor = value;
    this.applyTheme();
  }

  /**
   * Native property change handler for inactiveIconColor
   * @param value - The new inactive icon color value
   */
  [inactiveIconColorProperty.setNative](value: string) {
    this._inactiveIconColor = value;
    this.applyTheme();
  }

  /**
   * Native property change handler for indicatorColor
   * @param value - The new indicator color value
   */
  [indicatorColorProperty.setNative](value: string) {
    this._indicatorColor = value;
    this.applyTheme();
  }

  /**
   * Gets the Android context
   */
  get context(): android.content.Context {
    return this._context;
  }

  // Getters and setters for properties

  get activeTextColor(): string {
    return this._activeTextColor;
  }

  set activeTextColor(value: string) {
    this._activeTextColor = value;
    this.applyTheme();
  }

  get activeIconColor(): string {
    return this._activeIconColor;
  }

  set activeIconColor(value: string) {
    this._activeIconColor = value;
    this.applyTheme();
  }

  get inactiveTextColor(): string {
    return this._inactiveTextColor;
  }

  set inactiveTextColor(value: string) {
    this._inactiveTextColor = value;
    this.applyTheme();
  }

  get inactiveIconColor(): string {
    return this._inactiveIconColor;
  }

  set inactiveIconColor(value: string) {
    this._inactiveIconColor = value;
    this.applyTheme();
  }

  get indicatorColor(): string {
    return this._indicatorColor;
  }

  set indicatorColor(value: string) {
    this._indicatorColor = value;
    this.applyTheme();
  }

  constructor() {
    super();
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
    this.onWindowInsetsChanged = this.onWindowInsetsChanged.bind(this);
  }

  /**
   * Creates the native Android view for the bottom navigation
   * @returns The native Android view
   */
  public createNativeView(): android.view.View {
    // Use custom style defined in styles.xml
    const defStyleAttr = this.context
      .getResources()
      .getIdentifier(
        "bottomNavigationStyle",
        "attr",
        this.context.getPackageName()
      );

    this.bottomNav =
      new com.google.android.material.bottomnavigation.BottomNavigationView(
        this.context,
        null,
        defStyleAttr
      );

    // Set label visibility mode
    this.bottomNav.setLabelVisibilityMode(
      com.google.android.material.bottomnavigation.LabelVisibilityMode
        .LABEL_VISIBILITY_LABELED
    );

    // Set up item selection listener
    this.bottomNav.setOnItemSelectedListener(
      new com.google.android.material.navigation.NavigationBarView.OnItemSelectedListener(
        {
          onNavigationItemSelected: (
            menuItem: android.view.MenuItem
          ): boolean => {
            const menuId = menuItem.getItemId();
            // Find the tab with this menu ID and navigate to its page
            for (const [tabId, menuItemId] of this.idToMenuId.entries()) {
              if (menuItemId === menuId) {
                const tab = this.tabsById.get(tabId);
                if (!tab) {
                  console.error(
                    `BottomNavigation: onNavigationItemSelected - Tab with ID ${tabId} not found`
                  );
                  return false;
                }
                this.navigateToTab(tab);
                return true;
              }
            }
            return false;
          },
        }
      )
    );

    // Apply current theme
    this.applyTheme();

    systemStates.events.on(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );

    // Process any pending tabs that were added before view creation
    if (this.pendingTabs.length > 0) {
      this.pendingTabs.forEach((tab) => this.addTabToMenu(tab));
      this.pendingTabs = [];
    }

    return this.bottomNav;
  }

  /**
   * Initializes the native view
   * Called by NativeScript after the native view is created
   */
  public initNativeView(): void {
    super.initNativeView();

    // Subscribe to the global window insets event
    systemStates.events.on(
      SystemStates.windowInsetsChangedEvent,
      this.onWindowInsetsChanged
    );

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
   * Applies the current theme colors to the bottom navigation
   * Called when colors change or system theme changes
   */
  private applyTheme(
    isDarkMode = Application.systemAppearance() === "dark"
  ): void {
    if (!this.bottomNav) return;

    console.log("applyTheme");

    // Get colors using the new properties
    const activeTextColor = getMaterialColor(
      this._activeTextColor,
      this.context
    );
    const inactiveTextColor = getMaterialColor(
      this._inactiveTextColor,
      this.context
    );
    const activeIconColor = getMaterialColor(
      this._activeIconColor,
      this.context
    );
    const inactiveIconColor = getMaterialColor(
      this._inactiveIconColor,
      this.context
    );
    const indicatorColor = getMaterialColor(this._indicatorColor, this.context);

    // Create separate state lists for text and icons
    const textStateList = createColorStateList(
      activeTextColor,
      inactiveTextColor
    );
    const iconStateList = createColorStateList(
      activeIconColor,
      inactiveIconColor
    );
    const indicatorStateList = createColorStateList(indicatorColor);

    // Apply the state lists
    this.bottomNav.setItemTextColor(textStateList);
    this.bottomNav.setItemIconTintList(iconStateList);
    this.bottomNav.setItemActiveIndicatorColor(indicatorStateList);

    // Uniform the navigation bar appearance to match the bottom navigation background color
    setNavigationBarAppearance(undefined, isDarkMode);
  }

  /**
   * Disposes the native view and cleans up resources
   * Called by NativeScript when the view is no longer needed
   */
  public disposeNativeView(): void {
    // Remove listeners
    systemStates.events.off(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
    systemStates.events.off(
      SystemStates.windowInsetsChangedEvent,
      this.onWindowInsetsChanged
    );

    this.bottomNav = null;
    this.tabsById.clear();
    this.idToMenuId.clear();
    super.disposeNativeView();
  }

  /**
   * Adds child elements to the bottom navigation
   * Currently supports BottomTab instances only
   * This method is called by NativeScript when children are added declaratively in XML
   *
   * @param name - The name of the child element
   * @param value - The child element instance
   */
  public _addChildFromBuilder(name: string, value: any) {
    if (value instanceof BottomTab) {
      if (this.bottomNav) {
        this.addTabToMenu(value);
      } else {
        // Store tabs to add them once the view is created
        this.pendingTabs.push(value);
      }
      // Store the tab by ID for later reference
      this.tabsById.set(value.id, value);
    }
  }

  /**
   * Adds a tab to the bottom navigation menu
   * Creates a menu item with the tab's title and icon
   *
   * @param tab - The BottomTab instance to add
   */
  private addTabToMenu(tab: BottomTab): void {
    const menuId = Math.floor(Math.random() * 10000);
    tab.id = tab.id || `tab${menuId}`;

    const menuItem = this.bottomNav.getMenu().add(0, menuId, 0, tab.title);
    // Map tab ID to menu item ID
    this.idToMenuId.set(tab.id, menuId);

    if (tab.icon?.startsWith("res://")) {
      const iconName = tab.icon.replace("res://", "");
      const resId = getResource(iconName, "drawable", this.context);
      if (resId) {
        menuItem.setIcon(resId);
      }
    }
  }

  /**
   * Navigates to the page associated with the tab
   * Uses the tab ID as the page name in views/{tabId}
   *
   * @param tabId - The ID of the tab to navigate to
   */
  private navigateToTab(tab: BottomTab): void {
    // Find the main frame to navigate
    const mainFrame = Frame.getFrameById("mainFrame");
    if (mainFrame) {
      // Navigate to page corresponding to tab
      mainFrame.navigate({
        moduleName: tab.moduleName,
        clearHistory: true,
      });
    }
  }

  /**
   * Handler for the global windowInsetsChanged event.
   * Calculates and applies padding based on navigation bar insets.
   * @param insets - The WindowInsetsCompat object received from the event.
   */
  private onWindowInsetsChanged(event: WindowInsetsChangeEvent): void {
    if (!this.bottomNav || !event.newValue) {
      // Check bottomNav and insets
      console.log(
        "BottomNavigation: onWindowInsetsChanged called but bottomNav or insets are null"
      );
      return;
    }
    try {
      // Get navigation bar insets directly from WindowInsetsCompat
      const bottomInsetPixels = event.newValue.getInsets(
        androidx_core_view_WindowInsetsCompat.Type.navigationBars()
      ).bottom;
      // Use getMeasuredHeight which reflects the actual measured size, might be more reliable than getMinimumHeight
      const bottomNavHeightPixels = this.bottomNav.getMinimumHeight(); // measured height not works here so we use getMinimumHeight
      this.bottomNav.setPadding(0, 0, 0, bottomInsetPixels);

      if (bottomNavHeightPixels <= 0) {
        // If measured height is 0, it might mean the view hasn't been laid out yet.
        // We might need to request layout or wait.
        console.log(
          "BottomNavigation: onWindowInsetsChanged - Measured height is 0. Requesting layout."
        );
        // Request layout to potentially trigger a remeasure
        return this.requestLayout();
      }

      const totalHeightPixels = bottomNavHeightPixels + bottomInsetPixels;
      // Convert total pixels to DIPs for setting NativeScript height property
      this.height = Utils.layout.toDeviceIndependentPixels(totalHeightPixels);

      console.log(
        "BottomNavigation: onWindowInsetsChanged - Native Measured Height (Pixels):",
        bottomNavHeightPixels,
        "| Padding Bottom (Pixels):",
        bottomInsetPixels,
        "| Total Calculated Height (DIPs):",
        this.height
      );
    } catch (error) {
      console.error(
        "BottomNavigation: Error during onWindowInsetsChanged height calculation:",
        error
      );
    }
  }
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
activeTextColorProperty.register(BottomNavigation);
activeIconColorProperty.register(BottomNavigation);
inactiveTextColorProperty.register(BottomNavigation);
inactiveIconColorProperty.register(BottomNavigation);
indicatorColorProperty.register(BottomNavigation);
