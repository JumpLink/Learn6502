/**
 * The dialogs are rendered as open panels so they work without JavaScript. Enhancing one means
 * turning it back into a `<dialog>`: the anchor that pointed at it opens it modally, its close
 * button appears, and a click on the backdrop dismisses it. Escape and focus restoration are the
 * element's own doing.
 */
export function enhanceDialog(dialog: HTMLDialogElement, trigger: Element | null): void {
  const close = dialog.querySelector<HTMLButtonElement>(".dialog-close");
  if (close) {
    close.hidden = false;
    close.addEventListener("click", () => dialog.close());
  }
  trigger?.addEventListener("click", (event) => {
    event.preventDefault();
    dialog.showModal();
  });
  // A click reported on the dialog itself landed on the backdrop: the content sits in children.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
