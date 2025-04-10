import Gio from '@girs/gio-2.0'
import Gtk from '@girs/gtk-4.0'
import GLib from '@girs/glib-2.0'
import { APPLICATION_ID, PACKAGE_VERSION, PREFIX, LIBDIR, DATADIR } from './constants.ts'

// Promisify
Gio._promisify(Gio.OutputStream.prototype, 'write_bytes_async', 'write_bytes_finish')
Gio._promisify(Gio.OutputStream.prototype, 'close_async', 'close_finish')

Gio._promisify(Gio.File.prototype, 'load_contents_async', 'load_contents_finish')
Gio._promisify(Gio.File.prototype, 'replace_async', 'replace_finish')

Gio._promisify(Gtk.FileDialog.prototype, 'open', 'open_finish')
Gio._promisify(Gtk.FileDialog.prototype, 'save', 'save_finish')

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
imports.gettext.bindtextdomain(APPLICATION_ID, DATADIR + '/locale');
imports.gettext.textdomain(APPLICATION_ID);

// Initialize main loop
export const loop = GLib.MainLoop.new(null, false)