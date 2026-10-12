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
