const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for element content and double-quoted attribute values. */
export function esc(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

/** Replaces `{name}` placeholders in a translated string; values are escaped, the template is trusted. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return esc(template).replace(/\{(\w+)\}/g, (_match, key: string) => (key in values ? esc(values[key] as string | number) : `{${key}}`));
}

/** Renders attributes, dropping the `undefined`/`false` ones. */
export function attrs(values: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => (value === true ? ` ${key}` : ` ${key}="${esc(value as string | number)}"`))
    .join("");
}

/** Like `fmt`, for values that are escaped later (attribute values, `esc`-wrapped text). */
export function plain(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => (key in values ? String(values[key]) : `{${key}}`));
}
