export function addr2hex(addr: number) {
  return num2hex((addr >> 8) & 0xff) + num2hex(addr & 0xff);
}

export function num2hex(nr: number) {
  const str = "0123456789abcdef";
  const hi = ((nr & 0xf0) >> 4);
  const lo = (nr & 15);
  return str.substring(hi, hi + 1) + str.substring(lo, lo + 1);
}

/**
 * Throttle function to limit the rate of function calls.
 * @param func - The function to throttle.
 * @param delay - The delay in milliseconds.
 * @returns The throttled function.
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    // Execute immediately if it's the first call or enough time has passed
    if (now - lastCall >= delay) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func(...args);
    } else if (timeoutId === null) {
      // Schedule a call after the delay
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
        timeoutId = null;
      }, delay - (now - lastCall));
    }
  };
};

/**
 * Debounce function that delays invoking the provided function until after
 * the specified delay has elapsed since the last time it was invoked.
 * Perfect for handling rapid-fire events like text input.
 *
 * @param func - The function to debounce.
 * @param delay - The delay in milliseconds.
 * @returns The debounced function.
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

/** Pseudo i18n function */
export const _ = (str: string) => str;