import { EventData, Page } from "@nativescript/core";
import {
  debuggerController,
  DebuggerView,
  DebuggerState,
} from "@learn6502/common-ui";
import type { Memory, Simulator } from "@learn6502/6502";

class Debugger implements DebuggerView {
  private page: Page | null = null;

  // Implement required properties from DebuggerView interface
  public get state(): DebuggerState {
    return debuggerController.state;
  }

  public set state(value: DebuggerState) {
    debuggerController.state = value;
  }

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;

    console.log("debugger: onNavigatingTo", this.page);
    // Set state to active when navigating to this view
    debuggerController.state = DebuggerState.ACTIVE;
  }

  // Implement required methods from DebuggerView interface
  public update(memory: Memory, simulator: Simulator): void {
    debuggerController.update(memory, simulator);
  }

  public updateMonitor(memory: Memory): void {
    debuggerController.updateMonitor(memory);
  }

  public updateDebugInfo(simulator: Simulator): void {
    debuggerController.updateDebugInfo(simulator);
  }

  public reset(): void {
    debuggerController.reset();
  }

  public close(): void {
    debuggerController.close();
    this.page = null;
  }
}

// Create a singleton instance
const debuggerView = new Debugger();

// Export the instance methods for view binding
export const onNavigatingTo = debuggerView.onNavigatingTo.bind(debuggerView);
// Export the instance for external access if needed
export { debuggerView };
