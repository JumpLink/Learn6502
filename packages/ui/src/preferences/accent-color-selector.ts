import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";

import Template from "./accent-color-selector.blp?template";
import { themeService } from "./theme.service.ts";
import type { PrimaryFamilyKey } from "./theme.ts";

/**
 * AccentColorSelector
 *
 * Compact selector for predefined accent color families.
 * Delegates persistence/apply to themeService.
 */
export class AccentColorSelector extends Adw.Bin {
  declare enabled: boolean;
  declare private _accent_blue: Gtk.CheckButton;
  declare private _accent_teal: Gtk.CheckButton;
  declare private _accent_green: Gtk.CheckButton;
  declare private _accent_yellow: Gtk.CheckButton;
  declare private _accent_orange: Gtk.CheckButton;
  declare private _accent_red: Gtk.CheckButton;
  declare private _accent_pink: Gtk.CheckButton;
  declare private _accent_purple: Gtk.CheckButton;
  declare private _accent_slate: Gtk.CheckButton;
  private _isUpdatingUi: boolean = false;
  private _isReady: boolean = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "AccentColorSelector",
        Template,
        CssName: "accent-color-selector",
        InternalChildren: [
          "accent_blue",
          "accent_teal",
          "accent_green",
          "accent_yellow",
          "accent_orange",
          "accent_red",
          "accent_pink",
          "accent_purple",
          "accent_slate",
        ],
        Properties: {
          enabled: GObject.ParamSpec.boolean(
            "enabled",
            "Enabled",
            "Whether accent color swatches are enabled",
            GObject.ParamFlags.READWRITE,
            true
          ),
        },
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);

    // Initial state from service
    this._setAccentSelection(themeService.getAccentState().key);

    // Sync on map to catch late changes and mark ready
    this.connect("map", () => {
      this._setAccentSelection(themeService.getAccentState().key);
      this._isReady = true;
    });

    // React to external changes
    themeService.events.on("accent-changed", ({ key }) => {
      this._setAccentSelection(key ?? null);
    });

    // Keep accent override cleared when disabled
    this.connect("notify::enabled", () => {
      if (!this._isReady) return;
      if (!this.enabled) {
        this._setAccentSelection(null);
        themeService.setAccentSystem();
        themeService.refreshThemedWidgets();
      } else if (!this._anyAccentActive()) {
        // When enabling, ensure at least one is selected (default to blue)
        const useKey = themeService.getAccentState().key ?? "blue";
        this._setAccentSelection(useKey);
        themeService.setAccentByKey(useKey);
        themeService.refreshThemedWidgets();
      }
    });
  }

  _onAccentBlueToggled(): void {
    this._onAccentToggled(this._accent_blue, "blue");
  }
  _onAccentTealToggled(): void {
    this._onAccentToggled(this._accent_teal, "teal");
  }
  _onAccentGreenToggled(): void {
    this._onAccentToggled(this._accent_green, "green");
  }
  _onAccentYellowToggled(): void {
    this._onAccentToggled(this._accent_yellow, "yellow");
  }
  _onAccentOrangeToggled(): void {
    this._onAccentToggled(this._accent_orange, "orange");
  }
  _onAccentRedToggled(): void {
    this._onAccentToggled(this._accent_red, "red");
  }
  _onAccentPinkToggled(): void {
    this._onAccentToggled(this._accent_pink, "pink");
  }
  _onAccentPurpleToggled(): void {
    this._onAccentToggled(this._accent_purple, "purple");
  }
  _onAccentSlateToggled(): void {
    this._onAccentToggled(this._accent_slate, "slate");
  }

  private _onAccentToggled(source: Gtk.CheckButton, key: PrimaryFamilyKey): void {
    if (this._isUpdatingUi) return;
    if (!source.get_active()) {
      if (!this._anyAccentActive()) {
        if (this.enabled) {
          // Enforce one selected when enabled
          this._setAccentSelection("blue");
          themeService.setAccentByKey("blue");
          themeService.refreshThemedWidgets();
        } else {
          themeService.setAccentSystem();
        }
      }
      return;
    }
    this._setAccentSelection(key);
    themeService.setAccentByKey(key);
    themeService.refreshThemedWidgets();
  }

  private get _buttons(): Record<PrimaryFamilyKey, Gtk.CheckButton> {
    return {
      blue: this._accent_blue,
      teal: this._accent_teal,
      green: this._accent_green,
      yellow: this._accent_yellow,
      orange: this._accent_orange,
      red: this._accent_red,
      pink: this._accent_pink,
      purple: this._accent_purple,
      slate: this._accent_slate,
    };
  }

  private _setAccentSelection(key: PrimaryFamilyKey | null): void {
    this._isUpdatingUi = true;
    try {
      for (const [k, btn] of Object.entries(this._buttons)) {
        const want = key === k;
        if (btn.get_active() !== want) btn.set_active(want);
      }
    } finally {
      this._isUpdatingUi = false;
    }
  }

  private _anyAccentActive(): boolean {
    return Object.values(this._buttons).some((btn) => btn.get_active());
  }
}

GObject.type_ensure(AccentColorSelector.$gtype);
