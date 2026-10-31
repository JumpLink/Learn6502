import type { WindowCommon } from "@gjsify/adwaita-core";

import { debounce } from "@learn6502/core";

export interface WindowBehaviourOptions<TWidget = unknown> {
  window: WindowCommon<TWidget>;
  /** Follow the focused widget inside the window, where the platform can tell. */
  onFocusWidgetChanged(handler: () => void): void;
  /** The program is running, so losing the window's focus should pause it. */
  isRunning(): boolean;
  pause(): void;
  /** Decide a `close-request`: return true to block the close (e.g. to ask about unsaved changes). */
  onCloseRequest(): boolean;
  /** Focus moving between widgets only pauses in the three-column layout, where the console shares the window. */
  isDesktopLayout(): boolean;
  isInsideConsole(widget: TWidget | null): boolean;
}

/**
 * What the shared main window does with the window's own state, on every platform: pause the program
 * when the window loses focus, guard closing, and (where the platform has them) follow the focused widget.
 */
export class WindowBehaviour<TWidget = unknown> {
  private lastRunAtMs = 0;

  // Debounced so a transient focus loss (a menu popover) does not pause the program
  private readonly onActiveChanged = debounce(() => {
    if (!this.options.window.is_active && this.options.isRunning()) this.options.pause();
  }, 250);

  private readonly onFocusWidgetChanged = debounce(() => {
    if (!this.options.isDesktopLayout()) return;
    if (this.options.isInsideConsole(this.options.window.get_focus() ?? null)) return;
    // Starting the program moves the focus off the toolbar: that must not pause it again
    if (Date.now() - this.lastRunAtMs < 400) return;
    if (this.options.isRunning()) this.options.pause();
  }, 150);

  constructor(private readonly options: WindowBehaviourOptions<TWidget>) {}

  attach(): void {
    const { window } = this.options;
    window.connect("close-request", () => this.options.onCloseRequest());
    window.connect("notify::is-active", () => this.onActiveChanged());
    this.options.onFocusWidgetChanged(() => this.onFocusWidgetChanged());
  }

  /** The program just started; the focus is about to settle on the console. */
  noteRun(): void {
    this.lastRunAtMs = Date.now();
  }
}
