import type { View } from "@nativescript/core";
import { StackLayout } from "@nativescript/core";
import type { SimulatorState } from "@learn6502/core";
import { type Memory, type Labels, type Simulator, type Assembler } from "@learn6502/core";

// Import child widgets
import { Display } from "~/widgets/game-console";
import { Gamepad } from "@learn6502/ui";

// Import common controller
import {
  gameConsoleController,
  gameConsoleStateService,
  createSimulatorStack,
  type GameConsoleView,
  type GamepadKey,
} from "@learn6502/common-ui";
import { logger } from "~/utils";
import type { ScreenModule } from "./editor";
import { asView } from "~/utils/as-view";

/**
 * Game Console view — implements GameConsoleView. Now a content view (Display +
 * Gamepad) added to the shell's Adw.ViewStack. The simulator stack + controller
 * wiring are unchanged; only the widget construction moved off the Page.
 */
export class GameConsole implements GameConsoleView {
  private _display: Display | null = null;
  private _gamePad: Gamepad | null = null;

  private _memory: Memory;
  private _labels: Labels;
  private _simulator: Simulator;
  private _assembler: Assembler;

  private _isInitialized = false;
  private log = logger.scoped("GameConsole");

  constructor() {
    const { memory, labels, simulator, assembler } = createSimulatorStack();
    this._memory = memory;
    this._labels = labels;
    this._simulator = simulator;
    this._assembler = assembler;
  }

  // --- Read-only access ---
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

  /** Build the Display (in an Adwaita card) over the shared Gamepad, wiring the
   *  controller once the display loads. Mirrors the GNOME GameConsole: a framed
   *  DrawingArea above a d-pad of icon buttons + circular A/B buttons. */
  build(): View {
    const display = new Display();
    const gamePad = new Gamepad();
    this._display = display;
    this._gamePad = gamePad;

    const root = new StackLayout();
    root.orientation = "vertical";
    root.horizontalAlignment = "center";
    root.verticalAlignment = "middle";

    // Display in an Adwaita card (GNOME wraps the DrawingArea in a Gtk.Frame).
    const displayCard = new StackLayout();
    displayCard.className = "card";
    displayCard.horizontalAlignment = "center";
    displayCard.addChild(display);
    root.addChild(displayCard);

    // The shared @learn6502/ui Gamepad: the same .blp + class GNOME and the web run.
    gamePad.marginTop = 30;
    gamePad.marginBottom = 30;
    root.addChild(asView(gamePad));

    // The Display needs a native canvas before it can initialise with memory, so
    // wire the controller once it is loaded (the NS counterpart of the old Page
    // `onLoaded`).
    display.on("loaded", () => {
      if (!this._isInitialized) {
        this.log.debug("First initialization");
        this.initialize();
        this._isInitialized = true;
      } else {
        this.log.debug("Re-connecting widgets to existing state");
        this.reconnectWidgets();
      }
    });

    return root;
  }

  // --- API for external interaction ---
  assemble(code: string): void {
    gameConsoleController.assemble(code);
  }
  run(): void {
    gameConsoleController.run();
  }
  hexdump(): void {
    gameConsoleController.hexdump();
  }
  disassemble(): void {
    gameConsoleController.disassemble();
  }
  stop(): void {
    gameConsoleController.stop();
  }
  reset(): void {
    gameConsoleController.reset();
  }
  step(): void {
    gameConsoleController.step();
  }
  goto(address: string): void {
    gameConsoleController.goto(address);
  }
  gamepadPress(buttonName: GamepadKey): void {
    if (this._gamePad) {
      this._gamePad.press(buttonName);
    } else {
      gameConsoleController.gamepadPress(buttonName);
    }
  }

  close(): void {
    this.stop();
    gameConsoleController.close();
    this._isInitialized = false;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  private reconnectWidgets(): void {
    if (!this._display || !this._gamePad) return;
    this._display.initialize(this._memory);
    gameConsoleController.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });
  }

  private initialize(): void {
    if (!this._display || !this._gamePad) return;
    this.log.debug("Initializing game console components");

    gameConsoleController.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });

    this._display.initialize(this._memory);
    this._simulator.reset();
    gameConsoleStateService.initializeMemoryWithTestPattern(this._memory, "colorChart");

    this.log.debug("Initialization complete");
  }
}

// Create singleton instance of the view controller
export const gameConsoleView = new GameConsole();

/** Build the game console screen for the shell's Adw.ViewStack. */
export function buildGameConsoleScreen(): ScreenModule {
  return {
    view: gameConsoleView.build(),
  };
}

// Re-export the controller for external components
export { gameConsoleController };
