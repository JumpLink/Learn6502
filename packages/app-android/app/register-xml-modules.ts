/**
 * Register barrel modules referenced from XML via `xmlns` namespaces.
 *
 * NativeScript resolves a custom element such as `<w:SourceView>` (declared with
 * `xmlns:w="~/widgets/index"`) at runtime through `global.loadModule("widgets/index")`,
 * which looks the name up in the registry populated by `global.registerModule` /
 * `global.registerBundlerModules`.
 *
 * Under the previous `@nativescript/webpack` build the `xml-namespace-loader`
 * registered every `.ts` module, so the barrels resolved automatically. The Vite
 * build (`@gjsify/nativescript-vite` → `@nativescript/vite`) registers XML files,
 * their paired code-behind and CSS — but NOT standalone barrels that have no `.xml`
 * sibling. The two `index.ts` barrels below are reachable only via `xmlns`, so we
 * register them explicitly here.
 *
 * The modules themselves are already in the bundle (the views import the individual
 * widgets statically); this only adds the `loadModule` nickname → namespace mapping.
 *
 * TODO(gjsify): lift this into `@gjsify/nativescript-vite` so the composer registers
 * `xmlns`-referenced barrels transparently (the webpack loader's behaviour), and
 * remove this file once app-android bumps to that release.
 */
import * as widgetsIndex from "./widgets";
import * as mdxIndex from "./mdx";

// `registerModule` is an ambient global declared by `@nativescript/core`
// (`declare global { function registerModule() }`); at runtime it lives on the
// NativeScript global object (`global === globalThis`).
registerModule("widgets/index", () => widgetsIndex);
registerModule("mdx/index", () => mdxIndex);
