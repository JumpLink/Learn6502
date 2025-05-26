import {
  EventData,
  Page,
  GridLayout,
  ScrollView,
  TextView,
  LayoutBase,
} from "@nativescript/core";
import {
  debuggerController,
  DebuggerView,
  DebuggerState,
} from "@learn6502/common-ui";
import type { Memory, Simulator, Assembler } from "@learn6502/6502";

// Import custom widgets
import {
  MessageConsole,
  DebugInfo,
  HexMonitor,
  Hexdump,
  Disassembled,
} from "~/widgets/debugger";

class Debugger implements DebuggerView {
  private page: Page | null = null;

  // Widget instances
  private messageConsole: MessageConsole | null = null;
  private debugInfo: DebugInfo | null = null;
  private hexMonitor: HexMonitor | null = null;
  private hexdump: Hexdump | null = null;
  private disassembled: Disassembled | null = null;

  // State preservation
  private _isInitialized: boolean = false;

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

    console.log(
      `[Debugger] onNavigatingTo - isInitialized: ${this._isInitialized}`
    );

    // Get widget references from XML
    this.messageConsole =
      this.page.getViewById<MessageConsole>("messageConsole");
    this.debugInfo = this.page.getViewById<DebugInfo>("debugInfo");
    this.hexMonitor = this.page.getViewById<HexMonitor>("hexMonitor");
    this.hexdump = this.page.getViewById<Hexdump>("hexdump");
    this.disassembled = this.page.getViewById<Disassembled>("disassembled");

    if (
      !this.messageConsole ||
      !this.debugInfo ||
      !this.hexMonitor ||
      !this.hexdump ||
      !this.disassembled
    ) {
      console.error("Failed to find required components in debugger view");
      return;
    }

    // Initialize or re-initialize the debugger controller with widgets
    if (!this._isInitialized) {
      console.log("[Debugger] First initialization");
      this._isInitialized = true;
    } else {
      console.log("[Debugger] Re-initializing with existing state");
    }

    // Always re-initialize with current widgets (debuggerController handles state preservation)
    debuggerController.init(
      this.messageConsole,
      this.debugInfo,
      this.hexMonitor,
      this.disassembled,
      this.hexdump
    );

    // Set state to active when navigating to this view
    debuggerController.state = DebuggerState.ACTIVE;
  }

  public onNavigatingFrom(): void {
    console.log("[Debugger] onNavigatingFrom - preserving state");
    // The debuggerController maintains its state, we just disconnect the widgets
    // but keep the controller alive
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

  public updateHexdump(assembler: Assembler): void {
    debuggerController.updateHexdump(assembler);
  }

  public updateDisassembled(assembler: Assembler): void {
    debuggerController.updateDisassembled(assembler);
  }

  public reset(): void {
    debuggerController.reset();
  }

  public close(): void {
    debuggerController.close();
    this.page = null;

    // Clear widget references but don't reset initialization state
    this.messageConsole = null;
    this.debugInfo = null;
    this.hexMonitor = null;
    this.hexdump = null;
    this.disassembled = null;
  }

  /**
   * Get initialization status
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Force re-initialization (useful for testing or reset scenarios)
   */
  resetInitialization(): void {
    this._isInitialized = false;
    debuggerController.reset();
  }
}

// Create a singleton instance
const debuggerView = new Debugger();

// Export the instance methods for view binding
export const onNavigatingTo = debuggerView.onNavigatingTo.bind(debuggerView);
export const onNavigatingFrom =
  debuggerView.onNavigatingFrom.bind(debuggerView);
// Export the instance for external access if needed
export { debuggerView };
