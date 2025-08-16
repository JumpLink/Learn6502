/**
 * Cleans the text of the label by removing extra whitespace and trimming the text.
 * @param text - The text to clean.
 * @returns The cleaned text.
 */
export function clearExtraSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function filterProperties(
  obj: Record<string, any>,
  propertyNames: string[]
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => propertyNames.includes(key))
  );
}
