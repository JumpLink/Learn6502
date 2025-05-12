import { GridLayout } from "@nativescript/core";
import type { GamepadEventMap, GamepadWidget } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/6502";
export type GamepadKey = "Left" | "Right" | "Up" | "Down" | "A" | "B";

export const gamepadPressedEvent = "gamepad-pressed";

/**
 * Placeholder Gamepad widget for the GameConsole.
 */
export class Gamepad extends GridLayout implements GamepadWidget {
  readonly events: EventDispatcher<GamepadEventMap> =
    new EventDispatcher<GamepadEventMap>();

  public static gamepadPressedEvent = gamepadPressedEvent;

  private keyMap: { [key in GamepadKey]: number } = {
    Right: 0x01,
    Left: 0x02,
    Down: 0x04,
    Up: 0x08,
    A: 0x10, // Often Start or Select on original hardware, using A here
    B: 0x20, // Often A or B
  };

  constructor() {
    super();
  }

  /**
   * Simulate pressing a button.
   * In a real implementation, this would be triggered by UI events.
   */
  public press(keyName: GamepadKey): void {
    const keyCode = this.keyMap[keyName];
    console.log(
      `Gamepad: Button ${keyName} (${keyCode}) pressed (placeholder)`
    );

    // Notify listeners about the button press
    this.events.dispatch("keyPressed", {
      key: keyName,
      keyCode,
    });
  }
}
