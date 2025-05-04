import { EventData } from "@nativescript/core";

import { Page } from "@nativescript/core";

class GameConsoleController {
  private page: Page | null = null;

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;

    console.log("game-console: onNavigatingTo", this.page);
  }
}

const gameConsoleController = new GameConsoleController();

export const onNavigatingTo = gameConsoleController.onNavigatingTo.bind(
  gameConsoleController
);
