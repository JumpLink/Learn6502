import {
  Application,
  Frame,
  LaunchEventData,
  SystemAppearanceChangedEventData,
  View,
  isAndroid,
} from "@nativescript/core";
import { localize } from "@nativescript/localize";
import {
  initLifecycle,
  lifecycleEvents,
  setEdgeToEdge,
  contrastChangedEvent,
} from "./utils/index";
import { ContrastMode } from "./constants";

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

lifecycleEvents.on(contrastChangedEvent, (contrastMode: ContrastMode) => {
  console.log("contrastChangedEvent", contrastMode);

  const rootView = Application.getRootView();

  rootView.cssClasses.delete("ns-contrast-normal");
  rootView.cssClasses.delete("ns-contrast-medium");
  rootView.cssClasses.delete("ns-contrast-high");
  rootView.cssClasses.add("ns-contrast-" + contrastMode);

  rootView._onCssStateChange();

  rootView._getRootModalViews()?.forEach((view) => {
    view.cssClasses.delete("ns-contrast-normal");
    view.cssClasses.delete("ns-contrast-medium");
    view.cssClasses.delete("ns-contrast-high");
    view.cssClasses.add("ns-contrast-" + contrastMode);

    view?._onCssStateChange();
  });

  console.log("rootView cssClasses", Array.from(rootView.cssClasses.values()));
});

lifecycleEvents.on(Application.launchEvent, (_args: LaunchEventData) => {
  setEdgeToEdge(true);
});

lifecycleEvents.on(
  "loaded:app-root",
  (event: { rootFrame: Frame; rootView: View }) => {
    const rootView = event.rootView;
    console.log("rootView", rootView);
  }
);

Application.setResources({ L: localize });
Application.run({ moduleName: "app-root" });
