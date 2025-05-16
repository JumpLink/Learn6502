import {
  type Memory,
  type Simulator,
  type Assembler,
  EventDispatcher,
} from "@learn6502/6502";
import type { DebuggerEventMap } from "../types";
import {
  type MessageConsoleWidget,
  type DebugInfoWidget,
  type HexMonitorWidget,
  type DisassembledWidget,
  type HexdumpWidget,
  DummyMessageConsole,
} from "../widgets/index";

/**
 * Platform-independent debugger service
 */
export class DebuggerService {
  // Event dispatcher for debugger events
  protected events = new EventDispatcher<DebuggerEventMap>();

  // Widgets for output and display
  protected console: MessageConsoleWidget = new DummyMessageConsole();
  protected debugInfo: DebugInfoWidget | null = null;
  protected hexMonitor: HexMonitorWidget | null = null;
  protected disassembled: DisassembledWidget | null = null;
  protected hexdump: HexdumpWidget | null = null;
  /**
   * Initialize the debugger service with widgets
   * @param console Message console widget for logging output
   * @param debugInfo Debug info widget for displaying CPU state
   * @param hexMonitor Hex monitor widget for displaying memory
   * @param disassembled Disassembled widget for displaying disassembled code
   */
  public init(
    console: MessageConsoleWidget,
    debugInfo: DebugInfoWidget,
    hexMonitor?: HexMonitorWidget,
    disassembled?: DisassembledWidget,
    hexdump?: HexdumpWidget
  ): void {
    this.console = console;
    this.debugInfo = debugInfo || null;
    this.hexMonitor = hexMonitor || null;
    this.disassembled = disassembled || null;
    this.hexdump = hexdump || null;
  }

  /**
   * Update the debugger with current simulator state
   * @param simulator Simulator instance for state information
   */
  public updateDebugInfo(simulator: Simulator): void {
    if (this.debugInfo) {
      this.debugInfo.update(simulator);
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
   * Update the hexdump view
   * @param assembler Assembler with assembled code
   */
  public updateHexdump(assembler: Assembler): void {
    if (this.hexdump) {
      this.hexdump.update(assembler);
    }
  }

  /**
   * Update the memory monitor with current memory state
   * @param memory Current memory state
   */
  public updateMemory(memory: Memory): void {
    if (this.hexMonitor) {
      this.hexMonitor.update(memory);
    }
  }

  /**
   * Update the disassembled view
   * @param assembler Assembler with assembled code
   */
  public updateDisassembled(assembler: Assembler): void {
    // Implementation delegated to widgets when available
    if (this.disassembled) {
      this.disassembled.update(assembler);
    }
  }

  /**
   * Log a message to the debugger console
   * @param message Message to log
   */
  public log(message: string): void {
    // Console is always available
    this.console?.log(message);
  }

  /**
   * Clear all stored console logs
   */
  public clearConsole(): void {
    if (this.console) {
      this.console.clear();
    }
  }

  /**
   * Reset all debugger components
   */
  public reset(): void {
    this.clearConsole();
    // Reset other components as needed
    this.events.dispatch("reset", undefined);
  }
}

// Export singleton instance
export const debuggerService = new DebuggerService();
