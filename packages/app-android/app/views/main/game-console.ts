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

  constructor() {
    this._memory = new Memory();
    this._labels = new Labels();
    this._simulator = new Simulator(this._memory, this._labels);
    this._assembler = new Assembler(this._memory, this._labels);

    // Bind methods
    this.onLoaded = this.onLoaded.bind(this);
    this.onUnloaded = this.onUnloaded.bind(this);
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
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;

    this._display = this.page.getViewById<Display>("display");
    this._gamePad = this.page.getViewById<Gamepad>("gamePad");

    if (!this._display || !this._gamePad) {
      console.error("Failed to find required components in game-console view");
      return;
    }

    this.initialize();
  }

  public onUnloaded(args: EventData): void {
    this.close();
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
  }

  // --- Private Methods ---
  /**
   * Initializes the simulator and sets up event listeners.
   */
  private initialize(): void {
    if (!this._display || !this._gamePad) {
      throw new Error("Missing required components");
    }

    console.log("GameConsole: Initializing game console components");

    // Initialize common controller first
    gameConsoleController.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });

    // Debug output for memory and controller
    console.log(
      `GameConsole: Memory initialized (${this._memory ? "ok" : "failed"})`
    );
    console.log(
      `GameConsole: Controller memory initialized (${gameConsoleController.memory ? "ok" : "failed"})`
    );

    // Add test pattern to memory via shared controller
    gameConsoleController.initializeMemoryWithTestPattern("colorChart");

    // Initialize display with memory
    this._display.initialize(this._memory);

    // Reset simulator to initial state
    this._simulator.reset();

    console.log("GameConsole: Initialization complete");
  }
}

// Create singleton instance of the view controller
const gameConsoleView = new GameConsole();

// Export bound public methods for XML binding
export const onLoaded = gameConsoleView.onLoaded;
export const onUnloaded = gameConsoleView.onUnloaded;

// Re-export the controller for external components
export { gameConsoleController };
