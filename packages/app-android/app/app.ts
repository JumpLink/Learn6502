import { Application, SystemAppearanceChangedEventData, isAndroid } from '@nativescript/core'
import { localize } from '@nativescript/localize'
import { initLifecycle, lifecycleEvents } from './utils/lifecycle';
import { initStatusBar } from './services/status-bar';


if (!isAndroid) {
  throw new Error('This app is only supported on Android');
}

initLifecycle();

lifecycleEvents.on(Application.systemAppearanceChangedEvent, (args: SystemAppearanceChangedEventData) => {
  const activity = Application.android.foregroundActivity as androidx.appcompat.app.AppCompatActivity;
  activity.getDelegate().applyDayNight();
});

// Initialize both statusBar and themeManager after launch
lifecycleEvents.on(Application.launchEvent, () => {
  console.log('Application: Launch event');

  // Initialize StatusBar first
  initStatusBar();
});

Application.setResources({ L: localize });
Application.run({ moduleName: 'app-root' });