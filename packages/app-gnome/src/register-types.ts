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
import "./widgets/source-view.ts";
import "./widgets/main-button.ts";
import "./widgets/menu-button.ts";
import "./widgets/toolbar.ts";
import "./widgets/accent-color-selector.ts";
import "./widgets/primary-color-selector.ts";
import "./widgets/theme-mode-selector.ts";
import "./widgets/examples-list.ts";
import "./widgets/example-list-item.ts";
import "./widgets/share-dialog.ts";

// Game console widgets
import "./widgets/game-console/display.ts";
import "./widgets/game-console/gamepad.ts";

// Debugger widgets
import "./widgets/debugger/debug-info.ts";
import "./widgets/debugger/disassembled.ts";
import "./widgets/debugger/hexdump.ts";
import "./widgets/debugger/hex-monitor.ts";
import "./widgets/debugger/message-console.ts";

// MDX-driven widgets
import "./mdx/mdx-view.ts";
import "./mdx/quick-help-view.ts";
import "./mdx/tutorial-view.ts";

// Composite views and dialogs
import "./views/main/game-console.ts";
import "./views/main/debugger.ts";
import "./views/main/editor.ts";
import "./views/main/learn.ts";
import "./views/main.window.ts";
import "./views/help.window.ts";
import "./views/preferences.dialog.ts";
