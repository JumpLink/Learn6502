import type { EventData, Frame } from "@nativescript/core";

/**
 * Root Frame loaded handler
 *
 * Note: Edge-to-edge is automatically enabled by NativeScript.
 * Window insets are handled via androidOverflowInset event on Pages
 * with androidOverflowEdge="dont-apply" and exposed as CSS variables.
 */
export function onLoaded(args: EventData) {
  const rootFrame = args.object as Frame;

  // Remove any padding from root Frame for edge-to-edge display
  // The insets are handled via CSS variables (--windowInsetTop, etc.), not root view padding
  // Pattern: NativeScript's edge-to-edge implementation expects no padding on root view
  if (rootFrame?.style) {
    rootFrame.style.paddingTop = 0;
    rootFrame.style.paddingBottom = 0;
    rootFrame.style.paddingLeft = 0;
    rootFrame.style.paddingRight = 0;
  }

  console.log("app-root loaded");
}
