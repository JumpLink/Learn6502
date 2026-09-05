import { Adw } from "@gjsify/adwaita-web";
import type { DebuggerView, DisassembledCopyEvent, HexdumpCopyEvent, HexMonitorCopyEvent } from "@learn6502/common-ui";
import { DebuggerState, debuggerController } from "@learn6502/common-ui";
import type { Assembler, Memory, Simulator } from "@learn6502/core";

import { DebugInfo, Disassembled, HexMonitor, Hexdump, MessageConsole } from "../widgets/debugger/index.js";

/**
 * AdwDebuggerView — the ADR 0007 spike: `DebuggerView` from
 * `@learn6502/common-ui` implemented as a class over `@gjsify/adwaita-web`
 * custom elements, wired to the shared `debuggerController` exactly like its
 * GNOME (`Debugger extends Adw.Bin`) and Android (`Debugger` over
 * `@gjsify/adwaita-nativescript`) twins.
 *
 * Structure mirrors the twins: a clamped column with a "Debug Settings" boxed
 * list (enable + stepper switch rows), the register/flags display, and the
 * hex monitor / hexdump / disassembled / messages sections. All logic stays in
 * `debuggerController`; this class only builds widgets and forwards events.
 */
export class AdwDebuggerView extends HTMLElement implements DebuggerView {
  private messageConsole: MessageConsole | null = null;
  private debugInfo: DebugInfo | null = null;
  private hexMonitor: HexMonitor | null = null;
  private hexdump: Hexdump | null = null;
  private disassembled: Disassembled | null = null;
  private enabledRow: Adw.SwitchRow | null = null;
  private stepperRow: Adw.SwitchRow | null = null;

  // Reference to the last memory update for refreshing when monitor options change
  private memory: Memory | null = null;
  private subscribed = false;

  private onStateChanged = (state: DebuggerState): void => {
    if (!this.enabledRow) return;
    const shouldBeEnabled = state !== DebuggerState.DISABLED;
    if (this.enabledRow.active !== shouldBeEnabled) this.enabledRow.active = shouldBeEnabled;
  };

  private onStepperToggled = (enabled: boolean): void => {
    if (!this.stepperRow) return;
    if (this.stepperRow.active !== enabled) this.stepperRow.active = enabled;
  };

  private onCopyToClipboard = (content: string): void => {
    void navigator.clipboard?.writeText(content);
  };

  public get state(): DebuggerState {
    return debuggerController.state;
  }

  public set state(value: DebuggerState) {
    debuggerController.state = value;
  }

  connectedCallback(): void {
    this.ensureBuilt();
  }

  /**
   * Initialize the shared controller with this view's widgets and the core
   * references — the same `debuggerController.init(...)` call the GNOME and
   * Android views make.
   */
  public initialize(assembler: Assembler, simulator: Simulator): void {
    this.ensureBuilt();

    debuggerController.init(
      this.messageConsole!,
      this.debugInfo!,
      assembler,
      simulator,
      this.hexMonitor!,
      this.disassembled!,
      this.hexdump!
    );

    if (!this.subscribed) {
      this.subscribed = true;
      debuggerController.on("stateChanged", this.onStateChanged);
      debuggerController.on("stepperToggled", this.onStepperToggled);
      debuggerController.on("copyToClipboard", this.onCopyToClipboard);
    }

    // Seed the switch rows from the controller state.
    this.onStateChanged(debuggerController.state);
    this.onStepperToggled(debuggerController.stepperEnabled);
  }

  // --- DebuggerView interface (delegates to debuggerController, like the twins) ---

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

  public log(message: string): void {
    debuggerController.log(message);
  }

  public reset(): void {
    debuggerController.reset();
  }

  public close(): void {
    if (this.subscribed) {
      this.subscribed = false;
      debuggerController.off("stateChanged", this.onStateChanged);
      debuggerController.off("stepperToggled", this.onStepperToggled);
      debuggerController.off("copyToClipboard", this.onCopyToClipboard);
    }
    debuggerController.close();
  }

  /** Build the widget tree (once) and wire widget events to the controller. */
  private ensureBuilt(): void {
    if (this.messageConsole) return;

    this.messageConsole = new MessageConsole();
    this.debugInfo = new DebugInfo();
    this.hexMonitor = new HexMonitor();
    this.hexdump = new Hexdump();
    this.disassembled = new Disassembled();

    const column = document.createElement("div");

    // --- Debug Settings (Adwaita boxed list, like the GNOME/Android twins) ---
    const settings = new Adw.PreferencesGroup();
    settings.setAttribute("title", "Debug Settings");

    this.enabledRow = new Adw.SwitchRow();
    this.enabledRow.setAttribute("title", "Enable debugger");
    this.enabledRow.active = debuggerController.state !== DebuggerState.DISABLED;
    this.enabledRow.addEventListener("notify::active", () => {
      debuggerController.state = this.enabledRow?.active ? DebuggerState.ACTIVE : DebuggerState.DISABLED;
    });
    settings.appendChild(this.enabledRow);

    this.stepperRow = new Adw.SwitchRow();
    this.stepperRow.setAttribute("title", "Stepping mode");
    this.stepperRow.active = debuggerController.stepperEnabled;
    this.stepperRow.addEventListener("notify::active", () => {
      debuggerController.stepperEnabled = this.stepperRow?.active ?? false;
    });
    settings.appendChild(this.stepperRow);

    column.appendChild(settings);

    // --- Widget sections, in the GNOME debugger order: registers, hex monitor,
    //     hexdump, disassembled, then messages. The register/flags display is
    //     an Adwaita boxed list (its own groups); the rest get a heading. ---
    column.appendChild(this.debugInfo);
    column.appendChild(this.section("Hex Monitor", this.hexMonitor));
    column.appendChild(this.section("Hexdump", this.hexdump));
    column.appendChild(this.section("Disassembled", this.disassembled));
    column.appendChild(this.section("Messages", this.messageConsole));

    this.setupWidgetEventListeners();

    const clamp = new Adw.Clamp();
    clamp.setAttribute("maximum-size", "700");
    clamp.appendChild(column);
    this.replaceChildren(clamp);
  }

  /** A heading + the widget, matching the Android twin's section helper. */
  private section(title: string, content: HTMLElement): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "learn-section";

    const heading = document.createElement("span");
    heading.className = "learn-section-heading";
    heading.textContent = title;

    wrap.append(heading, content);
    return wrap;
  }

  /** Wire widget copy/changed events to the controller (like both twins). */
  private setupWidgetEventListeners(): void {
    this.disassembled?.events.on("copy", (event: DisassembledCopyEvent) => {
      debuggerController.copyToEditor(event.code);
    });
    this.hexdump?.events.on("copy", (event: HexdumpCopyEvent) => {
      debuggerController.copyToClipboard(event.content);
    });
    this.hexMonitor?.events.on("copy", (event: HexMonitorCopyEvent) => {
      debuggerController.copyToClipboard(event.content);
    });
    this.hexMonitor?.events.on("changed", () => {
      if (this.memory) debuggerController.updateMonitor(this.memory);
    });
  }
}

customElements.define("learn-debugger", AdwDebuggerView);
