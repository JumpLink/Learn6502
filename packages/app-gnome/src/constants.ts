import Gio from '@girs/gio-2.0'

export const APPLICATION_ID = __APPLICATION_ID__
export const RESOURCES_PATH = __RESOURCES_PATH__
export const PACKAGE_VERSION = __PACKAGE_VERSION__
export const GJS_CONSOLE = __GJS_CONSOLE__
export const PREFIX = __PREFIX__
export const LIBDIR = Gio.File.new_for_path(__LIBDIR__)
export const DATADIR = Gio.File.new_for_path(__DATADIR__)
export const BINDIR = Gio.File.new_for_path(__BINDIR__)
export const PKGDATADIR = Gio.File.new_for_path(__PKGDATADIR__)
