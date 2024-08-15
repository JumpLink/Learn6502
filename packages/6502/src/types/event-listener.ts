// deno-lint-ignore no-explicit-any
export type EventListener<T = any> = ((data: T) => void) & { once?: boolean };
