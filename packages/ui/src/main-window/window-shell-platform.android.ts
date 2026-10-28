import { padForSystemInsets, padSheetForSystemInsets } from "@gjsify/adwaita-nativescript";
import type { Adw as NativeAdw } from "@gjsify/adwaita-nativescript";

import type { WindowShellPlatform, WindowShellPlatformParts } from "./window-shell-platform.ts";

type InsetsTarget = Parameters<typeof padForSystemInsets>[0];

/** The Android version of the platform part: the gesture area at the screen's bottom edge. */
export function createWindowShellPlatform(parts: WindowShellPlatformParts): WindowShellPlatform {
  const { learn, editor, gameConsole, debugger: debuggerView, rightColumnContent } = parts;
  let releaseInsets: (() => void)[] = [];

  return {
    // NativeScript refuses `notify::focus-widget`, and Android has no in-window focus to follow.
    watchFocusWidget: () => {},

    layoutMounted: (desktop) => {
      for (const release of releaseInsets) release();
      releaseInsets = [];

      // A box hands spare space only to a child that asks for it, and the screens are plain views.
      if (desktop) {
        for (const screen of [learn, editor, debuggerView, gameConsole]) {
          Object.assign(screen, { hexpand: true, vexpand: true });
        }
      }

      // The columns run down to the screen's bottom edge, behind the gesture area, with their
      // backgrounds. What scrolls in them (and the editor's Help bar) clears it instead of the
      // columns being shortened. In the stack the switcher bar below pays it, so nothing does here.
      if (!desktop) return;
      // The widgets are typed against the GJS bindings; at run time they are NativeScript views.
      releaseInsets = [
        padForSystemInsets(rightColumnContent as unknown as InsetsTarget),
        ...learn.scrolledWindows.map((scroll) => padForSystemInsets(scroll.get_child() as unknown as InsetsTarget)),
        padSheetForSystemInsets(editor.bottomSheet as unknown as NativeAdw.BottomSheet),
      ];
    },
  };
}
