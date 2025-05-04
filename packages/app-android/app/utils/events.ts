import {
  Application,
  LaunchEventData,
  type SystemAppearanceChangedEventData,
  Utils,
} from "@nativescript/core";
import {
  androidLaunchEventLocalizationHandler,
  overrideLocale,
} from "@nativescript/localize";
import { EventDispatcher } from "@learn6502/6502";
import { ContrastMode } from "../constants";

// Import necessary AndroidX classes
import androidx_core_view_ViewCompat = androidx.core.view.ViewCompat;
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;
import androidx_core_view_OnApplyWindowInsetsListener = androidx.core.view.OnApplyWindowInsetsListener;
import android_view_View = android.view.View;
import { ContrastChangeEventData } from "~/types";

let initialized = false;

// Use 'any' as the generic type for now, as the dispatcher doesn't support event-specific types
export const events = new EventDispatcher</*Events:EventMap*/ any>();

/**
 * Event name for window insets changes.
 */
export const windowInsetsChangedEvent = "windowInsetsChanged";

/**
 * Event name for contrast mode changes.
 */
export const contrastChangedEvent = "contrastChanged";

/**
 * Initializes theme-related functionality when the app is ready
 */
export function onLaunch(event: LaunchEventData) {
  if (!event.android)
    throw new Error("Events:: onLaunch - No Android event found");
  if (initialized) throw new Error("Events:: onLaunch - Already initialized");
  initialized = true;

  androidLaunchEventLocalizationHandler();

  console.log("Events:: onLaunch called");

  // Get initial system appearance
  const systemAppearance = Application.systemAppearance();
  console.log("systemAppearance", systemAppearance);

  // Set the default locale for testing, see https://docs.nativescript.org/plugins/localize#changing-the-language-dynamically-at-runtime
  const localeOverriddenSuccessfully = overrideLocale("de-DE");
  console.log("localeOverriddenSuccessfully", localeOverriddenSuccessfully);

  events.dispatch(Application.launchEvent, event);

  listenContrastChange();

  listenWindowInsetsChange();
}

const listenContrastChange = () => {
  // Listen for contrast changes (API 34+)
  if (android.os.Build.VERSION.SDK_INT < 34) {
    console.warn("ContrastChangeListener requires API level 34+.");
    return;
  }

  const context = Utils.android.getApplicationContext();
  if (!context) {
    console.error("Could not get application context for contrast listener.");
    return;
  }

  const uiModeManager = context.getSystemService(
    android.content.Context.UI_MODE_SERVICE
  ) as android.app.UiModeManager;

  if (!uiModeManager) {
    console.error("Could not get UiModeManager service for contrast listener.");
    return;
  }

  // Get the main executor to run the callback on the main thread
  const mainExecutor = context.getMainExecutor();
  if (!mainExecutor) {
    console.error("Could not get main executor for ContrastChangeListener.");
    return;
  }

  const contrastListener = new android.app.UiModeManager.ContrastChangeListener(
    {
      onContrastChanged: (contrastLevel: number) => {
        console.log("System contrast changed:", contrastLevel);
        let newMode: ContrastMode;
        if (contrastLevel === 1) {
          newMode = ContrastMode.HIGH;
        } else if (contrastLevel === 0.5) {
          newMode = ContrastMode.MEDIUM;
        } else {
          newMode = ContrastMode.NORMAL;
        }
        const contrastChangeEventData: ContrastChangeEventData = {
          contrastMode: newMode,
          initial: false,
        };
        events.dispatch(contrastChangedEvent, contrastChangeEventData);
      },
    }
  );

  // Get initial contrast state and dispatch
  const initialContrast = uiModeManager.getContrast();
  console.log("Initial system contrast level:", initialContrast);
  let initialMode: ContrastMode;
  if (initialContrast === 1) {
    initialMode = ContrastMode.HIGH;
  } else if (initialContrast === 0.5) {
    initialMode = ContrastMode.MEDIUM;
  } else {
    initialMode = ContrastMode.NORMAL;
  }

  // Dispatch initial state
  const contrastChangeEventData: ContrastChangeEventData = {
    contrastMode: initialMode,
    initial: true,
  };

  events.dispatch(contrastChangedEvent, contrastChangeEventData);

  uiModeManager.addContrastChangeListener(mainExecutor, contrastListener);
  console.log("ContrastChangeListener added.");
};

const listenWindowInsetsChange = () => {
  const activity =
    Application.android?.foregroundActivity ||
    Application.android?.startActivity;
  if (!activity) {
    throw new Error(
      "Events:: Could not get activity to attach WindowInsets listener."
    );
  }

  const rootView = activity.getWindow().getDecorView().getRootView();
  if (!rootView) {
    throw new Error(
      "Events:: Could not get root view to attach WindowInsets listener."
    );
  }

  androidx_core_view_ViewCompat.setOnApplyWindowInsetsListener(
    rootView,
    new androidx_core_view_OnApplyWindowInsetsListener({
      onApplyWindowInsets: (
        view: android_view_View,
        insets: androidx_core_view_WindowInsetsCompat
      ): androidx_core_view_WindowInsetsCompat => {
        events.dispatch(windowInsetsChangedEvent, insets);
        // Return the insets consumed by the decor view's default listener
        // to ensure proper handling by the system
        return androidx_core_view_ViewCompat.onApplyWindowInsets(view, insets);
      },
    })
  );
  // Request initial insets
  rootView.requestApplyInsets();
};

/**
 * Initializes the Events: hooks at the appropriate time based on platform
 */
export function setupEvents() {
  if (!Application.android) {
    throw new Error("Events:: setupEvents - No Android application found");
  }

  // This registers the onLaunch handler to the native Application event.
  // onLaunch itself will dispatch the event via events.
  Application.once(Application.launchEvent, onLaunch);

  // Listen for theme changes
  Application.on(
    Application.systemAppearanceChangedEvent,
    (event: SystemAppearanceChangedEventData) => {
      events.dispatch(Application.systemAppearanceChangedEvent, event);
    }
  );

  // Listen for display changes
  Application.on(Application.displayedEvent, () => {
    events.dispatch(Application.displayedEvent, {});
  });

  // Listen for resume events
  Application.on(Application.resumeEvent, (args) => {
    events.dispatch(Application.resumeEvent, args);
  });
}
