import GObject from '@girs/gobject-2.0'
import Gio from '@girs/gio-2.0'
import Gdk from '@girs/gdk-4.0'
import Gtk from '@girs/gtk-4.0'
import Adw from '@girs/adw-1'

import { ApplicationWindow } from './widgets/application-window.ts'
import { PreferencesDialog } from './widgets/preferences-dialog.ts'
import { APPLICATION_ID } from './constants.ts'
import { initResources } from './resources.ts'

import mainStyle from './main.css?inline'

export const Application = GObject.registerClass(
    class Application extends Adw.Application {
        constructor() {
            super({
                applicationId: APPLICATION_ID,
                flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
            })
            this.onStartup = this.onStartup.bind(this)
            this.connect('startup', this.onStartup)
            this.initActions()
        }

        protected onStartup(): void {
            this.initStyles()
            initResources()
        }

        /** Load the stylesheet in a CssProvider and add it to the Gtk.StyleContext */
        protected initStyles() {
            const provider = new Gtk.CssProvider();
            provider.load_from_string(mainStyle);
            const display = Gdk.Display.get_default()

            if (!display) {
                console.error('No display found')
                return
            }

            Gtk.StyleContext.add_provider_for_display(
                display,
                provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            );
        }

        initActions() {
            // Quit action
            const quitAction = new Gio.SimpleAction({ name: 'quit' })
            quitAction.connect('activate', (_action) => {
                log('quitAction activated')
                this.quit()
            })
            this.add_action(quitAction)
            this.set_accels_for_action('app.quit', ['<primary>q'])

            // About action
            const showAboutAction = new Gio.SimpleAction({ name: 'about' })
            showAboutAction.connect('activate', (_action) => {
                const aboutParams = {
                    transient_for: this.active_window,
                    application_name: 'Easy 6502',
                    application_icon: APPLICATION_ID,
                    developer_name: 'Pascal Garber',
                    version: '0.1.0',
                    developers: ['Pascal Garber'],
                    copyright: '© 2024 Pascal Garber',
                }
                const aboutWindow = new Adw.AboutWindow(aboutParams)
                aboutWindow.present()
            })
            this.add_action(showAboutAction)

            const showPreferencesAction = new Gio.SimpleAction({ name: 'preferences' })
            showPreferencesAction.connect('activate', (_action) => {
                const preferencesDialog = new PreferencesDialog()
                preferencesDialog.present(this.active_window)
            })
            this.add_action(showPreferencesAction)
        }

        vfunc_activate() {
            let { active_window } = this

            if (!active_window) active_window = new ApplicationWindow(this)

            active_window.present()
        }
    },
)
