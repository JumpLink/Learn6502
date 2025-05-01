import { View } from "@nativescript/core";

/**
 * Represents a tab in the bottom navigation
 *
 * Used as a child element of the BottomNavigation component
 *
 * @example
 * <BottomTab id="home" title="Home" icon="res://ic_home" />
 */
export class BottomTab extends View {
  /**
   * The title of the tab displayed in the UI
   */
  title: string;

  /**
   * The icon of the tab
   * Should be a resource path starting with res:// (e.g., res://ic_home)
   */
  icon: string;

  /**
   * The unique identifier for the tab
   * Used for navigation to views/{id} and for internal tracking
   * If not specified, a random ID will be generated
   */
  id: string;
}
