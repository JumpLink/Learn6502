import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";

import Template from "./preferences.dialog.blp";
// Ensure custom widgets referenced in Blueprint are registered
import "../widgets/language-selector.ts";
import "../widgets/theme-mode-selector.ts";
import "../widgets/primary-color-selector.ts";
import "../widgets/accent-color-selector.ts";
import { themeService } from "../services";

export class PreferencesDialog extends Adw.PreferencesDialog {
  declare _rowPrimary: Adw.SwitchRow;
  declare _rowAccent: Adw.SwitchRow;
  declare _languageSelector: Adw.ComboRow;

  static {
    GObject.registerClass(
      {
        GTypeName: "PreferencesDialog",
        Template,
        InternalChildren: ["rowPrimary", "rowAccent", "languageSelector"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.PreferencesDialog.ConstructorProps> = {}) {
    super(params);

    // Initialize switches after map
    this.connect("map", () => {
      const primary = themeService.getPrimaryState();
      const accent = themeService.getAccentState();
      const wantPrimary = primary.mode === "custom";
      const wantAccent = accent.mode === "custom";
      if (this._rowPrimary.get_active() !== wantPrimary)
        this._rowPrimary.set_active(wantPrimary);
      if (this._rowAccent.get_active() !== wantAccent)
        this._rowAccent.set_active(wantAccent);
    });

    // Keep in sync with external changes
    themeService.events.on("primary-changed", ({ mode }) => {
      const want = mode === "custom";
      if (this._rowPrimary.get_active() !== want)
        this._rowPrimary.set_active(want);
    });
    themeService.events.on("accent-changed", ({ mode }) => {
      const want = mode === "custom";
      if (this._rowAccent.get_active() !== want)
        this._rowAccent.set_active(want);
    });

    // Show banner when language is changed
    this._languageSelector.connect("language-changed", () => {
      // ...
    });
  }
}

GObject.type_ensure(PreferencesDialog.$gtype);
