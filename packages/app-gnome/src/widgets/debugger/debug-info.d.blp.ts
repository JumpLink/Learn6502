// GENERATED from debug-info.blp — do not edit. ADR 0088 says what these exports mean.
// Regenerate with `gjsify blueprint types`; `scripts/check-blueprint-sidecars.mjs` holds it.

import type Adw from 'gi://Adw?version=1';
import type Gtk from 'gi://Gtk?version=4.0';

/** The GtkBuilder XML this `.blp` compiles to. */
declare const xml: string;
export default xml;

/** The class `template $DebugInfo` defines. */
export declare const GTypeName: 'DebugInfo';

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
    'mainBox',
    'grpRegisters',
    'rowA',
    'valueBox',
    'aValue',
    'aValueDec',
    'rowX',
    'xValueBox',
    'xValue',
    'xValueDec',
    'rowY',
    'yValueBox',
    'yValue',
    'yValueDec',
    'rowSP',
    'spValueBox',
    'spValue',
    'spValueDec',
    'rowPC',
    'pcValueBox',
    'pcValue',
    'pcValueDec',
    'grpFlags',
    'rowStatus',
    'statusGrid',
    'nHdr',
    'vHdr',
    'dashHdr',
    'bHdr',
    'dHdr',
    'iHdr',
    'zHdr',
    'cHdr',
    'p7',
    'p6',
    'p5',
    'p4',
    'p3',
    'p2',
    'p1',
    'p0',
];

/** The `_`-prefixed members GJS installs for them. Merge it into the class interface. */
export interface Children {
    _mainBox: Gtk.Box;
    _grpRegisters: Adw.PreferencesGroup;
    _rowA: Adw.ActionRow;
    _valueBox: Gtk.Box;
    _aValue: Gtk.Label;
    _aValueDec: Gtk.Label;
    _rowX: Adw.ActionRow;
    _xValueBox: Gtk.Box;
    _xValue: Gtk.Label;
    _xValueDec: Gtk.Label;
    _rowY: Adw.ActionRow;
    _yValueBox: Gtk.Box;
    _yValue: Gtk.Label;
    _yValueDec: Gtk.Label;
    _rowSP: Adw.ActionRow;
    _spValueBox: Gtk.Box;
    _spValue: Gtk.Label;
    _spValueDec: Gtk.Label;
    _rowPC: Adw.ActionRow;
    _pcValueBox: Gtk.Box;
    _pcValue: Gtk.Label;
    _pcValueDec: Gtk.Label;
    _grpFlags: Adw.PreferencesGroup;
    _rowStatus: Adw.ActionRow;
    _statusGrid: Gtk.Grid;
    _nHdr: Gtk.Label;
    _vHdr: Gtk.Label;
    _dashHdr: Gtk.Label;
    _bHdr: Gtk.Label;
    _dHdr: Gtk.Label;
    _iHdr: Gtk.Label;
    _zHdr: Gtk.Label;
    _cHdr: Gtk.Label;
    _p7: Gtk.Label;
    _p6: Gtk.Label;
    _p5: Gtk.Label;
    _p4: Gtk.Label;
    _p3: Gtk.Label;
    _p2: Gtk.Label;
    _p1: Gtk.Label;
    _p0: Gtk.Label;
}
