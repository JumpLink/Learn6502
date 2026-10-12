/**
 * The page needs about twenty small glyphs. They are drawn here instead of pulled from an icon
 * theme: inlining them costs no request and no licence notice, and a symbolic 16×16 grid is
 * little enough geometry to keep in one file. Every path uses `currentColor` and is sized by CSS.
 */

export type IconName =
  | "linux"
  | "macos"
  | "windows"
  | "android"
  | "web"
  | "firefox"
  | "chromium"
  | "package"
  | "download"
  | "license"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "copy"
  | "expand"
  | "external"
  | "code"
  | "bug"
  | "heart"
  | "help"
  | "mail"
  | "people"
  | "translate";

/** Shared attributes of the outline icons, so the strokes stay optically equal. */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';

const PATHS: Record<IconName, string> = {
  // Platform marks are filled silhouettes: at 18px an outline turns to mush.
  linux: `<path fill-rule="evenodd" d="M8 1.1c-1.7 0-3.1 1.4-3.1 3.1v1.2c0 .5-.2.9-.5 1.3-1.2 1.3-1.8 2.9-1.8 4.7 0 .6-.2 1.1-.6 1.5-.6.7-.3 1.7.5 2 1 .4 2.2.7 3.3.8.2 0 .3 0 .5-.1.5.1 1.1.1 1.7.1s1.2 0 1.7-.1c.2.1.3.1.5.1 1.1-.1 2.3-.4 3.3-.8.8-.3 1.1-1.3.5-2-.4-.4-.6-.9-.6-1.5 0-1.8-.6-3.4-1.8-4.7-.3-.4-.5-.8-.5-1.3V4.2c0-1.7-1.4-3.1-3.1-3.1Zm-1.2 2.2a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4Zm2.4 0a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4ZM8 5.1l1 .9-1 .9-1-.9 1-.9Z"/>`,
  macos: `<path d="M11.2 8.5c0-1.5 1.2-2.2 1.3-2.3-.7-1-1.8-1.1-2.1-1.1-.9-.1-1.7.5-2.2.5-.4 0-1.1-.5-1.9-.5-1 0-1.9.6-2.4 1.5-1 1.7-.3 4.3.7 5.7.5.7 1.1 1.5 1.8 1.4.7 0 1-.4 1.8-.4.9 0 1.1.4 1.8.4.8 0 1.2-.7 1.7-1.4.6-.8.8-1.5.8-1.6 0 0-1.3-.5-1.3-2.2Z"/><path d="M9.6 3.7c.4-.5.7-1.1.6-1.8-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.7.7.1 1.3-.3 1.7-.8Z"/>`,
  windows: `<path d="M1.6 2.9 7.1 2.1v5.2H1.6V2.9Zm6.5-.9L14.4 1v6.3H8.1V2Zm-6.5 6.7h5.5V14L1.6 13.2V8.7Zm6.5 0h6.3V15L8.1 14.1V8.7Z"/>`,
  android: `<path ${STROKE} d="m4.9 3 -.8-1.3M11.1 3l.8-1.3"/><path fill-rule="evenodd" d="M3.9 5.8C4.1 3.7 5.8 2 8 2s3.9 1.7 4.1 3.8H3.9Zm2.4-1.9a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2Zm3.4 0a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2Z"/><path d="M3.9 6.8h8.2v5.4c0 .6-.5 1.1-1.1 1.1H5c-.6 0-1.1-.5-1.1-1.1V6.8Zm-2.9.9a.9.9 0 0 1 1.8 0v3.5a.9.9 0 0 1-1.8 0V7.7Zm12.3 0a.9.9 0 0 1 1.8 0v3.5a.9.9 0 0 1-1.8 0V7.7ZM5.1 13.6a.9.9 0 0 1 1.8 0v1.5a.9.9 0 0 1-1.8 0v-1.5Zm4 0a.9.9 0 0 1 1.8 0v1.5a.9.9 0 0 1-1.8 0v-1.5Z"/>`,
  web: `<g ${STROKE}><circle cx="8" cy="8" r="6.3"/><path d="M1.7 8h12.6"/><path d="M8 1.7c1.7 1.7 2.6 3.9 2.6 6.3S9.7 12.6 8 14.3C6.3 12.6 5.4 10.4 5.4 8s.9-4.6 2.6-6.3Z"/></g>`,

  firefox: `<g ${STROKE}><circle cx="8" cy="8" r="6.3"/><path d="M4.9 7.4a3.3 3.3 0 1 0 5.7-2.5c.2 1-.1 1.8-.9 2.4"/></g>`,
  chromium: `<g ${STROKE}><circle cx="8" cy="8" r="6.3"/><circle cx="8" cy="8" r="2.4"/><path d="M8 5.6h5.7M5.9 9.2 3.1 14M10.1 9.2 7.3 14.1"/></g>`,
  package: `<g ${STROKE}><path d="M8 1.6 14 4.5v7L8 14.4l-6-2.9v-7L8 1.6Z"/><path d="m2 4.5 6 2.9 6-2.9M8 7.4v7"/></g>`,
  download: `<g ${STROKE}><path d="M8 1.9v7.6M4.8 6.4 8 9.6l3.2-3.2M2.4 13.3h11.2"/></g>`,
  license: `<g ${STROKE}><path d="M4 1.8h5l3.2 3.2v9.2H4V1.8Z"/><path d="M8.8 1.8V5h3.2M6.2 8.2h3.6M6.2 10.8h3.6"/></g>`,

  "chevron-down": `<path ${STROKE} d="m4.2 6.2 3.8 3.8 3.8-3.8"/>`,
  "chevron-left": `<path ${STROKE} d="M9.8 3 4.8 8l5 5"/>`,
  "chevron-right": `<path ${STROKE} d="m6.2 3 5 5-5 5"/>`,
  close: `<path ${STROKE} d="m3.8 3.8 8.4 8.4M12.2 3.8 3.8 12.2"/>`,
  copy: `<g ${STROKE}><rect x="5.4" y="5.4" width="8.2" height="8.2" rx="1.6"/><path d="M10.6 5.4V4c0-.9-.7-1.6-1.6-1.6H4c-.9 0-1.6.7-1.6 1.6v5c0 .9.7 1.6 1.6 1.6h1.4"/></g>`,
  expand: `<path ${STROKE} d="M6 1.9H1.9V6M10 1.9h4.1V6M10 14.1h4.1V10M6 14.1H1.9V10"/>`,
  external: `<g ${STROKE}><path d="M9.2 2.2h4.6v4.6M13.4 2.6 7.6 8.4"/><path d="M12 9.6v2.8c0 .8-.6 1.4-1.4 1.4H4c-.8 0-1.4-.6-1.4-1.4V5.8c0-.8.6-1.4 1.4-1.4h2.8"/></g>`,
  code: `<path ${STROKE} d="M5.6 11.8 2 8l3.6-3.8M10.4 4.2 14 8l-3.6 3.8M9.4 2.6 6.6 13.4"/>`,
  bug: `<g ${STROKE}><path d="M8 5.2c1.7 0 3 1.4 3 3v1.6c0 1.7-1.3 3-3 3s-3-1.3-3-3V8.2c0-1.6 1.3-3 3-3Z"/><path d="M6.3 4.2 5.5 2.6M9.7 4.2l.8-1.6M5 7.6H2.5M11 7.6h2.5M5 10.8H2.7M11 10.8h2.3M8 5.4v7.4"/></g>`,
  heart: `<path ${STROKE} d="M8 13.6 3.1 8.5a3.2 3.2 0 1 1 4.5-4.5l.4.4.4-.4a3.2 3.2 0 1 1 4.5 4.5L8 13.6Z"/>`,
  help: `<g ${STROKE}><circle cx="8" cy="8" r="6.3"/><path d="M6.2 6.2a1.8 1.8 0 1 1 2.7 1.7c-.6.3-.9.8-.9 1.4v.3"/></g><circle cx="8" cy="12" r=".9"/>`,
  mail: `<g ${STROKE}><rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.6"/><path d="m2.4 4.6 5.6 4.2 5.6-4.2"/></g>`,
  people: `<g ${STROKE}><circle cx="6.2" cy="5.2" r="2.6"/><path d="M1.6 13.8c0-2.5 2.1-4.2 4.6-4.2s4.6 1.7 4.6 4.2"/><path d="M10.6 3.1a2.6 2.6 0 0 1 0 5.1M12.1 9.9c1.4.5 2.3 1.7 2.3 3.3"/></g>`,
  translate: `<g ${STROKE}><path d="M2 4.4c0-.9.7-1.6 1.6-1.6h5.1c.9 0 1.6.7 1.6 1.6v2.3c0 .9-.7 1.6-1.6 1.6H6L3.6 10.4V8.3h-.1c-.8 0-1.5-.7-1.5-1.6V4.4Z"/><path d="M12.3 6h.1c.9 0 1.6.7 1.6 1.6v2.3c0 .9-.7 1.6-1.6 1.6h-.1v2.1L9.9 11.5H8"/></g>`,
};

export interface IconOptions {
  /** Added to the `<svg>`, on top of the shared `icon` class. */
  class?: string;
  /** Rendered as the accessible name; without it the icon is `aria-hidden`. */
  title?: string;
}

/** Renders one icon as an inline `<svg>`; decorative by default. */
export function icon(name: IconName, options: IconOptions = {}): string {
  const classes = options.class ? `icon ${options.class}` : "icon";
  const label = options.title
    ? ` role="img" aria-label="${options.title.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)}"`
    : ' aria-hidden="true"';
  return `<svg class="${classes}" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"${label}>${PATHS[name]}</svg>`;
}
