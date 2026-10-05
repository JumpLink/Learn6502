import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";
import Adw from "@girs/adw-1";
import GLib from "@girs/glib-2.0";

import { MainWindow, PreferencesDialog } from "./views/index.ts";
import { APPLICATION_ID } from "./constants.ts";
import { initResources } from "./resources.ts";
import { createAboutDialog } from "./about-dialog.ts";

import { themeService } from "./services";
import { uiFontService } from "./services/ui-font.service.ts";
import { settings } from "./settings.ts";

export class Application extends Adw.Application {
  static {
    GObject.registerClass(
      {
        GTypeName: "Application",
      },
      this
    );
  }

  constructor() {
    super({
      applicationId: APPLICATION_ID,
      flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
    });
    this.onStartup = this.onStartup.bind(this);
    this.connect("startup", this.onStartup);
    this.initActions();
  }

  protected onStartup(): void {
    themeService.init();
    // The interface font, before anything draws — and NOT before this point.
    //
    // `Gtk.Settings.get_default()` answers null until the toolkit is
    // initialised, and `applyUiFontPolicy` then leaves the setting alone. This
    // ran at module scope in bootstrap.ts and did exactly that: the app printed
    // `-> unparsed (unchanged)` on macOS and on Windows, so the whole setting
    // was inert on the one platform it exists for. `startup` is the earliest
    // moment GTK is up, and it is still before any window is built — which is
    // what the baseline capture needs (once a policy has written
    // `gtk-font-name`, the way back to `system` is gone).
    uiFontService.init(settings);
    initResources();
  }

  initActions() {
    // Quit action
    const quitAction = new Gio.SimpleAction({ name: "quit" });
    quitAction.connect("activate", (_action) => {
      log("quitAction activated");
      this.quit();
    });
    this.add_action(quitAction);
    this.set_accels_for_action("app.quit", ["<primary>q"]);

    // About action
    const showAboutAction = new Gio.SimpleAction({ name: "about" });
    showAboutAction.connect("activate", this.onShowAboutDialog.bind(this));
    this.add_action(showAboutAction);

    const showPreferencesAction = new Gio.SimpleAction({ name: "preferences" });
    showPreferencesAction.connect("activate", (_action) => {
      const preferencesDialog = new PreferencesDialog();
      preferencesDialog.present(this.active_window);
    });
    this.add_action(showPreferencesAction);
  }

  private onShowAboutDialog() {
    createAboutDialog().present(this.get_active_window());
  }

  vfunc_activate() {
    let { active_window } = this;

    if (!active_window) active_window = new MainWindow(this);

    active_window.present();
  }
}
