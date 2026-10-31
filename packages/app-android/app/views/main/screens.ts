import type { Debugger, GameConsole, Learn, Editor } from "@learn6502/ui";
import { buildEditorScreen, type ScreenModule } from "./editor";
import { buildLearnScreen } from "./learn";
import { buildDebuggerScreen } from "./debugger";
import { buildGameConsoleScreen } from "./game-console";
import { sibling } from "./parts";

/** The four screens, by the id `main.window.blp` gives the object that stands for each. */
export interface Screens {
  learn: ScreenModule<Learn>;
  editor: ScreenModule<Editor>;
  debugger: ScreenModule<Debugger>;
  gameConsole: ScreenModule<GameConsole>;
}

/**
 * Wraps the four widgets `main.window.blp` builds beside the window (`$Learn`, `$Editor`,
 * `$Debugger`, `$GameConsole`) in their Android screens. The blueprint owns their construction,
 * exactly as it does on GNOME, where the window reaches the same four as InternalChildren: the
 * `.blp` only declares them as objects beside the window, and the shell decides where they sit.
 */
export function createScreens(siblings: ReadonlyMap<string, object>): Screens {
  return {
    learn: buildLearnScreen(sibling<Learn>(siblings, "learn")),
    editor: buildEditorScreen(sibling<Editor>(siblings, "editor")),
    debugger: buildDebuggerScreen(sibling<Debugger>(siblings, "debugger")),
    gameConsole: buildGameConsoleScreen(sibling<GameConsole>(siblings, "gameConsole")),
  };
}
