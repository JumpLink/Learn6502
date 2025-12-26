import { EventData, Page } from "@nativescript/core";
import { ListItem, Switch } from "../../widgets";

/**
 * Storybook view controller for demonstrating Material Design 3 components
 */
class Storybook {
  private page: Page | null = null;

  /**
   * Called when navigating to the storybook page
   * @param args - Navigation event data
   */
  public onNavigatingTo(args: EventData): void {
    const page = args.object as Page;
    this.page = page;

    console.log("storybook: onNavigatingTo", this.page);

    // Set up list item tap handlers
    this.setupListItemHandlers();
  }

  /**
   * Sets up tap handlers for all list items in the storybook
   */
  private setupListItemHandlers(): void {
    if (!this.page) return;

    // Define all list item IDs
    const standardItemIds = [
      "oneLineItem1",
      "oneLineItem2",
      "oneLineItem3",
      "twoLineItem1",
      "twoLineItem2",
      "twoLineItem3",
      "threeLineItem1",
      "threeLineItem2",
    ];

    const selectableItemIds = [
      "selectableItem1",
      "selectableItem2",
      "selectableItem3",
    ];

    // Set up handlers for standard items (non-selectable)
    this.setupStandardItemHandlers(standardItemIds);

    // Set up handlers for selectable items (with toggle behavior)
    this.setupSelectableItemHandlers(selectableItemIds);

    // Set up handlers for switches
    this.setupSwitchHandlers();
  }

  /**
   * Sets up tap handlers for standard (non-selectable) list items
   * @param itemIds - Array of list item IDs
   */
  private setupStandardItemHandlers(itemIds: string[]): void {
    if (!this.page) return;

    itemIds.forEach((id) => {
      const item = this.page.getViewById<ListItem>(id);
      if (item) {
        item.on(ListItem.tapEvent, () => {
          console.log(`List item tapped: ${item.headline}`);
        });
      } else {
        console.warn(`Storybook: List item not found with id: ${id}`);
      }
    });
  }

  /**
   * Sets up tap handlers for selectable list items with toggle behavior
   * @param itemIds - Array of selectable list item IDs
   */
  private setupSelectableItemHandlers(itemIds: string[]): void {
    if (!this.page) return;

    itemIds.forEach((id) => {
      const item = this.page.getViewById<ListItem>(id);
      if (item) {
        item.on(ListItem.tapEvent, () => {
          item.selected = !item.selected;
          console.log(
            `List item tapped: ${item.headline}, selected: ${item.selected}`
          );
        });
      } else {
        console.warn(
          `Storybook: Selectable list item not found with id: ${id}`
        );
      }
    });
  }

  /**
   * Sets up event handlers for all switches in the storybook
   */
  private setupSwitchHandlers(): void {
    if (!this.page) return;

    // Define all standalone switch IDs
    const switchIds = [
      "switch1",
      "switch2",
      "switch3",
      "switchTertiary",
      "switchError",
      "switchInteractive",
    ];

    // Set up handlers for all standalone switches
    switchIds.forEach((id) => {
      const switchView = this.page.getViewById<Switch>(id);
      if (switchView) {
        switchView.on(
          Switch.checkedChangeEvent,
          (args: EventData & { value: boolean }) => {
            console.log(`Switch ${id} changed: ${args.value}`);
          }
        );
      } else {
        console.warn(`Storybook: Switch not found with id: ${id}`);
      }
    });

    // Set up handlers for ListItems with trailing switches
    this.setupListItemSwitchHandlers();
  }

  /**
   * Sets up event handlers for ListItems with trailing switches
   */
  private setupListItemSwitchHandlers(): void {
    if (!this.page) return;

    // Define all list item IDs that have trailing switches
    const listItemSwitchIds = [
      "switchListItem",
      "darkModeListItem",
      "autoUpdateListItem",
    ];

    // Set up handlers for ListItems with trailing switches
    listItemSwitchIds.forEach((id) => {
      const listItem = this.page.getViewById<ListItem>(id);
      if (listItem) {
        // Handle tap on list item (toggles the switch)
        listItem.on(ListItem.tapEvent, () => {
          listItem.trailingSwitchChecked = !listItem.trailingSwitchChecked;
          console.log(
            `ListItem ${listItem.headline} tapped, switch: ${listItem.trailingSwitchChecked}`
          );
        });

        // Handle switch change directly
        listItem.on(
          ListItem.switchChangeEvent,
          (args: EventData & { value: boolean }) => {
            console.log(
              `ListItem ${listItem.headline} switch changed: ${args.value}`
            );
          }
        );
      } else {
        console.warn(
          `Storybook: ListItem with switch not found with id: ${id}`
        );
      }
    });
  }
}

const storybookController = new Storybook();

export const onNavigatingTo =
  storybookController.onNavigatingTo.bind(storybookController);
