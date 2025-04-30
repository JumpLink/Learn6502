import { ContentView, Property, Frame, Application, SystemAppearanceChangedEventData, Utils, EventData } from '@nativescript/core';
import { BottomTab } from './bottom-tab';
import { createColorStateList, getColor, getInsets, setNavigationBarAppearance } from '../utils/index';
import { lifecycleEvents, getResource } from '../utils/index';

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
 * <BottomNavigation navBackgroundColor="md_theme_surface" activeColor="md_theme_primary">
 *   <BottomTab id="home" title="Home" icon="res://ic_home" />
 *   <BottomTab id="search" title="Search" icon="res://ic_search" />
 * </BottomNavigation>
 */

// Define custom properties for colors
/**
 * Property for setting the navigation bar background color
 * @default 'md_theme_surfaceContainer'
 */
const navBackgroundColorProperty = new Property<BottomNavigation, string>({
  name: 'navBackgroundColor',
  defaultValue: 'md_theme_surfaceContainer',
});

/**
 * Property for setting the active item color (text and icons)
 * @default 'md_theme_onSurface'
 */
const activeColorProperty = new Property<BottomNavigation, string>({
  name: 'activeColor',
  defaultValue: 'md_theme_onSurface',
});

/**
 * Property for setting the inactive item color (text and icons)
 * @default 'md_theme_onSurfaceVariant'
 */
const inactiveColorProperty = new Property<BottomNavigation, string>({
  name: 'inactiveColor',
  defaultValue: 'md_theme_onSurfaceVariant',
});

/**
 * Property for setting the active indicator color
 * @default 'md_theme_secondaryContainer'
 */
const indicatorColorProperty = new Property<BottomNavigation, string>({
  name: 'indicatorColor',
  defaultValue: 'md_theme_secondaryContainer',
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
  /** Background color of the navigation bar */
  private _navBackgroundColor: string = 'md_theme_surfaceContainer';
  /** Color for active items (text and icons) */
  private _activeColor: string = 'md_theme_onSurface';
  /** Color for inactive items (text and icons) */
  private _inactiveColor: string = 'md_theme_onSurfaceVariant';
  /** Color for the active indicator */
  private _indicatorColor: string = 'md_theme_secondaryContainer';

  /**
   * Native property change handler for navBackgroundColor
   * @param value - The new navigation background color value
   */
  [navBackgroundColorProperty.setNative](value: string) {
    this._navBackgroundColor = value;
    this.applyTheme();
  }

  /**
   * Native property change handler for activeColor
   * @param value - The new active color value
   */
  [activeColorProperty.setNative](value: string) {
    this._activeColor = value;
    this.applyTheme();
  }

  /**
   * Native property change handler for inactiveColor
   * @param value - The new inactive color value
   */
  [inactiveColorProperty.setNative](value: string) {
    this._inactiveColor = value;
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
  get navBackgroundColor(): string {
    return this._navBackgroundColor;
  }

  set navBackgroundColor(value: string) {
    this._navBackgroundColor = value;
    this.applyTheme();
  }

  get activeColor(): string {
    return this._activeColor;
  }

  set activeColor(value: string) {
    this._activeColor = value;
    this.applyTheme();
  }

  get inactiveColor(): string {
    return this._inactiveColor;
  }

  set inactiveColor(value: string) {
    this._inactiveColor = value;
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
    this._onLoaded = this._onLoaded.bind(this);
  }

  /**
   * Creates the native Android view for the bottom navigation
   * @returns The native Android view
   */
  public createNativeView(): android.view.View {

    // Use custom style defined in styles.xml
    const defStyleAttr = this.context
      .getResources()
      .getIdentifier('bottomNavigationStyle', 'attr', this.context.getPackageName());

    this.bottomNav = new com.google.android.material.bottomnavigation.BottomNavigationView(
      this.context,
      null,
      defStyleAttr
    );

    // Set label visibility mode
    this.bottomNav.setLabelVisibilityMode(com.google.android.material.bottomnavigation.LabelVisibilityMode.LABEL_VISIBILITY_LABELED);

    // Set up item selection listener
    this.bottomNav.setOnItemSelectedListener(new com.google.android.material.navigation.NavigationBarView.OnItemSelectedListener({
      onNavigationItemSelected: (menuItem: android.view.MenuItem): boolean => {
        const menuId = menuItem.getItemId();
        // Find the tab with this menu ID and navigate to its page
        for (const [tabId, menuItemId] of this.idToMenuId.entries()) {
          if (menuItemId === menuId) {
            this.navigateToTab(tabId);
            return true;
          }
        }
        return false;
      }
    }));

    // Apply current theme
    this.applyTheme();

    lifecycleEvents.on(Application.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    // Process any pending tabs that were added before view creation
    if (this.pendingTabs.length > 0) {
      this.pendingTabs.forEach(tab => this.addTabToMenu(tab));
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

    this.on('loaded', this._onLoaded);

    // Additional initialization if needed
  }

  private _onLoaded(args: EventData): void {
    console.log('bottomNavigation: onLoaded', this);
    // TODO: Fix this delayed execution if possible
    setTimeout(() => {
      const bottomNavHeight = Utils.layout.toDeviceIndependentPixels(this.bottomNav.getMinimumHeight());
      const paddingBottom = Utils.layout.toDeviceIndependentPixels(getInsets(this, android.view.WindowInsets.Type.systemBars()).bottom);

      // Set the height of the bottom navigation container
      this.height = bottomNavHeight + paddingBottom;

      console.log(
        'initNativeView - Desired DIPs:', bottomNavHeight,
        '| Set Pixels:', bottomNavHeight + paddingBottom,
        '| Padding Pixels:', paddingBottom,
        '| NS Height (DIPs):', this.height
      );
    }, 1000);
  }

  /**
   * Handles system appearance (dark/light mode) changes
   * @param event - The system appearance change event
   */
  private onSystemAppearanceChanged(event: SystemAppearanceChangedEventData): void {
    this.applyTheme(event.newValue === 'dark');
  }

  /**
   * Applies the current theme colors to the bottom navigation
   * Called when colors change or system theme changes
   */
  private applyTheme(isDarkMode = Application.systemAppearance() === 'dark'): void {
    if (!this.bottomNav) return;

    console.log('applyTheme');

    // Force the navigation view to recreate its drawable states
    // This will make it pick up the current theme colors
    this.bottomNav.refreshDrawableState();

    const backgroundColor = getColor(this._navBackgroundColor, this.context);
    const activeColor = getColor(this._activeColor, this.context);
    const inactiveColor = getColor(this._inactiveColor, this.context);
    const indicatorColor = getColor(this._indicatorColor, this.context);

    const itemStateList = createColorStateList(activeColor, inactiveColor);
    const indicatorStateList = createColorStateList(indicatorColor);

    this.bottomNav.setBackgroundColor(backgroundColor);
    this.bottomNav.setItemTextColor(itemStateList);
    this.bottomNav.setItemIconTintList(itemStateList);
    this.bottomNav.setItemActiveIndicatorColor(indicatorStateList);

    // Uniform the navigation bar appearance to match the bottom navigation background color
    setNavigationBarAppearance(backgroundColor, isDarkMode);
  }

  /**
   * Disposes the native view and cleans up resources
   * Called by NativeScript when the view is no longer needed
   */
  public disposeNativeView(): void {
    // Remove theme change listener
    lifecycleEvents.off(Application.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

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

    if (tab.icon?.startsWith('res://')) {
      const iconName = tab.icon.replace('res://', '');
      const resId = getResource(iconName, 'drawable', this.context);
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
  private navigateToTab(tabId: string): void {
    // Find the main frame to navigate
    const mainFrame = Frame.getFrameById('mainFrame');
    if (mainFrame) {
      // Navigate to page corresponding to tab ID
      // For example, if tab ID is "home", navigate to "views/home"
      mainFrame.navigate({
        moduleName: `views/main/${tabId}`, // TODO: Make this dynamic
        clearHistory: true
      });
    }
  }
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
navBackgroundColorProperty.register(BottomNavigation);
activeColorProperty.register(BottomNavigation);
inactiveColorProperty.register(BottomNavigation);
indicatorColorProperty.register(BottomNavigation);
