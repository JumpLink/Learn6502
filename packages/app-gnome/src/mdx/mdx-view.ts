import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { SourceView } from "../widgets/source-view.ts";
import type { SourceViewCopyEvent } from "@learn6502/common-ui";

/** RIGHT-TO-LEFT MARK (U+200F) — an invisible character with strong RTL directionality. */
const RLM = "\u200F";

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
          .join("\n");
      }
      this.applyRtlBaseDirection(child);
    }
  }
}

GObject.type_ensure(MdxView.$gtype);
