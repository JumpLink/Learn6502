// We don't want to use the DOM types in the 6502 package to make it cross-platform,
// but we need the interval and timeout functions
declare function setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
declare function clearInterval(handle?: number): void;

declare function setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
declare function clearTimeout(handle?: number): void;

type TimerHandler = string | Function;