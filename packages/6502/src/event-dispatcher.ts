import type { EventListener } from "./types/index.ts";

// deno-lint-ignore no-explicit-any
export class EventDispatcher<T = any> {
  private listeners: { [event: string]: EventListener<T>[] } = {};

  /** Register a listener for a specific event */
  public on(event: string, callback: EventListener<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /** Remove a listener for a specific event */
  public off(event: string, callback: EventListener<T>): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback
    );
  }

  /** Dispatch an event to all registered listeners */
  public dispatch(event: string, data: T): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((listener) => listener(data));
    // Automatically remove listeners registered with `once`
    this.listeners[event] = this.listeners[event].filter(
      (listener) => !listener.once
    );
  }

  /** Register a listener that will be removed after its first invocation */
  public once(event: string, callback: EventListener<T>): void {
    const onceWrapper = ((data: T) => {
      callback(data);
      onceWrapper.once = true; // Mark for removal
    }) as EventListener<T>;
    this.on(event, onceWrapper);
  }
}
