import type { GameConsole as GameConsoleWidget } from "@learn6502/ui";
import { createSimulatorStack } from "@learn6502/common-ui";
import { asView } from "~/utils/as-view";
import type { ScreenModule } from "./editor";

/** One simulator stack for the process: the activity, and the widgets with it, are rebuilt around it. */
export const simulatorStack = createSimulatorStack();

let previous: GameConsoleWidget | null = null;

/** Wrap the `$GameConsole` the window built; the shared main window controller hands it the stack. */
export function buildGameConsoleScreen(widget: GameConsoleWidget): ScreenModule<GameConsoleWidget> {
  // The previous console, if the activity was recreated, stops listening to memory first.
  previous?.unbind();
  previous = widget;
  // The shared widget is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
  return { view: asView(widget), widget };
}
