import { Application } from '@nativescript/core'
import { localize } from '@nativescript/localize'
// import { initThemes, switchTheme } from '@nativescript/theme-switcher'
import { initLifecycle, lifecycleEvents } from './utils/lifecycle';
import { initStatusBar } from './status-bar';
import { initThemeColors } from './style';
// import { initThemeManager } from './theme';

// initThemes({
//   // default is optional - will be auto-applied after initializing (*)
//   // default: () => import('theme-loader!./themes/default.scss'),
//   // red: () => import('theme-loader!./themes/red.scss'),
//   // green: () => import('theme-loader!./themes/green.scss'),
// })
initLifecycle();




// Initialize both statusBar and themeManager after launch
lifecycleEvents.on(Application.launchEvent, () => {
  console.log('Application: Launch event');
  // Initialize StatusBar first
  initStatusBar();

  // initThemeManager();

  // Extrahiere Theme-Farben und stelle sie als CSS-Variablen bereit
  initThemeColors();
});

Application.setResources({ L: localize });
Application.run({ moduleName: 'app-root' });