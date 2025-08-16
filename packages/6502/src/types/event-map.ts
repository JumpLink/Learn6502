/**
 * Type definition for event maps
 * This type maps event names to their payload types
 *
 * @example
 * ```
 * // Define your event map
 * interface MyEventMap {
 *   "click": { x: number, y: number };
 *   "hover": string;
 *   "load": boolean;
 * }
 *
 * // Use with EventDispatcher
 * const events = new EventDispatcher<MyEventMap>();
 * events.on("click", (data) => console.log(data.x, data.y)); // Type-safe!
 * ```
 */
// deno-lint-ignore no-explicit-any
export type EventMap = Record<string, any>;
