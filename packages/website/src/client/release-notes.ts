/**
 * Long release notes are clamped to a few lines with a fade and a toggle. The clamp is added
 * here, not in the markup, so a reader without JavaScript gets the whole text instead of a
 * truncated one — and it is only added when there is actually something to hide.
 */
class ReleaseNotes extends HTMLElement {
  connectedCallback(): void {
    const body = this.querySelector<HTMLElement>(".release-body");
    const button = this.querySelector<HTMLButtonElement>(".release-more");
    if (!body || !button) return;
    this.dataset.enhanced = "true";

    const more = this.dataset.more ?? button.textContent ?? "";
    const less = this.dataset.less ?? more;

    body.classList.add("clamped");
    if (body.scrollHeight <= body.clientHeight) {
      body.classList.remove("clamped");
      return;
    }

    button.hidden = false;
    button.textContent = more;
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const clamped = body.classList.toggle("clamped");
      button.textContent = clamped ? more : less;
      button.setAttribute("aria-expanded", String(!clamped));
    });
  }
}

customElements.define("release-notes", ReleaseNotes);
