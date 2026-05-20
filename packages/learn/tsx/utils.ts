/**
 * Normalize whitespace by collapsing consecutive spaces and trimming.
 *
 * @param text The text to normalize.
 * @returns The cleaned text with single spaces and no leading/trailing whitespace.
 */
export function clearExtraSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Pick a subset of properties from a plain object, retaining only allowed keys.
 *
 * @template T The input object shape
 * @param obj Source object to filter
 * @param propertyNames Allowed property names to keep
 * @returns A new object containing only the selected properties
 */
export function filterProperties(obj: Record<string, any>, propertyNames: string[]): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => propertyNames.includes(key)));
}

// --- Source file context helpers (used during GTK UI generation) ---

let currentSourceFilePath = "";

/**
 * Get the MDX source file path currently used for UI generation.
 *
 * This is used to annotate generated translatable strings with a helpful
 * translator comment indicating where the text originated from.
 *
 * @returns Absolute or repo-relative path to the current MDX file
 */
export function getCurrentSourceFile(): string {
  return currentSourceFilePath;
}

/**
 * Run a function with a specific MDX source file context.
 *
 * Sets a thread-local-ish module variable so renderers can embed translator
 * comments like: "TRANSLATORS: MDX-derived text from <file>" in generated XML.
 * The previous context is restored after the function completes.
 *
 * @typeParam T Return type of the provided function
 * @param sourceFilePath The MDX source file path being rendered
 * @param fn Function to execute while the context is active
 * @returns The result of the provided function
 */
export function withSourceFileContext<T>(sourceFilePath: string, fn: () => T): T {
  const previous = currentSourceFilePath;
  currentSourceFilePath = sourceFilePath;
  try {
    return fn();
  } finally {
    currentSourceFilePath = previous;
  }
}
