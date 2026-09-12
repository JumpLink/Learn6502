import Gio from "@girs/gio-2.0";
import {
  adwaitaUiFontAvailability,
  applyUiFontPolicy,
  initFonts,
  UI_FONT_POLICIES,
  type UiFontPolicy,
} from "@gjsify/gtk-host/fonts";

import { KEY_UI_FONT } from "../constants.ts";

/**
 * Which typeface and size the interface is drawn with.
 *
 * This exists because GTK takes the HOST's interface font, and off Linux that
 * is not GNOME's. Measured on Windows 11: `Segoe UI 9`, 16.0 px against the
 * 19.0 px GNOME's own `Adwaita Sans 11` draws — 16% smaller, which reads as
 * "the font is a bit small" without being nameable. macOS is already at 18.8 px
 * and needs nothing, which is why the default RAISES ONLY and never shrinks.
 *
 * `adwaita` is offered only where the bundled typeface actually reached the
 * font map. That is not a formality: on Windows the family is exposed as
 * `Adwaita Sans Text` rather than `Adwaita Sans`, and on macOS CoreText cannot
 * register a face at runtime at all — so asking for it by name would silently
 * yield a substitute, which is the defect this setting exists to prevent.
 */
export class UiFontService {
  private settings: Gio.Settings | null = null;

  /**
   * Register the bundled faces and apply the stored choice.
   *
   * Called before the first window is built: `applyUiFontPolicy` captures the
   * host's own `gtk-font-name` the first time it runs, and that is the only
   * moment it can still be read. Once something has written the setting, the
   * way back to `system` is gone.
   */
  init(settings: Gio.Settings): void {
    this.settings = settings;
    // Registers the runtime's faces. On Linux fontconfig has usually found them
    // already; on Windows this is the only mechanism that can.
    initFonts();
    this.apply(this.policy);
    settings.connect(`changed::${KEY_UI_FONT}`, () => this.apply(this.policy));
  }

  /** Whether the `adwaita` option can be offered at all on this host. */
  get adwaitaAvailable(): boolean {
    return adwaitaUiFontAvailability().available;
  }

  get policy(): UiFontPolicy {
    const stored = this.settings?.get_string(KEY_UI_FONT) ?? "size";
    // A value from a newer version, or a hand-edited one, must not throw.
    return (UI_FONT_POLICIES as readonly string[]).includes(stored) ? (stored as UiFontPolicy) : "size";
  }

  set policy(value: UiFontPolicy) {
    this.settings?.set_string(KEY_UI_FONT, value);
  }

  private apply(policy: UiFontPolicy): void {
    // Asking for `adwaita` where the face never arrived would replace one
    // substitution with another. Fall back to the size-only correction, which
    // needs no bundled face.
    const effective = policy === "adwaita" && !this.adwaitaAvailable ? "size" : policy;
    const plan = applyUiFontPolicy(effective);
    console.log(
      `ui-font: policy=${policy}${effective !== policy ? ` (as ${effective}: the GNOME typeface is not on this font map)` : ""} -> ${plan.kind}${plan.next ? ` "${plan.next}"` : " (unchanged)"}`
    );
  }
}

export const uiFontService = new UiFontService();
