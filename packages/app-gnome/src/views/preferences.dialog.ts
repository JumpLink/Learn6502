import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import type { UiFontPolicy } from "@gjsify/gtk-host/fonts";

import Template from "./preferences.dialog.blp";
// Ensure custom widgets referenced in Blueprint are registered
import "../widgets/theme-mode-selector.ts";
import "../widgets/primary-color-selector.ts";
import "../widgets/accent-color-selector.ts";
import { themeService, uiFontService } from "../services";

export class PreferencesDialog extends Adw.PreferencesDialog {
  declare _rowPrimary: Adw.SwitchRow;
  declare _rowAccent: Adw.SwitchRow;
  declare _rowUiFont: Adw.ComboRow;

  /** The policies this host can actually honour, in the order they are shown. */
  private fontChoices: UiFontPolicy[] = [];

  static {
    GObject.registerClass(
      {
        GTypeName: "PreferencesDialog",
        Template,
        InternalChildren: ["rowPrimary", "rowAccent", "rowUiFont"],
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
      if (this._rowPrimary.get_active() !== wantPrimary) this._rowPrimary.set_active(wantPrimary);
      if (this._rowAccent.get_active() !== wantAccent) this._rowAccent.set_active(wantAccent);
    });

    // Keep in sync with external changes
    themeService.events.on("primary-changed", ({ mode }) => {
      const want = mode === "custom";
      if (this._rowPrimary.get_active() !== want) this._rowPrimary.set_active(want);
    });
    themeService.events.on("accent-changed", ({ mode }) => {
      const want = mode === "custom";
      if (this._rowAccent.get_active() !== want) this._rowAccent.set_active(want);
    });

    this.setupUiFontRow();
  }

  /**
   * The interface-font chooser.
   *
   * `adwaita` is listed only where the bundled typeface actually reached the
   * font map. Offering it otherwise would let a user pick "the GNOME font" and
   * silently receive a substitute — on Windows the family is exposed under a
   * different name, and on macOS CoreText cannot register a face at runtime at
   * all. A choice that cannot be honoured does not belong in the list.
   */
  private setupUiFontRow(): void {
    const labels: Record<UiFontPolicy, string> = {
      // TRANSLATORS: Font option — use the operating system's own font, untouched
      system: _("System font"),
      // TRANSLATORS: Font option — keep the system's typeface, use GNOME's size
      size: _("System font, GNOME size"),
      // TRANSLATORS: Font option — the GNOME typeface shipped with the app
      adwaita: _("GNOME font"),
    };

    this.fontChoices = uiFontService.adwaitaAvailable ? ["system", "size", "adwaita"] : ["system", "size"];

    const model = Gtk.StringList.new(this.fontChoices.map((p) => labels[p]));
    this._rowUiFont.set_model(model);

    const current = this.fontChoices.indexOf(uiFontService.policy);
    // A stored `adwaita` on a host that cannot honour it lands here as -1. The
    // service already falls back to `size`, so show that rather than nothing.
    this._rowUiFont.set_selected(current >= 0 ? current : this.fontChoices.indexOf("size"));

    this._rowUiFont.connect("notify::selected", () => {
      const chosen = this.fontChoices[this._rowUiFont.get_selected()];
      if (chosen && chosen !== uiFontService.policy) uiFontService.policy = chosen;
    });
  }
}

GObject.type_ensure(PreferencesDialog.$gtype);
