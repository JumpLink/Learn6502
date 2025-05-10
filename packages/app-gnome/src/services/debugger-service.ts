import { type Assembler, type Memory, type Simulator } from "@learn6502/6502";
import {
  BaseDebuggerService,
  type DebuggerService,
  type MessageConsoleWidget,
  type DebugInfoWidget,
} from "@learn6502/common-ui";

/**
 * GNOME-specific implementation of the DebuggerService
 */
class GnomeDebuggerService extends BaseDebuggerService {
  private static instance: GnomeDebuggerService;
  private consoleLog: string[] = [];

  private constructor() {
    super();
  }

  /**
   * Get the singleton instance of the DebuggerService
   */
  public static getInstance(): GnomeDebuggerService {
    if (!GnomeDebuggerService.instance) {
      GnomeDebuggerService.instance = new GnomeDebuggerService();
    }
    return GnomeDebuggerService.instance;
  }

  /**
   * Update the hexdump view
   * @param assembler Assembler with assembled code
   */
  public updateHexdump(assembler: Assembler): void {
    // Implementation will be handled by the widget
  }

  /**
   * Update the disassembled view
   * @param assembler Assembler with assembled code
   */
  public updateDisassembled(assembler: Assembler): void {
    // Implementation will be handled by the widget
  }

  /**
   * Log a message to the debugger console
   * @param message Message to log
   */
  public log(message: string): void {
    if (this.console) {
      // If console is available, log directly
      this.console.log(message);
    } else {
      // Otherwise, store for later
      this.consoleLog.push(message);
    }
  }

  /**
   * Flush any pending logs to the console widget
   */
  protected flushPendingLogs(): void {
    if (this.console && this.consoleLog.length > 0) {
      this.consoleLog.forEach((message) => {
        this.console?.log(message);
      });
      this.consoleLog = [];
    }
  }

  /**
   * Clear all stored console logs
   */
  public clearConsoleLog(): void {
    this.consoleLog = [];
    this.console?.clear();
  }
}

// Export a singleton instance
export const debuggerService: DebuggerService =
  GnomeDebuggerService.getInstance();
