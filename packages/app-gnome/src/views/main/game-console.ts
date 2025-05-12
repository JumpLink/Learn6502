import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";

import {
  Memory,
  Labels,
  Simulator,
  Assembler,
  // New event types
  type AssemblerSuccessEvent,
  type AssemblerFailureEvent,
  type AssemblerHexdumpEvent,
  type AssemblerDisassemblyEvent,
  type AssemblerInfoEvent,
  type SimulatorStartEvent,
  type SimulatorStepEvent,
  type SimulatorMultiStepEvent,
  type SimulatorResetEvent,
  type SimulatorStopEvent,
  type SimulatorGotoEvent,
  type SimulatorFailureEvent,
  type SimulatorInfoEvent,
  type SimulatorPseudoOpEvent,
  type LabelsInfoEvent,
  type LabelsFailureEvent,
} from "@learn6502/6502";

import { Display, Gamepad } from "../../widgets/game-console/index.ts";
import { gameConsoleService } from "@learn6502/common-ui";

import Template from "./game-console.blp";

export interface GameConsole {
  // GObject signals
  connect(id: string, callback: (...args: any[]) => any): number;
  connect_after(id: string, callback: (...args: any[]) => any): number;
  emit(id: string, ...args: any[]): void;

  // Custom signals for assembler events
  connect(
    signal: "assemble-success",
    callback: (_source: this, pspec: AssemblerSuccessEvent) => void
  ): number;
  connect_after(
    signal: "assemble-success",
    callback: (_source: this, pspec: AssemblerSuccessEvent) => void
  ): number;
  emit(signal: "assemble-success", pspec: AssemblerSuccessEvent): void;

  connect(
    signal: "assemble-failure",
    callback: (_source: this, pspec: AssemblerFailureEvent) => void
  ): number;
  connect_after(
    signal: "assemble-failure",
    callback: (_source: this, pspec: AssemblerFailureEvent) => void
  ): number;
  emit(signal: "assemble-failure", pspec: AssemblerFailureEvent): void;

  connect(
    signal: "hexdump",
    callback: (_source: this, pspec: AssemblerHexdumpEvent) => void
  ): number;
  connect_after(
    signal: "hexdump",
    callback: (_source: this, pspec: AssemblerHexdumpEvent) => void
  ): number;
  emit(signal: "hexdump", pspec: AssemblerHexdumpEvent): void;

  connect(
    signal: "disassembly",
    callback: (_source: this, pspec: AssemblerDisassemblyEvent) => void
  ): number;
  connect_after(
    signal: "disassembly",
    callback: (_source: this, pspec: AssemblerDisassemblyEvent) => void
  ): number;
  emit(signal: "disassembly", pspec: AssemblerDisassemblyEvent): void;

  connect(
    signal: "assemble-info",
    callback: (_source: this, pspec: AssemblerInfoEvent) => void
  ): number;
  connect_after(
    signal: "assemble-info",
    callback: (_source: this, pspec: AssemblerInfoEvent) => void
  ): number;
  emit(signal: "assemble-info", pspec: AssemblerInfoEvent): void;

  // Custom signals for simulator events
  connect(
    signal: "stop",
    callback: (_source: this, pspec: SimulatorStopEvent) => void
  ): number;
  connect_after(
    signal: "stop",
    callback: (_source: this, pspec: SimulatorStopEvent) => void
  ): number;
  emit(signal: "stop", pspec: SimulatorStopEvent): void;

  connect(
    signal: "start",
    callback: (_source: this, pspec: SimulatorStartEvent) => void
  ): number;
  connect_after(
    signal: "start",
    callback: (_source: this, pspec: SimulatorStartEvent) => void
  ): number;
  emit(signal: "start", pspec: SimulatorStartEvent): void;

  connect(
    signal: "reset",
    callback: (_source: this, pspec: SimulatorResetEvent) => void
  ): number;
  connect_after(
    signal: "reset",
    callback: (_source: this, pspec: SimulatorResetEvent) => void
  ): number;
  emit(signal: "reset", pspec: SimulatorResetEvent): void;

  connect(
    signal: "step",
    callback: (_source: this, pspec: SimulatorStepEvent) => void
  ): number;
  connect_after(
    signal: "step",
    callback: (_source: this, pspec: SimulatorStepEvent) => void
  ): number;
  emit(signal: "step", pspec: SimulatorStepEvent): void;

  connect(
    signal: "multistep",
    callback: (_source: this, pspec: SimulatorMultiStepEvent) => void
  ): number;
  connect_after(
    signal: "multistep",
    callback: (_source: this, pspec: SimulatorMultiStepEvent) => void
  ): number;
  emit(signal: "multistep", pspec: SimulatorMultiStepEvent): void;

  connect(
    signal: "goto",
    callback: (_source: this, pspec: SimulatorGotoEvent) => void
  ): number;
  connect_after(
    signal: "goto",
    callback: (_source: this, pspec: SimulatorGotoEvent) => void
  ): number;
  emit(signal: "goto", pspec: SimulatorGotoEvent): void;

  connect(
    signal: "pseudo-op",
    callback: (_source: this, pspec: SimulatorPseudoOpEvent) => void
  ): number;
  connect_after(
    signal: "pseudo-op",
    callback: (_source: this, pspec: SimulatorPseudoOpEvent) => void
  ): number;
  emit(signal: "pseudo-op", pspec: SimulatorPseudoOpEvent): void;

  connect(
    signal: "simulator-info",
    callback: (_source: this, pspec: SimulatorInfoEvent) => void
  ): number;
  connect_after(
    signal: "simulator-info",
    callback: (_source: this, pspec: SimulatorInfoEvent) => void
  ): number;
  emit(signal: "simulator-info", pspec: SimulatorInfoEvent): void;

  connect(
    signal: "simulator-failure",
    callback: (_source: this, pspec: SimulatorFailureEvent) => void
  ): number;
  connect_after(
    signal: "simulator-failure",
    callback: (_source: this, pspec: SimulatorFailureEvent) => void
  ): number;
  emit(signal: "simulator-failure", pspec: SimulatorFailureEvent): void;

  // Custom signals for labels events
  connect(
    signal: "labels-info",
    callback: (_source: this, pspec: LabelsInfoEvent) => void
  ): number;
  connect_after(
    signal: "labels-info",
    callback: (_source: this, pspec: LabelsInfoEvent) => void
  ): number;
  emit(signal: "labels-info", pspec: LabelsInfoEvent): void;

  connect(
    signal: "labels-failure",
    callback: (_source: this, pspec: LabelsFailureEvent) => void
  ): number;
  connect_after(
    signal: "labels-failure",
    callback: (_source: this, pspec: LabelsFailureEvent) => void
  ): number;
  emit(signal: "labels-failure", pspec: LabelsFailureEvent): void;
}

/**
 * The GameConsole widget.
 * @emits assemble-success - Emitted when the assembler successfully assembled the code.
 * @emits assemble-failure - Emitted when the assembler failed to assemble the code.
 * @emits hexdump - Emitted when the assembler hexdumps the code.
 * @emits disassembly - Emitted when the assembler disassembles the code.
 * @emits assemble-info - Emitted when the assembler has an info message.
 * @emits stop - Emitted when the simulator stops.
 * @emits start - Emitted when the simulator starts.
 * @emits reset - Emitted when the simulator resets.
 * @emits step - Emitted when the simulator executes a single step.
 * @emits multistep - Emitted when the simulator executes multiple steps.
 * @emits labels-info - Emitted when the labels has a info message.
 * @emits labels-failure - Emitted when the labels fail to parse.
 */
export class GameConsole extends Adw.Bin {
  // Child widgets
  declare private _display: Display;
  declare private _gamePad: Gamepad;

  static {
    GObject.registerClass(
      {
        GTypeName: "GameConsole",
        Template,
        InternalChildren: ["display", "gamePad"],
        Signals: {
          "assemble-success": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          "assemble-failure": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          hexdump: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          disassembly: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          "assemble-info": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          stop: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          start: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          reset: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          step: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          multistep: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          goto: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          "pseudo-op": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          "simulator-info": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          "simulator-failure": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          "labels-info": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
          "labels-failure": {
            param_types: [GObject.TYPE_JSOBJECT],
          },
        },
      },
      this
    );
  }

  private _memory: Memory;
  private _labels: Labels;
  private _simulator: Simulator;
  private _assembler: Assembler;

  get memory() {
    return this._memory;
  }

  get labels() {
    return this._labels;
  }

  get simulator() {
    return this._simulator;
  }

  get assembler() {
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
    this._display?.initialize(this._memory);
    this._simulator.reset();

    // Set up game console service with all components
    gameConsoleService.init({
      memory: this._memory,
      displayWidget: this._display,
      gamepadWidget: this._gamePad,
      simulator: this._simulator,
      assembler: this._assembler,
      labels: this._labels,
    });

    this.setupEventListeners();
  }

  /**
   * Sets up event listeners to forward events from service to GObject signals.
   */
  private setupEventListeners(): void {
    // Forward events from service to GObject signals
    gameConsoleService.on("assemble-success", (event) => {
      this.emit("assemble-success", event);
    });

    gameConsoleService.on("assemble-failure", (event) => {
      this.emit("assemble-failure", event);
    });

    gameConsoleService.on("hexdump", (event) => {
      this.emit("hexdump", event);
    });

    gameConsoleService.on("disassembly", (event) => {
      this.emit("disassembly", event);
    });

    gameConsoleService.on("assemble-info", (event) => {
      this.emit("assemble-info", event);
    });

    gameConsoleService.on("stop", (event) => {
      this.emit("stop", event);
    });

    gameConsoleService.on("start", (event) => {
      this.emit("start", event);
    });

    gameConsoleService.on("reset", (event) => {
      this.emit("reset", event);
    });

    gameConsoleService.on("step", (event) => {
      this.emit("step", event);
    });

    gameConsoleService.on("multistep", (event) => {
      this.emit("multistep", event);
    });

    gameConsoleService.on("goto", (event) => {
      this.emit("goto", event);
    });

    gameConsoleService.on("pseudo-op", (event) => {
      this.emit("pseudo-op", event);
    });

    gameConsoleService.on("simulator-info", (event) => {
      this.emit("simulator-info", event);
    });

    gameConsoleService.on("simulator-failure", (event) => {
      this.emit("simulator-failure", event);
    });

    gameConsoleService.on("labels-info", (event) => {
      this.emit("labels-info", event);
    });

    gameConsoleService.on("labels-failure", (event) => {
      this.emit("labels-failure", event);
    });
  }

  private removeSignalHandlers(): void {
    // Nothing to do here as event handlers are managed by the service
  }
}

GObject.type_ensure(GameConsole.$gtype);
