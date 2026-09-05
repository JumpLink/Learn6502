import { Label, StackLayout } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import { Gtk, attachRowPressFeedback } from "@gjsify/adwaita-nativescript";
import {
  systemRunSymbolic,
  mediaPlaybackStartSymbolic,
  mediaPlaybackPauseSymbolic,
  viewRefreshSymbolic,
  goNextSymbolic,
} from "@gjsify/adwaita-icons/actions";
import { MainButtonState } from "@learn6502/common-ui";

/** The action a FAB tap emits, matching the MainButtonState intent. */
export type MainButtonAction = "assemble" | "run" | "pause" | "resume" | "reset" | "step";

interface MainButtonMode {
  icon: string;
  label: string;
  action: MainButtonAction;
}

/** State -> { icon, label, action }. HIDDEN (and any unmapped state) collapses the FAB. */
const MODES: Partial<Record<MainButtonState, MainButtonMode>> = {
  [MainButtonState.INITIAL]: { icon: systemRunSymbolic, label: "Assemble", action: "assemble" },
  [MainButtonState.ASSEMBLE]: { icon: systemRunSymbolic, label: "Assemble", action: "assemble" },
  [MainButtonState.RUN]: { icon: mediaPlaybackStartSymbolic, label: "Run", action: "run" },
  [MainButtonState.PAUSE]: { icon: mediaPlaybackPauseSymbolic, label: "Pause", action: "pause" },
  [MainButtonState.RESUME]: { icon: mediaPlaybackStartSymbolic, label: "Resume", action: "resume" },
  [MainButtonState.RESET]: { icon: viewRefreshSymbolic, label: "Reset", action: "reset" },
  [MainButtonState.STEP]: { icon: goNextSymbolic, label: "Step", action: "step" },
};

/**
 * Adwaita-styled floating action button: a pill holding a white symbolic icon +
 * label on the accent background. It is stateless w.r.t. the simulator — the shell
 * computes the MainButtonState and calls setState(); a tap invokes
 * onAction(currentAction). Replaces the Material `MainButton`/`Fab` widget.
 */
export class AdwMainButton extends StackLayout {
  /** Invoked on tap with the current mode's action. Wired by the shell. */
  public onAction: ((action: MainButtonAction) => void) | null = null;

  private readonly _icon: Gtk.Image;
  private readonly _label: Label;
  private _state: MainButtonState = MainButtonState.ASSEMBLE;

  constructor() {
    super();
    this.orientation = "horizontal";
    this.className = "adw-fab";

    const icon = new Gtk.Image();
    icon.iconColor = "#ffffff"; // pinned white on the accent pill, both schemes
    icon.verticalAlignment = "middle";
    this._icon = icon;
    this.addChild(icon);

    const label = new Label();
    label.className = "adw-fab-label";
    label.verticalAlignment = "middle";
    this._label = label;
    this.addChild(label);

    // Adwaita buttons darken on press; NS only auto-applies that to `Button`.
    attachRowPressFeedback(this);
    this.addEventListener("tap", () => {
      const mode = MODES[this._state];
      if (mode && this.onAction) this.onAction(mode.action);
    });

    this.setState(MainButtonState.ASSEMBLE);
  }

  getState(): MainButtonState {
    return this._state;
  }

  setState(state: MainButtonState): void {
    this._state = state;
    const mode = MODES[state];
    if (!mode) {
      this.visibility = "collapse";
      return;
    }
    this.visibility = "visible";
    this._icon.iconName = mode.icon;
    this._label.text = _(mode.label);
  }
}
