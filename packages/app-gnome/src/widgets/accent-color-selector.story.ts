import GObject from "gi://GObject";

import { StoryWidget, type StoryMeta, type StoryModule } from "@gjsify/storybook";

import { AccentColorSelector } from "./accent-color-selector.ts";

/** Story for the Adwaita accent-colour picker. */
export class AccentColorSelectorStory extends StoryWidget {
  private _widget: AccentColorSelector | null = null;

  static {
    GObject.registerClass({ GTypeName: "AccentColorSelectorStory" }, AccentColorSelectorStory);
  }

  constructor() {
    super(StoryWidget.fromMeta(AccentColorSelectorStory.getMetadata(), "Default"));
  }

  static getMetadata(): StoryMeta {
    return {
      title: "Widgets/Accent Color Selector",
      description: "Picks the libadwaita accent colour applied across the app.",
      component: AccentColorSelector.$gtype,
    };
  }

  initialize(): void {
    this._widget = new AccentColorSelector();
    this.addContent(this._widget);
  }
}

GObject.type_ensure(AccentColorSelectorStory.$gtype);

export const AccentColorSelectorStories: StoryModule = { stories: [AccentColorSelectorStory] };
