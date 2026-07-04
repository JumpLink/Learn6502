import { AdwClamp } from "@gjsify/adwaita-web";
import quickHelpHtml from "@learn6502/learn/dist/quick-help.html";

/**
 * QuickHelp — the 6502 reference card shown in the Editor's help sheet.
 *
 * Web twin of app-gnome's `QuickHelpView extends MdxView` (`quick-help.ui`) and
 * the help window's content: the generated `quick-help.html` fragment from
 * `@learn6502/learn`'s HTML render target (built from the SAME `quick-help.mdx`
 * as the GTK `.ui` XML and NativeScript XML). Unlike the tutorial, this fragment
 * is pure reference prose (memory map, colour palette, registers,
 * addressing/opcodes) with no `<adw-source-view>` code blocks, so there is
 * nothing to upgrade or forward — the view only mounts the fragment in a clamp.
 */
export class QuickHelp extends HTMLElement {
  private built = false;

  connectedCallback(): void {
    this.ensureBuilt();
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    const clamp = new AdwClamp();
    clamp.setAttribute("maximum-size", "600");
    // Trusted build output (the learn package's own MDX render target), not
    // user input.
    clamp.innerHTML = quickHelpHtml;
    this.replaceChildren(clamp);
  }
}

customElements.define("learn-quick-help", QuickHelp);
