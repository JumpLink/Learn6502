import type { Assembler, Simulator, SimulatorState } from "@learn6502/6502";
import { gameConsoleController } from "./game-console-controller.ts";
import { debuggerController } from "./debugger-controller.ts";

/**
 * Callbacks that platforms must implement for platform-specific behavior.
 * The bridge handles all shared event wiring logic and delegates
 * platform-specific concerns (i18n, UI updates) to these callbacks.
 */
export interface GameConsoleEventBridgeCallbacks {
  /**
   * Format a message with params and log it to the debugger console.
   * GNOME uses gettext formatting, Android logs directly.
   */
  formatAndLog(message: string, params?: (string | number | boolean | null | undefined)[]): void;

  /** Called when the debugger UI should be refreshed (memory, CPU state). */
  updateDebugger(): void;

  /** Called after successful assembly to update hexdump/disassembly views. */
  updateAssemblerViews(assembler: Assembler): void;

  /** Called when simulator state changes (start/stop/reset) to update UI. */
  updateUiState(state?: SimulatorState): void;

  /** Show a notification with a translatable key. */
  showNotification(key: string): void;

  /** Called when a step/multistep/goto occurs and debugger may need update. */
  updateDebugInfo(simulator: Simulator): void;
}

type EventUnsubscriber = () => void;

/**
 * Bridges gameConsoleController events to debuggerController and platform UI.
 *
 * This eliminates ~150 lines of duplicated event listener setup
 * from both Android MainController and GNOME MainWindow.
 */
export class GameConsoleEventBridge {
  private unsubscribers: EventUnsubscriber[] = [];

  constructor(private readonly callbacks: GameConsoleEventBridgeCallbacks) {}

  /**
   * Connect all event listeners. Call during view initialization.
   */
  connect(): void {
    this.disconnect();

    this.on("assemble-success", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
      if (signal.assembler) {
        this.callbacks.updateAssemblerViews(signal.assembler);
      }
      this.callbacks.updateDebugger();
      this.callbacks.updateUiState();
      this.callbacks.showNotification("assembled-successfully");
    });

    this.on("assemble-failure", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
      this.callbacks.showNotification("assemble-failed");
    });

    this.on("hexdump", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog("Hexdump:\n" + signal.message, signal.params);
      }
    });

    this.on("disassembly", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog("Disassembly:\n" + signal.message, signal.params);
      }
    });

    this.on("assemble-info", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
    });

    this.on("stop", (signal) => {
      this.callbacks.updateDebugger();
      this.callbacks.updateUiState(signal.state);
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
    });

    this.on("start", (signal) => {
      this.callbacks.updateDebugger();
      this.callbacks.updateUiState(signal.state);
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
    });

    this.on("reset", (signal) => {
      this.callbacks.updateDebugger();
      this.callbacks.updateUiState(signal.state);
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
    });

    this.on("step", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
      if (signal.simulator) {
        this.callbacks.updateDebugInfo(signal.simulator);
      }
    });

    this.on("multistep", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
      this.callbacks.updateDebugger();
    });

    this.on("goto", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
      this.callbacks.updateDebugger();
    });

    this.on("simulator-info", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
    });

    this.on("simulator-failure", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
      this.callbacks.showNotification("simulator-failure");
    });

    this.on("labels-info", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
    });

    this.on("labels-failure", (signal) => {
      if (signal.message) {
        this.callbacks.formatAndLog(signal.message, signal.params);
      }
      this.callbacks.showNotification("labels-failure");
    });

    this.on("stepper-changed", (event) => {
      if (debuggerController.stepperEnabled !== event.enabled) {
        debuggerController.stepperEnabled = event.enabled;
      }
    });
  }

  /**
   * Disconnect all event listeners. Call during view teardown.
   */
  disconnect(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }

  private on<K extends keyof import("../types").GameConsoleEventMap>(
    event: K,
    callback: (data: import("../types").GameConsoleEventMap[K]) => void,
  ): void {
    gameConsoleController.on(event, callback);
    this.unsubscribers.push(() => gameConsoleController.off(event, callback));
  }
}
