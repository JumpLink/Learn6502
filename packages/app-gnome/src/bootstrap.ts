import GLib from "@girs/glib-2.0";
import { APPLICATION_ID, PACKAGE_VERSION, PREFIX, LIBDIR, DATADIR } from "./constants.ts";
import { localeDir } from "./install-paths.ts";

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

// Initialize main loop
export const loop = GLib.MainLoop.new(null, false);
