import { enhanceDialog } from "./dialog.ts";

/** The copy button is hidden in the markup: without JavaScript the IBAN is plain selectable text. */
function enhanceCopy(button: HTMLButtonElement): void {
  const label = button.querySelector("span");
  const text = label?.textContent ?? "";
  if (!navigator.clipboard) return;
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy ?? "");
    } catch {
      return;
    }
    if (label) label.textContent = button.dataset.done ?? text;
    setTimeout(() => {
      if (label) label.textContent = text;
    }, 2000);
  });
}

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
    for (const button of this.querySelectorAll<HTMLButtonElement>(".sepa-copy")) enhanceCopy(button);
  }
}

customElements.define("app-support", AppSupport);
