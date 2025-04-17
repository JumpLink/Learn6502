/*
In NativeScript, the app.ts file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/
import { Application, type SystemAppearanceChangedEventData } from '@nativescript/core'

// Not ready yet?
// const systemAppearance = Application.systemAppearance();
// console.log('systemAppearance', systemAppearance);

Application.on(Application.systemAppearanceChangedEvent, (event: SystemAppearanceChangedEventData) => {
  console.log('systemAppearanceChangedEvent', event.newValue);
});

Application.run({ moduleName: 'app-root' })

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
