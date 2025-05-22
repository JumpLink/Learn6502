import { EventData } from "@nativescript/core";

import { Page } from "@nativescript/core";

class Storybook {
  private page: Page | null = null;

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;

    console.log("storybook: onNavigatingTo", this.page);
  }
}

const storybookController = new Storybook();

export const onNavigatingTo =
  storybookController.onNavigatingTo.bind(storybookController);
