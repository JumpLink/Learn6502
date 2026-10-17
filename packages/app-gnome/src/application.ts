import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";
import Adw from "@girs/adw-1";

import { addAppActions, themeService } from "@learn6502/ui";
import { PreferencesDialog } from "@learn6502/ui/preferences";
import { MainWindow } from "./views/index.ts";
import { APPLICATION_ID } from "./constants.ts";
import { initResources } from "./resources.ts";
import { createAboutDialog } from "./about-dialog.ts";

import { uiFontService } from "./services/ui-font.service.ts";
import { settings } from "./settings.ts";
import mainCss from "./main.css";

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
    this.loadCss();
    themeService.init(settings);
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

  private loadCss(): void {
    const display = Gdk.Display.get_default();
    if (!display) return;
    const provider = new Gtk.CssProvider();
    provider.load_from_string(mainCss);
    Gtk.StyleContext.add_provider_for_display(display, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
  }

  initActions() {
    addAppActions(this, {
      // `quit()` skips `close-request`, which is where unsaved changes are asked about
      quit: () => {
        for (const window of this.get_windows()) window.close();
      },
      about: () => this.onShowAboutDialog(),
      preferences: () => new PreferencesDialog({ uiFont: uiFontService }).present(this.active_window),
    });
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
