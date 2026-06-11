/**
 * Feed health check — verifies every feed in shared/sources.ts is reachable
 * and parseable from wherever you run it.
 *
 *   npm run check:feeds
 *
 * Run this locally (or in Vercel's environment) after deploying. Some sandboxed
 * environments block outbound HTTP; a wall of failures here usually means the
 * network, not the feeds.
 */
import { SOURCES } from "../shared/sources";
import { fetchFeedArticles } from "../api/_lib/rss";

async function main(): Promise<void> {
  console.log(`Checking ${SOURCES.reduce((n, s) => n + s.feeds.length, 0)} feeds across ${SOURCES.length} sources…\n`);

  let ok = 0;
  let failed = 0;

  for (const source of SOURCES) {
    for (const feed of source.feeds) {
      const started = Date.now();
      const { articles, error } = await fetchFeedArticles(source, feed);
      const ms = Date.now() - started;
      const label = `${source.name.padEnd(24)} ${feed.url.slice(0, 76)}`;
      if (error) {
        failed += 1;
        console.log(`  ✗ ${label}\n      → ${error} (${ms}ms)`);
      } else {
        ok += 1;
        console.log(`  ✓ ${label}\n      → ${articles.length} items (${ms}ms)`);
      }
    }
  }

  console.log(`\nResult: ${ok} ok, ${failed} failed.`);
  if (ok === 0) {
    console.log("Every feed failed — check outbound network access before blaming the feed URLs.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
