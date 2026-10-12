import { enhanceDialog } from "./dialog.ts";

/**
 * The ways to support the project, behind a dialog. The section only exists when the site
 * configures support links, so this element is often absent from the page.
 */
class AppSupport extends HTMLElement {
  connectedCallback(): void {
    const dialog = this.querySelector("dialog");
    if (!dialog) return;
    this.dataset.enhanced = "true";
    enhanceDialog(dialog, this.querySelector(".support-cta"));
  }
}

customElements.define("app-support", AppSupport);
