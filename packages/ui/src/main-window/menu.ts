import Gio from "@girs/gio-2.0";
import type Gtk from "@girs/gtk-4.0";

import { _ } from "../translate.ts";

export interface MainMenuOptions {
  /** Offer `app.preferences`; false where the platform has no preferences dialog. */
  preferences?: boolean;
}

/** What the `app.*` actions of the main menu do; the platform answers each. */
export interface AppActionHandlers {
  quit(): void;
  about(): void;
  /** Absent where the platform has no preferences dialog. */
  preferences?(): void;
}

/**
 * The main menu, one model for every platform. The `win.*` items name the actions
 * `MainWindowController` registers, the `app.*` ones those of `addAppActions`.
 */
export function createMainMenu(options: MainMenuOptions = {}): Gio.Menu {
  const menu = new Gio.Menu();

  const simulator = new Gio.Menu();
  // TRANSLATORS: Menu item to assemble the current code
  simulator.append(_("Assemble"), "win.assemble");
  // TRANSLATORS: Menu item to start running the simulator
  simulator.append(_("Run"), "win.run-simulator");
  // TRANSLATORS: Menu item to resume execution after pause
  simulator.append(_("Continue"), "win.resume-simulator");
  // TRANSLATORS: Menu item to pause the running simulator
  simulator.append(_("Pause"), "win.pause-simulator");
  // TRANSLATORS: Menu item for single-step execution
  simulator.append(_("Step"), "win.step-simulator");
  // TRANSLATORS: Menu item to reset simulator and state
  simulator.append(_("Reset"), "win.reset-simulator");
  menu.append_section(null, simulator);

  const share = new Gio.Menu();
  // TRANSLATORS: Menu item to share the current code
  share.append(_("Share"), "win.share");
  menu.append_section(null, share);

  const files = new Gio.Menu();
  // TRANSLATORS: Menu item to open a file
  files.append(_("Open..."), "win.open-file");
  // TRANSLATORS: Menu item to save the current file
  files.append(_("Save"), "win.save-file");
  // TRANSLATORS: Menu item to save to a new file (Save As)
  files.append(_("Save as..."), "win.save-as-file");
  menu.append_section(null, files);

  const app = new Gio.Menu();
  if (options.preferences) {
    // TRANSLATORS: Preferences menu item label with underscore for accelerator
    app.append(_("_Preferences"), "app.preferences");
  }
  // TRANSLATORS: Help menu item label
  app.append(_("Help"), "win.show-help");
  // TRANSLATORS: About dialog menu item label
  app.append(_("About Learn 6502"), "app.about");
  // TRANSLATORS: Quit application menu item label
  app.append(_("Quit"), "app.quit");
  menu.append_section(null, app);

  return menu;
}

/** Register the `app.*` actions of the main menu, with their accelerators. */
export function addAppActions(app: Gtk.Application, handlers: AppActionHandlers): void {
  const add = (name: string, activate: () => void, accels?: string[]) => {
    const action = new Gio.SimpleAction({ name });
    action.connect("activate", () => activate());
    app.add_action(action);
    if (accels) app.set_accels_for_action(`app.${name}`, accels);
  };

  add("quit", () => handlers.quit(), ["<primary>q"]);
  add("about", () => handlers.about());
  if (handlers.preferences) add("preferences", () => handlers.preferences?.());
}
