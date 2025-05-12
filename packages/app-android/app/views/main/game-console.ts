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

// Import gameConsoleService
import {
  gameConsoleService,
  type GameConsoleView,
  type GamepadKey,
} from "@learn6502/common-ui";

class GameConsoleController implements GameConsoleView {
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
    this.assemble = this.assemble.bind(this);
    this.run = this.run.bind(this);
    this.stop = this.stop.bind(this);
    this.reset = this.reset.bind(this);
    this.step = this.step.bind(this);
    this.goto = this.goto.bind(this);
    this.gamepadPress = this.gamepadPress.bind(this);
    this.close = this.close.bind(this);
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
    console.log("game-console.view: onLoaded");
    this._display = this.page.getViewById<Display>("display");
    this._gamePad = this.page.getViewById<Gamepad>("gamePad");
    this.initialize();
  }

  public onUnloaded(args: EventData): void {
    console.log("game-console.view: onUnloaded");
    this.close(); // Clean up simulator and listeners
    this.page = null;
    this._display = null;
    this._gamePad = null;
  }

  // --- Public Methods (API for external interaction) ---
  public assemble(code: string): void {
    gameConsoleService.assemble(code);
  }

  public run(): void {
    gameConsoleService.run();
  }

  public hexdump(): void {
    gameConsoleService.hexdump();
  }

  public disassemble(): void {
    gameConsoleService.disassemble();
  }

  public stop(): void {
    gameConsoleService.stop();
  }

  public reset(): void {
    gameConsoleService.reset();
  }

  public step(): void {
    gameConsoleService.step();
  }

  public goto(address: string): void {
    gameConsoleService.goto(address);
  }

  public gamepadPress(buttonName: GamepadKey): void {
    this._gamePad?.press(buttonName);
  }

  /** Call this when the view is about to be destroyed. */
  public close(): void {
    this.stop();
    this.removeEventListeners();
  }

  // --- Private Methods ---
  /**
   * Initializes the simulator and sets up event listeners.
   */
  private initialize(): void {
    if (!this._display || !this._gamePad || !this._memory) {
      throw new Error("Missing required components");
    }

    // Initialize gameConsoleService
    gameConsoleService.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });

    this._display.initialize(this._memory);
    this._simulator.reset();

    console.log("game-console.view: Initialized");
  }

  /**
   * Removes event listeners previously set up.
   */
  private removeEventListeners(): void {
    console.log("game-console.view: Removing event listeners");
    // No need to manually remove event listeners as they're now handled by the service
  }

  // Helper to notify parent component/view
  private notifyParent(eventName: string, detail: any): void {
    if (this.page) {
      this.page.notify({
        eventName: eventName,
        object: this.page, // Or maybe 'this' controller?
        detail: detail,
      });
    } else {
      console.warn(
        `game-console.view: Cannot notify parent, page is null for event: ${eventName}`
      );
    }
  }
}

// Create singleton instance of the controller
const gameConsoleController = new GameConsoleController();

// Export bound public methods for XML binding
export const onLoaded = gameConsoleController.onLoaded;
export const onUnloaded = gameConsoleController.onUnloaded;

// You might expose other methods needed directly from XML if necessary,
// but typically interaction goes through the main page's controller.

// --- Re-export event names --- Need to define them here now
export const assembleSuccessEvent = "assemble-success";
export const assembleFailureEvent = "assemble-failure";
export const hexdumpEvent = "hexdump";
export const disassemblyEvent = "disassembly";
export const assembleInfoEvent = "assemble-info";
export const stopEvent = "stop";
export const startEvent = "start";
export const resetEvent = "reset";
export const stepEvent = "step";
export const multistepEvent = "multistep";
export const gotoEvent = "goto";
export const pseudoOpEvent = "pseudo-op";
export const simulatorInfoEvent = "simulator-info";
export const simulatorFailureEvent = "simulator-failure";
export const labelsInfoEvent = "labels-info";
export const labelsFailureEvent = "labels-failure";
export const gamepadPressedEvent = "gamepad-pressed";

// Initialization function for gameConsoleService
const initializeGameConsole = (memory, displayWidget, gamepadWidget) => {};
