import type { SimulatorState, Memory, Labels, Simulator, Assembler } from "@learn6502/core";
import { GameConsole as GameConsoleWidget } from "@learn6502/ui";
import { gameConsoleController, createSimulatorStack } from "@learn6502/common-ui";
import { asView } from "~/utils/as-view";
import type { ScreenModule } from "./editor";

/** One simulator stack for the process: the activity, and the widgets with it, are rebuilt around it. */
const stack = createSimulatorStack();

/**
 * Thin Android glue around the shared `@learn6502/ui` GameConsole: it owns the simulator stack
 * (the widget receives it) and forwards the shell's calls to the shared controller.
 */
class GameConsoleGlue {
  private widget: GameConsoleWidget | null = null;

  get memory(): Memory {
    return stack.memory;
  }
  get labels(): Labels {
    return stack.labels;
  }
  get simulator(): Simulator {
    return stack.simulator;
  }
  get assembler(): Assembler {
    return stack.assembler;
  }
  get state(): SimulatorState {
    return stack.simulator.state;
  }

  build(): ScreenModule {
    // The previous console, if the activity was recreated, stops listening to memory first.
    this.widget?.unbind();
    const widget = new GameConsoleWidget();
    widget.setSimulatorStack(stack);
    this.widget = widget;
    // The shared widget is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
    return { view: asView(widget) };
  }

  run(): void {
    gameConsoleController.run();
  }
  stop(): void {
    gameConsoleController.stop();
  }
  reset(): void {
    gameConsoleController.reset();
  }
}

export const gameConsoleView = new GameConsoleGlue();

/** Build the game console screen for the shell's Adw.ViewStack. */
export function buildGameConsoleScreen(): ScreenModule {
  return gameConsoleView.build();
}
