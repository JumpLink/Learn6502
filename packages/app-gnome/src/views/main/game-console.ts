import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";

import { Memory, Labels, Simulator, Assembler } from "@learn6502/6502";

import { Display, Gamepad } from "../../widgets/game-console/index.ts";
import {
  gameConsoleController,
  type GameConsoleView,
} from "@learn6502/common-ui";

import Template from "./game-console.blp";

/**
 * The GameConsole widget.
 */
export class GameConsole extends Adw.Bin implements GameConsoleView {
  // Child widgets
  declare private _display: Display;
  declare private _gamePad: Gamepad;

  static {
    GObject.registerClass(
      {
        GTypeName: "GameConsole",
        Template,
        InternalChildren: ["display", "gamePad"],
      },
      this
    );
  }

  private _memory: Memory;
  private _labels: Labels;
  private _simulator: Simulator;
  private _assembler: Assembler;

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

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);

    this._memory = new Memory();
    this._labels = new Labels();
    this._simulator = new Simulator(this._memory, this._labels);
    this._assembler = new Assembler(this._memory, this._labels);

    this.initialize();
  }

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

  public gamepadPress(
    buttonName: "Left" | "Right" | "Up" | "Down" | "A" | "B"
  ): void {
    this._gamePad.press(buttonName);
  }

  /** Call this when the MainWindow is closed. */
  public close(): void {
    this.stop();
    this.removeSignalHandlers();
  }

  /**
   * Initializes the simulator widget and sets up event listeners.
   */
  private initialize(): void {
    // Set up game console service with all components
    gameConsoleController.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });

    // Add a test pattern to memory to test the display
    // This should be the same pattern as on Android for comparison
    gameConsoleController.initializeMemoryWithTestPattern("colorChart");

    // Now we can initialize the display component with the initialized memory
    this._display?.initialize(this._memory);

    // Reset simulator
    this._simulator.reset();

    console.log("GNOME GameConsole: Initialization complete");
  }

  private removeSignalHandlers(): void {
    // Nothing to do here as event handlers are managed by the service
  }
}

GObject.type_ensure(GameConsole.$gtype);
