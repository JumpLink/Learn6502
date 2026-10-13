import { GameConsole as GameConsoleWidget } from "@learn6502/ui";
import { createSimulatorStack } from "@learn6502/common-ui";
import { asView } from "~/utils/as-view";
import type { ScreenModule } from "./editor";

/** One simulator stack for the process: the activity, and the widgets with it, are rebuilt around it. */
export const simulatorStack = createSimulatorStack();

let widget: GameConsoleWidget | null = null;

/** Build the game console screen; the shared main window controller hands it the stack. */
export function buildGameConsoleScreen(): ScreenModule<GameConsoleWidget> {
  // The previous console, if the activity was recreated, stops listening to memory first.
  widget?.unbind();
  widget = new GameConsoleWidget();
  // The shared widget is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
  return { view: asView(widget), widget };
}
