import { existsSync } from "node:fs";
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

export type ImageFormat = "avif" | "webp" | "png";

export interface ImageFile {
  url: string;
  width: number;
}

export interface ProcessedImage {
  /** Intrinsic size of the largest rendition, for the `width`/`height` attributes. */
  width: number;
  height: number;
  formats: Record<ImageFormat, ImageFile[]>;
}

export interface ImageOptions {
  /** Directory the renditions are published into (served below `urlBase`). */
  outDir: string;
  /** Persistent store of encoded renditions; AVIF is slow, so it is reused while the source is unchanged. */
  cacheDir: string;
  urlBase: string;
}

const TARGET_WIDTHS = [480, 960, 1440];
const FORMATS: ImageFormat[] = ["avif", "webp", "png"];

export function imageSlug(path: string): string {
  return path
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** Never upscales: widths above the source are dropped, and the source's own width is used if it is the largest that fits. */
export function renditionWidths(natural: number): number[] {
  const widths = new Set(TARGET_WIDTHS.filter((width) => width < natural));
  widths.add(Math.min(natural, TARGET_WIDTHS[TARGET_WIDTHS.length - 1] as number));
  return [...widths].sort((a, b) => a - b);
}

async function encode(source: string, width: number, format: ImageFormat): Promise<Buffer> {
  const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
  if (format === "avif") return pipeline.avif({ quality: 55, effort: 4 }).toBuffer();
  if (format === "webp") return pipeline.webp({ quality: 80 }).toBuffer();
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

async function isFresh(cached: string, source: string): Promise<boolean> {
  if (!existsSync(cached)) return false;
  const [a, b] = await Promise.all([stat(cached), stat(source)]);
  return a.mtimeMs >= b.mtimeMs;
}

/** Encodes AVIF, WebP and PNG renditions of one screenshot into `outDir` and describes them. */
export async function processImage(source: string, repoPath: string, options: ImageOptions): Promise<ProcessedImage> {
  const meta = await sharp(source).metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot read the size of ${repoPath}`);
  const widths = renditionWidths(meta.width);
  const slug = imageSlug(repoPath);
  await Promise.all([mkdir(options.outDir, { recursive: true }), mkdir(options.cacheDir, { recursive: true })]);

  const formats: Record<ImageFormat, ImageFile[]> = { avif: [], webp: [], png: [] };
  await Promise.all(
    FORMATS.flatMap((format) =>
      widths.map(async (width) => {
        const name = `${slug}-${width}.${format}`;
        const cached = join(options.cacheDir, name);
        if (!(await isFresh(cached, source))) await writeFile(cached, await encode(source, width, format));
        await copyFile(cached, join(options.outDir, name));
        formats[format].push({ url: `${options.urlBase}${name}`, width });
      })
    )
  );
  for (const format of FORMATS) formats[format].sort((a, b) => a.width - b.width);

  const largest = widths[widths.length - 1] as number;
  return { width: largest, height: Math.round((largest * meta.height) / meta.width), formats };
}
