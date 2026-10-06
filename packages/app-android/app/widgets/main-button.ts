import { localize as _ } from "@nativescript/localize";
import { Gio, Gtk, insertActionGroup } from "@gjsify/adwaita-nativescript";
import { build } from "@gjsify/adwaita-nativescript/builder";
import type { View } from "@nativescript/core";
import { MainButtonState } from "@learn6502/common-ui";
// The GNOME app's own Blueprint (revealer + suggested-action button), built by the shared-tree builder.
import mainButtonTree from "../../../app-gnome/src/widgets/main-button.blp?shared-tree";

/** The action a tap emits, matching the MainButtonState intent. */
export type MainButtonAction = "assemble" | "run" | "pause" | "resume" | "reset" | "step";

interface MainButtonMode {
  iconName: string;
  text: () => string;
  /** Name inside the `win` action group; the same names the GNOME MainButton uses. */
  actionName: string;
  action: MainButtonAction;
}

// Same icons, labels and action names as app-gnome's `MainButton.buttonModes`.
const MODES: Partial<Record<MainButtonState, MainButtonMode>> = {
  [MainButtonState.INITIAL]: { iconName: "build-alt-symbolic", text: () => _("Assemble"), actionName: "assemble", action: "assemble" },
  [MainButtonState.ASSEMBLE]: { iconName: "build-alt-symbolic", text: () => _("Assemble"), actionName: "assemble", action: "assemble" },
  [MainButtonState.RUN]: { iconName: "play-symbolic", text: () => _("Run"), actionName: "run-simulator", action: "run" },
  [MainButtonState.PAUSE]: { iconName: "pause-symbolic", text: () => _("Pause"), actionName: "pause-simulator", action: "pause" },
  [MainButtonState.RESUME]: { iconName: "resume-symbolic", text: () => _("Resume"), actionName: "resume-simulator", action: "resume" },
  [MainButtonState.RESET]: { iconName: "reset-symbolic", text: () => _("Reset"), actionName: "reset-simulator", action: "reset" },
  [MainButtonState.STEP]: { iconName: "step-over-symbolic", text: () => _("Step"), actionName: "step-simulator", action: "step" },
};

/**
 * The GNOME app's MainButton, rendered from the same `main-button.blp`: a `Gtk.Revealer` holding a
 * `suggested-action` `Gtk.Button` whose icon, tooltip and `win.*` action follow the MainButtonState.
 * HIDDEN (and any unmapped state) slides the revealer away, as on GNOME.
 */
export class MainButton {
  /** The built widget tree; add it to the window overlay. */
  public readonly view: View;
  /** Invoked when the button's action fires. Wired by the shell. */
  public onAction: ((action: MainButtonAction) => void) | null = null;

  private readonly revealer: InstanceType<typeof Gtk.Revealer>;
  private readonly button: Gtk.Button;
  private _state: MainButtonState = MainButtonState.ASSEMBLE;

  constructor() {
    const root = build(mainButtonTree);
    this.view = root;
    this.revealer = root.getViewById<InstanceType<typeof Gtk.Revealer>>("revealer");
    this.button = root.getViewById<Gtk.Button>("button");

    const actions = new Gio.SimpleActionGroup();
    for (const mode of Object.values(MODES)) {
      if (actions.lookup_action(mode.actionName)) continue;
      const action = new Gio.SimpleAction({ name: mode.actionName });
      action.connect("activate", () => this.onAction?.(mode.action));
      actions.add_action(action);
    }
    insertActionGroup(root, "win", actions);

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
