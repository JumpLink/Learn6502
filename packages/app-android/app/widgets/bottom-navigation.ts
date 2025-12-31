import {
  ContentView,
  Property,
  Frame,
  Utils,
  GridLayout,
} from "@nativescript/core";
import { BottomTab } from "./bottom-tab";
import { createColorStateList, getMaterialColor } from "../utils/index";
import { systemStates, SystemStates } from "../states";
import { SystemAppearanceChangeEvent } from "~/types";
import { logger } from "~/utils";

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
  /** Base height in DIPs (without bottom inset) */
  private baseHeight: number = 80;

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

    this.bottomNav.setClipToPadding(false);

    if (android.os.Build.VERSION.SDK_INT >= 21) {
      this.bottomNav.setElevation(0);
    }

    // CRITICAL: Set initial background color immediately after creation
    // This prevents any black background from showing during initialization
    try {
      const surfaceContainerColor = getMaterialColor(
        "surfaceContainer",
        this.context
      );
      if (
        surfaceContainerColor !== undefined &&
        surfaceContainerColor !== null
      ) {
        this.bottomNav.setBackgroundColor(surfaceContainerColor);
      }
    } catch (error) {
      logger.error(
        "BottomNavigation",
        "Error setting initial background color:",
        error
      );
    }

    // Ensure minimum height for visibility
    // Material BottomNavigationView has a default minimum height, but we ensure it's set
    this.bottomNav.setMinimumHeight(this.bottomNav.getMinimumHeight());

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
                  logger.error(
                    "BottomNavigation",
                    `onNavigationItemSelected - Tab with ID ${tabId} not found`
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

    // Set background color on the ContentView wrapper itself
    try {
      const surfaceContainerColor = getMaterialColor(
        "surfaceContainer",
        this.context
      );
      if (
        surfaceContainerColor !== undefined &&
        surfaceContainerColor !== null
      ) {
        this.nativeViewProtected?.setBackgroundColor(surfaceContainerColor);
      }
    } catch (error) {
      logger.error(
        "BottomNavigation",
        "Error setting ContentView background color:",
        error
      );
    }

    // Store base height from XML attribute (default: 80 DIPs)
    // Note: height might be a string (e.g., "80") or number, so we parse it
    const currentHeight =
      typeof this.height === "string"
        ? parseFloat(this.height)
        : (this.height as number) || 0;

    if (currentHeight > 0) {
      this.baseHeight = currentHeight;
    }

    // Log dimensions for debugging
    try {
      if (this.bottomNav) {
        const height = this.bottomNav.getHeight();
        const minHeight = this.bottomNav.getMinimumHeight();
        logger.debug(
          "BottomNavigation",
          `BottomNavigation initialized - height: ${height}, minHeight: ${minHeight}, baseHeight: ${this.baseHeight}`
        );
      }
    } catch (error) {
      logger.error(
        "BottomNavigation",
        "Error logging BottomNavigation dimensions:",
        error
      );
    }
  }

  /**
   * Called after the view is laid out
   * Ensures the BottomNavigation has a proper height
   */
  public onLayout(
    left: number,
    top: number,
    right: number,
    bottom: number
  ): void {
    super.onLayout(left, top, right, bottom);

    // CRITICAL: Force the native view to have a height if it's still 0
    // This can happen if the GridLayout doesn't measure it properly
    try {
      if (this.bottomNav) {
        const currentHeight = this.bottomNav.getHeight();
        const minHeight = this.bottomNav.getMinimumHeight();

        if (currentHeight === 0 && minHeight > 0) {
          // Convert pixels to DIPs and set explicit height
          const heightInDips =
            Utils.layout.toDeviceIndependentPixels(minHeight);
          this.height = heightInDips;
          logger.debug(
            "BottomNavigation",
            `BottomNavigation onLayout: Set explicit height to ${heightInDips} DIPs (${minHeight}px)`
          );
          // Request a new layout pass
          this.requestLayout();
        }
      }
    } catch (error) {
      logger.error(
        "BottomNavigation",
        "Error setting BottomNavigation height in onLayout:",
        error
      );
    }
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
    _isDarkMode = systemStates.systemAppearance === "dark"
  ): void {
    if (!this.bottomNav) return;

    logger.debug("BottomNavigation", "applyTheme");

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
      const resId = Utils.android.resources.getResource(iconName, "drawable");
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
   * Programmatically selects a tab by ID without triggering navigation
   * @param tabId The ID of the tab to select
   * @returns True if the tab was found and selected, false otherwise
   */
  public selectTab(tabId: string): boolean {
    if (!this.bottomNav || !this.idToMenuId.has(tabId)) {
      logger.debug(
        "BottomNavigation",
        `selectTab - Tab with ID ${tabId} not found`
      );
      return false;
    }

    const menuItemId = this.idToMenuId.get(tabId);
    if (!menuItemId) return false;

    // Select the menu item without triggering the listener
    this.bottomNav.setSelectedItemId(menuItemId);
    return true;
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
