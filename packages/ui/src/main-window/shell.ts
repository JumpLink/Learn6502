import type { WindowCommon } from "@gjsify/adwaita-core";

import type { ViewType } from "@learn6502/common-ui";

import type { WindowSettings } from "./services.ts";

/** One of the window's `win` actions, as the buttons and the menu see it. */
export interface ShellAction {
  setEnabled(enabled: boolean): void;
}

export type UnsavedChangesAnswer = "save" | "discard" | "cancel";

/**
 * What the shared `MainWindowController` needs from the widgets that hold the four screens. Each
 * platform implements it over its own toolkit (GTK, NativeScript, the DOM), so the controller
 * names no widget API of its own. `TWidget` is what holds the focus: a `Gtk.Widget`, a DOM
 * `Element` or a NativeScript `View`.
 */
export interface MainWindowShell<TWidget = unknown> {
  /** The window, for the behaviour that follows its focus and close request. */
  readonly window: WindowCommon<TWidget>;
  /** Call `handler` whenever the focused widget inside the window changes, where the platform can tell. */
  onFocusWidgetChanged(handler: () => void): void;
  /** Restore the saved window geometry and keep saving it, where the platform owns a window size. */
  persistWindowSize(settings: WindowSettings): void;

  /** The screens sit side by side (wide window) instead of one at a time. */
  isDesktopLayout(): boolean;
  /** The window moved between the two layouts; the shell has already placed the screens. */
  onLayoutChanged(handler: () => void): void;
  /** Place the screens for the current layout. */
  mountLayout(): void;

  /** The screen on show; in the side-by-side layout the one the shell treats as current. */
  activeView(): ViewType;
  showView(view: ViewType): void;
  onActiveViewChanged(handler: (view: ViewType, previous: ViewType) => void): void;

  setLearnBackVisible(visible: boolean): void;
  setFileTitle(filename: string): void;
  /** Close the sidebar when it overlays the content, so copied code is visible at once. */
  closeSidebarIfOverlay(): void;
  isInsideConsole(widget: TWidget | null): boolean;

  /** Register an action; `accels` are keyboard shortcuts where the platform has them. */
  addAction(name: string, activate: () => void, accels?: string[]): ShellAction;
  askUnsavedChanges(): Promise<UnsavedChangesAnswer>;
  closeWindow(): void;
}
