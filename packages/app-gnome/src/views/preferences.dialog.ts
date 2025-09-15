import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";

import Template from "./preferences.dialog.blp";
// Ensure custom widgets referenced in Blueprint are registered
import "../widgets/theme-selector.ts";

export class PreferencesDialog extends Adw.PreferencesDialog {
  static {
    GObject.registerClass(
      {
        GTypeName: "PreferencesDialog",
        Template,
      },
      this
    );
  }

  constructor(params: Partial<Adw.PreferencesDialog.ConstructorProps> = {}) {
    super(params);
  }
}

GObject.type_ensure(PreferencesDialog.$gtype);
