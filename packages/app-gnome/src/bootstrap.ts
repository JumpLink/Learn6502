import Gio from "@girs/gio-2.0";
import Gtk from "@girs/gtk-4.0";
import GLib from "@girs/glib-2.0";
import { APPLICATION_ID, PACKAGE_VERSION, PREFIX, LIBDIR, DATADIR } from "./constants.ts";
import { localeDir } from "./install-paths.ts";
import { settings } from "./settings.ts";
import { uiFontService } from "./services/ui-font.service.ts";

// Promisify
Gio._promisify(Gio.OutputStream.prototype, "write_bytes_async", "write_bytes_finish");
Gio._promisify(Gio.OutputStream.prototype, "close_async", "close_finish");

Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");
Gio._promisify(Gio.File.prototype, "replace_async", "replace_finish");

Gio._promisify(Gtk.FileDialog.prototype, "open", "open_finish");
Gio._promisify(Gtk.FileDialog.prototype, "save", "save_finish");

// Initialize package
imports.package.init({
  name: APPLICATION_ID,
  version: PACKAGE_VERSION,
  prefix: PREFIX,
  libdir: LIBDIR,
  datadir: DATADIR,
});

// Initialize gettext and format
pkg.initGettext();
pkg.initFormat();
imports.gettext.bindtextdomain(APPLICATION_ID, localeDir());
imports.gettext.textdomain(APPLICATION_ID);

// The interface font, before anything draws.
//
// `applyUiFontPolicy` reads the host's own `gtk-font-name` the first time it
// runs and keeps it as the baseline. That is the only moment it can still be
// read — once a policy has written the setting, the way back to `system` is
// gone — so this belongs here rather than in a window's constructor.
uiFontService.init(settings);

// Initialize main loop
export const loop = GLib.MainLoop.new(null, false);
