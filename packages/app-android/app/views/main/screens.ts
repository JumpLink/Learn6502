import type { Debugger, GameConsole, Learn, Editor } from "@learn6502/ui";
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
