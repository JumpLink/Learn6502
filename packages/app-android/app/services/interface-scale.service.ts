import type Gio from "@girs/gio-2.0";
import {
  appScaleChoices,
  appScaleSetting,
  defaultAppScale,
  parseAppScaleSetting,
  setAppScale,
  type AppScaleSetting,
} from "@gjsify/adwaita-nativescript/app-scale";
import type { InterfaceScaleSetting, InterfaceScaleValue } from "@learn6502/ui";

import { KEY_INTERFACE_SCALE } from "../constants";

/**
 * How large the interface is drawn, as the Preferences dialog sees it.
 *
 * The scale itself — why 360 is the reference, why it never goes below 1, why a tablet is left
 * alone — belongs to `@gjsify/adwaita-nativescript/app-scale`. This service is the app's half:
 * the one `Gio.Settings` key the choice is stored under, so a restart draws the interface the way
 * the learner left it.
 *
 * Stored as a STRING, `"auto"` or a factor. A number key would need a sentinel value for
 * "automatic", and a 0 that means 1.143 is the kind of encoding that outlives the comment
 * explaining it.
 */
export class InterfaceScaleService implements InterfaceScaleSetting {
  private settings: Gio.Settings | null = null;

  /**
   * Apply the stored choice. Call from `activate`, after `registerAppScaleCss`: the scale needs
   * the stylesheet it scales, and the first window should already be built at the right size.
   */
  init(settings: Gio.Settings): void {
    this.settings = settings;
    setAppScale(this.value);
    settings.connect(`changed::${KEY_INTERFACE_SCALE}`, () => setAppScale(this.value));
  }

  /** The factor `"auto"` resolves to on this screen. */
  get automatic(): number {
    return defaultAppScale();
  }

  /** The factors offered next to automatic — the clamp's own range, so none can be refused. */
  get choices(): readonly number[] {
    return appScaleChoices();
  }

  get value(): InterfaceScaleValue {
    // No settings yet means nothing has been read: report what the scale is actually set to
    // rather than a default that may not be what is drawn.
    if (!this.settings) return appScaleSetting();
    // A hand-edited or newer value must not throw, and must not be applied unclamped.
    return parseAppScaleSetting(this.settings.get_string(KEY_INTERFACE_SCALE));
  }

  set value(next: InterfaceScaleValue) {
    this.settings?.set_string(KEY_INTERFACE_SCALE, next === "auto" ? "auto" : String(next));
    // On a host whose settings never arrived the choice still has to reach the interface.
    if (!this.settings) setAppScale(next as AppScaleSetting);
  }
}

export const interfaceScaleService = new InterfaceScaleService();
