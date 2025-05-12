import type { EventDispatcher } from "@learn6502/6502";
import type { GamepadKey, GamepadEventMap } from "../../types/index.js";

/**
 * Interface for a platform-independent Gamepad widget
 */
export interface GamepadWidget {
  readonly events: EventDispatcher<GamepadEventMap>;

  /**
   * Press a gamepad button
   * @param buttonName The button to press
   */
  press(buttonName: GamepadKey): void;
}
