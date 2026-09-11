import Gio from "@girs/gio-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import GtkSource from "@girs/gtksource-5";

import { APPLICATION_ID, RESOURCES_PATH } from "./constants.ts";
import { dataSearchPathForDiagnostics, resolveDataFile } from "./install-paths.ts";

export const initResources = () => {
  // Register resources
  const resourceName = `${APPLICATION_ID}.data.gresource`;
  const resourceDataPath = resolveDataFile(resourceName);
  if (!resourceDataPath) {
    // Name the file and every directory that was consulted: the app is dead
    // without its resources, and "not found" alone does not say whether the
    // bundle was relocated or the data was never staged beside it.
    throw new Error(`${resourceName} not found in ${dataSearchPathForDiagnostics().join(", ")}`);
  }

  const resourceData = Gio.Resource.load(resourceDataPath);
  Gio.resources_register(resourceData);

  // Register icons
  const display = Gdk.Display.get_default();
  if (!display) {
    throw new Error("Display not found");
  }
  const theme = Gtk.IconTheme.get_for_display(display);
  theme.add_resource_path(`${RESOURCES_PATH}/icons`);

  // Register language specs
  const languageManager = GtkSource.LanguageManager.get_default();
  const searchPath = languageManager.get_search_path();
  if (!searchPath) {
    throw new Error("Search path not found");
  }
  languageManager.set_search_path([`resource://${RESOURCES_PATH}/lang-specs`, ...searchPath]);

  // Register GtkSourceView style schemes from resources
  const schemeManager = GtkSource.StyleSchemeManager.get_default();
  const schemePaths = schemeManager.get_search_path();
  schemeManager.set_search_path([`resource://${RESOURCES_PATH}/schemas`, ...schemePaths]);
};
