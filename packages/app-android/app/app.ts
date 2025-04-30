import { Application, SystemAppearanceChangedEventData, isAndroid } from '@nativescript/core'
import { localize } from '@nativescript/localize'
import { initLifecycle, lifecycleEvents, getContrastMode, setEdgeToEdge } from './utils/index';


if (!isAndroid) {
  throw new Error('This app is only supported on Android');
}

initLifecycle();

lifecycleEvents.on(Application.systemAppearanceChangedEvent, (args: SystemAppearanceChangedEventData) => {
  const activity = Application.android.foregroundActivity as androidx.appcompat.app.AppCompatActivity;
  activity.getDelegate().applyDayNight();

  console.log('getContrastMode', getContrastMode());
});

// Initialize both statusBar and themeManager after launch
lifecycleEvents.on(Application.launchEvent, () => {
  console.log('Application: Launch event');

  setEdgeToEdge(true);

  console.log('getContrastMode', getContrastMode());
});


Application.setResources({ L: localize });
Application.run({ moduleName: 'app-root' });
