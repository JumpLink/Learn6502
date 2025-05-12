import { GridLayout, EventData } from "@nativescript/core";

export type GamepadKey = "Left" | "Right" | "Up" | "Down" | "A" | "B";

export const gamepadPressedEvent = "gamepad-pressed";

export interface GamepadPressEventData extends EventData {
  eventName: typeof gamepadPressedEvent;
  object: Gamepad;
  keyName: GamepadKey;
  key: number; // The actual key code value (0x01, 0x02, 0x04, 0x08, 0x10, 0x20)
}

/**
 * Placeholder Gamepad widget for the GameConsole.
 */
export class Gamepad extends GridLayout {
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
    this.notify(<GamepadPressEventData>{
      eventName: gamepadPressedEvent,
      object: this,
      keyName: keyName,
      key: keyCode,
    });
  }
}
