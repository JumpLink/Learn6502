import {
  Application,
  Frame,
  LaunchEventData,
  SystemAppearanceChangedEventData,
  View,
  isAndroid,
  Utils,
} from "@nativescript/core";
import { localize } from "@nativescript/localize";
import {
  initLifecycle,
  lifecycleEvents,
  getContrastMode,
  setEdgeToEdge,
} from "./utils/index";

if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

initLifecycle();

lifecycleEvents.on(
  Application.systemAppearanceChangedEvent,
  (_args: SystemAppearanceChangedEventData) => {
    const activity = Application.android
      .foregroundActivity as androidx.appcompat.app.AppCompatActivity;
    activity.getDelegate().applyDayNight();
  }
);

lifecycleEvents.on(
  "loaded:app-root",
  (event: { rootFrame: Frame; rootView: View }) => {
    const contrastMode = getContrastMode();

    // Enable Material You dynamic colors if available (Android 12+)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
      console.log("Applying Material You dynamic colors");
      // Enable Material You dynamic colors
      com.google.android.material.color.DynamicColors.applyToActivitiesIfAvailable(
        Application.android.nativeApp
      );
    }

    console.log("contrastMode", contrastMode);
    // TODO: Detect contrast mode change, remove old class and add new one
    // TODO: Apply this to native elements as well
    event.rootView.cssClasses.add("ns-contrast-" + contrastMode);
    // see https://github.com/NativeScript/plugins/blob/5b4822ab9dd7501259dd6e2c7ef7826ed25a7d69/packages/theme-switcher/index.ts#L94
    event.rootView._onCssStateChange();
    event.rootView._getRootModalViews()?.forEach((view) => {
      view.cssClasses.add("ns-contrast-" + contrastMode);
      view?._onCssStateChange();
    });

    console.log(
      "rootView cssClasses",
      Array.from(event.rootView.cssClasses.values())
    );
  }
);

lifecycleEvents.on(Application.launchEvent, (_args: LaunchEventData) => {
  setEdgeToEdge(true);
});

Application.setResources({ L: localize });
Application.run({ moduleName: "app-root" });
