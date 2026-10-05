import type { GamepadKey } from "./gamepad-key";

/**
 * Interface for gamepad input events
 */
export interface GamepadEvent {
  key: GamepadKey;
  keyCode: number;
}
