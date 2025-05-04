import { EventData, Page } from "@nativescript/core";
import { SourceView } from "../../widgets";

export class EditorController {
  private page: Page | null = null;
  private sourceView: SourceView | null = null;

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;
    this.sourceView = page.getViewById("SourceView") as SourceView;

    console.log("editor: onNavigatingTo", this.sourceView);
  }
}

const editorController = new EditorController();

export const onNavigatingTo =
  editorController.onNavigatingTo.bind(editorController);
