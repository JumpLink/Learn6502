// GENERATED from accent-color-selector.blp — do not edit. ADR 0088 says what these exports mean.
// Regenerate with `gjsify blueprint types`; `scripts/check-blueprint-sidecars.mjs` holds it.

import type Adw from 'gi://Adw?version=1';
import type Gtk from 'gi://Gtk?version=4.0';

/** The GtkBuilder XML this `.blp` compiles to. */
declare const xml: string;
export default xml;

/** The class `template $AccentColorSelector` defines. */
export declare const GTypeName: 'AccentColorSelector';

/**
 * Every id inside the template, in source order — what `registerClass` is given.
 *
 * A MUTABLE tuple, and the `readonly` is missing for a reason that is not ours: `@girs`
 * declares `GObject.MetaInfo['InternalChildren']` as `string[]`, so a `readonly` tuple is
 * refused at the call site with TS4104 and the consumer would have to spread it — the
 * boilerplate ADR 0088 exists to remove. The tuple still pins the exact ids and arity,
 * which is the property that matters. `status/open-todos/blueprint.md` carries the
 * upstream half.
 */
export declare const InternalChildren: [
    'accents',
    'accent_blue',
    'accent_teal',
    'accent_green',
    'accent_yellow',
    'accent_orange',
    'accent_red',
    'accent_pink',
    'accent_purple',
    'accent_slate',
];

/** The `_`-prefixed members GJS installs for them. Merge it into the class interface. */
export interface Children {
    _accents: Adw.WrapBox;
    _accent_blue: Gtk.CheckButton;
    _accent_teal: Gtk.CheckButton;
    _accent_green: Gtk.CheckButton;
    _accent_yellow: Gtk.CheckButton;
    _accent_orange: Gtk.CheckButton;
    _accent_red: Gtk.CheckButton;
    _accent_pink: Gtk.CheckButton;
    _accent_purple: Gtk.CheckButton;
    _accent_slate: Gtk.CheckButton;
}
