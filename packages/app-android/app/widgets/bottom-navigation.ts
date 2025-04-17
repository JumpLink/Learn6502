import { ContentView, Property, View, Frame, Application } from '@nativescript/core';
import { BottomTab } from './bottom-tab';

export class BottomNavigation extends ContentView {
  private bottomNav: com.google.android.material.bottomnavigation.BottomNavigationView;
  private pendingTabs: BottomTab[] = [];
  private tabsById = new Map<string, BottomTab>();
  private idToMenuId = new Map<string, number>();

  public createNativeView(): android.view.View {
    const context = this._context;
    this.bottomNav = new com.google.android.material.bottomnavigation.BottomNavigationView(context);

    // Set background color
    const backgroundColor = context.getResources().getColor(context.getResources().getIdentifier("md_theme_primary", "color", context.getPackageName()));
    this.bottomNav.setBackgroundColor(backgroundColor);

    // Set item color
    const itemColor = context.getResources().getColor(context.getResources().getIdentifier("md_theme_onPrimary", "color", context.getPackageName()));
    this.bottomNav.setItemTextColor(android.content.res.ColorStateList.valueOf(itemColor));
    this.bottomNav.setItemIconTintList(android.content.res.ColorStateList.valueOf(itemColor));

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

    // Process any pending tabs that were added before view creation
    if (this.pendingTabs.length > 0) {
      this.pendingTabs.forEach(tab => this.addTabToMenu(tab));
      this.pendingTabs = [];
    }

    return this.bottomNav;
  }

  public initNativeView(): void {
    super.initNativeView();
    // Additional initialization if needed
  }

  public disposeNativeView(): void {
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
      // For example, if tab ID is "home", navigate to "pages/home.page"
      mainFrame.navigate({
        moduleName: `pages/${tabId}.page`,
        clearHistory: true
      });
    }
  }
}
