import type Adw from "@girs/adw-1";

import { ViewType } from "../views/index.ts";
import { editorController, mainStateController } from "../controller/index.ts";

import { FileService } from "../file.service.ts";
import { notificationService } from "../notification.service.ts";
import { PreferencesDialog } from "../preferences/preferences-dialog.ts";
import { createAboutDialog } from "./about.ts";
import { addAppActions } from "./menu.ts";
import type { MainWindowHost, MainWindowPlatform } from "./platform.ts";

declare const __APP_VERSION__: string;

/** Learn6502 project repository — the "share your example" destination. */
const SHARE_URL = "https://github.com/JumpLink/Learn6502";

/** The starter program the Editor opens with — Assemble, then Run or Step. */
const DEMO_PROGRAM = `; Fill the display page at $0200 with random colors.
; Assemble, then Run or Step to watch the debugger update.
  LDX #$00
loop:
  LDA $fe        ; random byte
  STA $0200,X
  INX
  BNE loop
  BRK
`;

/** The browser: DOM pickers and clipboard, the Editor's quick-help sheet as help, no geometry to keep. */
export function createMainWindowPlatform({ window, application, navigateToView }: MainWindowHost): MainWindowPlatform {
  const files = new FileService();
  const openShareUrl = () => openUrl(SHARE_URL);
  return {
    services: {
      files: {
        openFile: () => files.openFile(),
        saveFile: (content) => files.saveFile(content),
        saveFileAs: (content, suggestedName) => files.saveFileAs(content, suggestedName),
        getCurrentFileName: () => files.getCurrentFileName(),
        hasCurrentFile: () => files.hasCurrentFile(),
        hasUnsavedChanges: () => files.hasUnsavedChanges(),
        setUnsavedChanges: (hasChanges) => files.setUnsavedChanges(hasChanges),
      },
      settings: { getInt: () => 0, setInt: () => {}, getBoolean: () => false, setBoolean: () => {} },
      clipboard: {
        copy: (text) => {
          if (!navigator.clipboard) return false;
          void navigator.clipboard.writeText(text);
          return true;
        },
      },
      notifier: { show: (options) => notificationService.showNotification(options) },
      showHelp: () => {
        navigateToView(ViewType.EDITOR);
        editorController.setHelpVisible(true);
      },
      showShareDialog: openShareUrl,
      submitExample: openShareUrl,
    },
    initialView: ViewType.EDITOR,
    bindShell: (shell) => {
      // so `close()` hides the frame instead of detaching it and leaving a blank page
      window.hide_on_close = true;
      const about = createAboutDialog(__APP_VERSION__) as Adw.AboutDialog;
      // The dialog is an in-page overlay, so it lives in the window like any other child.
      (window as unknown as HTMLElement).appendChild(about as unknown as Node);
      addAppActions(application, {
        quit: () => shell.closeWindow(),
        about: () => about.present(window),
        preferences: () => new PreferencesDialog().present(window),
      });
    },
    // The layout must be mounted after the tree is connected: the elements build their internals on connect.
    whenReady: (init) => {
      let started = false;
      window.connect("map", () => {
        if (started) return;
        started = true;
        // The browser tab is the work area: the window fills it, the blueprint's default size is GNOME's.
        window.maximize();
        editorController.setCode(DEMO_PROGRAM);
        mainStateController.setCodeChanged(false);
        init();
      });
    },
    started: () => files.setUnsavedChanges(false),
  };
}

function openUrl(url: string): void {
  globalThis.open(url, "_blank", "noopener,noreferrer");
}
