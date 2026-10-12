import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type {
  Localized,
  Metainfo,
  ScreenshotItemConfig,
  ScreenshotVariantKey,
  ScreenshotVariants,
  Screenshot,
  SiteConfig,
} from "./types.ts";

/** What each wanted variant falls back to, nearest match first. */
export const VARIANT_FALLBACK: Record<ScreenshotVariantKey, readonly ScreenshotVariantKey[]> = {
  "mobile-dark": ["mobile-dark", "mobile-light", "desktop-dark", "desktop-light"],
  "mobile-light": ["mobile-light", "mobile-dark", "desktop-light", "desktop-dark"],
  "desktop-dark": ["desktop-dark", "desktop-light", "mobile-dark", "mobile-light"],
  "desktop-light": ["desktop-light", "desktop-dark", "mobile-light", "mobile-dark"],
};

export const VARIANT_KEYS = Object.keys(VARIANT_FALLBACK) as ScreenshotVariantKey[];

/** Picks the file to show for a wanted variant, or `undefined` when the screenshot has no artwork at all. */
export function resolveVariant(variants: ScreenshotVariants, wanted: ScreenshotVariantKey): string | undefined {
  for (const key of VARIANT_FALLBACK[wanted]) {
    const path = variants[key];
    if (path) return path;
  }
  return undefined;
}

/**
 * Combines the metainfo screenshot list with the `gjsify.site.screenshots` items.
 *
 * - `metainfo`: only the metainfo list, in its order, with no artwork of its own, so every entry
 *   needs a `variants` item at its index.
 * - `site`: only the configured items.
 * - `merge`: the configured items; one with `from` borrows the metainfo caption.
 *
 * `captionFor` resolves a `caption` msgid of the website catalogue to a localized text.
 */
export function mergeScreenshots(
  config: SiteConfig,
  metainfo: Metainfo,
  captionFor: (msgid: string) => Localized
): Array<{ item: ScreenshotItemConfig; caption: Localized | null }> {
  const { source, items } = config.screenshots;
  const metainfoCaption = (index: number | undefined): Localized | null =>
    index === undefined ? null : (metainfo.screenshots[index]?.caption ?? null);

  const entries: Array<{ item: ScreenshotItemConfig; caption: Localized | null }> = [];
  if (source === "metainfo") {
    metainfo.screenshots.forEach((_screenshot, index) => {
      const item = items.find((candidate) => candidate.from === index);
      if (item) entries.push({ item, caption: metainfoCaption(index) });
    });
    return entries;
  }

  for (const item of items) {
    const caption =
      item.caption !== undefined ? captionFor(item.caption) : source === "merge" ? metainfoCaption(item.from) : null;
    entries.push({ item, caption });
  }
  return entries;
}

/** Verifies every configured artwork file exists; the build fails loudly rather than shipping a broken carousel. */
export function validateVariants(variants: ScreenshotVariants, root: string, label: string): void {
  const keys = VARIANT_KEYS.filter((key) => variants[key]);
  if (keys.length === 0)
    throw new Error(`Screenshot ${label} has no variants; give it at least one of ${VARIANT_KEYS.join(", ")}`);
  for (const key of keys) {
    const path = variants[key]!;
    if (!existsSync(resolve(root, path))) {
      throw new Error(
        `Screenshot ${label}: variant "${key}" points to "${path}", which does not exist (relative to ${root})`
      );
    }
  }
}

export function buildScreenshots(
  config: SiteConfig,
  metainfo: Metainfo,
  root: string,
  captionFor: (msgid: string) => Localized
): Screenshot[] {
  return mergeScreenshots(config, metainfo, captionFor).map(({ item, caption }, index) => {
    const variants = item.variants ?? {};
    validateVariants(variants, root, `#${index + 1}`);
    return { caption, variants };
  });
}
