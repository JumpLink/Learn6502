import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";
import Adw from "@girs/adw-1";
import GLib from "@girs/glib-2.0";

import { MainWindow, PreferencesDialog } from "./views/index.ts";
import { APPLICATION_ID, RESOURCES_PATH, PACKAGE_VERSION } from "./constants.ts";
import { initResources } from "./resources.ts";

import { themeService } from "./services";

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
    const aboutDialog = Adw.AboutDialog.new_from_appdata(
      `${RESOURCES_PATH}/metainfo/${APPLICATION_ID}.metainfo.xml`,
      PACKAGE_VERSION
    );
    aboutDialog.present(this.get_active_window());
  }

  vfunc_activate() {
    let { active_window } = this;

    if (!active_window) active_window = new MainWindow(this);

    active_window.present();
  }
}
