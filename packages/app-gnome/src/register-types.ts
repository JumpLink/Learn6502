// GObject type registration barrel.
//
// Blueprint templates reference custom widgets by their `GTypeName` (e.g.
// `$TutorialView`, `$QuickHelpView`, `$SourceView`). A custom type must already
// be registered with the GObject type system *before* any template that embeds
// it is instantiated, otherwise GTK aborts with
// `Invalid object type '<Name>'`.
//
// Each widget module self-registers via its static `GObject.registerClass(...)`
// block (and a trailing `GObject.type_ensure(...)`), but that code only runs if
// the module is actually evaluated. Several consumer modules import their child
// widgets with `import type { ... }`, which the bundler strips entirely — so the
// child modules were never pulled into the bundle and never registered.
//
// Importing every self-registering module here for its side effects, before the
// `Application` is constructed (see `main.ts`), guarantees all GTypes exist by
// the time the first window template is built. When adding a new template
// widget, add a side-effect import for it here.

// Leaf widgets
// Shared widgets (@learn6502/ui): SourceView, Hexdump, Disassembled, HexMonitor, DebugInfo, MessageConsole, Gamepad, Display, GameConsole, Debugger, Editor, Learn, ExamplesList, ExampleListItem, MainButton, Toolbar, ShareDialog,
// ThemeModeSelector, PrimaryColorSelector, AccentColorSelector, PreferencesDialog, MdxView, TutorialView, QuickHelpView
import "@learn6502/ui";

// Composite views and dialogs
