import { EventDispatcher } from "@learn6502/core";
import type { SourceViewEventMap, SourceViewWidget } from "@learn6502/common-ui";
import type { AdwSourceView } from "@gjsify/adwaita-web/source-view";

/**
 * SourceView — the web `SourceViewWidget` implemented over the CodeMirror-backed
 * `<adw-source-view>` custom element (`@gjsify/adwaita-web/source-view`).
 *
 * Web twin of app-gnome's `SourceView extends Adw.Bin` (a `GtkSource.View`) and
 * app-android's NativeScript source view: a 6502-highlighted editor that maps
 * onto the shared `SourceViewWidget` contract from `@learn6502/common-ui`
 * (`code` / `lineNumbers` / `editable` / `readonly` / `lineNumberStart` /
 * `selectable` / `copyable` / `copyButtonIcon` / `copyButtonTooltip`).
 *
 * The custom element already exposes that exact property surface (see
 * `adwaita-web/src/source-view/adw-source-view.ts`); this wrapper's only real
 * jobs are to (1) satisfy the `EventDispatcher`-based `SourceViewEventMap`
 * contract the controllers expect and (2) bridge the DOM `code-changed` /
 * `copy` CustomEvents the element emits to `events.dispatch("changed" | "copy")`
 * — the same seam GNOME's `SourceView` uses (`buffer.connect("changed", …)` /
 * copy-button click → `this.events.dispatch(…)`).
 *
 * @emits changed - when the user edits the buffer
 * @emits copy    - when the copy button is pressed
 */
export class SourceView extends HTMLElement implements SourceViewWidget {
  readonly events: EventDispatcher<SourceViewEventMap> = new EventDispatcher<SourceViewEventMap>();

  private editor: AdwSourceView | null = null;
  private built = false;

  // Persisted property state, applied to the element once it is built. Mirrors
  // the AdwSourceView field defaults so a value set before connect survives.
  private pendingCode = "";
  private pendingEditable = true;
  private pendingLanguage = "6502";
  private pendingLineNumbers = true;
  private pendingSelectable = true;
  private pendingCopyable = false;
  private pendingFillHeight = true;

  private readonly onCodeChanged = (event: Event): void => {
    const detail = (event as CustomEvent<{ code: string }>).detail;
    this.events.dispatch("changed", { code: detail?.code ?? this.code });
  };

  private readonly onCopy = (event: Event): void => {
    const detail = (event as CustomEvent<{ code: string }>).detail;
    this.events.dispatch("copy", { code: detail?.code ?? this.code });
  };

  connectedCallback(): void {
    this.ensureBuilt();
  }

  // --- SourceViewWidget interface ---

  get code(): string {
    return this.editor ? this.editor.code : this.pendingCode;
  }

  set code(value: string) {
    this.pendingCode = value ?? "";
    if (this.editor) this.editor.code = this.pendingCode;
  }

  get editable(): boolean {
    return this.editor ? this.editor.editable : this.pendingEditable;
  }

  set editable(value: boolean) {
    this.pendingEditable = !!value;
    if (this.editor) this.editor.editable = this.pendingEditable;
  }

  get readonly(): boolean {
    return !this.editable;
  }

  set readonly(value: boolean) {
    this.editable = !value;
  }

  get lineNumbers(): boolean {
    return this.editor ? this.editor.lineNumbers : this.pendingLineNumbers;
  }

  set lineNumbers(value: boolean) {
    this.pendingLineNumbers = !!value;
    if (this.editor) this.editor.lineNumbers = this.pendingLineNumbers;
  }

  get selectable(): boolean {
    return this.editor ? this.editor.selectable : this.pendingSelectable;
  }

  set selectable(value: boolean) {
    this.pendingSelectable = !!value;
    if (this.editor) this.editor.selectable = this.pendingSelectable;
  }

  get copyable(): boolean {
    return this.editor ? this.editor.copyable : this.pendingCopyable;
  }

  set copyable(value: boolean) {
    this.pendingCopyable = !!value;
    if (this.editor) this.editor.copyable = this.pendingCopyable;
  }

  /** The highlight language (`6502` enables the assembler mode). */
  get language(): string {
    return this.editor ? this.editor.language : this.pendingLanguage;
  }

  set language(value: string) {
    this.pendingLanguage = value ?? "";
    if (this.editor) this.editor.language = this.pendingLanguage;
  }

  /** Whether the editor fills its host's height (vs. sizing to its content). */
  get fillHeight(): boolean {
    return this.editor ? this.editor.fillHeight : this.pendingFillHeight;
  }

  set fillHeight(value: boolean) {
    this.pendingFillHeight = !!value;
    if (this.editor) this.editor.fillHeight = this.pendingFillHeight;
  }

  /** Move keyboard focus into the CodeMirror editor. */
  public focus(): boolean {
    this.editor?.view?.focus();
    return !!this.editor?.view?.hasFocus;
  }

  /** Build the `<adw-source-view>` once and wire its DOM events to the dispatcher. */
  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    const editor = document.createElement("adw-source-view") as AdwSourceView;
    editor.language = this.pendingLanguage;
    editor.editable = this.pendingEditable;
    editor.lineNumbers = this.pendingLineNumbers;
    editor.selectable = this.pendingSelectable;
    editor.copyable = this.pendingCopyable;
    editor.fillHeight = this.pendingFillHeight;
    editor.code = this.pendingCode;

    editor.addEventListener("code-changed", this.onCodeChanged);
    editor.addEventListener("copy", this.onCopy);

    this.editor = editor;
    this.replaceChildren(editor);
  }
}

customElements.define("learn-source-view", SourceView);
