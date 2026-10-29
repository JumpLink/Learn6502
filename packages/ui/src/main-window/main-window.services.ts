import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";

import type { Memory } from "@learn6502/core";
import { gameConsoleController } from "@learn6502/common-ui";

import { FileService } from "../file.service.ts";
import { notificationService } from "../notification.service.ts";
import { settings } from "../settings.ts";
import { _ } from "../translate.ts";
import { ShareDialog } from "../share-dialog.ts";
import { HelpWindow } from "./help-window.ts";
import type { MainWindowHost, MainWindowPlatform } from "./platform.ts";

function presentShareDialog(window: Gtk.Window, code: string, memory: Memory): void {
  const dialog = new ShareDialog();
  dialog.setCode(code);
  dialog.setMemory(memory);
  dialog.connect("submit", (submitted: ShareDialog) => {
    console.log("Example submitted:", submitted.submittedExample);
    // TODO: Implement GitHub PR creation logic here
    notificationService.showNotification({
      // TRANSLATORS: Toast message when example is submitted
      title: _("Example submitted for review"),
      timeout: 3,
    });
  });
  dialog.present(window);
}

function registerKeys(window: Gtk.Window): void {
  const keyController = new Gtk.EventControllerKey();
  window.add_controller(keyController);
  keyController.connect("key-pressed", (_controller: Gtk.EventControllerKey, keyval: number) =>
    gameConsoleController.handleKeyPress(keyval)
  );
  gameConsoleController.registerKeyMappings({
    [Gdk.KEY_w]: "Up",
    [Gdk.KEY_s]: "Down",
    [Gdk.KEY_a]: "Left",
    [Gdk.KEY_d]: "Right",
    [Gdk.KEY_Up]: "Up",
    [Gdk.KEY_Down]: "Down",
    [Gdk.KEY_Left]: "Left",
    [Gdk.KEY_Right]: "Right",
    [Gdk.KEY_Return]: "A",
    [Gdk.KEY_q]: "A",
    [Gdk.KEY_space]: "B",
    [Gdk.KEY_e]: "B",
  });
}

/** GNOME: native dialogs and GSettings. The `Application` owns the app actions (quit, about, …). */
export function createMainWindowPlatform({ window }: MainWindowHost): MainWindowPlatform {
  const files = new FileService({ parent: () => window });
  registerKeys(window);
  return {
    services: {
      files: {
        openFile: () => files.openFile(),
        saveFile: async (content) => (await files.saveFile(content)) || false,
        saveFileAs: (content, suggestedName) => files.saveFileAs(content, suggestedName),
        getCurrentFileName: () => files.getCurrentFileName() || "",
        hasCurrentFile: () => files.hasCurrentFile(),
        hasUnsavedChanges: () => files.hasUnsavedChanges(),
        setUnsavedChanges: (hasChanges) => files.setUnsavedChanges(hasChanges),
      },
      settings: {
        getInt: (key) => settings.get_int(key),
        setInt: (key, value) => settings.set_int(key, value),
        getBoolean: (key) => settings.get_boolean(key),
        setBoolean: (key, value) => settings.set_boolean(key, value),
      },
      clipboard: {
        copy: (text) => {
          window.get_clipboard().set(text);
          return true;
        },
      },
      notifier: { show: (options) => notificationService.showNotification(options) },
      showHelp: () => new HelpWindow().present(),
      showShareDialog: (code, memory) => presentShareDialog(window, code, memory),
      submitExample: (code, memory) => presentShareDialog(window, code, memory),
    },
    whenReady: (init) => init(),
  };
}
