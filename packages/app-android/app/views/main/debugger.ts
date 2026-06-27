import type { View } from "@nativescript/core";
import { Application, Label, ScrollView, StackLayout } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import type { DebuggerView } from "@learn6502/common-ui";
import {
  debuggerController,
  DebuggerState,
  mainStateController,
  editorController,
  ViewType,
} from "@learn6502/common-ui";
import type { Memory, Simulator, Assembler } from "@learn6502/core";
import { AdwClamp, AdwPreferencesGroup, AdwSwitchRow, NOTIFY_ACTIVE } from "@gjsify/adwaita-nativescript";

// Import custom widgets
import { MessageConsole, DebugInfo, HexMonitor, Hexdump, Disassembled } from "~/widgets/debugger";

import { notificationService } from "~/services";
import { gameConsoleView } from "./game-console";
import { logger } from "~/utils";
import type { ScreenModule } from "./editor";

/**
 * Debugger view — implements DebuggerView. Now a scrollable Adwaita content view
 * (a boxed-list settings group + framed sections for the register/monitor/dump
 * widgets) added to the shell's AdwViewStack. All logic stays in debuggerController.
 */
class Debugger implements DebuggerView {
  private messageConsole: MessageConsole | null = null;
  private debugInfo: DebugInfo | null = null;
  private hexMonitor: HexMonitor | null = null;
  private hexdump: Hexdump | null = null;
  private disassembled: Disassembled | null = null;

  private _initialized = false;
  private log = logger.scoped("Debugger");

  private onCopyToClipboard = (content: string): void => this.handleCopyToClipboard(content);
  private onCopyToEditor = (code: string): void => this.handleCopyToEditor(code);

  get state(): DebuggerState {
    return debuggerController.state;
  }

  set state(value: DebuggerState) {
    debuggerController.state = value;
  }

  /** Build the debugger content and wire the controller + widget events (once). */
  build(): View {
    this.messageConsole = new MessageConsole();
    this.debugInfo = new DebugInfo();
    this.hexMonitor = new HexMonitor();
    this.hexMonitor.height = 300; // HexMonitor is itself a ScrollView (needs a bound)
    this.hexdump = new Hexdump();
    this.disassembled = new Disassembled();

    const column = new StackLayout();
    column.className = "p-4";

    // --- Debug Settings (Adwaita boxed list) ---
    const settings = new AdwPreferencesGroup();
    settings.title = _("Debug Settings");

    const enabledRow = new AdwSwitchRow();
    enabledRow.title = _("Enable debugger");
    enabledRow.active = debuggerController.state !== DebuggerState.DISABLED;
    enabledRow.addEventListener(NOTIFY_ACTIVE, () => {
      debuggerController.state = enabledRow.active ? DebuggerState.ACTIVE : DebuggerState.DISABLED;
    });
    settings.addRow(enabledRow);

    const stepperRow = new AdwSwitchRow();
    stepperRow.title = _("Stepping mode");
    stepperRow.active = debuggerController.stepperEnabled;
    stepperRow.addEventListener(NOTIFY_ACTIVE, () => {
      debuggerController.stepperEnabled = stepperRow.active;
    });
    settings.addRow(stepperRow);

    column.addChild(settings);

    // --- Widget sections (each framed as a card), in the GNOME debugger order:
    //     registers, hex monitor, hexdump, disassembled, then messages. ---
    column.addChild(this.section(_("Registers & Flags"), this.debugInfo));
    column.addChild(this.section(_("Hex Monitor"), this.hexMonitor)); // HexMonitor is itself a ScrollView
    column.addChild(this.section(_("Hexdump"), this.scrolled(this.hexdump, 200)));
    column.addChild(this.section(_("Disassembled"), this.scrolled(this.disassembled, 200)));
    column.addChild(this.section(_("Messages"), this.scrolled(this.messageConsole, 200)));

    // Wire widget + controller events (the copy/changed plumbing from the old Page).
    this.setupWidgetEventListeners();
    if (!this._initialized) {
      this._initialized = true;
      debuggerController.on("copyToClipboard", this.onCopyToClipboard);
      debuggerController.on("copyToEditor", this.onCopyToEditor);
    }

    debuggerController.init(
      this.messageConsole,
      this.debugInfo,
      gameConsoleView.assembler,
      gameConsoleView.simulator,
      this.hexMonitor,
      this.disassembled,
      this.hexdump
    );

    const clamp = new AdwClamp();
    clamp.maximumSize = 700;
    clamp.setChild(column);

    const scroll = new ScrollView();
    scroll.content = clamp;
    return scroll;
  }

  /** A heading + a `.card`-wrapped widget, matching the GNOME Gtk.Frame sections. */
  private section(title: string, content: View): View {
    const wrap = new StackLayout();
    wrap.className = "mb-16";

    const heading = new Label();
    heading.text = title;
    heading.className = "heading mb-8";
    wrap.addChild(heading);

    const card = new StackLayout();
    card.className = "card p-8";
    card.addChild(content);
    wrap.addChild(card);

    return wrap;
  }

  /** Wrap a TextView-based widget in a fixed-height ScrollView (as the old XML did). */
  private scrolled(content: View, height: number): View {
    const scroll = new ScrollView();
    scroll.height = height;
    scroll.content = content;
    return scroll;
  }

  private setupWidgetEventListeners(): void {
    if (this.disassembled) {
      this.disassembled.on("copy", (args) => {
        const e = args as unknown as { code: string };
        debuggerController.copyToEditor(e.code);
      });
    }
    if (this.hexdump) {
      this.hexdump.on("copy", (args) => {
        const e = args as unknown as { content: string };
        debuggerController.copyToClipboard(e.content);
      });
    }
    if (this.hexMonitor) {
      this.hexMonitor.on("copy", (args) => {
        const e = args as unknown as { content: string };
        debuggerController.copyToClipboard(e.content);
      });
      this.hexMonitor.on("changed", () => {
        const memory = (debuggerController as unknown as { memory?: Memory }).memory;
        if (memory) debuggerController.updateMonitor(memory);
      });
    }
  }

  private handleCopyToClipboard(content: string): void {
    if (Application.android) {
      const context = Application.android.context;
      const clipboardManager = context.getSystemService(
        android.content.Context.CLIPBOARD_SERVICE
      ) as android.content.ClipboardManager;
      const clip = android.content.ClipData.newPlainText("6502 Code", content);
      clipboardManager.setPrimaryClip(clip);
      notificationService.showNotification({ title: "Copied to clipboard", timeout: 2 });
    }
  }

  private handleCopyToEditor(code: string): void {
    mainStateController.events.dispatch("navigate-to-view", { viewType: ViewType.EDITOR });
    editorController.setCode(code);
    notificationService.showNotification({ title: "Code copied to editor", timeout: 2 });
  }

  // --- DebuggerView interface ---
  update(memory: Memory, simulator: Simulator): void {
    debuggerController.update(memory, simulator);
  }
  updateMonitor(memory: Memory): void {
    debuggerController.updateMonitor(memory);
  }
  updateDebugInfo(simulator: Simulator): void {
    debuggerController.updateDebugInfo(simulator);
  }
  updateHexdump(assembler: Assembler): void {
    debuggerController.updateHexdump(assembler);
  }
  updateDisassembled(assembler: Assembler): void {
    debuggerController.updateDisassembled(assembler);
  }
  reset(): void {
    debuggerController.reset();
  }
  close(): void {
    debuggerController.off("copyToClipboard", this.onCopyToClipboard);
    debuggerController.off("copyToEditor", this.onCopyToEditor);
    debuggerController.close();
  }
}

// Create a singleton instance
const debuggerView = new Debugger();

/** Build the debugger screen for the shell's AdwViewStack. */
export function buildDebuggerScreen(): ScreenModule {
  return {
    view: debuggerView.build(),
    onShow: () => {
      debuggerView.state = DebuggerState.ACTIVE;
    },
  };
}

export { debuggerView };
