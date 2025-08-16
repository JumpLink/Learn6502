import type { EventListener, EventMap } from "./types/index.ts";

/**
 * Type-safe event dispatcher with support for event mapping
 * @template TEventMap A mapping of event names to their data types
 */
export class EventDispatcher<TEventMap extends EventMap = EventMap> {
  private listeners: {
    [K in keyof TEventMap]?: EventListener<TEventMap[K]>[];
  } = {};

  /**
   * Register a listener for a specific event
   * @param event The event name to listen for
   * @param callback The callback function to execute when the event occurs
   */
  public on<K extends keyof TEventMap>(
    event: K,
    callback: EventListener<TEventMap[K]>
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  /**
   * Remove a listener for a specific event
   * @param event The event name to remove the listener from
   * @param callback The callback function to remove
   */
  public off<K extends keyof TEventMap>(
    event: K,
    callback: EventListener<TEventMap[K]>
  ): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event]!.filter(
      (listener) => listener !== callback
    );
  }

  /**
   * Dispatch an event to all registered listeners
   * @param event The event name to dispatch
   * @param data The data to pass to the listeners
   */
  public dispatch<K extends keyof TEventMap>(
    event: K,
    data: TEventMap[K]
  ): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event]!.forEach((listener) => listener(data));
    // Automatically remove listeners registered with `once`
    this.listeners[event] = this.listeners[event]!.filter(
      (listener) => !listener.once
    );
  }

  /**
   * Register a listener that will be removed after its first invocation
   * @param event The event name to listen for
   * @param callback The callback function to execute when the event occurs
   */
  public once<K extends keyof TEventMap>(
    event: K,
    callback: EventListener<TEventMap[K]>
  ): void {
    const onceWrapper = ((data: TEventMap[K]) => {
      callback(data);
      onceWrapper.once = true; // Mark for removal
    }) as EventListener<TEventMap[K]>;
    this.on(event, onceWrapper);
  }
}
