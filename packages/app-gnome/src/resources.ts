import Gio from '@girs/gio-2.0'
import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'
import GtkSource from '@girs/gtksource-5'

import { APPLICATION_ID, RESOURCES_PATH, DATADIR } from './constants.ts'

export const initResources = () => {
  // Register resources
  const resourceDataPath = DATADIR.resolve_relative_path(`./${APPLICATION_ID}.data.gresource`).get_path()
  if (!resourceDataPath) {
    throw new Error('Resource data path not found')
  }

  const resourceData = Gio.Resource.load(resourceDataPath)
  Gio.resources_register(resourceData)

  // Register icons
  const display = Gdk.Display.get_default()
  if (!display) {
    throw new Error('Display not found')
  }
  const theme = Gtk.IconTheme.get_for_display(display);
  theme.add_resource_path(`${RESOURCES_PATH}/icons`);

  // Register language specs
  const languageManager = GtkSource.LanguageManager.get_default();
  const searchPath = languageManager.get_search_path();
  if (!searchPath) {
    throw new Error('Search path not found')
  }
  languageManager.set_search_path([`resource://${RESOURCES_PATH}/lang-specs`, ...searchPath]);
}
