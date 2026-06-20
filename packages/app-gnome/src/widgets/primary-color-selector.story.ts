import GObject from "gi://GObject";

import { StoryWidget, type StoryMeta, type StoryModule } from "@gjsify/storybook";

import { PrimaryColorSelector } from "./primary-color-selector.ts";

/** Story for the primary-colour picker. */
export class PrimaryColorSelectorStory extends StoryWidget {
  private _widget: PrimaryColorSelector | null = null;

  static {
    GObject.registerClass({ GTypeName: "PrimaryColorSelectorStory" }, PrimaryColorSelectorStory);
  }

  constructor() {
    super(StoryWidget.fromMeta(PrimaryColorSelectorStory.getMetadata(), "Default"));
  }

  static getMetadata(): StoryMeta {
    return {
      title: "Widgets/Primary Color Selector",
      description: "Picks the primary colour used by the emulator display palette.",
      component: PrimaryColorSelector.$gtype,
    };
  }

  initialize(): void {
    this._widget = new PrimaryColorSelector();
    this.addContent(this._widget);
  }
}

GObject.type_ensure(PrimaryColorSelectorStory.$gtype);

export const PrimaryColorSelectorStories: StoryModule = { stories: [PrimaryColorSelectorStory] };
