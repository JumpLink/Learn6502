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
  readonly events: EventDispatcher<GamepadEventMap> =
    new EventDispatcher<GamepadEventMap>();

  // Key codes (potentially specific to the target emulator/system)
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
        path: "~/widgets/game-console", // Path relative to the app root
        name: "gamepad", // Name of the XML file (without extension)
      });

      // Add the loaded view hierarchy as a child of this GridLayout
      // Note: This assumes Gamepad itself is just a container.
      // If Gamepad had other direct children, this approach might need adjustment.
      this.addChild(componentView);

      // Find buttons within the loaded component view
      const buttonUp = componentView.getViewById<Button>("buttonUp");
      const buttonDown = componentView.getViewById<Button>("buttonDown");
      const buttonLeft = componentView.getViewById<Button>("buttonLeft");
      const buttonRight = componentView.getViewById<Button>("buttonRight");
      const buttonA = componentView.getViewById<Button>("buttonA");
      const buttonB = componentView.getViewById<Button>("buttonB");

      // Attach tap listeners
      buttonUp?.on("tap", () => this.press("Up"));
      buttonDown?.on("tap", () => this.press("Down"));
      buttonLeft?.on("tap", () => this.press("Left"));
      buttonRight?.on("tap", () => this.press("Right"));
      buttonA?.on("tap", () => this.press("A"));
      buttonB?.on("tap", () => this.press("B"));
    });
  }

  /**
   * Handles button press logic and dispatches the event.
   */
  public press(keyName: GamepadKey): void {
    const keyCode = this.keyMap[keyName];
    console.log(`Gamepad: Button ${keyName} (${keyCode}) pressed`);

    // Notify listeners about the button press using the shared interface event
    this.events.dispatch("keyPressed", {
      key: keyName,
      keyCode, // Use the mapped keyCode
    });
  }
}
