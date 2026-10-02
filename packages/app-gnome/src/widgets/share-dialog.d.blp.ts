// GENERATED from share-dialog.blp — do not edit. ADR 0088 says what these exports mean.
// Regenerate with `gjsify blueprint types`; `scripts/check-blueprint-sidecars.mjs` holds it.

import type Adw from 'gi://Adw?version=1';
import type GObject from 'gi://GObject?version=2.0';
import type Gtk from 'gi://Gtk?version=4.0';

/** The GtkBuilder XML this `.blp` compiles to. */
declare const xml: string;
export default xml;

/** The class `template $ShareDialog` defines. */
export declare const GTypeName: 'ShareDialog';

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
    'backButton',
    'carousel',
    'formBox',
    'titleEntry',
    'authorEntry',
    'descriptionEntry',
    'sourceUrlEntry',
    'nextButton',
    'previewBox',
    'examplePreview',
    'submitButton',
    'completionPage',
    'copyToClipboardButton',
    'closeButton',
];

/** The `_`-prefixed members GJS installs for them. Merge it into the class interface. */
export interface Children {
    _backButton: Gtk.Button;
    _carousel: Adw.Carousel;
    _formBox: Gtk.Box;
    _titleEntry: Adw.EntryRow;
    _authorEntry: Adw.EntryRow;
    _descriptionEntry: Adw.EntryRow;
    _sourceUrlEntry: Adw.EntryRow;
    _nextButton: Gtk.Button;
    _previewBox: Gtk.Box;
    _examplePreview: GObject.Object;
    _submitButton: Gtk.Button;
    _completionPage: Adw.StatusPage;
    _copyToClipboardButton: Gtk.Button;
    _closeButton: Gtk.Button;
}
