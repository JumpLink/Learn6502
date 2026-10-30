// Enums copied from @girs/gtk-4.0.
//
// The three that reach a property value carry the GTK NICK, not the member's
// number. GtkBuilder resolves either, so the number worked as long as GNOME
// was the only reader; the NativeScript port takes the nick alone and refuses
// `halign="0"` outright, which is how the Android app booted to a blank screen
// once all three platforms started reading this one artifact. The nick is also
// what blueprint writes back out verbatim, so the round-trip in
// `ui-to-blueprint.ts` still compares like for like.
//
// `TextListType` and `CodeType` at the bottom are this generator's own: they
// are compared with `===` in the components and never reach a property.
//
// Const objects rather than `enum`, because `ui-to-blueprint.ts` reads the
// member lists to validate what it emits and `check.js` runs that file under
// bare Node, which strips types but cannot execute an `enum`.

/**
 * Used for justifying the text inside a [class`Label]` widget.
 */
export const Justification = {
  /** The text is placed at the left edge of the label. */
  LEFT: "left",
  /** The text is placed at the right edge of the label. */
  RIGHT: "right",
  /** The text is placed in the center of the label. */
  CENTER: "center",
  /** The text is placed is distributed across the label. */
  FILL: "fill",
} as const;

export type Justification = (typeof Justification)[keyof typeof Justification];

export const Orientation = {
  /** The element is in horizontal orientation. */
  HORIZONTAL: "horizontal",
  /** The element is in vertical orientation. */
  VERTICAL: "vertical",
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];

export const Align = {
  /**
   * stretch to fill all space if possible, center if
   *   no meaningful way to stretch
   */
  FILL: "fill",
  /** snap to left or top side, leaving space on right or bottom */
  START: "start",
  /** snap to right or bottom side, leaving space on left or top */
  END: "end",
  /** center natural width of widget inside the allocation */
  CENTER: "center",
  /** a different name for `GTK_ALIGN_BASELINE`. */
  BASELINE_FILL: "baseline-fill",
  /** align the widget according to the baseline. */
  BASELINE: "baseline",
  /** stretch to fill all space, but align the baseline. */
  BASELINE_CENTER: "baseline-center",
} as const;

export type Align = (typeof Align)[keyof typeof Align];

// Custom enums

export const TextListType = {
  ORDERED: 0,
  UNORDERED: 1,
} as const;

export type TextListType = (typeof TextListType)[keyof typeof TextListType];

export const CodeType = {
  INLINE: 0,
  BLOCK: 1,
} as const;

export type CodeType = (typeof CodeType)[keyof typeof CodeType];
