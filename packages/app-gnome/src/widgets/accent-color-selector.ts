import GObject from "gi://GObject";
import Adw from "gi://Adw";
import type Gtk from "gi://Gtk";

import Template from "./accent-color-selector.blp";
import { themeService } from "../services";

/**
 * AccentColorSelector
 *
 * Compact selector for predefined accent color families.
 * Delegates persistence/apply to themeService.
 */
export class AccentColorSelector extends Adw.Bin {
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
  private _enabled: boolean = true;
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
    const { key, mode } = themeService.getAccentState();
    const sel = key ?? null;
    this._setAccentSelection(sel as any);

    // Sync on map to catch late changes and mark ready
    this.connect("map", () => {
      const { key, mode } = themeService.getAccentState();
      const sel = key ?? null;
      this._setAccentSelection(sel as any);
      this._isReady = true;
    });

    // React to external changes
    themeService.events.on("accent-changed", ({ key, mode }) => {
      const sel = key ?? null;
      this._setAccentSelection(sel as any);
    });

    // Keep accent override cleared when disabled
    this.connect("notify::enabled", () => {
      const enabled = (this as any).enabled as boolean;
      this._enabled = enabled;
      // Ignore initial template binding before we are ready
      if (!this._isReady) return;
      if (!enabled) {
        this._setAccentSelection(null);
        themeService.setAccentSystem();
        themeService.refreshThemedWidgets();
      } else {
        // When enabling, ensure at least one is selected (default to blue)
        if (!this._anyAccentActive()) {
          const { key } = themeService.getAccentState();
          const useKey = (key as any) || "blue";
          this._setAccentSelection(useKey as any);
          themeService.setAccentByKey(useKey as any);
          themeService.refreshThemedWidgets();
        }
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

  private _onAccentToggled(source: Gtk.CheckButton, key: string): void {
    if (this._isUpdatingUi) return;
    if (!source.get_active()) {
      if (!this._anyAccentActive()) {
        if (this._enabled) {
          // Enforce one selected when enabled
          this._setAccentSelection("blue");
          themeService.setAccentByKey("blue" as any);
          themeService.refreshThemedWidgets();
        } else {
          themeService.setAccentSystem();
        }
      }
      return;
    }
    this._setAccentSelection(key);
    themeService.setAccentByKey(key as any);
    themeService.refreshThemedWidgets();
  }

  private _setAccentSelection(key: string | null): void {
    this._isUpdatingUi = true;
    try {
      const map: Record<string, Gtk.CheckButton> = {
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
      for (const [k, btn] of Object.entries(map)) {
        const want = key === k;
        if (btn.get_active() !== want) btn.set_active(want);
      }
    } finally {
      this._isUpdatingUi = false;
    }
  }

  private _anyAccentActive(): boolean {
    return (
      this._accent_blue.get_active() ||
      this._accent_teal.get_active() ||
      this._accent_green.get_active() ||
      this._accent_yellow.get_active() ||
      this._accent_orange.get_active() ||
      this._accent_red.get_active() ||
      this._accent_pink.get_active() ||
      this._accent_purple.get_active() ||
      this._accent_slate.get_active()
    );
  }
}

GObject.type_ensure(AccentColorSelector.$gtype);
