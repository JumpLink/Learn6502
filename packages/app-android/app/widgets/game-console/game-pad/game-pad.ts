import { GridLayout, EventData, Observable } from "@nativescript/core";

export type GamePadKey = "Left" | "Right" | "Up" | "Down" | "A" | "B";

export const gamepadPressedEvent = "gamepad-pressed";

export interface GamePadPressEventData extends EventData {
  eventName: typeof gamepadPressedEvent;
  object: GamePad;
  keyName: GamePadKey;
  key: number; // The actual key code value (0x01, 0x02, 0x04, 0x08, 0x10, 0x20)
}

/**
 * Placeholder GamePad widget for the GameConsole.
 */
export class GamePad extends GridLayout {
  public static gamepadPressedEvent = gamepadPressedEvent;

  private keyMap: { [key in GamePadKey]: number } = {
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
  public press(keyName: GamePadKey): void {
    const keyCode = this.keyMap[keyName];
    console.log(
      `GamePad: Button ${keyName} (${keyCode}) pressed (placeholder)`
    );

    // Notify listeners about the button press
    this.notify(<GamePadPressEventData>{
      eventName: gamepadPressedEvent,
      object: this,
      keyName: keyName,
      key: keyCode,
    });
  }
}
