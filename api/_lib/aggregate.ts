import { SOURCES } from "../../shared/sources";
import type { Article, Region, SourceRefreshStat } from "../../shared/types";
import { fetchFeedArticles } from "./rss";

export type RefreshScope = Region | "all";

export interface AggregateResult {
  articles: Article[];
  stats: SourceRefreshStat[];
}

/** Minimal promise pool — run `tasks` with at most `limit` in flight. */
async function pool<T>(limit: number, tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker()),
  );
  return results;
}

export async function aggregate(scope: RefreshScope): Promise<AggregateResult> {
  const sources = SOURCES.filter((s) => scope === "all" || s.region === scope);

  const tasks = sources.flatMap((source) =>
    source.feeds.map((feed) => async (): Promise<{ stat: SourceRefreshStat; articles: Article[] }> => {
      const { articles, error } = await fetchFeedArticles(source, feed);
      return {
        stat: {
          source: source.slug,
          feed: feed.url,
          fetched: articles.length,
          error,
        },
        articles,
      };
    }),
  );

  const settled = await pool(10, tasks);

  const byHash = new Map<string, Article>();
  const stats: SourceRefreshStat[] = [];
  for (const { stat, articles } of settled) {
    stats.push(stat);
    for (const a of articles) {
      if (!byHash.has(a.hash)) byHash.set(a.hash, a);
    }
  }

  const articles = [...byHash.values()].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  return { articles, stats };
}
