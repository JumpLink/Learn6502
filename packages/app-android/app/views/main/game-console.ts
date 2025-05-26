import { EventData, Page } from "@nativescript/core";
import {
  Memory,
  Labels,
  Simulator,
  Assembler,
  SimulatorState,
} from "@learn6502/6502";

// Import child widgets
import { Display, Gamepad } from "~/widgets/game-console";

// Import common controller
import {
  gameConsoleController,
  type GameConsoleView,
  type GamepadKey,
} from "@learn6502/common-ui";

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

  constructor() {
    this._memory = new Memory();
    this._labels = new Labels();
    this._simulator = new Simulator(this._memory, this._labels);
    this._assembler = new Assembler(this._memory, this._labels);

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
    console.log(
      `[GameConsole] onNavigatingTo - isInitialized: ${this._isInitialized}`
    );
    // Navigation handling is separate from loading
  }

  public onNavigatingFrom(): void {
    console.log("[GameConsole] onNavigatingFrom - preserving state");
    // State is preserved in the singleton instance and gameConsoleController
  }

  public onLoaded(args: EventData): void {
    this.page = args.object as Page;

    this._display = this.page.getViewById<Display>("display");
    this._gamePad = this.page.getViewById<Gamepad>("gamePad");

    if (!this._display || !this._gamePad) {
      console.error("Failed to find required components in game-console view");
      return;
    }

    if (!this._isInitialized) {
      console.log("[GameConsole] First initialization");
      this.initialize();
      this._isInitialized = true;
    } else {
      console.log("[GameConsole] Re-connecting widgets to existing state");
      this.reconnectWidgets();
    }
  }

  public onUnloaded(args: EventData): void {
    console.log("[GameConsole] onUnloaded - preserving state");
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

    console.log("GameConsole: Reconnecting widgets to existing state");

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

    console.log("GameConsole: Widget reconnection complete");
  }

  /**
   * Initializes the simulator and sets up event listeners.
   */
  private initialize(): void {
    if (!this._display || !this._gamePad) {
      throw new Error("Missing required components");
    }

    console.log("GameConsole: Initializing game console components");

    // Check if controller is already partially initialized (from main controller)
    if (gameConsoleController.memory) {
      console.log(
        "GameConsole: Controller already partially initialized, doing full initialization"
      );
      // Do full initialization with display and gamepad widgets
      gameConsoleController.init({
        memory: this._memory,
        displayWidget: this._display,
        gamepadWidget: this._gamePad,
        simulator: this._simulator,
        assembler: this._assembler,
        labels: this._labels,
      });
    } else {
      console.log("GameConsole: Full controller initialization from scratch");
      // Initialize common controller first
      gameConsoleController.init({
        memory: this._memory,
        displayWidget: this._display,
        gamepadWidget: this._gamePad,
        simulator: this._simulator,
        assembler: this._assembler,
        labels: this._labels,
      });
    }

    // Debug output for memory and controller
    console.log(
      `GameConsole: Memory initialized (${this._memory ? "ok" : "failed"})`
    );
    console.log(
      `GameConsole: Controller memory initialized (${gameConsoleController.memory ? "ok" : "failed"})`
    );

    // Initialize display with memory FIRST
    this._display.initialize(this._memory);

    // Reset simulator to initial state
    this._simulator.reset();

    // Add test pattern to memory via shared controller AFTER display initialization
    // This ensures the display is ready to receive and show the pattern
    gameConsoleController.initializeMemoryWithTestPattern("colorChart");

    console.log("GameConsole: Initialization complete");
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
