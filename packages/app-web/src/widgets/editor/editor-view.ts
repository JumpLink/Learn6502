import { AdwBottomSheet, AdwBottomSheetContent, AdwBottomSheetSheet, AdwButton } from "@gjsify/adwaita-web";
import { EventDispatcher } from "@learn6502/core";
import type {
  EditorChangedEvent,
  EditorEventMap,
  EditorHelpVisibilityChangedEvent,
  EditorView,
} from "@learn6502/common-ui";
import { editorController } from "@learn6502/common-ui";

import { QuickHelp } from "./quick-help.js";
import { SourceView } from "./source-view.js";

/**
 * AdwEditorView — the `EditorView` from `@learn6502/common-ui` implemented over
 * `@gjsify/adwaita-web`, the web twin of app-gnome's `Editor extends Adw.Bin`
 * (`editor.blp`) and app-android's `Editor` NativeScript view.
 *
 * Structure mirrors `editor.blp`: an `Adw.BottomSheet` whose persistent content
 * is the 6502 `SourceView` (CodeMirror) and whose slide-up sheet is the
 * `QuickHelp` reference card, with a "Help" bar button to reveal it. As on GNOME
 * and Android, ALL logic lives in the shared `editorController` — this class
 * only builds widgets, wires them to the controller, and bridges the help-sheet
 * open state to `editorController.helpVisible`.
 *
 * @emits changed - when the editor content is updated (forwarded from the controller)
 */
export class AdwEditorView extends HTMLElement implements EditorView {
  readonly events: EventDispatcher<EditorEventMap> = new EventDispatcher<EditorEventMap>();

  private readonly sourceView = new SourceView();
  private readonly quickHelp = new QuickHelp();
  private readonly bottomSheet = new AdwBottomSheet();
  private readonly helpButton = new AdwButton();

  private built = false;
  private initialized = false;
  // Guards the two-way help-sheet ⇄ controller sync from feedback loops.
  private syncingHelp = false;

  private readonly onControllerChanged = (event: EditorChangedEvent): void => {
    this.events.dispatch("changed", event);
  };

  private readonly onHelpVisibilityChanged = (event: EditorHelpVisibilityChangedEvent): void => {
    if (this.syncingHelp) return;
    this.syncingHelp = true;
    this.bottomSheet.open = event.visible;
    this.syncingHelp = false;
  };

  connectedCallback(): void {
    this.ensureBuilt();
  }

  // --- EditorView interface (delegates to editorController, like the twins) ---

  get code(): string {
    return editorController.code;
  }

  set code(value: string) {
    this.setCode(value);
  }

  public setCode(value: string): void {
    editorController.setCode(value);
  }

  get hasCode(): boolean {
    return editorController.hasCode;
  }

  public addContent(content: string): void {
    editorController.addContent(content);
  }

  public clear(): void {
    editorController.clear();
  }

  public focus(): boolean {
    this.ensureBuilt();
    return this.sourceView.focus();
  }

  /** Persist the current buffer to the controller (before navigation/close). */
  public saveState(): void {
    editorController.saveState();
  }

  // --- DOM construction ---

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    // Persistent content: the source editor filling the pane, with a "Help"
    // bar pinned below it (the web stand-in for editor.blp's bottom-bar Label).
    // AdwBottomSheet re-homes the CHILDREN of <adw-bottom-sheet-content> into
    // its own container, so wrap the column in a single element that survives
    // that move intact.
    this.sourceView.classList.add("editor-source-view");

    const helpBar = document.createElement("div");
    helpBar.className = "editor-help-bar";
    this.helpButton.setAttribute("label", "Help");
    this.helpButton.setAttribute("flat", "");
    this.helpButton.addEventListener("click", () => {
      editorController.setHelpVisible(!editorController.helpVisible);
    });
    helpBar.appendChild(this.helpButton);

    const contentColumn = document.createElement("div");
    contentColumn.className = "editor-content";
    contentColumn.append(this.sourceView, helpBar);

    const content = new AdwBottomSheetContent();
    content.appendChild(contentColumn);

    // Slide-up sheet: the scrollable quick-help reference card.
    const sheet = new AdwBottomSheetSheet();
    const scroller = document.createElement("div");
    scroller.className = "editor-help-scroller";
    scroller.appendChild(this.quickHelp);
    sheet.appendChild(scroller);

    this.bottomSheet.append(content, sheet);
    // A user dismissal (drag handle / dimming / Esc) flips `open` — mirror it
    // back onto the shared controller so the help state stays single-sourced.
    this.bottomSheet.addEventListener("notify::open", (event) => {
      if (this.syncingHelp) return;
      const open = (event as CustomEvent<{ open: boolean }>).detail.open;
      this.syncingHelp = true;
      editorController.setHelpVisible(open);
      this.syncingHelp = false;
    });

    this.replaceChildren(this.bottomSheet);

    this.initializeWithController();
  }

  private initializeWithController(): void {
    if (this.initialized) return;
    this.initialized = true;

    editorController.init(this.sourceView);
    editorController.events.on("changed", this.onControllerChanged);
    editorController.events.on("helpVisibilityChanged", this.onHelpVisibilityChanged);

    // Seed the sheet from the controller's persisted help state.
    this.bottomSheet.open = editorController.helpVisible;
  }
}

customElements.define("learn-editor", AdwEditorView);
