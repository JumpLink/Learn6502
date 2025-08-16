import { MdxView } from "./mdx-view";

export class TutorialView extends MdxView {
  constructor() {
    super();
  }

  protected getViewName(): string {
    return "tutorial";
  }
}
