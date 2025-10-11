import { EventData, Page } from "@nativescript/core";
import { ListItem } from "../../widgets";

class Storybook {
  private page: Page | null = null;

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;

    console.log("storybook: onNavigatingTo", this.page);

    // Set up list item tap handlers
    this.setupListItemHandlers();
  }

  private setupListItemHandlers() {
    if (!this.page) return;

    // One-line list items
    const oneLineItem1 = this.page.getViewById("oneLineItem1") as ListItem;
    const oneLineItem2 = this.page.getViewById("oneLineItem2") as ListItem;
    const oneLineItem3 = this.page.getViewById("oneLineItem3") as ListItem;

    // Two-line list items
    const twoLineItem1 = this.page.getViewById("twoLineItem1") as ListItem;
    const twoLineItem2 = this.page.getViewById("twoLineItem2") as ListItem;
    const twoLineItem3 = this.page.getViewById("twoLineItem3") as ListItem;

    // Three-line list items
    const threeLineItem1 = this.page.getViewById("threeLineItem1") as ListItem;
    const threeLineItem2 = this.page.getViewById("threeLineItem2") as ListItem;

    // Interactive list items
    const selectableItem1 = this.page.getViewById(
      "selectableItem1"
    ) as ListItem;
    const selectableItem2 = this.page.getViewById(
      "selectableItem2"
    ) as ListItem;
    const selectableItem3 = this.page.getViewById(
      "selectableItem3"
    ) as ListItem;

    // Add tap handlers for all items
    const allItems = [
      oneLineItem1,
      oneLineItem2,
      oneLineItem3,
      twoLineItem1,
      twoLineItem2,
      twoLineItem3,
      threeLineItem1,
      threeLineItem2,
    ].filter((item) => item);

    allItems.forEach((item) => {
      if (item) {
        item.on(ListItem.tapEvent, () => {
          console.log(`List item tapped: ${item.headline}`);
        });
      }
    });

    // Add tap handlers for selectable items with toggle behavior
    const selectableItems = [
      selectableItem1,
      selectableItem2,
      selectableItem3,
    ].filter((item) => item);

    selectableItems.forEach((item) => {
      if (item) {
        item.on(ListItem.tapEvent, () => {
          item.selected = !item.selected;
          console.log(
            `List item tapped: ${item.headline}, selected: ${item.selected}`
          );
        });
      }
    });
  }
}

const storybookController = new Storybook();

export const onNavigatingTo =
  storybookController.onNavigatingTo.bind(storybookController);
