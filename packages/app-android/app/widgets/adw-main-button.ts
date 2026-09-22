import { localize as _ } from "@nativescript/localize";
import { Adw, Gtk, GTK_BUTTON_CLICKED } from "@gjsify/adwaita-nativescript";
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
 * Adwaita-styled floating action button: a `Gtk.Button` holding an `Adw.ButtonContent`
 * (white symbolic icon + label) on the accent `.adw-fab` pill background. It is
 * stateless w.r.t. the simulator — the shell computes the MainButtonState and calls
 * setState(); a tap invokes onAction(currentAction). Replaces the Material
 * `MainButton`/`Fab` widget.
 */
export class AdwMainButton extends Gtk.Button {
  /** Invoked on tap with the current mode's action. Wired by the shell. */
  public onAction: ((action: MainButtonAction) => void) | null = null;

  // Not `_content`: `Gtk.Button` already declares a private field of that name
  // (its own single-child slot), and TypeScript refuses two private declarations
  // of the same name across a base/subclass pair.
  private readonly _buttonContent: Adw.ButtonContent;
  private _state: MainButtonState = MainButtonState.ASSEMBLE;

  constructor() {
    super();
    // `add_css_class`, not a `className` assignment: the button's constructor already
    // put `adw-button` there, and a raw overwrite would drop it — worse, it would come
    // back on the next `styleClasses`/`add_css_class` call, which rebuilds `className`
    // from the tracked list and has no idea `adw-fab` was ever there.
    this.add_css_class("adw-fab");

    // Icon+label IS `Adw.ButtonContent`. `Gtk.Button` already wires the press-darken
    // (`attachRowPressFeedback`, in its own constructor) — the only app-specific parts
    // left are the MainButtonState machine below and the `.adw-fab` pill styling.
    const buttonContent = new Adw.ButtonContent({ iconColor: "#ffffff" }); // pinned white on the accent pill, both schemes
    this._buttonContent = buttonContent;
    this.child = buttonContent;

    this.addEventListener(GTK_BUTTON_CLICKED, () => {
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
    this._buttonContent.iconName = mode.icon;
    this._buttonContent.label = _(mode.label);
  }
}
