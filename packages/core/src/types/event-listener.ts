/**
 * Type definition for event listeners
 * @template T The type of data passed to the listener callback
 */
export type EventListener<T = any> = ((data: T) => void) & { once?: boolean };
