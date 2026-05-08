declare namespace WebAssembly {
  interface Module {}
  interface Instance {}
  interface Imports {}
}

declare class Worker {
  constructor(stringUrl: string, options?: { name?: string });
}

declare class SharedWorker {
  constructor(stringUrl: string, options?: { name?: string });
}

declare class Event {
  type: string;
}

declare class WebSocket {
  constructor(url: string, protocols?: string | string[]);
}

// File loaders for `gjsify build`. `*.ui` and `*.asm` are claimed by
// the text-loader plugin (configured via `loaders` in package.json#gjsify);
// `*.css` is claimed by the built-in `cssAsStringPlugin`. All three
// produce a JS string default export.
//
// These ambient module declarations live in a non-module file (no
// top-level import/export) so `declare module "*.ext"` is treated
// globally rather than as a local module-augmentation scope.
declare module "*.ui" {
  const content: string;
  export default content;
}
declare module "*.asm" {
  const content: string;
  export default content;
}
declare module "*.css" {
  const content: string;
  export default content;
}
