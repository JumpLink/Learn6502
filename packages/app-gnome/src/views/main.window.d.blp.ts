// GENERATED from main.window.blp — do not edit. ADR 0088 says what these exports mean.
// Regenerate with `gjsify blueprint types`; `scripts/check-blueprint-sidecars.mjs` holds it.

import type Adw from 'gi://Adw?version=1';
import type GObject from 'gi://GObject?version=2.0';
import type Gtk from 'gi://Gtk?version=4.0';

/** The GtkBuilder XML this `.blp` compiles to. */
declare const xml: string;
export default xml;

/** The class `template $MainWindow` defines. */
export declare const GTypeName: 'MainWindow';

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
    'mainOverlay',
    'toastOverlay',
    'layoutHost',
    'singlePage',
    'singleContainer',
    'stack',
    'threePage',
    'threeColumnContainer',
    'threeColumns',
    'leftSidebar',
    'leftColumn',
    'centerRight',
    'centerOverlay',
    'centerColumn',
    'runToolbar',
    'rightColumn',
    'rightColumnContent',
    'rightTopBox',
    'rightBottomBox',
    'mainButton',
    'headerBar',
    'titleLabel',
    'sidebarToggleButton',
    'learnBackButton',
    'unsavedChangesIndicator',
    'menuButton',
    'switcherBar',
];

/** The `_`-prefixed members GJS installs for them. Merge it into the class interface. */
export interface Children {
    _mainOverlay: Gtk.Overlay;
    _toastOverlay: Adw.ToastOverlay;
    _layoutHost: Gtk.Stack;
    _singlePage: Gtk.StackPage;
    _singleContainer: Adw.Bin;
    _stack: Adw.ViewStack;
    _threePage: Gtk.StackPage;
    _threeColumnContainer: Adw.Bin;
    _threeColumns: Gtk.Box;
    _leftSidebar: Adw.OverlaySplitView;
    _leftColumn: Gtk.Box;
    _centerRight: Gtk.Box;
    _centerOverlay: Gtk.Overlay;
    _centerColumn: Gtk.Box;
    _runToolbar: GObject.Object;
    _rightColumn: Gtk.ScrolledWindow;
    _rightColumnContent: Gtk.Box;
    _rightTopBox: Gtk.Box;
    _rightBottomBox: Gtk.Box;
    _mainButton: GObject.Object;
    _headerBar: Adw.HeaderBar;
    _titleLabel: Gtk.Label;
    _sidebarToggleButton: Gtk.ToggleButton;
    _learnBackButton: Gtk.Button;
    _unsavedChangesIndicator: Gtk.Button;
    _menuButton: GObject.Object;
    _switcherBar: Adw.ViewSwitcherBar;
}
