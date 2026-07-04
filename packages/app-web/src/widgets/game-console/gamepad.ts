import { AdwButton } from "@gjsify/adwaita-web";
import { type GamepadEventMap, type GamepadKey, type GamepadWidget, getGamepadKeyCode } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/core";

/** Direction/action buttons in DOM order, with the glyph shown on each. */
const BUTTONS: ReadonlyArray<{ key: GamepadKey; glyph: string; area: string }> = [
  { key: "Up", glyph: "▲", area: "up" },
  { key: "Left", glyph: "◀", area: "left" },
  { key: "Right", glyph: "▶", area: "right" },
  { key: "Down", glyph: "▼", area: "down" },
  { key: "B", glyph: "B", area: "b" },
  { key: "A", glyph: "A", area: "a" },
];

/**
 * Gamepad — the on-screen d-pad + A/B controller, implementing the shared
 * `GamepadWidget` contract from `@learn6502/common-ui`.
 *
 * Web twin of app-gnome's `Gamepad extends Adw.Bin` (`gamepad.blp`, six
 * `Gtk.Button`s) and app-android's Android gamepad. Each button click calls
 * `press(key)`, which dispatches `keyPressed` with the ASCII key code
 * (`getGamepadKeyCode`) — the `gameConsoleController` writes that byte to memory
 * `$ff`, exactly like the GNOME/Android twins. A CSS grid lays the four
 * direction buttons out as a d-pad with A/B to the right.
 *
 * @emits keyPressed - when any button is pressed
 */
export class Gamepad extends HTMLElement implements GamepadWidget {
  readonly events: EventDispatcher<GamepadEventMap> = new EventDispatcher<GamepadEventMap>();

  private built = false;

  connectedCallback(): void {
    this.ensureBuilt();
  }

  // --- GamepadWidget interface ---

  public press(buttonName: GamepadKey): void {
    this.events.dispatch("keyPressed", {
      key: buttonName,
      keyCode: getGamepadKeyCode(buttonName),
    });
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    const pad = document.createElement("div");
    pad.className = "game-console-gamepad";

    for (const { key, glyph, area } of BUTTONS) {
      const button = new AdwButton();
      button.setAttribute("label", glyph);
      button.setAttribute("circular", "");
      button.classList.add("gamepad-button", `gamepad-button--${area}`);
      button.style.gridArea = area;
      button.setAttribute("aria-label", key);
      button.addEventListener("click", () => this.press(key));
      pad.appendChild(button);
    }

    this.replaceChildren(pad);
  }
}

customElements.define("learn-gamepad", Gamepad);
