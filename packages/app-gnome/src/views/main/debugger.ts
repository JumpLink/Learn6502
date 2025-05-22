import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Adw from "@girs/adw-1";

import {
  HexMonitor,
  Hexdump,
  Disassembled,
} from "../../widgets/debugger/index.ts";

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

export class Debugger extends Adw.Bin implements DebuggerView {
  // Properties
  declare private _state: DebuggerState;

  // Child widgets
  declare private _stack: Gtk.Stack;
  declare private _messageConsole: MessageConsoleWidget;
  declare private _hexMonitor: HexMonitor;
  declare private _hexdump: Hexdump;
  declare private _disassembled: Disassembled;
  declare private _debugInfo: DebugInfoWidget;
  declare private _statusPage: Adw.StatusPage;

  static {
    GObject.registerClass(
      {
        GTypeName: "Debugger",
        Template,
        InternalChildren: [
          "stack",
          "messageConsole",
          "hexMonitor",
          "hexdump",
          "disassembled",
          "debugInfo",
          "statusPage",
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

  /** A list of handler IDs for the signals we connect to. */
  private handlerIds: number[] = [];

  // Reference to the last memory update for refreshing when monitor options change
  private memory: Memory | null = null;

  constructor(binParams: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(binParams);

    this.onCopyToClipboard = this.onCopyToClipboard.bind(this);
    this.onCopyToEditor = this.onCopyToEditor.bind(this);
    this.onHexMonitorChanged = this.onHexMonitorChanged.bind(this);
    this.onStateChanged = this.onStateChanged.bind(this);
    this.onParamChanged = this.onParamChanged.bind(this);
    this.onServiceStateChanged = this.onServiceStateChanged.bind(this);

    this.setupSignalHandlers();
    this.setupServiceHandlers();
    this.state = DebuggerState.INITIAL;
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
    // Initialize the debugger service with widgets
    debuggerController.init(
      this._messageConsole,
      this._debugInfo,
      this._hexMonitor,
      this._disassembled,
      this._hexdump
    );

    // Listen for state changes from the service
    debuggerController.on("stateChanged", this.onServiceStateChanged);
  }

  private onServiceStateChanged(newState: DebuggerState): void {
    // Update UI component state when service state changes
    this.state = newState;
  }

  private onStateChanged(): void {
    if (this.state === DebuggerState.INITIAL) {
      this._stack.set_visible_child_name("initial");
    } else {
      this._stack.set_visible_child_name("debugger");
    }
  }

  private onParamChanged(_self: Debugger, pspec: GObject.ParamSpec): void {
    switch (pspec.name) {
      case "state":
        this.onStateChanged();
        break;
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

  private onCopyToClipboard(
    event: HexdumpCopyEvent | HexMonitorCopyEvent
  ): void {
    debuggerController.copyToClipboard(event.content);
  }

  private setupSignalHandlers(): void {
    this.handlerIds.push(this.connect("notify", this.onParamChanged));

    this._disassembled.events.on("copy", this.onCopyToEditor);

    this._hexdump.events.on("copy", this.onCopyToClipboard);

    this._hexMonitor.events.on("copy", this.onCopyToClipboard);

    this._hexMonitor.events.on("changed", this.onHexMonitorChanged);
  }

  private removeSignalHandlers(): void {
    try {
      this.handlerIds.forEach((id) => this.disconnect(id));
    } catch (error) {
      console.error("[Debugger] Failed to remove signal handlers", error);
    }

    this._disassembled.events.off("copy", this.onCopyToEditor);
    this._hexdump.events.off("copy", this.onCopyToClipboard);
    this._hexMonitor.events.off("copy", this.onCopyToClipboard);
    this._hexMonitor.events.off("changed", this.onHexMonitorChanged);

    // Remove service event listener
    debuggerController.off("stateChanged", this.onServiceStateChanged);

    this.handlerIds = [];
  }
}

GObject.type_ensure(Debugger.$gtype);
