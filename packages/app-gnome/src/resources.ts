import Gio from '@girs/gio-2.0'
import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'
import GtkSource from '@girs/gtksource-5'

import { APPLICATION_ID, RESOURCES_PATH } from './constants.ts'
import { rootDir } from './utils.ts'

export const initResources = () => {
    // Register resources
    const resourcePath = rootDir.resolve_relative_path(`./data/${APPLICATION_ID}.data.gresource`).get_path()
    if (!resourcePath) {
        throw new Error('Resource path not found')
    }
    
    const resource = Gio.Resource.load(resourcePath)
    Gio.resources_register(resource) // resource._register()
    
    // Register icons
    const display = Gdk.Display.get_default()
    if (!display) {
        throw new Error('Display not found')
    }
    const theme = Gtk.IconTheme.get_for_display(display);
    theme.add_resource_path(`${RESOURCES_PATH}/data/icons`);

    // Register language specs
    const languageManager = GtkSource.LanguageManager.get_default();
    const searchPath = languageManager.get_search_path();
    if (!searchPath) {
      throw new Error('Search path not found')
    }
    languageManager.set_search_path(['resource:///eu/jumplink/Easy6502/data/lang-specs', ...searchPath]);
}
