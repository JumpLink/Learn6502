import { localize as _ } from "@nativescript/localize";
import { Adw, Gtk } from "@gjsify/adwaita-nativescript";
import { buildInto, registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { MainButtonState } from "@learn6502/common-ui";
// The GNOME app's own Blueprint (revealer + suggested-action button), built by the shared-tree builder.
import mainButtonTree from "../../../app-gnome/src/widgets/main-button.blp?shared-tree";
import { translate } from "~/utils/translate";

interface MainButtonMode {
  iconName: string;
  text: () => string;
  /** Name inside the window's `win` action group; the same names the GNOME MainButton uses. */
  actionName: string;
}

// Same icons, labels and action names as app-gnome's `MainButton.buttonModes`.
const MODES: Partial<Record<MainButtonState, MainButtonMode>> = {
  [MainButtonState.INITIAL]: { iconName: "build-alt-symbolic", text: () => _("Assemble"), actionName: "assemble" },
  [MainButtonState.ASSEMBLE]: { iconName: "build-alt-symbolic", text: () => _("Assemble"), actionName: "assemble" },
  [MainButtonState.RUN]: { iconName: "play-symbolic", text: () => _("Run"), actionName: "run-simulator" },
  [MainButtonState.PAUSE]: { iconName: "pause-symbolic", text: () => _("Pause"), actionName: "pause-simulator" },
  [MainButtonState.RESUME]: { iconName: "resume-symbolic", text: () => _("Resume"), actionName: "resume-simulator" },
  [MainButtonState.RESET]: { iconName: "reset-symbolic", text: () => _("Reset"), actionName: "reset-simulator" },
  [MainButtonState.STEP]: { iconName: "step-over-symbolic", text: () => _("Step"), actionName: "step-simulator" },
};

/**
 * The GNOME app's `$MainButton`, built from the same `main-button.blp`: a `Gtk.Revealer` holding a
 * `suggested-action` `Gtk.Button` whose icon, tooltip and `win.*` action follow the MainButtonState.
 * HIDDEN (and any unmapped state) slides the revealer away, as on GNOME. The `win` actions come from
 * the window the button sits in.
 */
export class MainButton extends Adw.Bin {
  private readonly revealer: InstanceType<typeof Gtk.Revealer>;
  private readonly button: Gtk.Button;
  private _state: MainButtonState = MainButtonState.ASSEMBLE;

  constructor() {
    super();
    buildInto(this, mainButtonTree, { translate });
    this.revealer = this.getViewById<InstanceType<typeof Gtk.Revealer>>("revealer");
    this.button = this.getViewById<Gtk.Button>("button");
    this.setState(MainButtonState.ASSEMBLE);
  }

  getState(): MainButtonState {
    return this._state;
  }

  setState(state: MainButtonState): void {
    this._state = state;
    const mode = MODES[state];
    if (!mode) {
      this.revealer.revealChild = false;
      return;
    }
    this.revealer.revealChild = true;
    this.button.iconName = mode.iconName;
    this.button.tooltipText = mode.text();
    this.button.actionName = `win.${mode.actionName}`;
  }
}

registerTemplateClass("MainButton", MainButton);
