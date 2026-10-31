/**
 * The iOS counterpart of `engine.ts`: there is no node-gi payload for iOS, so the Adwaita port
 * runs on gjsify's pure-JS GObject subset. On iOS an empty engine slot is that answer (gjsify's
 * `engine-target.ios.ts`), so nothing is selected here — the module exists so the build's
 * platform resolution never pulls the Android engine and its native library into an iOS bundle.
 */
export {};
