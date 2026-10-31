import type Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";

import type { Debugger } from "../debugger/debugger.ts";
import type { Editor } from "../editor/editor.ts";
import type { GameConsole } from "../game-console/game-console.ts";
import type { Learn } from "../learn/learn.ts";

/** What the platform part of the shell works on: the window and the widgets it places. */
export interface WindowShellPlatformParts {
  window: Adw.ApplicationWindow;
  learn: Learn;
  editor: Editor;
  debugger: Debugger;
  gameConsole: GameConsole;
  /** The right column's content, which runs down to the screen's bottom edge in the wide layout. */
  rightColumnContent: Gtk.Box;
}

/**
 * The few things `WindowShell` leaves to the platform. This file is the GNOME and web version; the
 * `.android.ts` sibling replaces it wholesale, as `game-console/canvas2d.android.ts` does, because a
 * platform file cannot import the module it stands in for.
 */
export interface WindowShellPlatform {
  /** Call `handler` whenever the focused widget inside the window changes, where the platform can tell. */
  watchFocusWidget(handler: () => void): void;
  /** The screens were placed for the wide (`desktop`) or the narrow layout. */
  layoutMounted(desktop: boolean): void;
}

export function createWindowShellPlatform(parts: WindowShellPlatformParts): WindowShellPlatform {
  return {
    watchFocusWidget: (handler) => {
      parts.window.connect("notify::focus-widget", handler);
    },
    layoutMounted: () => {},
  };
}
