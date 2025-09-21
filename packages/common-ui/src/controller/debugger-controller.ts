import {
  type Memory,
  type Simulator,
  type Assembler,
  EventDispatcher,
  throttle,
} from "@learn6502/6502";

import { DebuggerState } from "../data/index.ts";
import type { DebuggerEventMap } from "../types/index.ts";
import {
  type MessageConsoleWidget,
  type DebugInfoWidget,
  type HexMonitorWidget,
  type DisassembledWidget,
  type HexdumpWidget,
  DummyMessageConsole,
} from "../widgets/index.ts";
import { debuggerStateService } from "../services/index.ts";

/**
 * Platform-independent debugger controller
 * Acts as a coordinator between debugger state service and UI widgets
 */
class DebuggerController {
  // Reference to the last memory update for refreshing when monitor options change
  protected memory: Memory | null = null;

  // Event dispatcher for debugger events
  protected events = new EventDispatcher<DebuggerEventMap>();

  // Widgets for output and display
  protected console: MessageConsoleWidget = new DummyMessageConsole();
  protected debugInfo: DebugInfoWidget | null = null;
  protected hexMonitor: HexMonitorWidget | null = null;
  protected disassembled: DisassembledWidget | null = null;
  protected hexdump: HexdumpWidget | null = null;

  // Core references (set once during init)
  protected assembler: Assembler | null = null;
  protected simulator: Simulator | null = null;

  /**
   * Get the current state of the debugger
   */
  public get state(): DebuggerState {
    return debuggerStateService.debuggerState;
  }

  /**
   * Set the current state of the debugger
   */
  public set state(value: DebuggerState) {
    if (debuggerStateService.debuggerState === value) return;
    debuggerStateService.debuggerState = value;
    this.events.dispatch("stateChanged", value);
  }

  /**
   * Get the stepper enabled state
   */
  public get stepperEnabled(): boolean {
    return this.simulator ? this.simulator.stepperEnabled : false;
  }

  /**
   * Set the stepper enabled state
   */
  public set stepperEnabled(value: boolean) {
    if (!this.simulator) return;
    if (this.simulator.stepperEnabled === value) return;

    // Auto-enable when enabling stepper
    if (value && this.state === DebuggerState.DISABLED) {
      this.state = DebuggerState.ACTIVE;
    }
    if (value) {
      this.simulator.enableStepper();
    } else {
      this.simulator.stopStepper();
    }
    this.events.dispatch("stepperToggled", value);
  }

  /**
   * Toggle the stepper state
   * @returns The new stepper state
   */
  public toggleStepper(): boolean {
    if (!this.simulator) return false;
    const newState = !this.simulator.stepperEnabled;
    this.stepperEnabled = newState;
    return newState;
  }

  /**
   * Initialize the debugger controller with widgets and core references
   * @param console Message console widget for logging output
   * @param debugInfo Debug info widget for displaying CPU state
   * @param assembler Assembler instance
   * @param simulator Simulator instance
   * @param hexMonitor Hex monitor widget for displaying memory
   * @param disassembled Disassembled widget for displaying disassembled code
   * @param hexdump Hexdump widget for displaying hexdump of the code
   */
  public init(
    console: MessageConsoleWidget,
    debugInfo: DebugInfoWidget,
    assembler: Assembler,
    simulator: Simulator,
    hexMonitor?: HexMonitorWidget,
    disassembled?: DisassembledWidget,
    hexdump?: HexdumpWidget
  ): void {
    this.console = console;
    this.debugInfo = debugInfo || null;
    this.hexMonitor = hexMonitor || null;
    this.disassembled = disassembled || null;
    this.hexdump = hexdump || null;

    // Set core references (only once)
    if (!this.assembler) {
      this.assembler = assembler;
    }
    if (!this.simulator) {
      this.simulator = simulator;
    }

    // Restore persistent state to widgets
    this.restoreWidgetState();
  }

  /**
   * Restore widget state from persistent storage
   */
  protected restoreWidgetState(): void {
    // Restore console messages
    const messages = debuggerStateService.getConsoleMessages();
    if (this.console && messages.length > 0) {
      this.console.clear();
      for (const message of messages) {
        this.console.log(message);
      }
    }

    // Restore assembler data
    if (this.assembler) {
      if (this.hexdump) {
        this.hexdump.update(this.assembler);
      }
      if (this.disassembled) {
        this.disassembled.update(this.assembler);
      }
    }

    // Restore simulator and memory state
    if (this.simulator && this.debugInfo) {
      this.debugInfo.update(this.simulator);
    }
    if (this.memory && this.hexMonitor) {
      this.hexMonitor.update(this.memory);
    }

    // Dispatch initial stepper state
    this.events.dispatch("stepperToggled", this.stepperEnabled);
  }

  /**
   * Update debugger state from simulator state
   * @param simulatorState Current simulator state
   */
  public updateFromSimulatorState(simulatorState: Simulator["state"]): void {
    debuggerStateService.updateFromSimulatorState(simulatorState);
    this.events.dispatch("stateChanged", debuggerStateService.debuggerState);
  }

  /**
   * Get the stored console messages
   */
  public getConsoleMessages(): string[] {
    return debuggerStateService.getConsoleMessages();
  }

  /**
   * Internal update method for the debugger display.
   * Updates only frequently changing components (memory monitor and debug info).
   * @param memory Current state of system memory
   * @param simulator Current state of the 6502 simulator
   */
  private _update(memory: Memory, simulator: Simulator): void {
    if (this.state === DebuggerState.DISABLED) return; // No-op when disabled
    this.memory = memory;
    this.updateMonitor(memory);
    this.updateDebugInfo(simulator);
  }

  /**
   * Throttled public update method for the debugger display.
   * Called frequently during program execution but limited to update rate.
   * Only updates dynamic components (memory and debug info).
   * @param memory The memory to update the hex monitor
   * @param simulator The simulator to update the debug info
   */
  public update = throttle(this._update.bind(this), 349); // Prime number for throttling

  /**
   * Update the memory monitor with current memory state
   * @param memory Current memory state
   */
  public updateMonitor(memory: Memory): void {
    if (this.state === DebuggerState.DISABLED) return; // No-op when disabled
    if (this.hexMonitor) {
      this.hexMonitor.update(memory);
    }
  }

  /**
   * Update the debugger with current simulator state
   * @param simulator Simulator instance for state information
   */
  public updateDebugInfo(simulator: Simulator): void {
    if (this.state === DebuggerState.DISABLED) return; // No-op when disabled
    if (this.debugInfo) {
      this.debugInfo.update(simulator);
    }
  }

  /**
   * Update the hexdump view
   * @param assembler Assembler with assembled code
   */
  public updateHexdump(assembler: Assembler): void {
    if (this.state === DebuggerState.DISABLED) return; // No-op when disabled
    if (this.hexdump) {
      this.hexdump.update(assembler);
    }
  }

  /**
   * Update the disassembled view
   * @param assembler Assembler with assembled code
   */
  public updateDisassembled(assembler: Assembler): void {
    if (this.state === DebuggerState.DISABLED) return; // No-op when disabled
    if (this.disassembled) {
      this.disassembled.update(assembler);
    }
  }

  /**
   * Register a listener for debugger events
   * @param event Event name to listen for
   * @param callback Function to call when the event occurs
   */
  public on<K extends keyof DebuggerEventMap>(
    event: K,
    callback: (data: DebuggerEventMap[K]) => void
  ): void {
    this.events.on(event, callback);
  }

  /**
   * Remove a listener for debugger events
   * @param event Event name to remove listener from
   * @param callback Function to remove from listeners
   */
  public off<K extends keyof DebuggerEventMap>(
    event: K,
    callback: (data: DebuggerEventMap[K]) => void
  ): void {
    this.events.off(event, callback);
  }

  /**
   * Copy code to clipboard
   * @param code Code to copy
   */
  public copyToClipboard(code: string): void {
    this.events.dispatch("copyToClipboard", code);
  }

  /**
   * Copy code to editor
   * @param code Code to copy to editor
   */
  public copyToEditor(code: string): void {
    this.events.dispatch("copyToEditor", code);
  }

  /**
   * Log a message to the debugger console
   * @param message Message to log
   */
  public log(message: string): void {
    debuggerStateService.addConsoleMessage(message);
    this.console?.log(message);
  }

  /**
   * Clear all stored console logs
   */
  public clearConsole(): void {
    debuggerStateService.clearConsoleMessages();
    if (this.console) {
      this.console.clear();
    }
  }

  /**
   * Reset all debugger components
   */
  public reset(): void {
    debuggerStateService.reset();
    this.clearConsole();
    this.memory = null;
    this.events.dispatch("reset", undefined);
  }

  /**
   * Clean up resources when closing
   */
  public close(): void {
    // Cleanup code here
  }
}

export const debuggerController = new DebuggerController();
