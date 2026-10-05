import type { View } from "@nativescript/core";

/**
 * Widen an Adwaita NativeScript widget to `View`.
 *
 * fixed upstream in gjsify: `@gjsify/adwaita-nativescript`'s widgets redeclare a
 * member `@nativescript/core`'s `View` already owns, which makes them structurally
 * non-assignable to `View` even though they extend `GridLayout`. Which member has
 * changed with every bump, so the reason is restated per release rather than
 * assumed:
 *
 * - **0.52.0** — `AdwBottomSheet` declares `modal` as a `boolean` (it is the real
 *   `AdwBottomSheet:modal`, added in this release), while `ViewCommon.modal` is a
 *   `View` — NativeScript's modal-navigation accessor. Two members, one name, two
 *   types: not assignable (TS2322). The two defects 0.51.1 carried are GONE at
 *   0.52.0 — `AdwClamp`/`split-view-base` no longer redeclare the `private`
 *   `_measuredWidth` `ViewCommon` owns, and `AdwNavigationView` no longer narrows
 *   the inherited `public` `Observable._emit`.
 *
 * Type-only in every case: the runtime objects ARE NativeScript views. Delete this
 * helper and its call sites once adwaita-nativescript ships the fix.
 */
export const asView = (widget: object): View => widget as unknown as View;
