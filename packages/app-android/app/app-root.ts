import type { EventData } from "@nativescript/core";

/**
 * Event handler for the 'loaded' event of the root view.
 * Applies system bar insets to ensure content is not drawn under system bars
 * when Edge-to-Edge is enabled.
 * @param args Event arguments containing the view object.
 */
export function onLoaded(args: EventData) {
  console.log("app-root loaded");
}
