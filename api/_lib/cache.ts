import type { Article, SourceRefreshStat } from "../../shared/types";
import { aggregate } from "./aggregate";

/**
 * Warm-instance cache for "live" mode (no Supabase configured).
 * Serverless instances keep module state between invocations while warm,
 * which is enough to avoid re-fetching 30 feeds on every filter change.
 */
interface LiveCache {
  articles: Article[];
  stats: SourceRefreshStat[];
  fetchedAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const MIN_FORCE_INTERVAL_MS = 30 * 1000;

let cache: LiveCache | null = null;
let inflight: Promise<LiveCache> | null = null;

export function getCached(): LiveCache | null {
  return cache;
}

export async function getLiveArticles(force = false): Promise<LiveCache> {
  const now = Date.now();
  if (cache) {
    const age = now - cache.fetchedAt;
    if (!force && age < TTL_MS) return cache;
    if (force && age < MIN_FORCE_INTERVAL_MS) return cache;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { articles, stats } = await aggregate("all");
      // Keep stale data if a refresh comes back completely empty (network blip).
      if (articles.length > 0 || !cache) {
        cache = { articles, stats, fetchedAt: Date.now() };
      }
      return cache!;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
