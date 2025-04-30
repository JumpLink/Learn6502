import { Application, LaunchEventData, type SystemAppearanceChangedEventData } from '@nativescript/core';
import { androidLaunchEventLocalizationHandler, overrideLocale } from '@nativescript/localize'
import { EventDispatcher } from '@learn6502/6502'

let initialized = false;

export const lifecycleEvents = new EventDispatcher();

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
