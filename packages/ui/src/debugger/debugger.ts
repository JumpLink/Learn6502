import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import type { Memory, Simulator, Assembler } from "@learn6502/core";
import {
  type DebuggerView,
  type MessageConsoleWidget,
  type DebugInfoWidget,
  type SimulatorStack,
  DebuggerState,
  type DisassembledCopyEvent,
  type HexdumpCopyEvent,
  type HexMonitorCopyEvent,
  debuggerController,
} from "@learn6502/common-ui";

import type { Hexdump } from "./hexdump.ts";
import type { Disassembled } from "./disassembled.ts";
import type { HexMonitor } from "./hex-monitor.ts";

import Template from "./debugger.blp?template";

/**
 * The debugger page: registers, hex monitor, hexdump, disassembly and messages, the same widget on
 * GNOME, web and Android.
 *
 * It reads the assembler and simulator the platform hands over with `setSimulatorStack`, the stack
 * the GameConsole beside it plays on.
 */
export class Debugger extends Adw.Bin implements DebuggerView {
  declare private _state: DebuggerState;
  declare private _enabled: boolean;
  declare public scrollable: boolean;

  declare private _scrolledWindow: Gtk.ScrolledWindow;
  declare private _messageConsole: MessageConsoleWidget;
  declare private _hexMonitor: HexMonitor;
  declare private _hexdump: Hexdump;
  declare private _disassembled: Disassembled;
  declare private _debugInfo: DebugInfoWidget;
  declare private _stepperSwitch: Adw.SwitchRow;
  declare private _enabledSwitch: Adw.SwitchRow;

  // The last memory update, to refresh when the monitor options change
  private memory: Memory | null = null;
  private bound = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "Debugger",
        Template,
        InternalChildren: [
          "scrolledWindow",
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

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);

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

    this.connect("notify::scrollable", () => {
      this.updateScrollbarPolicy();
    });
  }

  /** Hand the debugger the assembler and simulator it shows, and connect the controller to its widgets. */
  public setSimulatorStack(stack: Pick<SimulatorStack, "assembler" | "simulator">): void {
    debuggerController.init(
      this._messageConsole,
      this._debugInfo,
      stack.assembler,
      stack.simulator,
      this._hexMonitor,
      this._disassembled,
      this._hexdump
    );

    if (!this.bound) {
      this.bound = true;
      debuggerController.on("stateChanged", this.onServiceStateChanged);
      debuggerController.on("stepperToggled", this.onStepperToggled);
    }
  }

  /**
   * Stop listening to the controller, which outlives this widget. Android calls it before it
   * rebuilds the debugger, or the old one keeps steering dead switches.
   */
  public unbind(): void {
    this.bound = false;
    debuggerController.off("stateChanged", this.onServiceStateChanged);
    debuggerController.off("stepperToggled", this.onStepperToggled);
  }

  /** Call this when the window is closed. */
  public close(): void {
    this.removeSignalHandlers();
    this.unbind();
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

  public updateMonitor(memory: Memory): void {
    debuggerController.updateMonitor(memory);
  }

  public updateDebugInfo(simulator: Simulator): void {
    debuggerController.updateDebugInfo(simulator);
  }

  public updateHexdump(assembler: Assembler): void {
    debuggerController.updateHexdump(assembler);
  }

  public updateDisassembled(assembler: Assembler): void {
    debuggerController.updateDisassembled(assembler);
  }

  public reset(): void {
    debuggerController.reset();
    this.state = DebuggerState.RESET;
  }

  private onServiceStateChanged(newState: DebuggerState): void {
    this.state = newState;
    // Reflect enabled state without triggering controller state changes
    const shouldBeEnabled = newState !== DebuggerState.DISABLED;
    if (this._enabled !== shouldBeEnabled) {
      this._enabled = shouldBeEnabled;
      this.notify("enabled");
    }
  }

  private onHexMonitorChanged(): void {
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

    this._stepperSwitch.connect("notify::active", this.onStepperSwitchActivated);
    this._enabledSwitch.connect("notify::active", this.onEnabledSwitchActivated);
  }

  private removeSignalHandlers(): void {
    this._disassembled.events.off("copy", this.onCopyToEditor);
    this._hexdump.events.off("copy", this.onCopyToClipboard);
    this._hexMonitor.events.off("copy", this.onCopyToClipboard);
    this._hexMonitor.events.off("changed", this.onHexMonitorChanged);
  }

  /** Mirror the stepper state of the controller without looping back into it. */
  private onStepperToggled(enabled: boolean): void {
    if (this._stepperSwitch.active !== enabled) {
      this._stepperSwitch.active = enabled;
    }
  }

  private onStepperSwitchActivated(): void {
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
    this._scrolledWindow.vscrollbar_policy = this.scrollable ? Gtk.PolicyType.AUTOMATIC : Gtk.PolicyType.NEVER;
  }
}

GObject.type_ensure(Debugger.$gtype);
