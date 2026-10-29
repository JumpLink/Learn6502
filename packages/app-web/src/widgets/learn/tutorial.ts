import { registerTemplateClass } from "@gjsify/adwaita-web";
import { learnController } from "@learn6502/ui";
import tutorialHtml from "@learn6502/learn/dist/tutorial.html";

/**
 * TutorialView — the step-by-step tutorial inside the Learn view.
 *
 * The web `$TutorialView` of the shared `@learn6502/ui` `learn.blp`, twin of app-gnome's
 * `TutorialView extends MdxView` (`tutorial.ui`): the generated `tutorial.html` fragment from
 * `@learn6502/learn`'s HTML render target, built from the SAME `tutorial.mdx` as the GTK `.ui` XML
 * and NativeScript XML. Its code blocks upgrade to `<adw-source-view>`; their copy buttons bubble
 * a `copy` CustomEvent up to here, which goes to the editor through `learnController`.
 */
export class TutorialView extends HTMLElement {
  private built = false;

  private readonly onCopy = (event: Event): void => {
    const detail = (event as CustomEvent<{ code: string }>).detail;
    if (!detail?.code) return;
    learnController.dispatch("copy", { code: detail.code });
  };

  connectedCallback(): void {
    this.ensureBuilt();
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    // Trusted build output (the learn package's own MDX render target), not user input.
    const content = document.createElement("div");
    content.innerHTML = tutorialHtml;
    this.replaceChildren(content);
    this.addEventListener("copy", this.onCopy);
  }
}

customElements.define("learn-tutorial", TutorialView);
registerTemplateClass("TutorialView", "learn-tutorial");
