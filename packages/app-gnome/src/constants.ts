/**
 * Application ID, e.g. "eu.jumplink.Learn6502"
 */
export const APPLICATION_ID = __APPLICATION_ID__;
export const RESOURCES_PATH = __RESOURCES_PATH__;
export const PACKAGE_VERSION = __PACKAGE_VERSION__;
export const GJS_CONSOLE = __GJS_CONSOLE__;
export const PREFIX = __PREFIX__;
export const LIBDIR = __LIBDIR__;
export const DATADIR = __DATADIR__;
export const BINDIR = __BINDIR__;
export const PKGDATADIR = __PKGDATADIR__;

// GSettings
export const KEY_COLOR_SCHEME = "color-scheme"; // 0=follow,1=light,2=dark
export const KEY_PRIMARY_COLOR = "primary-color"; // 'none' | predefined key

// Primary color family keys supported by libadwaita accent variables
export const PRIMARY_FAMILIES = [
  "blue",
  "teal",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "slate",
] as const;
