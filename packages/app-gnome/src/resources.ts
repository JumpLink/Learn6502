import Gio from '@girs/gio-2.0'
import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'

import { APPLICATION_ID, RESOURCES_PATH } from './constants.ts'
import { rootDir } from './utils.ts'

export const initResources = () => {
    const resourcePath = rootDir.resolve_relative_path(`./data/${APPLICATION_ID}.data.gresource`).get_path()
    if (!resourcePath) {
        throw new Error('Resource path not found')
    }
    
    const resource = Gio.Resource.load(resourcePath)
    Gio.resources_register(resource) // resource._register()
    
    const display = Gdk.Display.get_default()
    if (!display) {
        throw new Error('Display not found')
    }
    const theme = Gtk.IconTheme.get_for_display(display);
    theme.add_resource_path(`${RESOURCES_PATH}/data/icons`);

    console.log("`${RESOURCES_PATH}/data/icons`", `${RESOURCES_PATH}/data/icons`)
}
