import { Application, LaunchEventData, isAndroid } from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { setEdgeToEdge, restartApp, getRootViewWhenReady } from "./utils/index";
import { systemStates, SystemStates } from "./states";

if (!isAndroid) {
  throw new Error("This app is only supported on Android");
}

let restartRequiredOnResume = false;

systemStates.events.on(SystemStates.systemAppearanceChangedEvent, (event) => {
  const activity = Application.android
    .foregroundActivity as androidx.appcompat.app.AppCompatActivity;
  if (activity) {
    activity.getDelegate().applyDayNight();
  }
});

systemStates.events.on(SystemStates.contrastChangedEvent, async (event) => {
  console.log("contrastChangedEvent", event);

  // WORKAROUND: Flag the app for restart when the contrast mode changes
  //             (instead of restarting immediately)
  if (!event.initial) {
    console.log("Contrast changed, flagging for restart on resume.");
    restartRequiredOnResume = true;
  }

  // Remove all contrast classes and add the new one

  const rootView = await getRootViewWhenReady();

  rootView.cssClasses.delete("ns-contrast-normal");
  rootView.cssClasses.delete("ns-contrast-medium");
  rootView.cssClasses.delete("ns-contrast-high");
  rootView.cssClasses.add("ns-contrast-" + event.newValue);

  rootView._onCssStateChange();

  rootView._getRootModalViews()?.forEach((view) => {
    view.cssClasses.delete("ns-contrast-normal");
    view.cssClasses.delete("ns-contrast-medium");
    view.cssClasses.delete("ns-contrast-high");
    view.cssClasses.add("ns-contrast-" + event.newValue);

    view?._onCssStateChange();
  });

  console.log("rootView cssClasses", Array.from(rootView.cssClasses.values()));
});

systemStates.events.on(SystemStates.launchEvent, (_args: LaunchEventData) => {
  setEdgeToEdge(true);
});

// Add listener for the resume event to handle deferred restart
systemStates.events.on(SystemStates.resumeEvent, () => {
  console.log("Application resumed.");
  if (restartRequiredOnResume) {
    console.log("Restart required flag is set, restarting app now.");
    // Setze das Flag zurück, *bevor* der Neustart ausgelöst wird,
    // um Endlosschleifen zu vermeiden, falls der Neustart fehlschlägt.
    restartRequiredOnResume = false;
    restartApp();
  }
});

Application.setResources({ L: localize });
Application.run({ moduleName: "app-root" });
