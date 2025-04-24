import { Application, type SystemAppearanceChangedEventData } from '@nativescript/core';
import { androidLaunchEventLocalizationHandler, overrideLocale } from '@nativescript/localize'

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

  // Set the default locale for testing, see https://docs.nativescript.org/plugins/localize#changing-the-language-dynamically-at-runtime
  const localeOverriddenSuccessfully = overrideLocale('de-DE')
  console.log('localeOverriddenSuccessfully', localeOverriddenSuccessfully);
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

    Application.on(Application.launchEvent, (args) => {
      if (args.android) {
        androidLaunchEventLocalizationHandler()
      }
    })

  }
}
