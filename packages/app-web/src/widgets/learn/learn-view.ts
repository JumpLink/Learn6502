import { Adw } from "@gjsify/adwaita-web";
import type { LearnView } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui";
import tutorialHtml from "@learn6502/learn/dist/tutorial.html";

import { ExamplesList } from "./examples-list.js";

/** Learn6502 project repository — the "share your example" destination. */
const SHARE_URL = "https://github.com/JumpLink/Learn6502";

/**
 * AdwLearnView — the `LearnView` from `@learn6502/common-ui` implemented over
 * `@gjsify/adwaita-web`, the web twin of app-gnome's `Learn extends Adw.Bin`
 * (`learn.blp`) and app-android's `Learn`.
 *
 * Structure mirrors `learn.blp`: an `Adw.NavigationView` with a landing page
 * (a boxed list of "Tutorial" and "Examples" rows) that pushes to either the
 * Tutorial page (the generated `@learn6502/learn` HTML with `<adw-source-view>`
 * upgrades) or the Examples page (`ExamplesList` + a share prompt). The shell's
 * header back button drives `navigateBack()`; a `subpage-changed` event lets it
 * show/hide that button as the visible page changes (mirroring the GNOME twin's
 * `hasVisibleSubpage` property + `navigation.push`/`navigation.pop`).
 *
 * All copy actions (tutorial code blocks, example cards) route through
 * `learnController.dispatch("copy", …)` — the same seam the GNOME/Android twins
 * use to load code into the editor.
 */
export class AdwLearnView extends HTMLElement implements LearnView {
  private built = false;
  private lastScrollPosition = 0;
  private navigationView: Adw.NavigationView | null = null;
  private tutorialScroller: HTMLDivElement | null = null;

  /** A tutorial code block's copy button bubbles a `copy` CustomEvent up here. */
  private readonly onTutorialCopy = (event: Event): void => {
    const detail = (event as CustomEvent<{ code: string }>).detail;
    if (!detail?.code) return;
    learnController.dispatch("copy", { code: detail.code });
  };

  connectedCallback(): void {
    this.ensureBuilt();
  }

  // --- LearnView interface (scroll applies to the Tutorial page) ---

  public saveScrollPosition(): void {
    if (this.tutorialScroller) this.lastScrollPosition = this.tutorialScroller.scrollTop;
  }

  public restoreScrollPosition(): void {
    if (this.tutorialScroller && this.lastScrollPosition > 0) {
      this.tutorialScroller.scrollTop = this.lastScrollPosition;
    }
  }

  // --- Navigation surface for the shell (mirrors the GNOME twin) ---

  /** Whether a subpage (Tutorial/Examples) is open — drives the back button. */
  public get hasVisibleSubpage(): boolean {
    const tag = this.navigationView?.visiblePageTag ?? null;
    return tag !== null && tag !== "main";
  }

  /** Pop back to the landing page (the shell's header back button). */
  public navigateBack(): void {
    this.navigationView?.pop();
  }

  // --- DOM construction ---

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    const nav = new Adw.NavigationView();
    nav.append(this.buildLandingPage(nav), this.buildTutorialPage(), this.buildExamplesPage());
    nav.addEventListener("notify::visible-page", () => {
      this.dispatchEvent(
        new CustomEvent("subpage-changed", { bubbles: true, detail: { hasSubpage: this.hasVisibleSubpage } })
      );
    });

    this.navigationView = nav;
    this.replaceChildren(nav);
  }

  /** Landing page: a boxed list with Tutorial + Examples rows (learn.blp). */
  private buildLandingPage(nav: Adw.NavigationView): Adw.NavigationPage {
    const page = new Adw.NavigationPage();
    page.setAttribute("title", "Learn");
    page.setAttribute("tag", "main");

    const group = new Adw.PreferencesGroup();
    group.appendChild(this.buildNavRow("Tutorial", "Step-by-step guide to 6502 assembly", () => nav.push("tutorial")));
    group.appendChild(this.buildNavRow("Examples", "Try out example programs", () => nav.push("examples")));

    const column = document.createElement("div");
    column.className = "learn-landing";
    column.appendChild(group);

    page.appendChild(this.pageScroller(column));
    return page;
  }

  private buildNavRow(title: string, subtitle: string, onActivate: () => void): Adw.ActionRow {
    const row = new Adw.ActionRow();
    row.setAttribute("title", title);
    row.setAttribute("subtitle", subtitle);
    row.setAttribute("activatable", "");
    // Declare the chevron as a suffix slot child — Adw.ActionRow consumes
    // `slot="suffix"` children at connect time (its `suffixSection` is not
    // available before then).
    const chevron = document.createElement("span");
    chevron.className = "learn-row-chevron";
    chevron.textContent = "›";
    chevron.setAttribute("slot", "suffix");
    row.appendChild(chevron);
    row.addEventListener("activated", onActivate);
    return row;
  }

  /** Tutorial page: the generated tutorial HTML in a clamp, scrollable. */
  private buildTutorialPage(): Adw.NavigationPage {
    const page = new Adw.NavigationPage();
    page.setAttribute("title", "Tutorial");
    page.setAttribute("tag", "tutorial");

    const clamp = new Adw.Clamp();
    clamp.setAttribute("maximum-size", "600");
    // Trusted build output (the learn package's own MDX render target).
    clamp.innerHTML = tutorialHtml;

    const scroller = this.pageScroller(clamp);
    // A tutorial code block's copy button bubbles a `copy` CustomEvent here.
    scroller.addEventListener("copy", this.onTutorialCopy);
    this.tutorialScroller = scroller;
    page.appendChild(scroller);
    return page;
  }

  /** Examples page: the examples list + a "share your example" prompt. */
  private buildExamplesPage(): Adw.NavigationPage {
    const page = new Adw.NavigationPage();
    page.setAttribute("title", "Examples");
    page.setAttribute("tag", "examples");

    const list = new ExamplesList();
    list.events.on("copy", ({ code }) => learnController.dispatch("copy", { code }));

    const share = document.createElement("div");
    share.className = "learn-share";
    const prompt = document.createElement("p");
    prompt.className = "body";
    prompt.textContent = "Got a cool 6502 example? Share it with the community!";
    const shareLink = document.createElement("a");
    shareLink.className = "learn-share-button";
    shareLink.textContent = "Share Your Example";
    shareLink.href = SHARE_URL;
    shareLink.target = "_blank";
    shareLink.rel = "noopener noreferrer";
    share.append(prompt, shareLink);

    const column = document.createElement("div");
    column.className = "learn-examples";
    column.append(list, share);

    const clamp = new Adw.Clamp();
    clamp.setAttribute("maximum-size", "600");
    clamp.appendChild(column);

    page.appendChild(this.pageScroller(clamp));
    return page;
  }

  /** A vertically-scrolling container that fills the navigation page. */
  private pageScroller(child: HTMLElement): HTMLDivElement {
    const scroller = document.createElement("div");
    scroller.className = "learn-page-scroller";
    scroller.appendChild(child);
    return scroller;
  }
}

customElements.define("learn-view", AdwLearnView);
