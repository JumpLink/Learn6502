import { GridLayout, Button, Builder } from "@nativescript/core";
import type {
  GamepadKey,
  GamepadEventMap,
  GamepadWidget,
} from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/6502";

/**
 * Android implementation of the Gamepad widget.
 */
export class Gamepad extends GridLayout implements GamepadWidget {
  readonly events = new EventDispatcher<GamepadEventMap>();

  // Button references
  private buttonUp: Button | null = null;
  private buttonDown: Button | null = null;
  private buttonLeft: Button | null = null;
  private buttonRight: Button | null = null;
  private buttonA: Button | null = null;
  private buttonB: Button | null = null;

  // Key codes mapping for the emulator
  private keyMap: { [key in GamepadKey]: number } = {
    Right: 0x01,
    Left: 0x02,
    Down: 0x04,
    Up: 0x08,
    A: 0x10,
    B: 0x20,
  };

  constructor() {
    super();

    // Load the XML layout when the component is loaded
    this.on("loaded", () => {
      // Load the XML layout using Builder
      const componentView = Builder.load({
        path: "~/widgets/game-console",
        name: "gamepad",
      });

      // Add the loaded view hierarchy as a child of this GridLayout
      this.addChild(componentView);

      // Find buttons within the loaded component view
      this.buttonUp = componentView.getViewById<Button>("buttonUp");
      this.buttonDown = componentView.getViewById<Button>("buttonDown");
      this.buttonLeft = componentView.getViewById<Button>("buttonLeft");
      this.buttonRight = componentView.getViewById<Button>("buttonRight");
      this.buttonA = componentView.getViewById<Button>("buttonA");
      this.buttonB = componentView.getViewById<Button>("buttonB");

      // Attach tap listeners
      this.buttonUp?.on("tap", () => this.press("Up"));
      this.buttonDown?.on("tap", () => this.press("Down"));
      this.buttonLeft?.on("tap", () => this.press("Left"));
      this.buttonRight?.on("tap", () => this.press("Right"));
      this.buttonA?.on("tap", () => this.press("A"));
      this.buttonB?.on("tap", () => this.press("B"));
    });
  }

  /**
   * Handles button press logic and dispatches the event.
   * @param keyName The gamepad key that was pressed
   */
  public press(keyName: GamepadKey): void {
    const keyCode = this.keyMap[keyName];
    console.log(`Gamepad: Button ${keyName} (${keyCode}) pressed`);

    // Add visual feedback by applying a CSS class temporarily
    this.applyPressEffectToButton(keyName);

    // Notify listeners about the button press using the shared interface event
    this.events.dispatch("keyPressed", {
      key: keyName,
      keyCode,
    });
  }

  /**
   * Apply a visual effect to indicate button press
   * @param keyName The button that was pressed
   */
  private applyPressEffectToButton(keyName: GamepadKey): void {
    let button: Button | null = null;

    switch (keyName) {
      case "Up":
        button = this.buttonUp;
        break;
      case "Down":
        button = this.buttonDown;
        break;
      case "Left":
        button = this.buttonLeft;
        break;
      case "Right":
        button = this.buttonRight;
        break;
      case "A":
        button = this.buttonA;
        break;
      case "B":
        button = this.buttonB;
        break;
    }

    if (button) {
      // Add pressed class
      button.cssClasses.add("pressed");

      // Remove pressed class after a short delay
      setTimeout(() => {
        if (button) {
          button.cssClasses.delete("pressed");
        }
      }, 150);
    }
  }
}
