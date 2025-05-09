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
