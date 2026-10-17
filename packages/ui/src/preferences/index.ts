/// <reference path="../types.d.ts" />
// A second entry, not part of the barrel: the web and Android builds compile every template
// they import as a shared tree, and these templates carry `accessibility` blocks the shared
// tree has no spelling for yet.
export * from "./theme-mode-selector.ts";
export * from "./primary-color-selector.ts";
export * from "./accent-color-selector.ts";
export * from "./preferences-dialog.ts";
