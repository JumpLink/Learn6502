/**
 * Options for waitForProperty function
 */
export interface WaitForPropertyOptions<T = any> {
  /** Condition function that determines when to resolve */
  condition?: (value: T) => boolean;
  /** Polling interval in milliseconds */
  interval?: number;
  /** Optional timeout in milliseconds */
  timeout?: number;
}
