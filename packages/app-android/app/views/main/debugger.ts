import { EventData, Page, GridLayout, ScrollView, TextView, LayoutBase, Application } from "@nativescript/core";
import {
  debuggerController,
  DebuggerView,
  DebuggerState,
  mainStateController,
  editorController,
  ViewType,
} from "@learn6502/common-ui";
import type { Memory, Simulator, Assembler } from "@learn6502/6502";

// Import custom widgets
import { MessageConsole, DebugInfo, HexMonitor, Hexdump, Disassembled } from "~/widgets/debugger";

import { notificationService } from "~/services";
import { gameConsoleView } from "./game-console";
import { logger } from "~/utils";

class Debugger implements DebuggerView {
  private page: Page | null = null;

  // Widget instances
  private messageConsole: MessageConsole | null = null;
  private debugInfo: DebugInfo | null = null;
  private hexMonitor: HexMonitor | null = null;
  private hexdump: Hexdump | null = null;
  private disassembled: Disassembled | null = null;

  // State preservation
  private _isInitialized: boolean = false;

  // Scoped logger for this class
  private log = logger.scoped("Debugger");

  // Event handlers bound to this instance
  private onCopyToClipboard = this.handleCopyToClipboard.bind(this);
  private onCopyToEditor = this.handleCopyToEditor.bind(this);

  // Implement required properties from DebuggerView interface
  public get state(): DebuggerState {
    return debuggerController.state;
  }

  public set state(value: DebuggerState) {
    debuggerController.state = value;
  }

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;

    this.log.debug(`onNavigatingTo - isInitialized: ${this._isInitialized}`);

    // Get widget references from XML
    this.messageConsole = this.page.getViewById<MessageConsole>("messageConsole");
    this.debugInfo = this.page.getViewById<DebugInfo>("debugInfo");
    this.hexMonitor = this.page.getViewById<HexMonitor>("hexMonitor");
    this.hexdump = this.page.getViewById<Hexdump>("hexdump");
    this.disassembled = this.page.getViewById<Disassembled>("disassembled");

    if (!this.messageConsole || !this.debugInfo || !this.hexMonitor || !this.hexdump || !this.disassembled) {
      this.log.error("Failed to find required components in debugger view");
      return;
    }

    // Set up event listeners for widgets
    this.setupWidgetEventListeners();

    // Initialize or re-initialize the debugger controller with widgets
    if (!this._isInitialized) {
      this.log.debug("First initialization");
      this._isInitialized = true;

      // Set up controller event listeners only once
      this.setupControllerEventListeners();
    } else {
      this.log.debug("Re-initializing with existing state");
    }

    // Always re-initialize with current widgets (debuggerController handles state preservation)
    debuggerController.init(
      this.messageConsole,
      this.debugInfo,
      gameConsoleView.assembler,
      gameConsoleView.simulator,
      this.hexMonitor,
      this.disassembled,
      this.hexdump
    );

    // Set state to active when navigating to this view
    debuggerController.state = DebuggerState.ACTIVE;
  }

  public onNavigatingFrom(): void {
    this.log.debug("onNavigatingFrom - preserving state");

    // Remove widget event listeners to prevent memory leaks
    this.removeWidgetEventListeners();

    // The debuggerController maintains its state, we just disconnect the widgets
    // but keep the controller alive
  }

  private setupControllerEventListeners(): void {
    // Listen for copy events from the controller
    debuggerController.on("copyToClipboard", this.onCopyToClipboard);
    debuggerController.on("copyToEditor", this.onCopyToEditor);
  }

  private setupWidgetEventListeners(): void {
    // Set up event listeners for widget interactions
    if (this.disassembled) {
      this.disassembled.on("copy", (args: any) => {
        debuggerController.copyToEditor(args.code);
      });
    }

    if (this.hexdump) {
      this.hexdump.on("copy", (args: any) => {
        debuggerController.copyToClipboard(args.content);
      });
    }

    if (this.hexMonitor) {
      this.hexMonitor.on("copy", (args: any) => {
        debuggerController.copyToClipboard(args.content);
      });

      this.hexMonitor.on("changed", () => {
        // Refresh the hex monitor when settings change
        const memory = (debuggerController as any).memory;
        if (memory) {
          debuggerController.updateMonitor(memory);
        }
      });
    }
  }

  private removeWidgetEventListeners(): void {
    // Remove all widget event listeners
    if (this.disassembled) {
      this.disassembled.off("copy");
    }

    if (this.hexdump) {
      this.hexdump.off("copy");
    }

    if (this.hexMonitor) {
      this.hexMonitor.off("copy");
      this.hexMonitor.off("changed");
    }
  }

  private handleCopyToClipboard(content: string): void {
    // Implement clipboard functionality for Android
    if (Application.android) {
      const context = Application.android.context;
      const clipboardManager = context.getSystemService(
        android.content.Context.CLIPBOARD_SERVICE
      ) as android.content.ClipboardManager;

      const clip = android.content.ClipData.newPlainText("6502 Code", content);
      clipboardManager.setPrimaryClip(clip);

      // Show notification
      notificationService.showNotification({
        title: "Copied to clipboard",
        timeout: 2,
      });
    }
  }

  private handleCopyToEditor(code: string): void {
    // Navigate to editor and set the code
    mainStateController.events.dispatch("navigate-to-view", {
      viewType: ViewType.EDITOR,
    });
    editorController.setCode(code);

    // Show notification
    notificationService.showNotification({
      title: "Code copied to editor",
      timeout: 2,
    });
  }

  // Implement required methods from DebuggerView interface
  public update(memory: Memory, simulator: Simulator): void {
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
  }

  public close(): void {
    // Remove controller event listeners
    debuggerController.off("copyToClipboard", this.onCopyToClipboard);
    debuggerController.off("copyToEditor", this.onCopyToEditor);

    // Remove widget event listeners
    this.removeWidgetEventListeners();

    debuggerController.close();
    this.page = null;

    // Clear widget references but don't reset initialization state
    this.messageConsole = null;
    this.debugInfo = null;
    this.hexMonitor = null;
    this.hexdump = null;
    this.disassembled = null;
  }

  /**
   * Get initialization status
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Force re-initialization (useful for testing or reset scenarios)
   */
  resetInitialization(): void {
    this._isInitialized = false;
    debuggerController.reset();
  }
}

// Create a singleton instance
const debuggerView = new Debugger();

// Export the instance methods for view binding
export const onNavigatingTo = debuggerView.onNavigatingTo.bind(debuggerView);
export const onNavigatingFrom = debuggerView.onNavigatingFrom.bind(debuggerView);
// Export the instance for external access if needed
export { debuggerView };
