# AGENTS.md

Prefer retrieval-led reasoning over pre-training-led reasoning when referencing docs or APIs below.

## Project

Monorepo managed with `gjsify install` (`gjsify-lock.json`) — 6502 assembly learning environment with GNOME, Web, and Android apps. (The Flatpak build still vendors deps via the committed Yarn Berry cache pending its own gjsify migration.)
Principles: maximize code reuse via `common-ui`/`6502` packages; keep platform code in `app-*` packages; refactor freely across packages when it improves architecture.

`gjsify link <checkout>` develops this repo against a local gjsify instead of the pinned
`@gjsify/*` releases; it changes nothing tracked (the override is a git-excluded
`.gjsify-link.json`). While it is active, `gjsify install --immutable` — CI and the offline
Flatpak build — **aborts by design**; run `gjsify unlink` first. How-to in
[README.md](README.md#developing-against-a-local-gjsify-checkout).

## Packages

| Package               | Path                              | Purpose                                                         | Stack                                               |
| --------------------- | --------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| 6502 (core)           | `packages/core/`                  | Platform-independent assembler, simulator, disassembler         | TypeScript, zero deps, no UI                        |
| common-ui             | `packages/common-ui/`             | Shared UI logic, controllers, interfaces — 4-layer architecture | TypeScript, no platform deps                        |
| app-gnome             | `packages/app-gnome/`             | GNOME desktop app                                               | TypeScript, GJS, GTK 4, Adwaita, Vite, Meson        |
| app-web               | `packages/app-web/`               | Web app                                                         | TypeScript, HTML, CSS, Vite, `@gjsify/adwaita-web`  |
| app-android           | `packages/app-android/`           | Android app                                                     | TypeScript, NativeScript, Gradle, `@gjsify/adwaita-nativescript` |
| learn                 | `packages/learn/`                 | MDX tutorial content → platform-specific output                 | MDX, esbuild                                        |
| examples              | `packages/examples/`              | 6502 assembly code examples                                     | TypeScript                                          |
| translations          | `packages/translations/`          | i18n via gettext `.po` files                                    | gettext, `.po`/`.mo`                                |
| cli                   | `packages/cli/`                   | Headless assembler / simulator command-line frontend            | TypeScript, Node                                    |

## Package scripts

A `build` or `check` script should stay a **chain** rather than a lone `gjsify …` command.

The reason was a real defect. On the CLI this repo used to pin (0.16.3, `runScript`): a script
body that tokenized as a single plain `gjsify …` command was dispatched in-process and the
wrapper then exited with `process.exitCode ?? 0` — and `gjsify build`/`gjsify run` reported
failure without setting it, so the script exited 0 while its work had failed and every caller
above it saw green. That is how `gjsify workspace @learn6502/translations check` once reported
"All translations passed" over catalogs it had just emptied (issue #180), and it is why `learn`,
`translations` and `examples` have no `:gen`/`:run` sub-scripts.

**Fixed upstream in gjsify 0.23.0** — the in-process path now tracks the failure in a local
variable instead of reading a `process.exitCode` its commands never set. Re-measured on the
pinned 0.48.0: a script whose whole body is `gjsify run <throwing bundle>` exits **1**, and
`gjsify workspace @learn6502/app-web build:app` (a single-command script) propagated a failing
bundle as exit 1. The residual hole is narrower but not zero — a dispatched command that
neither throws nor sets `process.exitCode` still yields 0 — so keep the chains: they cost
nothing and they do not depend on the fix holding.

**A `gjsify workspace <name> <script>` entry point has to establish its own precondition.**
Root `build:android` ran `ns build android` directly: without `@learn6502/core` built first that
failed loudly (a real session had to run `gjsify workspace @learn6502/core build` by hand to get
an APK at all), but `app-android` never declared `@learn6502/learn` as a dependency — even though
`learn`'s `build` script copies its generated `tutorial.ns.xml`/`quick-help.ns.xml` straight into
`app-android/app/mdx/`. That relationship is a file copy across a workspace boundary, not an
import, so it is invisible to both module resolution and `--with-dependencies`. The APK still
built successfully with an empty `app/mdx/` and only crashed on-device opening the tutorial
(`Builder.load` finding nothing). `build:android`/`start:android` now declare `@learn6502/learn`
as a real dependency and pass `--with-dependencies` (`-t`/`-d`), which walks a target's declared
`dependencies` and runs each one's `build` script first — including a plain `^x.y.z` range, not
only the `workspace:` protocol (fixed upstream in gjsify, see `packages/app-gnome/meson.build`
for the now-stale workaround it predates). A new entry point is safe from a clean checkout only
when it either fails loudly on a missing precondition (`start:gnome`/`start:web` do — they run an
already-built bundle, or resolve imports through a bundler that errors hard on a missing module)
or establishes it via `--with-dependencies` backed by a real dependency edge for every workspace
it needs — including one it only reaches through a copied file. `check-workspace-scripts.js`
cannot check this mechanically: it would have to know whether a given script fails loud or ships
silently, which is a design decision, not something to guess.

## Releases

A tag produces artifacts. Until 0.7.0 it produced none — Flathub was the only way
to get the app, which leaves out Windows, macOS, every non-Flatpak Linux and
anyone archiving a copy (issue #93). `.github/workflows/release.yml` builds the
`.deb`, the `.rpm`, a macOS `.app` (arm64 + x86_64), a Windows program directory
and `.msi`, the browser build and the Flatpak bundle, and attaches them to the
GitHub release.

Everything but the Flatpak comes from `gjsify ship`, configured in the **root**
`package.json#gjsify.ship`. Not in app-gnome: `ship` takes its metadata from
`gjsify.flatpak`, which lives in the root, and one manifest means the AppStream
data has one home rather than two that drift.

**Two bundles, one source.** Linux runs `--app gjs`. macOS and Windows have no
GJS host at all, so they run `--app node` through `@gjsify/node-gi`.
`gjsify workspace @learn6502/app-gnome build:ship` builds both, into `dist/gjs/`
and `dist/node/`. The ordinary `build` is untouched — it stays the fast path for
development and is what Meson calls.

**Data is found beside the bundle, not at a baked prefix.** Meson and Flatpak
install to a prefix known before the bundle is written, so `__PKGDATADIR__` is
right there. A `.app` is dragged anywhere and a Windows directory is unzipped
anywhere, so it is wrong there by construction. `src/install-paths.ts` looks next
to the bundle first — via `__gjsifyBundleUrl`, which every gjsify bundle sets on
its first line — and falls back to the baked prefix. `ship` stages the whole
directory the bundle lives in into `lib/<binaryName>/` and maps that per layout,
so one relative step answers on all three. **Anything the app loads at run time
belongs in that directory**, declared through `gjsify.ship.extraFiles`.

**The macOS and Windows runtimes are os/cpu-gated.** A plain `gjsify install` on
a Linux runner skips them, and `ship` then stages a bundle with no interpreter
and no GTK — it says so loudly and still exits 0. `gjsify install --os darwin
--cpu arm64` (and the win32 pair) installs them; `gjsify install` skips its prune
step whenever a target is typed, so the Linux prebuilds the CLI itself runs on
survive.

**One version, eleven places.** `gjsify run check:versions` holds the root
manifest, the nine package manifests and the AppStream release list to a single
value, and CI runs it on every push. Changesets' `fixed: [["@learn6502/*"]]` does
not match the private root package and the release list is written by hand, so
without it a tag can label a `.deb` from a tree that says something else.

## TypeScript

Applies to all `.ts`/`.tsx` files.

- Code and comments always in English
- NEVER use `as any` or `any` types
- Class member order: static props → instance props → constructor → static methods → instance methods
- Within each category: public → protected → private

## Commits

- No unprompted commits — always ask permission first
- Validate before commit: `gjsify format` (writes — `--write` defaults to true since
  gjsify 0.29.0; `--no-write` reports drift) → `gjsify format --check` → `gjsify build`
- `gjsify check` (full type check) only after larger changes — very slow
- Atomic, self-contained commits; working code only
- Format: `<type>[scope]: <description>` — imperative mood, ≤50 char subject
- Platform prefixes: `Android:` | `Web:` | `Gnome:` | `Common:` | `Core:` | `Learn:` | `Translations:`
- Check `git log --oneline -10` to match existing patterns before committing

## common-ui — Four-Layer Component Architecture

Applies to TypeScript files in `packages/common-ui/src/`.
No platform-specific or UI-framework-specific dependencies allowed — pure TypeScript only.

### Layers

| Layer      | File pattern      | Purpose                            | Rules                                                                 |
| ---------- | ----------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Service    | `*-service.ts`    | Business logic, state calculations | Singleton export, no UI deps, pure functions preferred                |
| Controller | `*-controller.ts` | Coordination, event dispatching    | **NEVER implements View interfaces**, delegates ALL logic to services |
| Interface  | `*.ts`            | UI contracts for platform widgets  | Only UI-specific method signatures, no implementation                 |
| Event Map  | `*-event-map.ts`  | Event type definitions             | Type-only                                                             |

### Pattern

```typescript
// Service — business logic
export class ComponentStateService {
  calculateState(data: Input): Output {
    /* pure logic */
  }
}
export const componentStateService = new ComponentStateService();

// Controller — coordination only
export class ComponentController {
  readonly events = new EventDispatcher<ComponentEventMap>();
  update(data: Input) {
    const result = componentStateService.calculateState(data);
    this.events.dispatch("updated", result);
  }
}
export const componentController = new ComponentController();

// Interface — UI contract
export interface ComponentView {
  update(data: Output): void;
}
```

### Anti-patterns

- `class Controller implements ViewInterface` — NEVER
- Business logic in controllers
- UI deps in services
- Mixed responsibilities in any layer

### Reference components

| Component   | Service(s)                                                       | Controller                    | Interface         |
| ----------- | ---------------------------------------------------------------- | ----------------------------- | ----------------- |
| Debugger    | `debugger-state-service.ts`                                      | `debugger-controller.ts`      | `debugger.ts`     |
| GameConsole | `game-console-state-service.ts`, `game-console-input-service.ts` | `game-console-controller.ts`  | `game-console.ts` |
| Learn       | `learn-state-service.ts`                                         | `learn-controller.ts`         | `learn.ts`        |
| Editor      | —                                                                | `editor-controller.ts`        | `editor.ts`       |
| MainButton  | `main-button-state-service.ts`                                   | `main-ui-state-controller.ts` | —                 |

## GNOME — app-gnome

Applies to all files in `packages/app-gnome/`. Blueprint rules apply to all `.blp` files.

Native GNOME desktop app — deep integration, GNOME HIG adherence.
Stack: TypeScript + GJS + GTK 4 + Adwaita + Vite + Meson.
Events: prefer `event-dispatcher.ts` from `packages/core/` over raw GNOME signals.

### Adwaita styling references

- [CSS Variables](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/css-variables.html) | [Style Classes](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/style-classes.html) | [Styles & Appearance](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/styles-and-appearance.html)
- [Breakpoints](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/class.Breakpoint.html) | [StyleManager](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/class.StyleManager.html) | [Migration](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/migrating-to-breakpoints.html)
- Keep Adwaita usage up-to-date — check https://nyaa.place/blog/ for updates

### GTK4 + GObject rules

**Design:** Declarative UI (Blueprint) + reactive state (GObject properties/signals).
**Rendering:** GSK snapshot API; GPU paths first.
**Lifecycle:** Map/Unmap/Unroot for hooks; keep Dispose tiny.

**Do:**

- `vfunc_snapshot()` for rendering; `Gdk.Texture`/`Gdk.Paintable`; `clip+translate` for sprites
- `append_scaled_texture()` (GTK ≥ 4.10) with `Gsk.ScalingFilter`
- State as **Properties**; events as **Signals**; bind via Blueprint
- Connects in `vfunc_map()`; disconnect in `vfunc_unmap()` (+ `vfunc_unroot()` for globals)
- Always call `super.vfunc_*()` when overriding

**Don't:**

- No Cairo/`Gtk.DrawingArea` for perf work (fallback only)
- Don't mutate `Gdk.Texture` (immutable)
- Don't call `destroy()` or use `::destroy`
- No JS work in `dispose/finalize`
- Don't collide with core vfunc names (`get_flags`, `dispose`, `constructed`) — rename helpers (e.g. `get_flags()` → `computeFlags()`)

### Lifecycle

| Hook              | Action                                           |
| ----------------- | ------------------------------------------------ |
| `vfunc_map()`     | Start timers, connect signals, subscribe models  |
| `vfunc_unmap()`   | Stop timers, disconnect everything from map      |
| `vfunc_unroot()`  | Drop global/external refs (bus, singletons)      |
| `vfunc_dispose()` | Only break external refs — no UI, signals, async |

```typescript
private _ids: number[] = [];
vfunc_map() { super.vfunc_map(); if (!this._ids.length) this._ids.push(this._ok.connect('clicked', () => this.emit('done'))); }
vfunc_unmap() { for (const id of this._ids) this._ok.disconnect(id); this._ids = []; super.vfunc_unmap(); }
vfunc_dispose() { /* external = null */ super.vfunc_dispose(); }
```

### GC/VFunc safety — "JS callback during GC" fix

- Don't implement core vfuncs in JS unless trivial & safe (safe set: `vfunc_snapshot`, `vfunc_map/unmap`, `vfunc_unroot`)
- Rename helpers matching vfunc names: `get_flags()` → `computeFlags()`
- Disconnect/stop everything in `unmap` (+ `unroot` for globals)
- No `emit()`, I/O, or async in `dispose/finalize`

### Properties & Signals

```typescript
Properties: {
  value: GObject.ParamSpec.int('value','Value','', GObject.ParamFlags.READWRITE, 0, 100, 0),
},
Signals: { 'done': {} }
```

### Blueprint templates

[Blueprint docs](https://gnome.pages.gitlab.gnome.org/blueprint-compiler/)

Declarative UI in `.blp`; logic in TypeScript. Bindings over hardcoded state.
Namespaces first: `using Gtk 4.0; using Adw 1;`. Template names start with `$`.

```blp
using Gtk 4.0; using Adw 1;
template $MyWidget : Gtk.Box {
  Label title { label: bind template.title; hexpand: true; xalign: 0; }
}
```

**Binding:** `bind template.prop` for display; `bind template.prop bidirectional` for inputs. Prefer bind over constants; compute `visible`, `sensitive`, `label` inline.

**Signals:** Connect in `.blp` (`clicked => $_onSave();`), implement in class. Consistent `_onXxx` naming.

**Actions/menus:** Prefer `GAction`/`action-name` over manual `clicked`. Use `MenuButton.menu-model` for menus declaratively.

**Layout:** Shallow hierarchies; spacing/margins over nested boxes; `hexpand/halign/valign` intentionally.

**Accessibility:** Meaningful labels/`accessible-name` for interactives; preserve keyboard nav; tooltips only for non-obvious controls.

**Registration:**

```typescript
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Template from "./my-widget.blp";
export class MyWidget extends Gtk.Box {
  static {
    GObject.registerClass(
      {
        GTypeName: "MyWidget",
        Template,
        InternalChildren: ["title", "save"],
        Properties: {
          title: GObject.ParamSpec.string(
            "title",
            "Title",
            "",
            GObject.ParamFlags.READWRITE,
            ""
          ),
        },
      },
      this
    );
  }
  declare _title: Gtk.Label;
  declare _save: Gtk.Button;
}
```

### Micro-patterns

```blp
Button { action-name: "app.save"; action-target: bind template.doc_id; }
Entry { text: bind template.title bidirectional; }
```

```typescript
s.append_scaled_texture(
  tex,
  Graphene.Rect.zero(),
  new Graphene.Rect({ x: 0, y: 0, width: w, height: h }),
  Gsk.ScalingFilter.NEAREST
);
```

### Checklist

- Properties/signals defined; UI bound in Blueprint
- Map/unmap lifecycle clean; no lingering handlers
- Snapshot-only custom drawing; zero-copy sprites
- No vfunc name collisions; no JS in `dispose/finalize`
- Adwaita widgets/styles; shallow hierarchies
- Bindings > hardcoded values; actions > ad-hoc handlers
- Only expose `InternalChildren` you must access in code

## Android — app-android

Applies to all files in `packages/app-android/`.

Stack: TypeScript + NativeScript (no Angular/Vue). UI: custom TS components wrapping native Android widgets, Material Design 3.
Events: `packages/core/event-dispatcher.ts`. Build: NativeScript + Gradle.

### Reference projects

Git submodules in `references/nativescript/`:
`alpimaps` (offline maps) | `conty` (interactive stories) | `oss-weather` (Svelte+TS, MD patterns) | `ui-material-components` (MD2/MD3 wrappers) | `nativescript` (framework core) | `nativescript-app-utils` (helpers) | `systemui` (status/nav bar)

### NativeScript internals

Read `references/nativescript/nativescript/` for framework internals. Key areas:

- Core utils (`packages/core/utils/`): threading, serialization, Android resources, system UI, layout, path/URI, async (debounce/throttle)
- UI components (`packages/core/ui/`): native view wrapping
- Platform files (`.android.ts`): integration patterns

Utils: `import { Utils } from "@nativescript/core"` — threading, native helpers, Android resources, system UI, input, layout, path/URI, async. Full API in `references/nativescript/nativescript/packages/core/utils/index.d.ts`.

### Missing Android/Material types

When `@nativescript/types-android` lacks types (esp. MD3 components):

1. Search `references/nativescript/ui-material-components/src/typings/mdc.android.d.ts` (~22k lines)
2. Extract needed declarations → `app/typings/material.android.d.ts`
3. Ensure `references.d.ts` includes `/// <reference path="app/typings/material.android.d.ts" />`

### Native API whitelist — CRITICAL

Any direct Android SDK/AndroidX/Material API usage (`new android.*`, `androidx.*`, `com.google.android.material.*`) **MUST** be added to `packages/app-android/data/Android/native-api-usage.json`.

Format: `"package:Class"` — e.g. `"android.view:View"`, `"com.google.android.material.button:MaterialButton"`
Inner classes: `"package:Outer.Inner"` — e.g. `"android.view:View.OnClickListener"`
Static fields: `"package:Class.Field"` — e.g. `"android.view:View.VISIBLE"`

Required for R8/ProGuard code shrinking. Missing entries cause **runtime crashes in release builds**. Add immediately when introducing new native API usage.

### Architecture

- Services: `app/services/` (lifecycle, theme, notification)
- State: reactive with `EventDispatcher` from `@learn6502/core`
- Views: implement interfaces from `@learn6502/common-ui`
- Widgets: `app/widgets/` wrapping native Android widgets
- Utils: `app/utils/` (system, navigation, logger, resources)
- Activity: `app/android/activity.android.ts` extending `AppCompatActivity`

### Common patterns

- Scoped logger: `logger.scoped("ComponentName")`
- Sequential service init in `app.ts`
- Global error handler: `global.__errorHandler`
- Edge-to-edge display with window insets
- Theme service for system appearance changes
- Lifecycle service for app state transitions

## Web — app-web

Applies to all files in `packages/app-web/`.

Web app version. An Adwaita single-page app on `@gjsify/adwaita-web`, sharing the
`common-ui` controllers + `core` with app-gnome (the four views are the web twins
of the GNOME views). Production build = `gjsify build --app browser` (→ `dist-app/`,
deployed to GitHub Pages); dev = Vite + HMR (`vite.app.config.ts`). The classic
skilldrick Jekyll tutorial was removed in the app-web rewrite.
Focus: browser compatibility, responsive design, leverage `core` + `common-ui`.

## Learn — tutorial content

Applies to `packages/learn/` (`tutorial.mdx`, `quick-help.mdx`, `tsx/`).

One MDX source, three artifacts, three consumers: `dist/*.ui` (app-gnome, via `Gtk.Builder`),
`dist/*.ns.xml` (app-android) and `dist/*.html` (app-web) — plus `packages/translations`, which
extracts the tutorial's translatable strings from `dist/*.ui`.

**HTML entities are not markup here.** `Gtk.Label` renders an empty string when its markup fails
to parse, and Pango knows only `&amp; &lt; &gt; &quot; &apos;` plus numeric references. Write the
character itself — `–`, `×`, a real non-breaking space — never `&ndash;`, `&times;` or `&nbsp;`:
those cost the reader the entire paragraph, silently.

**Validate:** `gjsify workspace @learn6502/learn check` (rebuilds `dist/`, then checks XML
well-formedness, the element vocabulary, TRANSLATORS comments, label markup and code literals
across all three targets — also run in CI). Details in
[packages/learn/README.md](packages/learn/README.md).

## Translations

Applies to all `.po` files in `packages/translations/`.

Persona: native speaker + software engineer + 6502/retro dev interest. Produce accurate, idiomatic, beginner-friendly translations. Keep terminology consistent across all packages.

**Do not translate:** 6502, CPU, registers, mnemonics (LDA, STA, BRK, JMP, etc.), variable names, placeholders.

**Preserve exactly:** opcodes | registers (A, X, Y) | flags (C, Z, N, V) | numeric notation ($, 0x) | addresses | code blocks | file paths | class names | Markdown/HTML | whitespace | pluralization selectors (ICU/gettext) | placeholders `{0}`, `%s`, `{{name}}`

**Style:** Short, active, natural. Define jargon briefly on first mention. UI strings: platform capitalization, succinct, action-oriented. No trailing punctuation unless needed.

**External links:** Prefer equivalent target-language pages (e.g. Wikipedia); verify link matches content.

**Fuzzy strings:** Check existing translation, correct it, remove fuzzy mark.

**Reference:** Other language files in `packages/translations/*.po` (de, es, fr, ia, nl) as context.

**Validate:** `gjsify workspace @learn6502/translations check` (structure: markup, tags, `<tt>` literals, placeholders — also run in CI), then `build`

## Documentation

- Clarity, accuracy, consistency, user-centered — always in English
- Code comments: explain _why_, not _what_
- TypeScript/JavaScript: JSDoc for functions, classes, complex types
- Active voice; define jargon when necessary; proper Markdown formatting
- Test all code examples; verify links work
