import type { EventData, Page } from "@nativescript/core";
import type { SimulatorState } from "@learn6502/core";
import { type Memory, type Labels, type Simulator, type Assembler } from "@learn6502/core";

// Import child widgets
import type { Display, Gamepad } from "~/widgets/game-console";

// Import common controller
import {
  gameConsoleController,
  gameConsoleStateService,
  createSimulatorStack,
  type GameConsoleView,
  type GamepadKey,
} from "@learn6502/common-ui";
import { logger } from "~/utils";

/**
 * Android implementation of the Game Console view
 */
export class GameConsole implements GameConsoleView {
  private page: Page | null = null;
  private _display: Display | null = null;
  private _gamePad: Gamepad | null = null;

  private _memory: Memory;
  private _labels: Labels;
  private _simulator: Simulator;
  private _assembler: Assembler;

  // State preservation
  private _isInitialized: boolean = false;

  // Scoped logger for this class
  private log = logger.scoped("GameConsole");

  constructor() {
    const { memory, labels, simulator, assembler } = createSimulatorStack();
    this._memory = memory;
    this._labels = labels;
    this._simulator = simulator;
    this._assembler = assembler;

    // Bind methods
    this.onLoaded = this.onLoaded.bind(this);
    this.onUnloaded = this.onUnloaded.bind(this);
    this.onNavigatingTo = this.onNavigatingTo.bind(this);
    this.onNavigatingFrom = this.onNavigatingFrom.bind(this);
  }

  // --- Public Properties (Read-only access) ---
  get memory(): Memory {
    return this._memory;
  }

  get labels(): Labels {
    return this._labels;
  }

  get simulator(): Simulator {
    return this._simulator;
  }

  get assembler(): Assembler {
    return this._assembler;
  }

  get state(): SimulatorState {
    return this._simulator.state;
  }

  // --- Lifecycle Handlers ---
  public onNavigatingTo(args: EventData): void {
    this.log.debug(`onNavigatingTo - isInitialized: ${this._isInitialized}`);
    // Navigation handling is separate from loading
  }

  public onNavigatingFrom(): void {
    this.log.debug("onNavigatingFrom - preserving state");
    // State is preserved in the singleton instance and gameConsoleController
  }

  public onLoaded(args: EventData): void {
    this.page = args.object as Page;

    this._display = this.page.getViewById<Display>("display");
    this._gamePad = this.page.getViewById<Gamepad>("gamePad");

    if (!this._display || !this._gamePad) {
      this.log.error("Failed to find required components in game-console view");
      return;
    }

    if (!this._isInitialized) {
      this.log.debug("First initialization");
      this.initialize();
      this._isInitialized = true;
    } else {
      this.log.debug("Re-connecting widgets to existing state");
      this.reconnectWidgets();
    }
  }

  public onUnloaded(args: EventData): void {
    this.log.debug("onUnloaded - preserving state");
    // Don't call close() here as it would reset the state
    // Just clear the widget references
    this.page = null;
    this._display = null;
    this._gamePad = null;
  }

  // --- Public Methods (API for external interaction) ---
  public assemble(code: string): void {
    gameConsoleController.assemble(code);
  }

  public run(): void {
    gameConsoleController.run();
  }

  public hexdump(): void {
    gameConsoleController.hexdump();
  }

  public disassemble(): void {
    gameConsoleController.disassemble();
  }

  public stop(): void {
    gameConsoleController.stop();
  }

  public reset(): void {
    gameConsoleController.reset();
  }

  public step(): void {
    gameConsoleController.step();
  }

  public goto(address: string): void {
    gameConsoleController.goto(address);
  }

  public gamepadPress(buttonName: GamepadKey): void {
    if (this._gamePad) {
      this._gamePad.press(buttonName);
    } else {
      gameConsoleController.gamepadPress(buttonName);
    }
  }

  /** Call this when the view is about to be destroyed. */
  public close(): void {
    this.stop();
    gameConsoleController.close();
    this._isInitialized = false;
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
    this.close();
  }

  // --- Private Methods ---
  /**
   * Reconnect widgets to existing controller state
   */
  private reconnectWidgets(): void {
    if (!this._display || !this._gamePad) {
      throw new Error("Missing required components for reconnection");
    }

    this.log.debug("Reconnecting widgets to existing state");

    // Re-initialize display with existing memory
    this._display.initialize(this._memory);

    // Re-initialize the controller with existing state and new widgets
    gameConsoleController.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });

    this.log.debug("Widget reconnection complete");
  }

  /**
   * Initializes the simulator and sets up event listeners.
   */
  private initialize(): void {
    if (!this._display || !this._gamePad) {
      throw new Error("Missing required components");
    }

    this.log.debug("Initializing game console components");

    // Full initialization with display and gamepad widgets
    // (works whether controller was partially initialized from main or not)
    gameConsoleController.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });

    // Debug output for memory and controller
    this.log.debug(`Memory initialized (${this._memory ? "ok" : "failed"})`);
    this.log.debug(`Controller memory initialized (${gameConsoleController.memory ? "ok" : "failed"})`);

    // Initialize display with memory FIRST
    this._display.initialize(this._memory);

    // Reset simulator to initial state
    this._simulator.reset();

    // Add test pattern to memory via shared controller AFTER display initialization
    // This ensures the display is ready to receive and show the pattern
    gameConsoleStateService.initializeMemoryWithTestPattern(this._memory, "colorChart");

    this.log.debug("Initialization complete");
  }
}

// Create singleton instance of the view controller
export const gameConsoleView = new GameConsole();

// Export bound public methods for XML binding
export const onLoaded = gameConsoleView.onLoaded;
export const onUnloaded = gameConsoleView.onUnloaded;
export const onNavigatingTo = gameConsoleView.onNavigatingTo;
export const onNavigatingFrom = gameConsoleView.onNavigatingFrom;

// Re-export the controller for external components
export { gameConsoleController };
