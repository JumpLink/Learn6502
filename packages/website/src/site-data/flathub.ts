import { fetchJson, type NetworkOptions } from "./network.ts";

export interface FlathubStats {
  installsTotal: number;
  installsLastMonth?: number;
}

/**
 * Parses `https://flathub.org/api/v2/stats/<appid>`. Verified shape (2026-10): an object with
 * `installs_total`, `installs_last_month`, `installs_last_7_days`, `installs_per_day` and
 * `installs_per_country`. Only the totals are used.
 */
export function parseFlathubStats(payload: unknown): FlathubStats {
  const stats = payload as { installs_total?: unknown; installs_last_month?: unknown };
  if (typeof stats?.installs_total !== "number") throw new Error("Unexpected Flathub stats payload");
  return {
    installsTotal: stats.installs_total,
    installsLastMonth: typeof stats.installs_last_month === "number" ? stats.installs_last_month : undefined,
  };
}

export async function fetchFlathubStats(appId: string, options: NetworkOptions): Promise<FlathubStats> {
  return parseFlathubStats(
    await fetchJson(
      `https://flathub.org/api/v2/stats/${encodeURIComponent(appId)}`,
      { Accept: "application/json" },
      options
    )
  );
}

export interface FlathubSummary {
  /** Bytes the install transfers, which is what a download size means for a store install. */
  downloadSize: number;
  installedSize?: number;
}

/**
 * Parses `https://flathub.org/api/v2/summary/<appid>`. Verified shape (2026-10): `download_size`,
 * `installed_size`, `branches`, `arches`, `metadata` and `timestamp`, with the sizes in bytes and
 * repeated per branch. The top-level pair describes the branch Flathub installs by default.
 */
export function parseFlathubSummary(payload: unknown): FlathubSummary {
  const summary = payload as { download_size?: unknown; installed_size?: unknown };
  if (typeof summary?.download_size !== "number") throw new Error("Unexpected Flathub summary payload");
  return {
    downloadSize: summary.download_size,
    installedSize: typeof summary.installed_size === "number" ? summary.installed_size : undefined,
  };
}

export async function fetchFlathubSummary(appId: string, options: NetworkOptions): Promise<FlathubSummary> {
  return parseFlathubSummary(
    await fetchJson(
      `https://flathub.org/api/v2/summary/${encodeURIComponent(appId)}`,
      { Accept: "application/json" },
      options
    )
  );
}
