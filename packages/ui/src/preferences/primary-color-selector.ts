import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";

import Template from "./primary-color-selector.blp?template";
import { themeService } from "./theme.service.ts";
import type { PrimaryFamilyKey } from "./theme.ts";

/**
 * PrimaryColorSelector
 *
 * Compact selector for predefined primary color families.
 * Delegates persistence/apply to themeService.
 */
export class PrimaryColorSelector extends Adw.Bin {
  declare enabled: boolean;
  declare private _primary_blue: Gtk.CheckButton;
  declare private _primary_teal: Gtk.CheckButton;
  declare private _primary_green: Gtk.CheckButton;
  declare private _primary_yellow: Gtk.CheckButton;
  declare private _primary_orange: Gtk.CheckButton;
  declare private _primary_red: Gtk.CheckButton;
  declare private _primary_pink: Gtk.CheckButton;
  declare private _primary_purple: Gtk.CheckButton;
  declare private _primary_slate: Gtk.CheckButton;
  private _isUpdatingUi: boolean = false;
  private _isReady: boolean = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "PrimaryColorSelector",
        Template,
        CssName: "primary-color-selector",
        InternalChildren: [
          "primary_blue",
          "primary_teal",
          "primary_green",
          "primary_yellow",
          "primary_orange",
          "primary_red",
          "primary_pink",
          "primary_purple",
          "primary_slate",
        ],
        Properties: {
          enabled: GObject.ParamSpec.boolean(
            "enabled",
            "Enabled",
            "Whether primary color swatches are enabled",
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
    this._setPrimarySelection(themeService.getPrimaryState().key);

    // Sync on map to catch late changes and mark ready
    this.connect("map", () => {
      this._setPrimarySelection(themeService.getPrimaryState().key);
      this._isReady = true;
    });

    // React to external changes
    themeService.events.on("primary-changed", ({ key }) => {
      this._setPrimarySelection(key ?? null);
    });

    // Keep primary override cleared when disabled
    this.connect("notify::enabled", () => {
      if (!this._isReady) return;
      if (!this.enabled) {
        this._setPrimarySelection(null);
        themeService.setPrimaryNone();
        themeService.refreshThemedWidgets();
      } else if (!this._anyPrimaryActive()) {
        // When enabling, ensure at least one is selected (default to blue)
        const useKey = themeService.getPrimaryState().key ?? "blue";
        this._setPrimarySelection(useKey);
        themeService.setPrimaryByKey(useKey);
        themeService.refreshThemedWidgets();
      }
    });
  }

  _onPrimaryBlueToggled(): void {
    this._onPrimaryToggled(this._primary_blue, "blue");
  }
  _onPrimaryTealToggled(): void {
    this._onPrimaryToggled(this._primary_teal, "teal");
  }
  _onPrimaryGreenToggled(): void {
    this._onPrimaryToggled(this._primary_green, "green");
  }
  _onPrimaryYellowToggled(): void {
    this._onPrimaryToggled(this._primary_yellow, "yellow");
  }
  _onPrimaryOrangeToggled(): void {
    this._onPrimaryToggled(this._primary_orange, "orange");
  }
  _onPrimaryRedToggled(): void {
    this._onPrimaryToggled(this._primary_red, "red");
  }
  _onPrimaryPinkToggled(): void {
    this._onPrimaryToggled(this._primary_pink, "pink");
  }
  _onPrimaryPurpleToggled(): void {
    this._onPrimaryToggled(this._primary_purple, "purple");
  }
  _onPrimarySlateToggled(): void {
    this._onPrimaryToggled(this._primary_slate, "slate");
  }

  private _onPrimaryToggled(source: Gtk.CheckButton, key: PrimaryFamilyKey): void {
    if (this._isUpdatingUi) return;
    if (!source.get_active()) {
      if (!this._anyPrimaryActive()) {
        if (this.enabled) {
          // Enforce one selected when enabled
          this._setPrimarySelection("blue");
          themeService.setPrimaryByKey("blue");
          themeService.refreshThemedWidgets();
        } else {
          themeService.setPrimaryNone();
        }
      }
      return;
    }
    this._setPrimarySelection(key);
    themeService.setPrimaryByKey(key);
    themeService.refreshThemedWidgets();
  }

  private get _buttons(): Record<PrimaryFamilyKey, Gtk.CheckButton> {
    return {
      blue: this._primary_blue,
      teal: this._primary_teal,
      green: this._primary_green,
      yellow: this._primary_yellow,
      orange: this._primary_orange,
      red: this._primary_red,
      pink: this._primary_pink,
      purple: this._primary_purple,
      slate: this._primary_slate,
    };
  }

  private _setPrimarySelection(key: PrimaryFamilyKey | null): void {
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

  private _anyPrimaryActive(): boolean {
    return Object.values(this._buttons).some((btn) => btn.get_active());
  }
}

GObject.type_ensure(PrimaryColorSelector.$gtype);
