import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { SourceView } from "../widgets/source-view.ts";
import type { SourceViewCopyEvent } from "@learn6502/common-ui";

/** RIGHT-TO-LEFT MARK (U+200F) — an invisible character with strong RTL directionality. */
const RLM = "\u200F";

/** FIRST STRONG ISOLATE (U+2068) — starts a bidi-isolated run whose direction is detected from its content. */
const FSI = "\u2068";

/** POP DIRECTIONAL ISOLATE (U+2069) — ends a bidi-isolated run. */
const PDI = "\u2069";

/**
 * Base class for rendering MDX content in GTK
 * Provides common functionality for handling source views and other MDX elements
 * This class is designed to be extended by concrete implementations with specific templates
 */
export class MdxView extends Adw.Bin {
  static {
    GObject.registerClass(
      {
        GTypeName: "MdxView",
        Signals: {
          copy: {
            param_types: [GObject.TYPE_STRING],
          },
        },
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);
    // Prevent direct instantiation of the base class
    if (this.constructor === MdxView) {
      throw new Error("MdxView is a base class and should not be instantiated directly");
    }
    if (this.get_direction() === Gtk.TextDirection.RTL) {
      this.applyRtlBaseDirection(this);
    }
  }

  protected setupSourceViews(sourceViewIds: string[]) {
    for (const id of sourceViewIds) {
      const sourceView = this.getSourceView(id);
      // TODO: Disconnect the signal when the source view is destroyed
      sourceView.events.on("copy", (event: SourceViewCopyEvent) => {
        this.emit("copy", event.code);
      });
    }
  }

  protected getSourceView(id: string): SourceView {
    const propertyName = `_${id}` as keyof this;
    if (propertyName in this) {
      return this[propertyName] as unknown as SourceView;
    }
    throw new Error(`SourceView with id ${id} not found`);
  }

  /**
   * Force the RTL base direction on all text labels of the rendered MDX content.
   *
   * Pango derives each paragraph's base direction from its first strong
   * directional character, so a translated paragraph that happens to start
   * with an LTR word (e.g. a mnemonic like "LDA") would flip to left-to-right
   * layout in RTL locales. Prepending an invisible RIGHT-TO-LEFT MARK gives
   * every paragraph an RTL first strong character instead.
   *
   * Inline code spans are additionally bidi-isolated so that neutral
   * punctuation next to them resolves against the RTL paragraph direction.
   *
   * @see https://github.com/JumpLink/Learn6502/issues/116
   */
  protected applyRtlBaseDirection(widget: Gtk.Widget): void {
    for (let child = widget.get_first_child(); child !== null; child = child.get_next_sibling()) {
      // Code blocks are intentionally kept in LTR layout
      if (child instanceof SourceView) {
        continue;
      }
      if (child instanceof Gtk.Label && child.label) {
        child.label = child.label
          .split("\n")
          .map((line) => (line.startsWith(RLM) ? line : RLM + line))
          .map((line) => this.isolateInlineCode(line))
          .join("\n");
      }
      this.applyRtlBaseDirection(child);
    }
  }

  /**
   * Wrap the content of inline code spans in bidi isolates.
   *
   * Without isolation, neutral characters (quotes, dots, colons) between an
   * LTR code span and an adjacent LTR word join them into one left-to-right
   * run, so the punctuation jumps to its LTR position inside RTL text — e.g.
   * in `<tt>BNE</tt>: "Branch on not equal"` the colon and the opening quote
   * stuck to the LTR run while the closing quote resolved right-to-left.
   * Isolating the span makes all surrounding punctuation resolve uniformly
   * against the RTL paragraph direction; the bidi algorithm still renders the
   * isolated code itself left-to-right.
   *
   * @see https://github.com/JumpLink/Learn6502/issues/117
   */
  private isolateInlineCode(markup: string): string {
    return markup.replace(/<tt>(?!\u2068)/g, `<tt>${FSI}`).replace(/(?<!\u2069)<\/tt>/g, `${PDI}</tt>`);
  }
}

GObject.type_ensure(MdxView.$gtype);
