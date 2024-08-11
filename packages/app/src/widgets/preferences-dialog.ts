import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import Template from './preferences-dialog.ui?raw'

export const PreferencesDialog = GObject.registerClass(
    {
        GTypeName: 'PreferencesDialog',
        Template,
    },
    class PreferencesDialog extends Adw.PreferencesDialog {
        constructor(params: Partial<Adw.PreferencesDialog.ConstructorProps> = {}) {
            super(params)
        }
    },
)
