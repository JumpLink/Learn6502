import { ContentView, Property, View, Frame, Application, SystemAppearanceChangedEventData } from '@nativescript/core';
import { BottomTab } from './bottom-tab';
import { createColorStateList, getColor } from '../utils/color';
import { lifecycleEvents } from '../utils/lifecycle';
export class BottomNavigation extends ContentView {
  private bottomNav: com.google.android.material.bottomnavigation.BottomNavigationView;
  private pendingTabs: BottomTab[] = [];
  private tabsById = new Map<string, BottomTab>();
  private idToMenuId = new Map<string, number>();

  constructor() {
    super();
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
  }

  public createNativeView(): android.view.View {
    const context = this._context as android.content.Context;
    this.bottomNav = new com.google.android.material.bottomnavigation.BottomNavigationView(context);

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

  private onSystemAppearanceChanged(event: SystemAppearanceChangedEventData): void {
    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.bottomNav) return;
    const context = this._context as android.content.Context;

    // Force the navigation view to recreate its drawable states
    // This will make it pick up the current theme colors
    this.bottomNav.refreshDrawableState();

    // Set default material 3 colors for light and dark themes

    // Material Design 3 default color mappings:
    // Container background: ?attr/colorSurfaceContainer
    // Text/Icons active: ?attr/colorOnSurface (text), ?attr/colorOnSecondaryContainer (icons)
    // Text/Icons inactive: ?attr/colorOnSurfaceVariant
    // Active indicator: ?attr/colorSecondaryContainer
    // Source: https://github.com/material-components/material-components-android/blob/4f55422744129bee5fe07fb8fb22f32876a92ff2/docs/components/BottomNavigation.md

    const backgroundColor = getColor(context, "md_theme_surfaceContainer");
    const activeColor = getColor(context, "md_theme_onSurface");
    const inactiveColor = getColor(context, "md_theme_onSurfaceVariant");
    const indicatorColor = getColor(context, "md_theme_secondaryContainer");

    const itemStateList = createColorStateList(activeColor, inactiveColor);
    const indicatorStateList = createColorStateList(indicatorColor);

    this.bottomNav.setBackgroundColor(backgroundColor);
    this.bottomNav.setItemTextColor(itemStateList);
    this.bottomNav.setItemIconTintList(itemStateList);
    this.bottomNav.setItemActiveIndicatorColor(indicatorStateList);
  }

  public initNativeView(): void {
    super.initNativeView();
    // Additional initialization if needed
  }

  public disposeNativeView(): void {
    // Remove theme change listener
    lifecycleEvents.off(Application.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    this.bottomNav = null;
    this.tabsById.clear();
    this.idToMenuId.clear();
    super.disposeNativeView();
  }

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

  private addTabToMenu(tab: BottomTab): void {
    const menuId = Math.floor(Math.random() * 10000);
    tab.id = tab.id || `tab${menuId}`;

    const menuItem = this.bottomNav.getMenu().add(0, menuId, 0, tab.title);
    // Map tab ID to menu item ID
    this.idToMenuId.set(tab.id, menuId);

    if (tab.icon?.startsWith('res://')) {
      const iconName = tab.icon.replace('res://', '');
      const resId = this._context.getResources().getIdentifier(iconName, 'drawable', this._context.getPackageName());
      if (resId) {
        menuItem.setIcon(resId);
      }
    }
  }

  private navigateToTab(tabId: string): void {
    // Find the main frame to navigate
    const mainFrame = Frame.getFrameById('mainFrame');
    if (mainFrame) {
      // Navigate to page corresponding to tab ID
      // For example, if tab ID is "home", navigate to "views/home"
      mainFrame.navigate({
        moduleName: `views/${tabId}`,
        clearHistory: true
      });
    }
  }
}
