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
  restartApp,
} from "./utils/index";
import { ContrastMode } from "./constants";
import { ContrastChangeEventData } from "./types";

if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

let restartRequiredOnResume = false;

initLifecycle();

lifecycleEvents.on(
  Application.systemAppearanceChangedEvent,
  (_args: SystemAppearanceChangedEventData) => {
    const activity = Application.android
      .foregroundActivity as androidx.appcompat.app.AppCompatActivity;
    if (activity) {
      activity.getDelegate().applyDayNight();
    }
  }
);

lifecycleEvents.on(contrastChangedEvent, (event: ContrastChangeEventData) => {
  console.log("contrastChangedEvent", event);

  // WORKAROUND: Flag the app for restart when the contrast mode changes
  //             (instead of restarting immediately)
  if (!event.initial) {
    console.log("Contrast changed, flagging for restart on resume.");
    restartRequiredOnResume = true;
  }

  // Remove all contrast classes and add the new one

  const rootView = Application.getRootView();

  if (!rootView) {
    console.error("rootView not found");
    return;
  }

  rootView.cssClasses.delete("ns-contrast-normal");
  rootView.cssClasses.delete("ns-contrast-medium");
  rootView.cssClasses.delete("ns-contrast-high");
  rootView.cssClasses.add("ns-contrast-" + event.contrastMode);

  rootView._onCssStateChange();

  rootView._getRootModalViews()?.forEach((view) => {
    view.cssClasses.delete("ns-contrast-normal");
    view.cssClasses.delete("ns-contrast-medium");
    view.cssClasses.delete("ns-contrast-high");
    view.cssClasses.add("ns-contrast-" + event.contrastMode);

    view?._onCssStateChange();
  });

  console.log("rootView cssClasses", Array.from(rootView.cssClasses.values()));
});

lifecycleEvents.on(Application.launchEvent, (_args: LaunchEventData) => {
  setEdgeToEdge(true);
});

// Add listener for the resume event to handle deferred restart
lifecycleEvents.on(Application.resumeEvent, () => {
  console.log("Application resumed.");
  if (restartRequiredOnResume) {
    console.log("Restart required flag is set, restarting app now.");
    // Setze das Flag zurück, *bevor* der Neustart ausgelöst wird,
    // um Endlosschleifen zu vermeiden, falls der Neustart fehlschlägt.
    restartRequiredOnResume = false;
    restartApp();
  }
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
