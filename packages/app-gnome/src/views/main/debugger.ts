import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import { HexMonitor, Hexdump, Disassembled } from "../../widgets/debugger/index.ts";

import Template from "./debugger.blp";

import { type Memory, type Simulator, Assembler } from "@learn6502/6502";
import {
  type DebuggerView,
  type MessageConsoleWidget,
  type DebugInfoWidget,
  DebuggerState,
  type DisassembledCopyEvent,
  type HexdumpCopyEvent,
  type HexMonitorCopyEvent,
  debuggerController,
} from "@learn6502/common-ui";
import type { GameConsole } from "./game-console.ts";

export class Debugger extends Adw.Bin implements DebuggerView {
  // Properties
  private declare _state: DebuggerState;
  private declare _enabled: boolean;
  public declare scrollable: boolean;

  // Child widgets
  private declare _messageConsole: MessageConsoleWidget;
  private declare _hexMonitor: HexMonitor;
  private declare _hexdump: Hexdump;
  private declare _disassembled: Disassembled;
  private declare _debugInfo: DebugInfoWidget;
  private declare _stepperSwitch: Adw.SwitchRow;
  private declare _enabledSwitch: Adw.SwitchRow;

  // Reference to game console
  private gameConsole: GameConsole | null = null;

  static {
    GObject.registerClass(
      {
        GTypeName: "Debugger",
        Template,
        InternalChildren: [
          "messageConsole",
          "hexMonitor",
          "hexdump",
          "disassembled",
          "debugInfo",
          "stepperSwitch",
          "enabledSwitch",
        ],
        Properties: {
          // TypeScript enums are numbers by default
          state: GObject.ParamSpec.uint(
            "state",
            "State",
            "Debugger state",
            GObject.ParamFlags.READWRITE,
            DebuggerState.INITIAL,
            DebuggerState.RESET,
            DebuggerState.INITIAL
          ),
          enabled: GObject.ParamSpec.boolean(
            "enabled",
            "Enabled",
            "Debugger enabled",
            GObject.ParamFlags.READWRITE,
            true
          ),
          scrollable: GObject.ParamSpec.boolean(
            "scrollable",
            "Scrollable",
            "Whether the debugger should have its own scrollbar",
            GObject.ParamFlags.READWRITE,
            true
          ),
        },
      },
      this
    );
  }

  public get state(): DebuggerState {
    return this._state;
  }

  public set state(value: DebuggerState) {
    if (this._state !== value) {
      this._state = value;
      this.notify("state");
    }
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(value: boolean) {
    if (this._enabled === value) return;
    this._enabled = value;
    this.notify("enabled");

    // Sync with controller state
    debuggerController.state = value
      ? this.state === DebuggerState.RESET
        ? DebuggerState.RESET
        : DebuggerState.ACTIVE
      : DebuggerState.DISABLED;
  }

  // No generic handler tracking needed

  // Reference to the last memory update for refreshing when monitor options change
  private memory: Memory | null = null;

  constructor(binParams: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(binParams);

    this.onCopyToClipboard = this.onCopyToClipboard.bind(this);
    this.onCopyToEditor = this.onCopyToEditor.bind(this);
    this.onHexMonitorChanged = this.onHexMonitorChanged.bind(this);
    this.onServiceStateChanged = this.onServiceStateChanged.bind(this);
    this.onStepperToggled = this.onStepperToggled.bind(this);
    this.onStepperSwitchActivated = this.onStepperSwitchActivated.bind(this);
    this.onEnabledSwitchActivated = this.onEnabledSwitchActivated.bind(this);

    this.setupSignalHandlers();
    this.state = DebuggerState.INITIAL;
    this.enabled = true;

    // Connect to scrollable property changes
    this.connect("notify::scrollable", () => {
      this.updateScrollbarPolicy();
    });
  }

  /**
   * Set the game console reference for accessing assembler and simulator
   */
  public setGameConsole(gameConsole: GameConsole): void {
    this.gameConsole = gameConsole;
    this.setupServiceHandlers();
  }

  /** Call this when the MainWindow is closed. */
  public close(): void {
    this.removeSignalHandlers();
    debuggerController.close();
  }

  public log(message: string): void {
    debuggerController.log(message);
  }

  /**
   * Update the debugger display.
   * @param memory Current state of system memory
   * @param simulator Current state of the 6502 simulator
   */
  public update(memory: Memory, simulator: Simulator): void {
    this.memory = memory;
    debuggerController.update(memory, simulator);
  }

  /**
   * Updates the memory monitor display when memory content changes.
   * @param memory Current state of system memory
   */
  public updateMonitor(memory: Memory): void {
    debuggerController.updateMonitor(memory);
  }

  /**
   * Updates debug information like registers and flags.
   * @param simulator Current state of the 6502 simulator
   */
  public updateDebugInfo(simulator: Simulator): void {
    debuggerController.updateDebugInfo(simulator);
  }

  /**
   * Updates the hexdump display of the assembled program.
   * @param assembler Assembler instance containing the new program code
   */
  public updateHexdump(assembler: Assembler): void {
    debuggerController.updateHexdump(assembler);
  }

  /**
   * Updates the disassembled display of the assembled program.
   * @param assembler Assembler instance containing the new program code
   */
  public updateDisassembled(assembler: Assembler): void {
    debuggerController.updateDisassembled(assembler);
  }

  public reset(): void {
    debuggerController.reset();
    this.state = DebuggerState.RESET;
  }

  private setupServiceHandlers(): void {
    if (!this.gameConsole) {
      console.warn("[Debugger] GameConsole not set, skipping service initialization");
      return;
    }

    // Initialize the debugger service with widgets
    debuggerController.init(
      this._messageConsole,
      this._debugInfo,
      this.gameConsole.assembler,
      this.gameConsole.simulator,
      this._hexMonitor,
      this._disassembled,
      this._hexdump
    );

    // Listen for state changes from the service
    debuggerController.on("stateChanged", this.onServiceStateChanged);

    // Listen for stepper state changes from the service
    debuggerController.on("stepperToggled", this.onStepperToggled);
  }

  private onServiceStateChanged(newState: DebuggerState): void {
    // Keep state in sync for service consumers; UI is always the debugger view
    this.state = newState;
    // Reflect enabled state without triggering controller state changes
    const shouldBeEnabled = newState !== DebuggerState.DISABLED;
    if (this._enabled !== shouldBeEnabled) {
      this._enabled = shouldBeEnabled;
      this.notify("enabled");
    }
  }

  private onHexMonitorChanged(): void {
    // Refresh the view if we have memory data
    if (this.memory) {
      this.updateMonitor(this.memory);
    }
  }

  private onCopyToEditor(event: DisassembledCopyEvent): void {
    debuggerController.copyToEditor(event.code);
  }

  private onCopyToClipboard(event: HexdumpCopyEvent | HexMonitorCopyEvent): void {
    debuggerController.copyToClipboard(event.content);
  }

  private setupSignalHandlers(): void {
    this._disassembled.events.on("copy", this.onCopyToEditor);

    this._hexdump.events.on("copy", this.onCopyToClipboard);

    this._hexMonitor.events.on("copy", this.onCopyToClipboard);

    this._hexMonitor.events.on("changed", this.onHexMonitorChanged);

    // Connect stepper switch signal
    this._stepperSwitch.connect("notify::active", this.onStepperSwitchActivated);

    // Connect enabled switch
    this._enabledSwitch.connect("notify::active", this.onEnabledSwitchActivated);
  }

  private removeSignalHandlers(): void {
    this._disassembled.events.off("copy", this.onCopyToEditor);
    this._hexdump.events.off("copy", this.onCopyToClipboard);
    this._hexMonitor.events.off("copy", this.onCopyToClipboard);
    this._hexMonitor.events.off("changed", this.onHexMonitorChanged);

    // Remove service event listeners
    debuggerController.off("stateChanged", this.onServiceStateChanged);
    debuggerController.off("stepperToggled", this.onStepperToggled);
    // no-op
  }

  /**
   * Handle stepper state changes from the service
   * @param enabled Whether stepper is enabled
   */
  private onStepperToggled(enabled: boolean): void {
    // Only update if the state actually changed to avoid signal loops
    if (this._stepperSwitch.active !== enabled) {
      this._stepperSwitch.active = enabled;
    }
  }

  /**
   * Handle stepper switch activation from UI
   */
  private onStepperSwitchActivated(): void {
    // The setter will only dispatch events if the state actually changed
    debuggerController.stepperEnabled = this._stepperSwitch.active;
    // Stepping implies debugging; ensure enabled
    if (!this._enabledSwitch.active) {
      this._enabledSwitch.active = true;
    }
  }

  private onEnabledSwitchActivated(): void {
    this.enabled = this._enabledSwitch.active;
  }

  private updateScrollbarPolicy(): void {
    const scrolledWindow = this.get_first_child() as Gtk.ScrolledWindow;
    if (scrolledWindow) {
      scrolledWindow.vscrollbar_policy = this.scrollable ? Gtk.PolicyType.AUTOMATIC : Gtk.PolicyType.NEVER;
    }
  }
}

GObject.type_ensure(Debugger.$gtype);
