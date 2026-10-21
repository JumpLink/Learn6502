import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import { _ } from "../translate.ts";
import Template from "./preferences-dialog.blp?template";
// Ensure custom widgets referenced in Blueprint are registered
import "./theme-mode-selector.ts";
import "./primary-color-selector.ts";
import "./accent-color-selector.ts";
import { themeService } from "./theme.service.ts";

export type UiFontPolicy = "system" | "size" | "adwaita";

/** The interface-font setting of a host that has one. */
export interface UiFontSetting {
  /** Whether the `adwaita` option can be offered at all on this host. */
  readonly adwaitaAvailable: boolean;
  policy: UiFontPolicy;
}

export interface PreferencesDialogOptions {
  /** Without one the interface-font group is hidden. */
  uiFont?: UiFontSetting;
}

export class PreferencesDialog extends Adw.PreferencesDialog {
  declare _rowPrimary: Adw.SwitchRow;
  declare _rowAccent: Adw.SwitchRow;
  declare _fontGroup: Adw.PreferencesGroup;
  declare _rowUiFont: Adw.ComboRow;

  /** The policies this host can actually honour, in the order they are shown. */
  private fontChoices: UiFontPolicy[] = [];

  static {
    GObject.registerClass(
      {
        GTypeName: "PreferencesDialog",
        Template,
        InternalChildren: ["rowPrimary", "rowAccent", "fontGroup", "rowUiFont"],
      },
      this
    );
  }

  constructor({ uiFont }: PreferencesDialogOptions = {}, params: Partial<Adw.PreferencesDialog.ConstructorProps> = {}) {
    super(params);

    // Initialize switches after map
    this.connect("map", () => {
      const wantPrimary = themeService.getPrimaryState().mode === "custom";
      const wantAccent = themeService.getAccentState().mode === "custom";
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

    if (uiFont) this.setupUiFontRow(uiFont);
    else this._fontGroup.set_visible(false);
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
  private setupUiFontRow(uiFont: UiFontSetting): void {
    const labels: Record<UiFontPolicy, string> = {
      // TRANSLATORS: Font option — use the operating system's own font, untouched
      system: _("System font"),
      // TRANSLATORS: Font option — keep the system's typeface, use GNOME's size
      size: _("System font, GNOME size"),
      // TRANSLATORS: Font option — the GNOME typeface shipped with the app
      adwaita: _("GNOME font"),
    };

    this.fontChoices = uiFont.adwaitaAvailable ? ["system", "size", "adwaita"] : ["system", "size"];

    const model = Gtk.StringList.new(this.fontChoices.map((p) => labels[p]));
    this._rowUiFont.set_model(model);

    const current = this.fontChoices.indexOf(uiFont.policy);
    // A stored `adwaita` on a host that cannot honour it lands here as -1. The
    // service already falls back to `size`, so show that rather than nothing.
    this._rowUiFont.set_selected(current >= 0 ? current : this.fontChoices.indexOf("size"));

    this._rowUiFont.connect("notify::selected", () => {
      const chosen = this.fontChoices[this._rowUiFont.get_selected()];
      if (chosen && chosen !== uiFont.policy) uiFont.policy = chosen;
    });
  }
}

GObject.type_ensure(PreferencesDialog.$gtype);
