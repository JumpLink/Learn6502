import { Application, type SystemAppearanceChangedEventData, Utils } from '@nativescript/core';

let initialized = false;


/**
 * Initializes theme-related functionality when the app is ready
 */
export function onReady() {
  if (initialized) return;
  initialized = true;

  console.log('Lifecycle: onReady called');

  // TODO: Not ready for this yet
  // Get initial system appearance
  const systemAppearance = Application.systemAppearance();
  console.log('systemAppearance', systemAppearance);

  // Listen for theme changes
  Application.on(Application.systemAppearanceChangedEvent, (event: SystemAppearanceChangedEventData) => {
    console.log('systemAppearanceChangedEvent', event.newValue);
  });
}

/**
 * Initializes the lifecycle hooks at the appropriate time based on platform
 */
export function initLifecycle() {
  if (Application.android) {
    // const context = Utils.android.getApplicationContext();
    // if (context) {
    //   console.log('Already initialized');
    //   onReady();
    // } else {
    //   console.log('Not initialized, waiting for launchEvent');
    //   Application.once(Application.launchEvent, onReady);
    // }
    Application.once(Application.launchEvent, onReady);
  }
}
