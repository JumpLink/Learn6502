import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export interface NetworkOptions {
  fetch?: FetchLike;
  /** When set, responses are stored here and reused for `cacheTtlMs`; a stale copy also serves as the offline fallback. */
  cacheDir?: string;
  cacheTtlMs?: number;
  timeoutMs?: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 15_000;

async function readCache(file: string): Promise<{ data: unknown; ageMs: number } | null> {
  try {
    const [text, info] = await Promise.all([readFile(file, "utf8"), stat(file)]);
    return { data: JSON.parse(text) as unknown, ageMs: Date.now() - info.mtimeMs };
  } catch {
    return null;
  }
}

/**
 * GETs JSON, optionally through an on-disk cache. Throws when the network fails and no cached copy
 * exists, so callers decide how to degrade.
 */
export async function fetchJson(
  url: string,
  headers: Record<string, string>,
  options: NetworkOptions = {}
): Promise<unknown> {
  const file = options.cacheDir
    ? join(options.cacheDir, `${createHash("sha256").update(url).digest("hex").slice(0, 16)}.json`)
    : undefined;
  const cached = file ? await readCache(file) : null;
  if (cached && cached.ageMs < (options.cacheTtlMs ?? DEFAULT_TTL_MS)) return cached.data;

  try {
    const doFetch: FetchLike = options.fetch ?? ((target, init) => fetch(target, init));
    const response = await doFetch(url, {
      headers,
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const data = await response.json();
    if (file && options.cacheDir) {
      await mkdir(options.cacheDir, { recursive: true });
      await writeFile(file, JSON.stringify(data));
    }
    return data;
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }
}
