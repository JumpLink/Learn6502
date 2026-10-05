/**
 * Navigation utilities for Android
 *
 * Handles back button navigation and provides utilities for navigation management.
 * Pattern from reference projects (conty, oss-weather, alpimaps).
 */

import type { View } from "@nativescript/core";
import { Application, Frame, Page, type AndroidActivityBackPressedEventData } from "@nativescript/core";
import { logger } from "./logger";

/**
 * App-level back handler, consulted before the default Frame / background logic.
 * The shell registers one so the active screen can consume the hardware back
 * button (e.g. the Learn screen pops its internal Adw.NavigationView). Returns
 * true when it handled the press. Needed because the app's root is a single-page
 * Frame: `Frame.canGoBack()` is always false, so the default handler would
 * background the app on every back press without this hook.
 */
let appBackHandler: (() => boolean) | null = null;

/** Register (or clear, with `null`) the app-level back handler. */
export function setAppBackHandler(handler: (() => boolean) | null): void {
  appBackHandler = handler;
}

/**
 * Check if a view should handle back button press
 * Based on pattern from reference projects
 */
function shouldHandleBackButton(view: View): boolean {
  if (!view) {
    return false;
  }

  // If it's a Page, check if it's the current page of its frame
  if (view instanceof Page) {
    if (view.frame?.currentPage !== view) {
      // Not the current page, ignore
      return false;
    }
  }

  // Check for modals
  let modalParent = view;
  const lastModalInStack = (modalParent as any)._getRootModalViews?.()?.slice(-1)[0];

  while (modalParent.parent && !(modalParent as any)._modalParent) {
    modalParent = modalParent.parent as View;
  }

  logger.debug("Navigation", "shouldHandleBackButton", view.id, (modalParent as any)._modalParent, lastModalInStack);

  // If there's a modal in the stack that's not the current parent, ignore
  if (lastModalInStack && lastModalInStack !== modalParent) {
    return false;
  }

  return true;
}

/**
 * Handle back button press for a view
 * Returns true if the back button was handled, false otherwise
 */
export function handleBackButton(view: View, callback: () => void): boolean {
  if (!shouldHandleBackButton(view)) {
    return false;
  }

  callback();
  return true;
}

/**
 * Setup back button handler
 * Registers a handler for Android back button events
 * Pattern from reference projects: direct Application.android.on() instead of wrapper
 */
export function setupBackButtonHandler(): void {
  if (!Application.android) {
    DEV_LOG && logger.warn("Navigation", "Android application not available, skipping back button handler setup");
    return;
  }

  if (!Application.android.activityBackPressedEvent) {
    DEV_LOG && logger.warn("Navigation", "Activity back pressed event not available");
    return;
  }

  Application.android.on(Application.android.activityBackPressedEvent, (event: AndroidActivityBackPressedEventData) => {
    // Give the active screen first chance (e.g. pop the Learn navigation stack).
    if (appBackHandler?.()) {
      event.cancel = true;
      return;
    }

    const rootView = Application.getRootView();
    if (!rootView) {
      return;
    }

    let handled = false;

    // Try to handle with Frame navigation first
    if (rootView instanceof Frame) {
      if (rootView.canGoBack()) {
        rootView.goBack();
        handled = true;
      }
    } else {
      // Try to handle with view's onBackPressed
      const viewArgs = {
        eventName: "activityBackPressed",
        object: rootView,
        activity: event.activity,
        cancel: false,
      };
      rootView.notify(viewArgs);

      if (viewArgs.cancel || rootView.onBackPressed()) {
        handled = true;
      }
    }

    // If handled, cancel the default behavior
    if (handled) {
      event.cancel = true;
    } else {
      // If no navigation possible, move app to background
      // This follows the pattern from reference projects
      const activity = Application.android.foregroundActivity;
      if (activity) {
        activity.moveTaskToBack(true);
        event.cancel = true;
      }
    }
  });

  logger.debug("Navigation", "Back button handler setup complete");
}
