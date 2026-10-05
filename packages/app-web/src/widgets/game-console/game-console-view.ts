import { Adw } from "@gjsify/adwaita-web";
import type { GameConsoleView, GamepadKey } from "@learn6502/common-ui";
import { gameConsoleController, gameConsoleStateService } from "@learn6502/common-ui";
import type { Assembler, Labels, Memory, Simulator } from "@learn6502/core";

import { Display } from "./display.js";
import { Gamepad } from "./gamepad.js";

/**
 * AdwGameConsoleView — the `GameConsoleView` from `@learn6502/common-ui`
 * implemented over `@gjsify/adwaita-web`, the web twin of app-gnome's
 * `GameConsole extends Adw.Bin` (`game-console.blp`) and app-android's
 * `GameConsole`.
 *
 * Structure mirrors `game-console.blp`: a centred column with the `Display`
 * canvas above the `Gamepad` d-pad. As on GNOME and Android, ALL logic lives in
 * the shared `gameConsoleController`; this class only builds the widgets, calls
 * the controller's full `init` (upgrading the shell from the assembler-only
 * `initPartial`), and delegates the `GameConsoleView` actions.
 *
 * Unlike the GNOME twin the simulator stack is owned by the shell (`MainWindow`,
 * shared with the Debugger), so `initialize()` receives it rather than creating
 * its own via `createSimulatorStack()`.
 */
export class AdwGameConsoleView extends HTMLElement implements GameConsoleView {
  private readonly displayWidget = new Display();
  private readonly gamepadWidget = new Gamepad();

  private _memory: Memory | null = null;
  private _simulator: Simulator | null = null;
  private _assembler: Assembler | null = null;
  private _labels: Labels | null = null;

  private built = false;
  private initialized = false;

  // A key press only drives the game while the display is focused, so playing
  // never steals keystrokes from the Editor (the GNOME twin's focusable
  // DrawingArea). WASD + arrows + Enter/Space are mapped by the input service.
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (gameConsoleController.handleKeyPress(event.keyCode)) {
      event.preventDefault();
    }
  };

  connectedCallback(): void {
    this.ensureBuilt();
  }

  // --- GameConsoleView interface (delegates to gameConsoleController) ---

  public get simulator(): Simulator | null {
    return this._simulator;
  }

  public get assembler(): Assembler | null {
    return this._assembler;
  }

  public get memory(): Memory | null {
    return this._memory;
  }

  public get labels(): Labels | null {
    return this._labels;
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
    this.gamepadWidget.press(key);
  }

  public close(): void {
    this.displayWidget.element?.removeEventListener("keydown", this.onKeyDown);
    this.displayWidget.close();
    gameConsoleController.close();
  }

  /**
   * Wire the view to the shell's simulator stack and switch the controller from
   * assembler-only (`initPartial`) to full display + gamepad mode. Mirrors the
   * GNOME `GameConsole.initialize()` shape.
   */
  public initialize(memory: Memory, simulator: Simulator, assembler: Assembler, labels: Labels): void {
    this.ensureBuilt();

    this._memory = memory;
    this._simulator = simulator;
    this._assembler = assembler;
    this._labels = labels;

    if (this.initialized) return;
    this.initialized = true;

    gameConsoleController.init({
      memory,
      displayWidget: this.displayWidget,
      gamepadWidget: this.gamepadWidget,
      simulator,
      assembler,
      labels,
    });

    // Keyboard input is scoped to the focused display (see onKeyDown).
    this.displayWidget.element?.addEventListener("keydown", this.onKeyDown);

    // Seed the screen with the colour-chart demo pattern so the console shows
    // something before a program runs — the GNOME twin's initialize() does the
    // same (`initializeMemoryWithTestPattern(memory, "colorChart")`).
    gameConsoleStateService.initializeMemoryWithTestPattern(memory, "colorChart");
    this.displayWidget.drawAllPixels();
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    const column = document.createElement("div");
    column.className = "game-console-column";
    column.append(this.displayWidget, this.gamepadWidget);

    const clamp = new Adw.Clamp();
    clamp.setAttribute("maximum-size", "400");
    clamp.appendChild(column);
    this.replaceChildren(clamp);
  }
}

customElements.define("learn-game-console", AdwGameConsoleView);
