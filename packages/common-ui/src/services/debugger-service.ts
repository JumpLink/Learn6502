import {
  type Memory,
  type Simulator,
  type Assembler,
  EventDispatcher,
} from "@learn6502/6502";
import type { DebuggerEventMap } from "../types";
import type { MessageConsoleWidget } from "../widgets/message-console";
import type { DebugInfoWidget } from "../widgets/debug-info";

/**
 * Common interface for debugger services across platforms
 */
export interface DebuggerService {
  /**
   * Initialize the debugger service with widgets
   * @param console Message console widget for logging output
   * @param debugInfo Debug info widget for displaying CPU state
   */
  init(console: MessageConsoleWidget, debugInfo?: DebugInfoWidget): void;

  /**
   * Update the debugger with current simulator state
   * @param simulator Simulator instance for state information
   */
  updateDebugInfo(simulator: Simulator): void;

  /**
   * Update the hexdump view
   * @param assembler Assembler with assembled code
   */
  updateHexdump(assembler: Assembler): void;

  /**
   * Update the disassembled view
   * @param assembler Assembler with assembled code
   */
  updateDisassembled(assembler: Assembler): void;

  /**
   * Log a message to the debugger console
   * @param message Message to log
   */
  log(message: string): void;

  /**
   * Copy code to clipboard
   * @param code Code to copy
   */
  copyToClipboard(code: string): void;

  /**
   * Copy code to editor
   * @param code Code to copy to editor
   */
  copyToEditor(code: string): void;

  /**
   * Register a listener for debugger events
   * @param event Event name
   * @param callback Function to call when the event occurs
   */
  on(
    event: keyof DebuggerEventMap,
    callback: (data: DebuggerEventMap[typeof event]) => void
  ): void;

  /**
   * Remove a listener for debugger events
   * @param event Event name
   * @param callback Function to remove
   */
  off(
    event: keyof DebuggerEventMap,
    callback: (data: DebuggerEventMap[typeof event]) => void
  ): void;
}

/**
 * Base class implementing common debugger functionality
 */
export abstract class BaseDebuggerService implements DebuggerService {
  // Event dispatcher for debugger events
  protected events = new EventDispatcher<DebuggerEventMap>();

  // Widgets for output and display
  protected console: MessageConsoleWidget | null = null;
  protected debugInfo: DebugInfoWidget | null = null;

  /**
   * Initialize the debugger service with widgets
   * @param console Message console widget for logging output
   * @param debugInfo Debug info widget for displaying CPU state
   */
  public init(
    console: MessageConsoleWidget,
    debugInfo?: DebugInfoWidget
  ): void {
    this.console = console;
    this.debugInfo = debugInfo || null;
    this.flushPendingLogs();
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
  public on(
    event: keyof DebuggerEventMap,
    callback: (data: DebuggerEventMap[typeof event]) => void
  ): void {
    this.events.on(event, callback);
  }

  /**
   * Remove a listener for debugger events
   * @param event Event name to remove listener from
   * @param callback Function to remove from listeners
   */
  public off(
    event: keyof DebuggerEventMap,
    callback: (data: DebuggerEventMap[typeof event]) => void
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
  public abstract updateHexdump(assembler: Assembler): void;

  /**
   * Update the disassembled view
   * @param assembler Assembler with assembled code
   */
  public abstract updateDisassembled(assembler: Assembler): void;

  /**
   * Log a message to the debugger console
   * @param message Message to log
   */
  public abstract log(message: string): void;

  /**
   * Flush any pending logs to the console widget
   * To be implemented by platform-specific services
   */
  protected abstract flushPendingLogs(): void;
}
