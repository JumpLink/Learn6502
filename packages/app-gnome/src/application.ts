import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";
import Adw from "@girs/adw-1";
import GLib from "@girs/glib-2.0";

import { MainWindow, PreferencesDialog } from "./views/index.ts";
import {
  APPLICATION_ID,
  RESOURCES_PATH,
  PACKAGE_VERSION,
} from "./constants.ts";
import { initResources } from "./resources.ts";

import { themeService, languageService } from "./services";

export class Application extends Adw.Application {
  public restartRequested = false;

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
    languageService.init();
    themeService.init();
    initResources();

    // Listen for language changes to show restart dialog
    languageService.connect("language-changed", () => {
      this.showRestartDialog();
    });
  }

  private showRestartDialog(): void {
    const dialog = new Adw.AlertDialog({
      // TRANSLATORS: Dialog heading shown when user changes language
      heading: _("Restart Required"),
      // TRANSLATORS: Dialog message explaining that the language change requires a manual restart
      body: _(
        "The language change will take full effect after restarting the application."
      ),
    });
    // TRANSLATORS: Button to dismiss the restart dialog and continue using the app
    dialog.add_response("cancel", _("Later"));
    // TRANSLATORS: Button to quit the application so user can restart it
    dialog.add_response("restart", _("Restart"));
    dialog.set_response_appearance("restart", Adw.ResponseAppearance.SUGGESTED);
    dialog.set_default_response("restart");
    dialog.set_close_response("cancel");

    dialog.connect("response", (_self, response) => {
      if (response === "restart") {
        this.restartApplication();
      }
    });

    const window = this.get_active_window();
    if (window) {
      dialog.present(window);
    }
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

  private restartApplication(): void {
    this.restartRequested = true;
    this.quit();
  }
}
