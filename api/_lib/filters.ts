import type { Article, ArticleFilters } from "../../shared/types";

/** In-memory filtering used by "live" and "sample" modes (no database). */
export function applyFilters(
  articles: Article[],
  f: ArticleFilters,
): { articles: Article[]; total: number } {
  let out = articles;

  if (f.region) out = out.filter((a) => a.region === f.region);
  if (f.category) out = out.filter((a) => a.category === f.category);
  if (f.source) out = out.filter((a) => a.source === f.source);
  if (f.from) {
    const t = Date.parse(`${f.from}T00:00:00Z`);
    if (!Number.isNaN(t)) out = out.filter((a) => Date.parse(a.publishedAt) >= t);
  }
  if (f.to) {
    const t = Date.parse(`${f.to}T23:59:59Z`);
    if (!Number.isNaN(t)) out = out.filter((a) => Date.parse(a.publishedAt) <= t);
  }
  if (f.q) {
    const needle = f.q.toLowerCase().trim();
    if (needle) {
      out = out.filter(
        (a) =>
          a.title.toLowerCase().includes(needle) ||
          (a.summary ?? "").toLowerCase().includes(needle),
      );
    }
  }

  const total = out.length;
  const limit = Math.min(Math.max(f.limit ?? 60, 1), 200);
  const offset = Math.max(f.offset ?? 0, 0);
  return { articles: out.slice(offset, offset + limit), total };
}
