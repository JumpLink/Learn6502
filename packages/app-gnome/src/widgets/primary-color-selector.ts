import GObject from "gi://GObject";
import Adw from "gi://Adw";
import type Gtk from "gi://Gtk";

import Template from "./primary-color-selector.blp";
import { themeService } from "../services";

/**
 * PrimaryColorSelector
 *
 * Compact selector for predefined primary color families.
 * Delegates persistence/apply to themeService.
 */
export class PrimaryColorSelector extends Adw.Bin {
  private declare _primary_blue: Gtk.CheckButton;
  private declare _primary_teal: Gtk.CheckButton;
  private declare _primary_green: Gtk.CheckButton;
  private declare _primary_yellow: Gtk.CheckButton;
  private declare _primary_orange: Gtk.CheckButton;
  private declare _primary_red: Gtk.CheckButton;
  private declare _primary_pink: Gtk.CheckButton;
  private declare _primary_purple: Gtk.CheckButton;
  private declare _primary_slate: Gtk.CheckButton;
  private _isUpdatingUi: boolean = false;
  private _enabled: boolean = true;
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
    const { key, mode } = themeService.getPrimaryState();
    const sel = key ?? null;
    this._setPrimarySelection(sel as any);

    // Sync on map to catch late changes and mark ready
    this.connect("map", () => {
      const { key, mode } = themeService.getPrimaryState();
      const sel = key ?? null;
      this._setPrimarySelection(sel as any);
      this._isReady = true;
    });

    // React to external changes
    themeService.events.on("primary-changed", ({ key, mode }) => {
      const sel = key ?? null;
      this._setPrimarySelection(sel as any);
    });

    // Keep primary override cleared when disabled
    this.connect("notify::enabled", () => {
      const enabled = (this as any).enabled as boolean;
      this._enabled = enabled;
      if (!this._isReady) return;
      if (!enabled) {
        this._setPrimarySelection(null);
        themeService.setPrimaryNone();
        themeService.refreshThemedWidgets();
      } else {
        // When enabling, ensure at least one is selected (default to blue)
        if (!this._anyPrimaryActive()) {
          const { key } = themeService.getPrimaryState();
          const useKey = (key as any) || "blue";
          this._setPrimarySelection(useKey);
          themeService.setPrimaryByKey(useKey as any);
          themeService.refreshThemedWidgets();
        }
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

  private _onPrimaryToggled(source: Gtk.CheckButton, key: string): void {
    if (this._isUpdatingUi) return;
    if (!source.get_active()) {
      if (!this._anyPrimaryActive()) {
        if (this._enabled) {
          // Enforce one selected when enabled
          this._setPrimarySelection("blue");
          themeService.setPrimaryByKey("blue" as any);
          themeService.refreshThemedWidgets();
        } else {
          themeService.clearPrimaryColor();
        }
      }
      return;
    }
    this._setPrimarySelection(key);
    themeService.setPrimaryByKey(key as any);
    themeService.refreshThemedWidgets();
  }

  private _setPrimarySelection(key: string | null): void {
    this._isUpdatingUi = true;
    try {
      const map: Record<string, Gtk.CheckButton> = {
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
      for (const [k, btn] of Object.entries(map)) {
        const want = key === k;
        if (btn.get_active() !== want) btn.set_active(want);
      }
    } finally {
      this._isUpdatingUi = false;
    }
  }

  private _anyPrimaryActive(): boolean {
    return (
      this._primary_blue.get_active() ||
      this._primary_teal.get_active() ||
      this._primary_green.get_active() ||
      this._primary_yellow.get_active() ||
      this._primary_orange.get_active() ||
      this._primary_red.get_active() ||
      this._primary_pink.get_active() ||
      this._primary_purple.get_active() ||
      this._primary_slate.get_active()
    );
  }
}

GObject.type_ensure(PrimaryColorSelector.$gtype);
