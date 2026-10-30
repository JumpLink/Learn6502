import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import { SourceView } from "../source-view.ts";
import type { SourceViewCopyEvent } from "../types/index.ts";

/** RIGHT-TO-LEFT MARK (U+200F) — an invisible character with strong RTL directionality. */
const RLM = "\u200F";

/** FIRST STRONG ISOLATE (U+2068) — starts a bidi-isolated run whose direction is detected from its content. */
const FSI = "\u2068";

/** POP DIRECTIONAL ISOLATE (U+2069) — ends a bidi-isolated run. */
const PDI = "\u2069";

/** How many top-level sections stay visible through {@link MdxView.deferBelowFold} — a phone screenful. */
const EAGER_SECTIONS = 4;

/** Sections revealed per tick, and the gap between ticks: one frame at 60 Hz. */
const REVEAL_BATCH = 16;
const REVEAL_INTERVAL_MS = 16;

/**
 * The signals this widget registers, on top of Adw.Bin's.
 *
 * @girs 5.0.0 keys `connect`, `connect_after` and `emit` to a per-class
 * `SignalSignatures` map. A subclass that registers its own signals is not in
 * its parent's map, so `connect("…")` is rejected by name and the callback's
 * parameters degrade to implicit `any` — two errors from one cause.
 *
 * Declaration merging rather than overriding the inherited methods: it ADDS
 * overloads beside the ones Adw.Bin already has, so both the inherited
 * signals and these resolve, and nothing needs an `any` escape hatch.
 */
export namespace MdxView {
  export interface SignalSignatures extends Adw.Bin.SignalSignatures {
    copy: (code: string) => void;
  }
}

export interface MdxView {
  $signals: MdxView.SignalSignatures;
  connect<K extends keyof MdxView.SignalSignatures>(
    signal: K,
    callback: GObject.SignalCallback<this, MdxView.SignalSignatures[K]>
  ): number;
  connect_after<K extends keyof MdxView.SignalSignatures>(
    signal: K,
    callback: GObject.SignalCallback<this, MdxView.SignalSignatures[K]>
  ): number;
  emit<K extends keyof MdxView.SignalSignatures>(
    signal: K,
    ...args: GObject.GjsParameters<MdxView.SignalSignatures[K]>
  ): void;
}

/**
 * Base class of the views generated from MDX — one per document, each a `.blp` template that
 * `@learn6502/learn` writes from the same `.mdx` the other platforms read.
 *
 * It is the whole of what the three platforms used to hold separately: GNOME found its source
 * views by regex over the template XML and listed all ~350 of them as `InternalChildren`,
 * NativeScript loaded a generated NativeScript XML through `Builder.load`, and the web mounted a
 * generated HTML fragment. None of that survives the move to a shared template, and the reason
 * is the renderer: under `--gi-renderer` a `?template` import is an opaque projected tree, not a
 * string, so there is nothing to run a regex over. So the source views are found by WALKING the
 * built widget tree, which `get_first_child` / `get_next_sibling` answer on all three.
 *
 * @emits copy - A code block's copy button was pressed, with the code
 */
export class MdxView extends Adw.Bin {
  /** Whether {@link wire} has seen a built tree; its walk is a no-op from then on. */
  private wired = false;

  /** What {@link deferBelowFold} hid, in document order, until {@link revealDeferred} runs. */
  private deferred: Gtk.Widget[] = [];

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

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
    if (this.constructor === MdxView) {
      throw new Error("MdxView is a base class and should not be instantiated directly");
    }
    // The tree is there by now on GTK and on NativeScript, where a template builds INTO its
    // host. The web attaches the built children at the first `connectedCallback` instead, so
    // the walk finds nothing yet and `map` is where it runs — see {@link wire}.
    this.wire();
    this.connect("map", () => {
      this.wire();
      this.revealDeferred();
    });
  }

  /**
   * Hides every section below the first screenful, for {@link revealDeferred} to bring back once
   * the view is on screen.
   *
   * CALLED BY THE HOST, between constructing the view and attaching it, because that is the only
   * point at which all three platforms have a tree AND have not laid it out yet: a template
   * builds inside the constructor on GTK, right after it returns on NativeScript, and only at the
   * first `connectedCallback` on the web. Where the tree is not there yet this finds no children
   * and does nothing, which is the web — whose layout engine does not need the help.
   *
   * WHY IT PAYS: a hidden widget is not measured, and measuring is what the first visit spends
   * its time on. The tutorial is 195 widgets in one vertical box, of which four fit a phone
   * screen; the other 163 only have to exist by the time the reader scrolls to them. Nothing
   * about the visible result changes — the sections come back in document order, below the fold,
   * so no pixel the reader is looking at moves.
   */
  deferBelowFold(keep = EAGER_SECTIONS): void {
    const content = this.get_first_child();
    if (content === null) return;
    let index = 0;
    for (let section = content.get_first_child(); section !== null; section = section.get_next_sibling()) {
      // Only what this hid may be revealed again: a section the document itself hides is not ours
      if (index++ >= keep && section.visible) {
        section.visible = false;
        this.deferred.push(section);
      }
    }
  }

  /**
   * Reveals what {@link deferBelowFold} hid, a batch per frame, starting after the current one.
   *
   * In batches rather than all at once because each reveal costs the layout of those sections,
   * and one pass over 163 of them is the very freeze the deferral exists to avoid — spreading it
   * keeps the frames the reader scrolls through within budget.
   */
  private revealDeferred(): void {
    if (this.deferred.length === 0) return;
    const sections = this.deferred;
    this.deferred = [];
    let next = 0;
    const step = (): void => {
      for (let n = 0; n < REVEAL_BATCH && next < sections.length; n++, next++) sections[next].visible = true;
      if (next < sections.length) setTimeout(step, REVEAL_INTERVAL_MS);
    };
    setTimeout(step, REVEAL_INTERVAL_MS);
  }

  /**
   * Wires the built tree, once: every code block's copy button is re-emitted as this view's
   * `copy`, and in an RTL locale every paragraph gets an RTL base direction.
   *
   * Called from the constructor and from `map` because the three platforms attach a template's
   * children at different points of the lifecycle, and only the walk itself can tell whether
   * they are there: a view with no children has not been built, and a `map` without a prior
   * build is the web. `map` emits nothing on connect on any of the three (GTK's behaviour, which
   * both bridges reproduce), so the second call happens when the view goes on screen.
   */
  protected wire(): void {
    if (this.wired) return;
    const rtl = this.get_direction() === Gtk.TextDirection.RTL;
    let found = false;
    for (const child of descendants(this)) {
      found = true;
      if (child instanceof SourceView) {
        // TODO: Disconnect the signal when the source view is destroyed
        child.events.on("copy", (event: SourceViewCopyEvent) => this.emit("copy", event.code));
      } else if (rtl && child instanceof Gtk.Label && child.label) {
        child.label = applyRtlBaseDirection(child.label);
      }
    }
    this.wired = found;
  }
}

/**
 * Every widget under `root`, depth-first, except what a code block holds.
 *
 * A `SourceView` is yielded and not descended into: its internals are a `GtkSourceView`'s, not
 * rendered MDX, and the RTL pass below must not reach the code.
 */
function* descendants(root: Gtk.Widget): Generator<Gtk.Widget> {
  for (let child = root.get_first_child(); child !== null; child = child.get_next_sibling()) {
    yield child;
    if (!(child instanceof SourceView)) yield* descendants(child);
  }
}

/**
 * Forces the RTL base direction on one label of the rendered MDX content.
 *
 * Pango derives each paragraph's base direction from its first strong directional character, so a
 * translated paragraph that happens to start with an LTR word (e.g. a mnemonic like "LDA") would
 * flip to left-to-right layout in RTL locales. Prepending an invisible RIGHT-TO-LEFT MARK gives
 * every paragraph an RTL first strong character instead.
 *
 * Inline code spans are additionally bidi-isolated so that neutral punctuation next to them
 * resolves against the RTL paragraph direction. Without isolation, neutral characters (quotes,
 * dots, colons) between an LTR code span and an adjacent LTR word join them into one
 * left-to-right run, so the punctuation jumps to its LTR position inside RTL text — e.g. in
 * `<tt>BNE</tt>: "Branch on not equal"` the colon and the opening quote stuck to the LTR run
 * while the closing quote resolved right-to-left. Isolating the span makes all surrounding
 * punctuation resolve uniformly against the RTL paragraph direction; the bidi algorithm still
 * renders the isolated code itself left-to-right.
 *
 * Both halves are idempotent — the mark is only prepended to a line that has none, the isolates
 * only added inside a `<tt>` that has none — because the walk that calls this may run twice.
 *
 * @see https://github.com/JumpLink/Learn6502/issues/116
 * @see https://github.com/JumpLink/Learn6502/issues/117
 */
function applyRtlBaseDirection(markup: string): string {
  return markup
    .split("\n")
    .map((line) => (line.startsWith(RLM) ? line : RLM + line))
    .map((line) => line.replace(/<tt>(?!\u2068)/g, `<tt>${FSI}`).replace(/(?<!\u2069)<\/tt>/g, `${PDI}</tt>`))
    .join("\n");
}

GObject.type_ensure(MdxView.$gtype);
