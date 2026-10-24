/**
 * Selects the GObject engine for the Android build, and nothing else.
 *
 * Since gjsify 0.64.7 the engine slot starts out EMPTY and `engineForTarget` throws when a
 * port module is loaded without a decision — there is no silent fallback to the pure-JS
 * subset. The decision therefore has to be made before any Adwaita port module is imported,
 * which is why this is its own module and why `app.ts` imports it on its first line: the
 * bundler keeps import order, a call inside `app.ts` would run after its own imports.
 *
 * `requireGi` reaches libnode_gi.so, which resolves its Node-API symbols from NativeScript's
 * libNativeScript.so at load time — so @nativescript/android has to be a version that exports
 * them (9.1.1 is what @gjsify/gi-runtime-android's AAR is built against).
 */
import requireGi from "@gjsify/node-gi/gi";
import { useRealGObjectEngine } from "@gjsify/adwaita-gobject-native";

useRealGObjectEngine(requireGi);
