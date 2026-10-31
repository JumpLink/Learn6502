import { DebuggerState, debuggerController } from "@learn6502/common-ui";
import type { Debugger as DebuggerWidget } from "@learn6502/ui";

import { asView } from "~/utils/as-view";
import type { ScreenModule } from "./editor";

let previous: DebuggerWidget | null = null;

/** Wrap the `$Debugger` the window built; the shared main window controller hands it the stack. */
export function buildDebuggerScreen(widget: DebuggerWidget): ScreenModule<DebuggerWidget> {
  // The previous debugger, if the activity was recreated, stops listening to the controller first.
  previous?.unbind();
  previous = widget;
  return {
    // The shared widget is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
    view: asView(widget),
    widget,
    onShow: () => {
      debuggerController.state = DebuggerState.ACTIVE;
    },
  };
}
