import { registerTemplateClass } from "@gjsify/adwaita-web";
import quickHelpHtml from "@learn6502/learn/dist/quick-help.html";

/**
 * QuickHelp — the 6502 reference card shown in the Editor's help sheet.
 *
 * The web `$QuickHelpView` of the shared `@learn6502/ui` `editor.blp`, twin of app-gnome's
 * `QuickHelpView extends MdxView` (`quick-help.ui`): the generated `quick-help.html` fragment
 * from `@learn6502/learn`'s HTML render target (built from the SAME `quick-help.mdx` as the GTK
 * `.ui` XML and NativeScript XML). Unlike the tutorial, this fragment is pure reference prose
 * (memory map, colour palette, registers, addressing/opcodes) with no `<adw-source-view>` code
 * blocks, so there is nothing to upgrade or forward — the view only mounts the fragment.
 */
export class QuickHelp extends HTMLElement {
  private built = false;

  connectedCallback(): void {
    this.ensureBuilt();
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    // Trusted build output (the learn package's own MDX render target), not
    // user input.
    const content = document.createElement("div");
    content.innerHTML = quickHelpHtml;
    this.replaceChildren(content);
  }
}

customElements.define("learn-quick-help", QuickHelp);
registerTemplateClass("QuickHelpView", "learn-quick-help");
