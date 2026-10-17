import GObject from "gi://GObject";

import { StoryWidget, type StoryMeta, type StoryModule } from "@gjsify/storybook";

import { ThemeModeSelector } from "@learn6502/ui/preferences";

/** Story for the light / dark / follow-system theme switcher. */
export class ThemeModeSelectorStory extends StoryWidget {
  private _widget: ThemeModeSelector | null = null;

  static {
    GObject.registerClass({ GTypeName: "ThemeModeSelectorStory" }, ThemeModeSelectorStory);
  }

  constructor() {
    super(StoryWidget.fromMeta(ThemeModeSelectorStory.getMetadata(), "Default"));
  }

  static getMetadata(): StoryMeta {
    return {
      title: "Widgets/Theme Mode Selector",
      description: "Adwaita inline switcher for the light / dark / follow-system colour scheme.",
      component: ThemeModeSelector.$gtype,
    };
  }

  initialize(): void {
    this._widget = new ThemeModeSelector();
    this.addContent(this._widget);
  }
}

GObject.type_ensure(ThemeModeSelectorStory.$gtype);

export const ThemeModeSelectorStories: StoryModule = { stories: [ThemeModeSelectorStory] };
