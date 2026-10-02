// GENERATED from primary-color-selector.blp — do not edit. ADR 0088 says what these exports mean.
// Regenerate with `gjsify blueprint types`; `scripts/check-blueprint-sidecars.mjs` holds it.

import type Adw from 'gi://Adw?version=1';
import type Gtk from 'gi://Gtk?version=4.0';

/** The GtkBuilder XML this `.blp` compiles to. */
declare const xml: string;
export default xml;

/** The class `template $PrimaryColorSelector` defines. */
export declare const GTypeName: 'PrimaryColorSelector';

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
    'primary_blue',
    'primary_teal',
    'primary_green',
    'primary_yellow',
    'primary_orange',
    'primary_red',
    'primary_pink',
    'primary_purple',
    'primary_slate',
];

/** The `_`-prefixed members GJS installs for them. Merge it into the class interface. */
export interface Children {
    _accents: Adw.WrapBox;
    _primary_blue: Gtk.CheckButton;
    _primary_teal: Gtk.CheckButton;
    _primary_green: Gtk.CheckButton;
    _primary_yellow: Gtk.CheckButton;
    _primary_orange: Gtk.CheckButton;
    _primary_red: Gtk.CheckButton;
    _primary_pink: Gtk.CheckButton;
    _primary_purple: Gtk.CheckButton;
    _primary_slate: Gtk.CheckButton;
}
