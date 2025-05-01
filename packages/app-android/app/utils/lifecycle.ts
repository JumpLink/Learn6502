import { Application, LaunchEventData, type SystemAppearanceChangedEventData } from '@nativescript/core';
import { androidLaunchEventLocalizationHandler, overrideLocale } from '@nativescript/localize'
import { EventDispatcher } from '@learn6502/6502'

// Import necessary AndroidX classes
import androidx_core_view_ViewCompat = androidx.core.view.ViewCompat;
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;
import androidx_core_view_OnApplyWindowInsetsListener = androidx.core.view.OnApplyWindowInsetsListener;
import android_view_View = android.view.View;

let initialized = false;

// Define event types separately for clarity
/*
type LifecycleEventMap = {
  [Application.launchEvent]: LaunchEventData;
  [Application.systemAppearanceChangedEvent]: SystemAppearanceChangedEventData;
  [Application.displayedEvent]: {};
  windowInsetsChanged: androidx_core_view_WindowInsetsCompat;
};
*/

// Use 'any' as the generic type for now, as the dispatcher doesn't support event-specific types
export const lifecycleEvents = new EventDispatcher</*LifecycleEventMap*/ any>();

/**
 * Event name for window insets changes.
 */
export const windowInsetsChangedEvent = 'windowInsetsChanged';

/**
 * Initializes theme-related functionality when the app is ready
 */
export function onLaunch(event: LaunchEventData) {
  if (!event.android) return;
  if (initialized) return;
  initialized = true;

  androidLaunchEventLocalizationHandler()

  console.log('Lifecycle: onLaunch called');

  // TODO: Not ready for this yet
  // Get initial system appearance
  const systemAppearance = Application.systemAppearance();
  console.log('systemAppearance', systemAppearance);

  // Set the default locale for testing, see https://docs.nativescript.org/plugins/localize#changing-the-language-dynamically-at-runtime
  const localeOverriddenSuccessfully = overrideLocale('de-DE')
  console.log('localeOverriddenSuccessfully', localeOverriddenSuccessfully);

  lifecycleEvents.dispatch(Application.launchEvent, event);
}

/**
 * Initializes the lifecycle hooks at the appropriate time based on platform
 */
export function initLifecycle() {
  if (Application.android) {
    Application.once(Application.launchEvent, onLaunch);

    // Listen for window insets after the launch event completes
    Application.once(Application.launchEvent, () => {
      const activity = Application.android.foregroundActivity || Application.android.startActivity;
      if (activity) {
        const rootView = activity.getWindow().getDecorView().getRootView();
        if (rootView) {
          androidx_core_view_ViewCompat.setOnApplyWindowInsetsListener(rootView, new androidx_core_view_OnApplyWindowInsetsListener({
            onApplyWindowInsets: (view: android_view_View, insets: androidx_core_view_WindowInsetsCompat): androidx_core_view_WindowInsetsCompat => {
              console.log('Lifecycle: onApplyWindowInsets dispatched');
              lifecycleEvents.dispatch(windowInsetsChangedEvent, insets);
              // Return the insets consumed by the decor view's default listener
              // to ensure proper handling by the system
              return androidx_core_view_ViewCompat.onApplyWindowInsets(view, insets);
            }
          }));
          // Request initial insets
          androidx_core_view_ViewCompat.requestApplyInsets(rootView);
          console.log('Lifecycle: WindowInsets listener attached to root view.');
        } else {
          console.error('Lifecycle: Could not get root view to attach WindowInsets listener.');
        }
      } else {
        console.error('Lifecycle: Could not get activity to attach WindowInsets listener.');
      }
    });
  }

  // Listen for theme changes
  Application.on(Application.systemAppearanceChangedEvent, (event: SystemAppearanceChangedEventData) => {
    console.log('systemAppearanceChangedEvent', event.newValue);
    lifecycleEvents.dispatch(Application.systemAppearanceChangedEvent, event);
  });

  // Listen for display changes
  Application.on(Application.displayedEvent, () => {
    console.log('displayedEvent');
    lifecycleEvents.dispatch(Application.displayedEvent, {});
  });
}
