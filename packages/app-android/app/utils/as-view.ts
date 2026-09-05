import type { View } from "@nativescript/core";

/**
 * Widen an Adwaita NativeScript widget to `View`.
 *
 * fixed upstream in gjsify: two `@gjsify/adwaita-nativescript` widgets redeclare a
 * member `@nativescript/core`'s `View` already owns, which makes them structurally
 * non-assignable to `View` even though they extend `GridLayout`:
 *   - `AdwClamp` (and `split-view-base`) declare `_measuredWidth`, which
 *     `ViewCommon` already declares `private` — two separate private declarations
 *     of one name are never assignable to each other (TS2322/TS2345).
 *   - `AdwNavigationView` declares `_emit` `private`, narrowing the `public`
 *     `Observable._emit` it inherits.
 *
 * Both are type-only: the runtime objects ARE NativeScript views. Delete this
 * helper and its call sites once adwaita-nativescript ships the fix.
 */
export const asView = (widget: object): View => widget as unknown as View;
