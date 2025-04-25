import { Application } from '@nativescript/core'
import { localize } from '@nativescript/localize'
// import { initThemes, switchTheme } from '@nativescript/theme-switcher'
import { initLifecycle } from './utils/lifecycle';

// initThemes({
//   // default is optional - will be auto-applied after initializing (*)
//   // default: () => import('theme-loader!./themes/default.scss'),
//   // red: () => import('theme-loader!./themes/red.scss'),
//   // green: () => import('theme-loader!./themes/green.scss'),
// })
initLifecycle();

Application.setResources({ L: localize });
Application.run({ moduleName: 'app-root' });