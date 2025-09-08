import { SimulatorState } from "@learn6502/6502";
import { DebuggerState } from "../data/index";

/**
 * Service containing platform-independent business logic for debugger state management
 * Handles all state calculations and transitions without UI dependencies
 */
export class DebuggerStateService {
  // State tracking
  private _debuggerState: DebuggerState = DebuggerState.INITIAL;

  // Persistent state for console messages
  private _consoleMessages: string[] = [];

  /**
   * Get the current debugger state
   */
  public get debuggerState(): DebuggerState {
    return this._debuggerState;
  }

  /**
   * Set the current debugger state
   */
  public set debuggerState(value: DebuggerState) {
    this._debuggerState = value;
  }

  /**
   * Calculate the debugger state based on simulator state
   * This is the core business logic for determining debugger state
   * @param simulatorState Current simulator state
   * @returns Calculated debugger state
   */
  public calculateDebuggerState(simulatorState: SimulatorState): DebuggerState {
    switch (simulatorState) {
      case SimulatorState.INITIALIZED:
        return DebuggerState.INITIAL;

      case SimulatorState.READY:
      case SimulatorState.COMPLETED:
        return DebuggerState.ACTIVE;

      case SimulatorState.RUNNING:
      case SimulatorState.DEBUGGING:
        return DebuggerState.ACTIVE;

      case SimulatorState.PAUSED:
      case SimulatorState.DEBUGGING_PAUSED:
        return DebuggerState.PAUSED;

      default:
        return DebuggerState.INITIAL;
    }
  }

  /**
   * Update debugger state from simulator state
   * @param simulatorState Current simulator state
   */
  public updateFromSimulatorState(simulatorState: SimulatorState): void {
    this._debuggerState = this.calculateDebuggerState(simulatorState);
  }

  /**
   * Add a message to the console
   * @param message Message to add
   */
  public addConsoleMessage(message: string): void {
    this._consoleMessages.push(message);
  }

  /**
   * Get all stored console messages
   * @returns Array of console messages
   */
  public getConsoleMessages(): string[] {
    return [...this._consoleMessages];
  }

  /**
   * Clear all console messages
   */
  public clearConsoleMessages(): void {
    this._consoleMessages = [];
  }

  /**
   * Reset the debugger state service
   */
  public reset(): void {
    this._debuggerState = DebuggerState.RESET;
    this.clearConsoleMessages();
  }
}

// Export singleton instance
export const debuggerStateService = new DebuggerStateService();
