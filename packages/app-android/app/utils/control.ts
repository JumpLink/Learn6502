import { getByPath } from "./objects";
import type { WaitForPropertyOptions } from "../types";

/**
 * Creates a promise that resolves after the specified time
 * @param ms Time to sleep in milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Waits for a property in an object to meet a specified condition
 * @param path The property path (supports dot notation for nested properties)
 * @param obj The object to observe
 * @param options Optional configuration parameters
 * @returns Promise that resolves when the condition is met or rejects on timeout
 */
export const waitForProperty = async <T = any>(
  path: string,
  obj: any,
  options: WaitForPropertyOptions<T> = {}
): Promise<T> => {
  const {
    condition = (value: T) => !!value,
    interval = 100,
    timeout,
  } = options;

  const startTime = Date.now();

  while (true) {
    // Get the value at the specified path
    const value = getByPath(obj, path);

    // Check if condition is met
    if (condition(value)) {
      return value;
    }

    // Check for timeout
    if (timeout && Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for property ${path}`);
    }

    // Wait before next check
    await sleep(interval);
  }
};

/**
 * Waits for a function to return a truthy value.
 * @param func The function to execute and check the return value of.
 * @param options Optional configuration parameters.
 * @returns Promise that resolves with the truthy return value or rejects on timeout.
 */
export const waitForFunctionResult = async <T = any>(
  func: () => T,
  options: Pick<WaitForPropertyOptions<T>, "interval" | "timeout"> = {}
) => {
  const { interval = 100, timeout } = options;
  const startTime = Date.now();

  while (true) {
    let result: T | undefined;
    try {
      result = func();
    } catch (error) {
      console.error("waitForFunctionResult", error);
    }

    // Check if the result is truthy
    if (result) {
      return result;
    }

    // Check if the result is truthy
    if (result) {
      return result;
    }

    // Check for timeout
    if (timeout && Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for function to return a truthy value`);
    }

    // Wait before next check
    await sleep(interval);
  }
};
