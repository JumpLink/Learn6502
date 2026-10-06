import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { buildEditorScreen, type ScreenModule } from "./editor";
import { buildLearnScreen } from "./learn";
import { buildDebuggerScreen } from "./debugger";
import { buildGameConsoleScreen } from "./game-console";

/** The four screens, by the id `main.window.blp` gives the object that stands for each. */
export interface Screens {
  learn: ScreenModule;
  editor: ScreenModule;
  debugger: ScreenModule;
  gameConsole: ScreenModule;
}

/**
 * Builds the screens and registers the classes `main.window.blp` names for them (`$Learn`,
 * `$Editor`, `$Debugger`, `$GameConsole`). Each class is the screen's own view: the blueprint
 * only declares them as objects beside the window, and the shell decides where they sit.
 */
export function createScreens(): Screens {
  const screens: Screens = {
    learn: buildLearnScreen(),
    editor: buildEditorScreen(),
    debugger: buildDebuggerScreen(),
    gameConsole: buildGameConsoleScreen(),
  };
  current = screens;
  return screens;
}

let current: Screens | null = null;

// Registered once, because a class cannot be registered twice and the activity (and with it the
// screens) is recreated on a configuration change: each class hands out the CURRENT screen's view.
const SCREEN_CLASSES: Record<string, keyof Screens> = {
  Learn: "learn",
  Editor: "editor",
  Debugger: "debugger",
  GameConsole: "gameConsole",
};
for (const [name, id] of Object.entries(SCREEN_CLASSES)) {
  registerTemplateClass(
    name,
    class {
      constructor() {
        return current![id].view;
      }
    }
  );
}
