import GObject from "gi://GObject";

import { StoryWidget, type StoryMeta, type StoryModule } from "@gjsify/storybook";

import { MenuButton } from "./menu-button.ts";

/** Story for the app's primary menu button (hamburger). */
export class MenuButtonStory extends StoryWidget {
  private _widget: MenuButton | null = null;

  static {
    GObject.registerClass({ GTypeName: "MenuButtonStory" }, MenuButtonStory);
  }

  constructor() {
    super(StoryWidget.fromMeta(MenuButtonStory.getMetadata(), "Default"));
  }

  static getMetadata(): StoryMeta {
    return {
      title: "Widgets/Menu Button",
      description: "The header-bar menu button (primary menu trigger).",
      component: MenuButton.$gtype,
    };
  }

  initialize(): void {
    this._widget = new MenuButton();
    this.addContent(this._widget);
  }
}

GObject.type_ensure(MenuButtonStory.$gtype);

export const MenuButtonStories: StoryModule = { stories: [MenuButtonStory] };
