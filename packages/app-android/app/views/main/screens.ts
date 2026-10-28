import { ViewType } from "@learn6502/common-ui";
import type { Debugger, GameConsole, Learn, Editor, WindowShell } from "@learn6502/ui";
import { buildEditorScreen, type ScreenModule } from "./editor";
import { buildLearnScreen } from "./learn";
import { buildDebuggerScreen } from "./debugger";
import { buildGameConsoleScreen } from "./game-console";

/** The four screens, by the id `main.window.blp` gives the object that stands for each. */
export interface Screens {
  learn: ScreenModule<Learn>;
  editor: ScreenModule<Editor>;
  debugger: ScreenModule<Debugger>;
  gameConsole: ScreenModule<GameConsole>;
}

const SCREEN_OF_VIEW: Partial<Record<ViewType, keyof Screens>> = {
  [ViewType.LEARN]: "learn",
  [ViewType.EDITOR]: "editor",
  [ViewType.DEBUGGER]: "debugger",
  [ViewType.GAME_CONSOLE]: "gameConsole",
};

/**
 * Tell each screen when it comes on show and when it leaves: one at a time in the stack, all of
 * them at once in the columns.
 */
export function bindScreenLifecycle(shell: WindowShell, screens: Screens): void {
  let shown: ViewType | null = null;

  const screenOf = (view: ViewType | null) => (view ? screens[SCREEN_OF_VIEW[view] ?? "learn"] : null);

  shell.onActiveViewChanged((view) => {
    if (view === shown) return;
    screenOf(shown)?.onHide?.();
    screenOf(view)?.onShow?.();
    shown = view;
  });

  shell.onLayoutChanged(() => {
    if (!shell.isDesktopLayout()) return;
    shown = null;
    for (const screen of Object.values(screens)) screen.onShow?.();
  });
}

/**
 * Wraps the screens `main.window.blp` builds beside the window (`$Learn`, `$Editor`, `$Debugger`,
 * `$GameConsole`): as in GTK, the blueprint names the `@learn6502/ui` classes and the builder
 * constructs them, and the shell decides where they sit.
 */
export function createScreens(objects: ReadonlyMap<string, object>): Screens {
  const widget = <T>(id: keyof Screens): T => {
    const object = objects.get(id);
    if (!object) throw new Error(`main.window.blp built no '${id}' screen`);
    return object as T;
  };
  return {
    learn: buildLearnScreen(widget<Learn>("learn")),
    editor: buildEditorScreen(widget<Editor>("editor")),
    debugger: buildDebuggerScreen(widget<Debugger>("debugger")),
    gameConsole: buildGameConsoleScreen(widget<GameConsole>("gameConsole")),
  };
}
