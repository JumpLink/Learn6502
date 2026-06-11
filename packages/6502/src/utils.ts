export function addr2hex(addr: number) {
  return num2hex((addr >> 8) & 0xff) + num2hex(addr & 0xff);
}

export function num2hex(nr: number) {
  const str = "0123456789abcdef";
  const hi = (nr & 0xf0) >> 4;
  const lo = nr & 15;
  return str.substring(hi, hi + 1) + str.substring(lo, lo + 1);
}

/**
 * Converts a hex color string to RGB components
 * @param hex Hex color string (e.g. "#ff0000")
 * @returns RGB components as {red, green, blue} with values 0-1
 */
export function hexToRgb(hex: string): {
  red: number;
  green: number;
  blue: number;
} {
  // Expand shorthand form (e.g. "#03F") to full form (e.g. "#0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) {
    return { red: 0, green: 0, blue: 0 };
  }

  return {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255,
  };
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
): ((...args: Parameters<T>) => void) => {
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
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now();
          func(...args);
          timeoutId = null;
        },
        delay - (now - lastCall)
      );
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
): ((...args: Parameters<T>) => void) => {
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

/**
 * Replaces printf-style placeholders (%s, %d, %%) in a message with the given parameters.
 *
 * Used by platforms without their own message formatting: the GNOME app
 * translates with gettext and formats with GJS's String.format instead,
 * the Android app with localize() from @nativescript/localize.
 * Placeholders without a matching parameter are left untouched.
 *
 * @param message - Message containing printf-style placeholders.
 * @param params - Parameters to substitute for the placeholders, in order.
 * @returns The message with all placeholders replaced.
 */
export function formatMessage(
  message: string,
  params: ReadonlyArray<string | number | boolean | null | undefined> = []
): string {
  let index = 0;
  return message.replace(/%[%sd]/g, (specifier) => {
    if (specifier === "%%") {
      return "%";
    }
    if (index >= params.length) {
      return specifier;
    }
    const param = params[index++];
    return specifier === "%d" ? String(Number(param)) : String(param);
  });
}
