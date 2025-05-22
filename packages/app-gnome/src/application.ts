import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";
import Adw from "@girs/adw-1";

import { MainWindow, PreferencesDialog } from "./views/index.ts";
import { APPLICATION_ID, RESOURCES_PATH } from "./constants.ts";
import { initResources } from "./resources.ts";

import applicationStyle from "./application.css?inline";

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
    this.initStyles();
    initResources();
  }

  /** Load the stylesheet in a CssProvider and add it to the Gtk.StyleContext */
  protected initStyles() {
    const provider = new Gtk.CssProvider();
    provider.load_from_string(applicationStyle);
    const display = Gdk.Display.get_default();

    if (!display) {
      console.error("No display found");
      return;
    }

    Gtk.StyleContext.add_provider_for_display(
      display,
      provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
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
      `${RESOURCES_PATH}/metainfo/${pkg.name}.metainfo.xml`,
      pkg.version
    );
    aboutDialog.present(this.get_active_window());
  }

  vfunc_activate() {
    let { active_window } = this;

    if (!active_window) active_window = new MainWindow(this);

    active_window.present();
  }
}
