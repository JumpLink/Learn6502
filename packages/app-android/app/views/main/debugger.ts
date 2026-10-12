import { Application } from "@nativescript/core";
import {
  debuggerController,
  DebuggerState,
  mainStateController,
  editorController,
  ViewType,
} from "@learn6502/common-ui";
import type { Memory, Simulator, Assembler } from "@learn6502/core";
import { Debugger as DebuggerWidget } from "@learn6502/ui";

import { notificationService } from "~/services";
import { asView } from "~/utils/as-view";
import { gameConsoleView } from "./game-console";
import type { ScreenModule } from "./editor";

/**
 * Thin Android glue around the shared `@learn6502/ui` Debugger: the clipboard and the hop to the
 * editor are Android's own; everything else goes through the shared controller.
 */
class DebuggerGlue {
  private widget: DebuggerWidget | null = null;

  constructor() {
    debuggerController.on("copyToClipboard", (content: string) => this.copyToClipboard(content));
    debuggerController.on("copyToEditor", (code: string) => this.copyToEditor(code));
  }

  get state(): DebuggerState {
    return debuggerController.state;
  }
  set state(value: DebuggerState) {
    debuggerController.state = value;
  }

  build(): ScreenModule {
    // The previous debugger, if the activity was recreated, stops listening to the controller first.
    this.widget?.unbind();
    const widget = new DebuggerWidget();
    widget.setSimulatorStack(gameConsoleView);
    this.widget = widget;
    return {
      // The shared widget is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
      view: asView(widget),
      onShow: () => {
        this.state = DebuggerState.ACTIVE;
      },
    };
  }

  update(memory: Memory, simulator: Simulator): void {
    debuggerController.update(memory, simulator);
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

  private copyToClipboard(content: string): void {
    if (!Application.android) return;
    const clipboardManager = Application.android.context.getSystemService(
      android.content.Context.CLIPBOARD_SERVICE
    ) as android.content.ClipboardManager;
    clipboardManager.setPrimaryClip(android.content.ClipData.newPlainText("6502 Code", content));
    notificationService.showNotification({ title: "Copied to clipboard", timeout: 2 });
  }

  private copyToEditor(code: string): void {
    mainStateController.events.dispatch("navigate-to-view", { viewType: ViewType.EDITOR });
    editorController.setCode(code);
    notificationService.showNotification({ title: "Code copied to editor", timeout: 2 });
  }
}

export const debuggerView = new DebuggerGlue();

/** Build the debugger screen for the shell's Adw.ViewStack. */
export function buildDebuggerScreen(): ScreenModule {
  return debuggerView.build();
}
