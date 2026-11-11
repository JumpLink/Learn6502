import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import { formatMessage } from "@learn6502/core";

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

/** What the interface scale is set to: a factor, or `"auto"` for the host's derived one. */
export type InterfaceScaleValue = "auto" | number;

/**
 * The interface-scale setting of a host that has one — the phone ports.
 *
 * The derivation, the clamp and the appliers live in `@gjsify/adwaita-core/app-scale`; what
 * crosses into the shared UI is this much, so that `@learn6502/ui` keeps building for GNOME and
 * the web, where the setting does not exist and the group stays hidden.
 */
export interface InterfaceScaleSetting {
  /** The factor `"auto"` resolves to on THIS screen, so the automatic entry can name it. */
  readonly automatic: number;
  /** The factors offered next to automatic, ascending. */
  readonly choices: readonly number[];
  value: InterfaceScaleValue;
}

export interface PreferencesDialogOptions {
  /** Without one the interface-font group is hidden. */
  uiFont?: UiFontSetting;
  /** Without one the interface-scale group is hidden — it exists on the phone ports only. */
  interfaceScale?: InterfaceScaleSetting;
}

export class PreferencesDialog extends Adw.PreferencesDialog {
  declare _rowPrimary: Adw.SwitchRow;
  declare _rowAccent: Adw.SwitchRow;
  declare _fontGroup: Adw.PreferencesGroup;
  declare _rowUiFont: Adw.ComboRow;
  declare _scaleGroup: Adw.PreferencesGroup;
  declare _rowInterfaceScale: Adw.ComboRow;

  /** The policies this host can actually honour, in the order they are shown. */
  private fontChoices: UiFontPolicy[] = [];

  /** The scale values in the order they are shown, `"auto"` first. */
  private scaleChoices: InterfaceScaleValue[] = [];

  static {
    GObject.registerClass(
      {
        GTypeName: "PreferencesDialog",
        Template,
        InternalChildren: ["rowPrimary", "rowAccent", "fontGroup", "rowUiFont", "scaleGroup", "rowInterfaceScale"],
      },
      this
    );
  }

  constructor(
    { uiFont, interfaceScale }: PreferencesDialogOptions = {},
    params: Partial<Adw.PreferencesDialog.ConstructorProps> = {}
  ) {
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

    if (interfaceScale) this.setupInterfaceScaleRow(interfaceScale);
    else this._scaleGroup.set_visible(false);
  }

  private _onResetColors(): void {
    themeService.setTheme("system");
    themeService.setPrimaryDefault();
    themeService.setAccentSystem();
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

  /**
   * The interface-scale chooser.
   *
   * Automatic is the first entry and names the factor it resolves to on this screen, so picking
   * it again is the way back — the row needs no reset button of its own. A stored factor the
   * host no longer offers (a narrower device, a changed clamp) is shown as its nearest entry
   * rather than as nothing selected.
   */
  private setupInterfaceScaleRow(interfaceScale: InterfaceScaleSetting): void {
    this.scaleChoices = ["auto", ...interfaceScale.choices];

    const percent = (factor: number) => `${Math.round(factor * 100)}%`;
    const labels = this.scaleChoices.map((choice) =>
      choice === "auto"
        ? // TRANSLATORS: Interface scale option — the factor derived from the
          // screen; %s is that factor as a percentage, e.g. "114%"
          formatMessage(_("Automatic (%s)"), [percent(interfaceScale.automatic)])
        : percent(choice)
    );
    this._rowInterfaceScale.set_model(Gtk.StringList.new(labels));

    const current = this.scaleChoices.indexOf(interfaceScale.value);
    this._rowInterfaceScale.set_selected(current >= 0 ? current : this.nearestScaleIndex(interfaceScale.value));

    this._rowInterfaceScale.connect("notify::selected", () => {
      const chosen = this.scaleChoices[this._rowInterfaceScale.get_selected()];
      if (chosen !== undefined && chosen !== interfaceScale.value) interfaceScale.value = chosen;
    });
  }

  /** The entry closest to a stored factor that is not offered; automatic when it is not one. */
  private nearestScaleIndex(value: InterfaceScaleValue): number {
    if (value === "auto") return 0;
    let best = 0;
    let distance = Number.POSITIVE_INFINITY;
    this.scaleChoices.forEach((choice, index) => {
      if (choice === "auto") return;
      const d = Math.abs(choice - value);
      if (d < distance) {
        distance = d;
        best = index;
      }
    });
    return best;
  }
}

GObject.type_ensure(PreferencesDialog.$gtype);
