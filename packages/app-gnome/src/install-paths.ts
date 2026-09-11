import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

import { DATADIR, PKGDATADIR } from "./constants.ts";

/**
 * Where the application's own data files are at run time.
 *
 * The build bakes an absolute prefix into the bundle (`__PKGDATADIR__` and its
 * neighbours). That is right for Meson and Flatpak, which know the install
 * prefix before the bundle is written and never move afterwards. It is wrong by
 * construction for a `gjsify ship` artifact: a `.app` is dragged wherever the
 * user likes, a Windows program directory is unzipped to an arbitrary path, and
 * a `.deb` built on one host installs under a prefix chosen by another. A path
 * decided at build time cannot answer for any of them.
 *
 * Both are answered by looking BESIDE THE BUNDLE first and falling back to the
 * baked prefix. `gjsify ship` stages the whole directory the bundle lives in
 * into `lib/<binaryName>/` and maps that per layout — `Contents/Resources/lib/…`
 * on macOS, the program root on Windows — so one relative step finds a sibling
 * data file on all three. Under Meson nothing is placed beside the bundle, the
 * search falls through, and the baked path answers exactly as it did before.
 */

/**
 * The directory the running bundle sits in, or `null` when that cannot be
 * established.
 *
 * Two spellings, because the bundlers differ and only one of them was obvious.
 * `--app gjs` bundles open with `globalThis.__gjsifyBundleUrl ??=
 * import.meta.url`, a banner that exists precisely because gjsify's own module
 * rewriter may rewrite a per-module `import.meta.url` inside a GJS bundle — so
 * on that target the banner is the only trustworthy anchor. `--app node`
 * bundles carry no banner: it rides on the `process` stub, which Node does not
 * need, so there `import.meta.url` is both untouched and correct.
 *
 * Reading either rather than `programInvocationName` matters for the shipped
 * layouts: what the user launches is a wrapper in `bin/` or `Contents/MacOS/`,
 * so the invocation name points at the launcher's directory and not at the
 * staged data.
 *
 * Measured: with only the banner consulted, the `.app` on macOS 15.7.9 died in
 * `initResources` with "not found in ./data" — the node bundle has no banner,
 * the search fell through to the baked prefix, and the baked prefix is a
 * relative path that means nothing inside a bundle a user dragged somewhere.
 */
const bundleDir = (): string | null => {
  const url = globalThis.__gjsifyBundleUrl ?? import.meta.url;
  if (!url) {
    return null;
  }
  return Gio.File.new_for_uri(url).get_parent()?.get_path() ?? null;
};

/** Directories that may hold an application data file, most specific first. */
const dataSearchPath = (): string[] => {
  const beside = bundleDir();
  return beside ? [beside, PKGDATADIR] : [PKGDATADIR];
};

/**
 * Absolute path of an application data file, or `null` when no candidate exists.
 *
 * Returns `null` rather than throwing so the caller can name the file it wanted
 * and list where it looked — a bare "file not found" from deep inside
 * `Gio.Resource.load` says nothing about which of two prefixes was consulted.
 */
export const resolveDataFile = (name: string): string | null => {
  for (const dir of dataSearchPath()) {
    const candidate = GLib.build_filenamev([dir, name]);
    if (GLib.file_test(candidate, GLib.FileTest.EXISTS)) {
      return candidate;
    }
  }
  return null;
};

/** Every directory {@link resolveDataFile} would consult, for error messages. */
export const dataSearchPathForDiagnostics = (): string[] => dataSearchPath();

/**
 * The gettext catalogue root.
 *
 * `GJSIFY_LOCALE_DIR` is exported by the launcher `gjsify ship` renders, which
 * is the only party that knows where the catalogues ended up after the layout
 * map was applied. Honouring it keeps the application free of install-layout
 * knowledge; with nothing exported, the baked `DATADIR` answers as before.
 */
export const localeDir = (): string => GLib.getenv("GJSIFY_LOCALE_DIR") ?? `${DATADIR}/locale`;
