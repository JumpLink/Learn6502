import { Application } from "@nativescript/core";
import { events } from "./utils";
import type { EventData, Frame } from "@nativescript/core";

export function onLoaded(args: EventData) {
  const rootFrame = args.object as Frame;
  console.log("app-root loaded", rootFrame);

  // TODO: Add contrast classes to rootView
  const rootView = Application.getRootView();
  console.log("rootView cssClasses", Array.from(rootView.cssClasses.values()));

  events.dispatch("loaded:app-root", { rootFrame, rootView });
}
