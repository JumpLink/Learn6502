import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";

import type { Memory, Labels, Simulator, Assembler } from "@learn6502/core";
import {
  gameConsoleController,
  gameConsoleStateService,
  type GameConsoleView,
  type GamepadKey,
  type SimulatorStack,
} from "@learn6502/common-ui";

import type { Display } from "./display.ts";
import type { Gamepad } from "./gamepad.ts";

import Template from "./game-console.blp?template";

/**
 * The 6502 console: the `Display` above the `Gamepad`, the same widget on GNOME, web and Android.
 *
 * The widget does not own a simulator. The platform creates the stack and hands it over with
 * `setSimulatorStack`, so the Debugger beside it can share the very same assembler and simulator.
 */
export class GameConsole extends Adw.Bin implements GameConsoleView {
  declare private _display: Display;
  declare private _gamePad: Gamepad;

  private stack: SimulatorStack | null = null;

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

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
  }

  private requireStack(): SimulatorStack {
    if (!this.stack) throw new Error("GameConsole: setSimulatorStack() has not been called");
    return this.stack;
  }

  get memory(): Memory {
    return this.requireStack().memory;
  }

  get labels(): Labels {
    return this.requireStack().labels;
  }

  get simulator(): Simulator {
    return this.requireStack().simulator;
  }

  get assembler(): Assembler {
    return this.requireStack().assembler;
  }

  /** The display, for platform code that wires focus or key events. */
  get display(): Display {
    return this._display;
  }

  /** Hand the console its simulator stack and connect the controller to the display and gamepad. */
  public setSimulatorStack(stack: SimulatorStack): void {
    this.stack = stack;

    gameConsoleController.init({
      memory: stack.memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: stack.simulator,
      assembler: stack.assembler,
      labels: stack.labels,
    });

    this._display.initialize(stack.memory);
    stack.simulator.reset();
    // After the display is bound, so the pattern is painted.
    gameConsoleStateService.initializeMemoryWithTestPattern(stack.memory, "colorChart");
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

  public gamepadPress(key: GamepadKey): void {
    this._gamePad.press(key);
  }

  /** Focus the display for immediate keyboard input. */
  public focus(): boolean {
    return this._display.focus();
  }

  /** Stop listening to memory, which outlives this widget. Android calls it before it rebuilds the console. */
  public unbind(): void {
    this._display.unbind();
  }

  /** Call this when the window is closed. */
  public close(): void {
    this.stop();
    this.unbind();
  }
}

GObject.type_ensure(GameConsole.$gtype);
